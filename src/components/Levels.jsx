export default function Levels({ levels, unlockedUpto, onBack, onEnter }) {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      <div className="p-6 text-center text-2xl font-bold">Choose your Sprint</div>

      <div className="grid grid-cols-3 gap-4 p-6 place-items-center">
        {levels.map((lvl) => {
          const locked = lvl > unlockedUpto
          return (
            <button
              key={lvl}
              onClick={() => !locked && onEnter(lvl)}
              className={`w-20 h-20 rounded-full border flex items-center justify-center text-lg font-semibold transition ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black hover:text-white'}`}
            >
              {locked ? '🔒' : `Nivel ${lvl}`}
            </button>
          )
        })}
      </div>

      <div className="p-6 flex justify-center">
        <button onClick={onBack} className="px-4 py-2 rounded-full border hover:bg-black hover:text-white">Back</button>
      </div>
    </div>
  )
}
