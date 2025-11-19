import { useState } from 'react'
import { Settings } from 'lucide-react'

export default function Home({ onPlay, onTraining, onSettings }) {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center relative overflow-hidden">
      <button onClick={onSettings} className="absolute top-4 right-4 p-2 rounded-full border border-black/10 hover:bg-black/5 transition">
        <Settings className="w-6 h-6" />
      </button>

      <h1 className="text-5xl font-extrabold tracking-tight mb-10">Shadow Sprint</h1>

      <div className="flex flex-col items-center gap-4">
        <button onClick={onPlay} className="w-56 h-16 rounded-full bg-black text-white text-2xl font-semibold hover:scale-[1.02] active:scale-95 transition">
          Play
        </button>
        <button onClick={onTraining} className="w-40 h-12 rounded-full border border-black text-black text-base hover:bg-black hover:text-white transition">
          Training
        </button>
      </div>
    </div>
  )
}
