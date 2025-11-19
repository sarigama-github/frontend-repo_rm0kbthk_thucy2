import { useEffect, useState } from 'react'

export default function SettingsSheet({ playerId, onClose }) {
  const [settings, setSettings] = useState({ volume: true, vibration: true, language: 'es' })

  useEffect(() => {
    const base = import.meta.env.VITE_BACKEND_URL
    fetch(`${base}/api/settings/${playerId}`).then(r => r.json()).then(setSettings).catch(()=>{})
  }, [playerId])

  const toggle = (key) => {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    const base = import.meta.env.VITE_BACKEND_URL
    fetch(`${base}/api/settings/${playerId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: next[key] }) })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl p-6" onClick={e=>e.stopPropagation()}>
        <div className="text-xl font-bold mb-4">Settings</div>
        <div className="space-y-3">
          <Row label="Volumen" value={settings.volume} onChange={() => toggle('volume')} />
          <Row label="Vibración" value={settings.vibration} onChange={() => toggle('vibration')} />
          <Row label="Idioma" value={settings.language === 'es'} onChange={() => toggle('language')} trueLabel="ES" falseLabel="EN" />
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-full border hover:bg-black hover:text-white">Close</button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, onChange, trueLabel='ON', falseLabel='OFF' }){
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <button onClick={onChange} className={`w-24 h-10 rounded-full border transition ${value ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}>
        {value ? trueLabel : falseLabel}
      </button>
    </div>
  )
}
