
import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'

type Props = {
  onDisplayTimeChange: (displayTime: string | null) => void
}

function Stopwatch({ onDisplayTimeChange }: Props) {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  // 運行中時，定期更新畫面；時間以 timestamp 計算，避免累積誤差。
  useEffect(() => {
    if (startTime === null) return

    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 10)

    return () => window.clearInterval(timer)
  }, [startTime])

  const currentElapsed = startTime !== null
    ? elapsedMs + now - startTime
    : elapsedMs

  const totalCentiseconds = Math.floor(currentElapsed / 10)
  const minutes = Math.floor(totalCentiseconds / 6000)
  const seconds = Math.floor((totalCentiseconds % 6000) / 100)
  const centiseconds = totalCentiseconds % 100

  useEffect(() => {
    if (startTime === null) {
      onDisplayTimeChange(null)
      return
    }

    const displayMinutes = Math.floor(currentElapsed / 60000)
    const displaySeconds = Math.floor((currentElapsed % 60000) / 1000)

    const navDisplayTime = displayMinutes >= 60
      ? `${String(Math.floor(displayMinutes / 60)).padStart(2, '0')}:${String(displayMinutes % 60).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
      : `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`

    onDisplayTimeChange(navDisplayTime)
  }, [startTime, currentElapsed, onDisplayTimeChange])

  const displayTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`

  // 回報碼表時間給 App，供導覽列顯示。
  useEffect(() => {
    if (startTime === null) {
      onDisplayTimeChange(null)
      return
    }

    const displayMinutes = Math.floor(currentElapsed / 60000)
    const displaySeconds = Math.floor((currentElapsed % 60000) / 1000)

    const navDisplayTime = displayMinutes >= 60
      ? `${String(Math.floor(displayMinutes / 60)).padStart(2, '0')}:${String(displayMinutes % 60).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
      : `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`

    onDisplayTimeChange(navDisplayTime)
  }, [startTime, currentElapsed, onDisplayTimeChange])

  const handleStartPause = () => {
    if (startTime !== null) {
      setElapsedMs(elapsedMs + Date.now() - startTime)
      setStartTime(null)
    } else {
      setNow(Date.now())
      setStartTime(Date.now())
    }
  }

  const handleReset = () => {
    setElapsedMs(0)
    setStartTime(null)
    setNow(Date.now())
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 text-center">
        <div className="text-7xl font-bold tabular-nums tracking-tight text-gray-800">
          {displayTime}
        </div>
      </div>

      {/* 操作按鈕 */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleReset}
          aria-label="重置"
          title="重置"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <RotateCcw size={22} />
        </button>

        <button
          onClick={handleStartPause}
          className="h-11 w-28 cursor-pointer rounded-lg bg-gray-800 text-white hover:bg-gray-700"
        >
          {startTime !== null
            ? '暫停'
            : elapsedMs > 0
              ? '繼續'
              : '開始'}
        </button>

        {/* 佔位 */}
        <div className="h-11 w-11" />
      </div>
    </div>
  )
}

export default Stopwatch
