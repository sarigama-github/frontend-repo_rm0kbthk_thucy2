import { useEffect, useMemo, useState } from 'react'
import Home from './components/Home'
import Levels from './components/Levels'
import Game from './components/Game'
import SettingsSheet from './components/SettingsSheet'

function App() {
  const [screen, setScreen] = useState('home') // home | levels | game | training
  const [level, setLevel] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [levels, setLevels] = useState([])
  const [unlocked, setUnlocked] = useState(1)

  const base = import.meta.env.VITE_BACKEND_URL
  const playerId = useMemo(()=>{
    const k = 'shadow_sprint_player_id'
    let id = localStorage.getItem(k)
    if (!id){ id = Math.random().toString(36).slice(2); localStorage.setItem(k, id) }
    return id
  }, [])

  useEffect(() => {
    fetch(`${base}/api/levels`).then(r=>r.json()).then(d=>setLevels(d.levels || [])).catch(()=>setLevels(Array.from({length:15},(_,i)=>i+1)))
    fetch(`${base}/api/progress/${playerId}`).then(r=>r.json()).then(d=>setUnlocked(d.unlocked_upto || 1)).catch(()=>setUnlocked(1))
  }, [playerId])

  const handleFinish = (res) => {
    if (res.next){
      const next = Math.min(level+1, 15)
      setLevel(next)
      setScreen('game')
      return
    }
    setScreen('levels')
  }

  return (
    <div className="min-h-screen bg-white">
      {screen === 'home' && (
        <Home onPlay={()=>setScreen('levels')} onTraining={()=>{setLevel(1); setScreen('training')}} onSettings={()=>setShowSettings(true)} />
      )}
      {screen === 'levels' && (
        <Levels levels={levels} unlockedUpto={unlocked} onBack={()=>setScreen('home')} onEnter={(lvl)=>{ setLevel(lvl); setScreen('game') }} />
      )}
      {screen === 'game' && (
        <Game level={level} playerId={playerId} onFinish={handleFinish} onBack={()=>setScreen('levels')} />
      )}
      {screen === 'training' && (
        <Game level={level} training playerId={playerId} onFinish={handleFinish} onBack={()=>setScreen('home')} />
      )}

      {showSettings && (
        <SettingsSheet playerId={playerId} onClose={()=>setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
