import { useEffect, useMemo, useRef, useState } from 'react'

// Simple 1D track from 0 -> 1 with bezier ease to simulate curves visually
function easeOut(t){ return 1 - Math.pow(1 - t, 3) }

export default function Game({ level, training=false, playerId, onFinish, onBack }){
  const [running, setRunning] = useState(false)
  const [playerPos, setPlayerPos] = useState(0)
  const [ghostPos, setGhostPos] = useState(0)
  const [playerTime, setPlayerTime] = useState(0)
  const [ghostTime, setGhostTime] = useState(0)
  const [ghostData, setGhostData] = useState(null)
  const [result, setResult] = useState(null)

  const pressRef = useRef(null)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const inputsRef = useRef([])

  const base = import.meta.env.VITE_BACKEND_URL

  // params per level (slightly harder as level increases)
  const params = useMemo(() => {
    const v = 0.18 + (level-1)*0.003 // base velocity per second
    const accel = 0.28
    const decel = 0.25
    const friction = 0.12
    return { v, accel, decel, friction }
  }, [level])

  useEffect(() => {
    fetch(`${base}/api/ghost/${playerId}/${level}`).then(r=>r.json()).then(setGhostData).catch(()=>{
      setGhostData({ time_ms: 8000, inputs: Array.from({length:10}, (_,i)=>({start_ms:i*700, end_ms:i*700+120, kind:'tap'})) })
    })
  }, [level, playerId])

  useEffect(() => {
    if (!ghostData) return
    start()
    return () => cancelAnimationFrame(rafRef.current)
  }, [ghostData])

  function handlePointerDown(){
    const now = performance.now()
    if (!running){ inputsRef.current=[]; startRef.current=now; setResult(null); setRunning(true) }
    pressRef.current = now
  }
  function handlePointerUp(){
    if (pressRef.current == null) return
    const now = performance.now()
    inputsRef.current.push({ start_ms: Math.floor(pressRef.current - startRef.current), end_ms: Math.floor(now - startRef.current), kind: 'hold' })
    pressRef.current = null
  }

  function start(){
    setRunning(true)
    const gInputs = ghostData?.inputs || []
    const gDuration = ghostData?.time_ms || 8000

    let t0 = performance.now()
    let v = 0
    let gV = 0
    let p = 0
    let g = 0

    const loop = () => {
      const now = performance.now()
      const dt = Math.min(0.032, (now - t0)/1000)
      t0 = now

      // player input state
      const elapsed = now - (startRef.current || now)
      const isPressed = pressRef.current != null
      if (running){
        if (isPressed) v += params.accel*dt; else v -= params.decel*dt
        v = Math.max(0, Math.min(1, v - params.friction*dt + params.v*dt))
        p = Math.min(1, p + v*dt*0.22)
      }

      // ghost based on recorded inputs replay (approximate)
      const gPressed = gInputs.some(seg => elapsed >= seg.start_ms && elapsed <= seg.end_ms)
      if (running){
        if (gPressed) gV += params.accel*dt; else gV -= params.decel*dt
        gV = Math.max(0, Math.min(1, gV - params.friction*dt + params.v*dt))
        g = Math.min(1, g + gV*dt*0.22)
      }

      setPlayerPos(p)
      setGhostPos(g)
      setPlayerTime(elapsed)
      setGhostTime(Math.min(elapsed, gDuration))

      if (p >= 1 || (elapsed > 12000)){
        finish(Math.floor(elapsed))
        return
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
  }

  function finish(timeMs){
    setRunning(false)
    const won = ghostData ? timeMs < ghostData.time_ms : true
    setResult({ won, timeMs, ghostMs: ghostData?.time_ms || 8000 })

    if (!training){
      // store inputs and possibly unlock
      fetch(`${base}/api/ghost`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: playerId, level, time_ms: timeMs, inputs: inputsRef.current }) })
        .then(()=>{ if (won) fetch(`${base}/api/progress/unlock`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ player_id: playerId, won_level: level }) }) })
      .finally(() => onFinish({ won, timeMs, ghostMs: ghostData?.time_ms || 8000 }))
    } else {
      onFinish({ won, timeMs, ghostMs: ghostData?.time_ms || 8000 })
    }
  }

  // UI
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <button onClick={onBack} className="px-3 py-1 rounded-full border">Back</button>
        <div className="text-sm">Level {level}{training? ' • Training':''}</div>
        <div className="text-sm">{Math.floor(playerTime/10)/100}s</div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Track visual */}
        <div className="w-full max-w-sm h-72 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M5,95 C35,20 65,180 95,5" fill="none" stroke="#e5e5e5" strokeWidth="3" />
            <circle cx={5 + 90*easeOut(playerPos)} cy={95 - 90*easeOut(playerPos)} r="2.5" fill="#000" />
            <circle cx={5 + 90*easeOut(ghostPos)} cy={95 - 90*easeOut(ghostPos)} r="2.5" fill="#000" opacity="0.2" />
          </svg>
        </div>

        {result && (
          <div className="mt-4 text-center">
            <div className="text-xl font-bold mb-1">{result.won ? (result.timeMs < (ghostData?.time_ms||0) ? '🔥 New Record!' : 'You outran your shadow!') : 'Almost! Try Again.'}</div>
            <div className="text-sm text-black/60">You: {Math.floor(result.timeMs/10)/100}s • Shadow: {Math.floor(result.ghostMs/10)/100}s</div>
            <div className="mt-4 flex gap-2 justify-center">
              <button onClick={()=>window.location.reload()} className="px-4 py-2 rounded-full bg-black text-white">Retry</button>
              {!training && <button onClick={()=>onFinish({ ...result, next:true })} className="px-4 py-2 rounded-full border">Next</button>}
              <button onClick={()=>onBack()} className="px-4 py-2 rounded-full border">Back to Levels</button>
            </div>
          </div>
        )}
      </div>

      {/* Big control button */}
      <div className="p-6">
        <button
          onMouseDown={handlePointerDown}
          onMouseUp={handlePointerUp}
          onTouchStart={(e)=>{e.preventDefault(); handlePointerDown()}}
          onTouchEnd={(e)=>{e.preventDefault(); handlePointerUp()}}
          className="w-full h-24 rounded-full bg-black text-white text-xl active:scale-95 transition"
        >
          {running ? 'Hold to accelerate' : 'Tap to start'}
        </button>
      </div>
    </div>
  )
}
