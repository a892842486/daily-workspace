
import { useEffect, useState } from 'react'
import { RotateCcw, SkipForward, Settings } from 'lucide-react'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

// 三種計時模式。
const modes = [
    { id: 'focus', label: '專注' },
    { id: 'shortBreak', label: '短休息' },
    { id: 'longBreak', label: '長休息' },
] as const

// 預設計時時間（秒）。
const durations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
}

export default function PomodoroTimer() {
    const [mode, setMode] = useState<TimerMode>('focus')
    const [remainingSeconds, setRemainingSeconds] = useState(durations.focus)
    const [isRunning, setIsRunning] = useState(false)
    // 記錄目前階段是否曾經開始計時。
    const [hasStarted, setHasStarted] = useState(false)
    // 記錄目前循環已經歷的專注階段數量。
    const [focusCount, setFocusCount] = useState(0)

    // 切換計時模式。
    const changeMode = (nextMode: TimerMode) => {
        if (nextMode === mode) return

        setIsRunning(false)
        setHasStarted(false)
        setMode(nextMode)
        setRemainingSeconds(durations[nextMode])
    }

    // 依照番茄鐘循環進入下一階段。
    const nextPhase = () => {
        if (mode === 'focus') {
            const nextCount = focusCount + 1

            setFocusCount(nextCount)

            changeMode(
                nextCount >= 4 ? 'longBreak' : 'shortBreak'
            )
        } else {
            if (mode === 'longBreak') {
                setFocusCount(0)
            }

            changeMode('focus')
        }
    }

    // 倒數計時，結束後進入下一階段。
    useEffect(() => {
        if (!isRunning) return

        const timer = window.setTimeout(() => {
            if (remainingSeconds <= 1) {
                nextPhase()
            } else {
                setRemainingSeconds(prev => prev - 1)
            }
        }, 1000)

        return () => window.clearTimeout(timer)
    }, [isRunning, remainingSeconds, nextPhase])

    // 重置目前模式的計時器。
    const resetTimer = () => {
        setIsRunning(false)
        setHasStarted(false)
        setRemainingSeconds(durations[mode])
    }

    // 開始、暫停或繼續計時。
    const toggleTimer = () => {
        setHasStarted(true)
        setIsRunning(prev => !prev)
    }

    // 轉換成 MM:SS 格式。
    const minutes = String(
        Math.floor(remainingSeconds / 60)
    ).padStart(2, '0')

    const seconds = String(
        remainingSeconds % 60
    ).padStart(2, '0')

    // 目前所處的循環階段。
    const currentRound = Math.min(
        4,
        Math.max(1, mode === 'focus' ? focusCount + 1 : focusCount)
    )

    return (
        <div className="flex flex-col items-center gap-8 py-12">
            {/* 模式切換 */}
            <div className="flex gap-6">
                {modes.map(item => (
                    <button
                        key={item.id}
                        onClick={() => changeMode(item.id)}
                        className={`cursor-pointer border-b-2 px-2 py-2 transition-colors ${mode === item.id
                            ? 'border-gray-800 font-semibold text-gray-800'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* 倒數時間 */}
            <div className="relative flex h-28 items-center justify-center">
                <div className="text-6xl font-bold leading-none tabular-nums sm:text-8xl">
                    {minutes}:{seconds}
                </div>

                <button
                    type="button"
                    aria-label="計時設定"
                    title="計時設定"
                    className={`absolute left-full ml-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800 sm:ml-3 ${hasStarted ? 'invisible' : ''
                        }`}
                >
                    <Settings size={22} />
                </button>
            </div>

            {/* 循環進度 */}
            <div className="-mt-6 text-sm text-gray-400 tabular-nums">
                {currentRound} / 4
            </div>

            {/* 操作按鈕 */}
            <div className="flex items-center gap-4">
                <button
                    onClick={resetTimer}
                    aria-label="重置"
                    title="重置"
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                >
                    <RotateCcw size={22} />
                </button>

                <button
                    onClick={toggleTimer}
                    disabled={remainingSeconds === 0}
                    className="h-11 w-28 cursor-pointer rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                    {remainingSeconds === 0
                        ? '已完成'
                        : isRunning
                            ? '暫停'
                            : hasStarted
                                ? '繼續'
                                : '開始'}
                </button>

                <button
                    type="button"
                    onClick={nextPhase}
                    aria-label="跳過"
                    title="跳過"
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                >
                    <SkipForward size={22} />
                </button>
            </div>
        </div>
    )
}
