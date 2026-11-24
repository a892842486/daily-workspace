
import { useCallback, useEffect, useState } from 'react'
import { RotateCcw, SkipForward, Settings } from 'lucide-react'
import PomodoroSettings from './PomodoroSettings'

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

// 三種計時模式。
const modes = [
    { id: 'focus', label: '專注' },
    { id: 'shortBreak', label: '短休息' },
    { id: 'longBreak', label: '長休息' },
] as const

// 三種模式的時間設定型別。
type TimerDurations = Record<TimerMode, number>

// 番茄鐘的計時狀態型別。
type TimerState = {
    mode: TimerMode
    remainingSeconds: number
    isRunning: boolean
    endTime: number | null
    hasStarted: boolean
    focusCount: number
}

// 預設計時時間（秒）。
const defaultDurations: TimerDurations = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
}

export default function PomodoroTimer() {
    const [durations, setDurations] = useState<TimerDurations>(() => {
        const saved = localStorage.getItem('pomodoroDurations')

        return saved ? JSON.parse(saved) : defaultDurations
    })

    // 讀取上一次的計時狀態。
    const [savedState] = useState<TimerState | null>(() => {
        const saved = localStorage.getItem('pomodoroTimerState')

        return saved ? JSON.parse(saved) : null
    })

    const [mode, setMode] = useState<TimerMode>(
        savedState?.mode ?? 'focus'
    )

    const [remainingSeconds, setRemainingSeconds] = useState(() => {
        if (savedState?.isRunning && savedState.endTime !== null) {
            return Math.max(
                0,
                Math.ceil((savedState.endTime - Date.now()) / 1000)
            )
        }

        return savedState?.remainingSeconds ?? durations.focus
    })

    const [isRunning, setIsRunning] = useState(
        savedState?.isRunning ?? false
    )

    // 記錄預計結束計時的時間戳記。
    const [endTime, setEndTime] = useState<number | null>(
        savedState?.endTime ?? null
    )

    // 記錄目前階段是否曾經開始計時。
    const [hasStarted, setHasStarted] = useState(
        savedState?.hasStarted ?? false
    )

    // 記錄目前循環已經歷的專注階段數量。
    const [focusCount, setFocusCount] = useState(
        savedState?.focusCount ?? 0
    )
    // 記錄設定選單是否展開。

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    // 自動儲存時間設定。
    useEffect(() => {
        localStorage.setItem(
            'pomodoroDurations',
            JSON.stringify(durations)
        )
    }, [durations])

    // 自動儲存計時狀態。
    useEffect(() => {
        const state: TimerState = {
            mode,
            remainingSeconds,
            isRunning,
            endTime,
            hasStarted,
            focusCount,
        }

        localStorage.setItem(
            'pomodoroTimerState',
            JSON.stringify(state)
        )
    }, [
        mode,
        remainingSeconds,
        isRunning,
        endTime,
        hasStarted,
        focusCount,
    ])

    // 切換計時模式。
    const changeMode = useCallback((nextMode: TimerMode) => {
        if (nextMode === mode) return

        setIsSettingsOpen(false)
        setIsRunning(false)
        setEndTime(null)
        setHasStarted(false)
        setMode(nextMode)
        setRemainingSeconds(durations[nextMode])
    }, [mode, durations])

    // 更新三種模式的時間設定。
    const updateDurations = (nextDurations: TimerDurations) => {
        setDurations(nextDurations)
        setRemainingSeconds(nextDurations[mode])
    }

    // 重置目前模式的計時器。
    const resetTimer = () => {
        setIsSettingsOpen(false)
        setIsRunning(false)
        setEndTime(null)
        setHasStarted(false)
        setRemainingSeconds(durations[mode])
    }

    // 依照番茄鐘循環進入下一階段。
    const nextPhase = useCallback(() => {
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
    }, [mode, focusCount, changeMode])

    // 根據結束時間戳記計算剩餘時間。
    useEffect(() => {
        if (!isRunning || endTime === null) return

        const timer = window.setInterval(() => {
            const remaining = Math.max(
                0,
                Math.ceil((endTime - Date.now()) / 1000)
            )

            if (remaining === 0) {
                window.clearInterval(timer)
                nextPhase()
            } else {
                setRemainingSeconds(remaining)
            }
        }, 100)

        return () => window.clearInterval(timer)
    }, [isRunning, endTime, nextPhase])

    // 開始、暫停或繼續計時。
    const toggleTimer = () => {
        setIsSettingsOpen(false)
        setHasStarted(true)

        if (isRunning) {
            // 暫停計時。
            if (endTime !== null) {
                setRemainingSeconds(
                    Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
                )
            }

            setIsRunning(false)
            setEndTime(null)
        } else {
            // 開始或繼續計時。
            setEndTime(Date.now() + remainingSeconds * 1000)
            setIsRunning(true)
        }
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
                        disabled={hasStarted}
                        className={`cursor-pointer border-b-2 px-2 py-2 transition-colors disabled:cursor-default ${mode === item.id
                            ? 'border-gray-800 font-semibold text-gray-800'
                            : 'border-transparent text-gray-400 enabled:hover:text-gray-600'
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
                    onClick={() => setIsSettingsOpen(prev => !prev)}
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
            {/* 設定選單 */}
            {isSettingsOpen && (
                <PomodoroSettings
                    durations={durations}
                    onChange={updateDurations}
                />
            )}
        </div>
    )
}
