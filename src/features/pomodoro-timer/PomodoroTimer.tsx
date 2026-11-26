
import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw, SkipForward, Settings } from 'lucide-react'

import PomodoroSettings from './PomodoroSettings'
import WorkHistory from '../work-history/WorkHistory'
import { getWorkspaceDate } from '../../utils/getWorkspaceDate'
import { formatDuration } from '../../utils/formatDuration'
import { initializeTimerAudio, playTimerSound } from './playTimerSound'

import type { FocusRecord } from './FocusRecord'
import type { TimerSound } from './playTimerSound'
import type { DateTimePreferences } from '../settings/dateTimePreferences'
import type { Task } from '../kanban/TaskCard'
import type { EventRecord } from '../event-records/EventRecord'

// 三種計時模式。
const modes = [
    { id: 'focus', label: '專注' },
    { id: 'shortBreak', label: '短休息' },
    { id: 'longBreak', label: '長休息' },
] as const

type TimerMode = 'focus' | 'shortBreak' | 'longBreak'

// 提供給 App 的全域計時顯示資訊。
export type TimerDisplayInfo = {
    displayTime: string
    modeLabel: string
    isRunning: boolean
}

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

type Props = {
    onTimerDisplayInfoChange: (info: TimerDisplayInfo | null) => void
    focusRecords: FocusRecord[]
    tasks: Task[]
    eventRecords: EventRecord[]
    addEventRecord: (occurredAt: number, title: string) => void
    updateEventRecord: (id: string, occurredAt: number, title: string) => void
    deleteEventRecord: (id: string) => void
    updateTask: (id: string, title: string, completedAt?: number) => void
    deleteTask: (id: string) => void
    dailyTitles: Record<string, string>
    dateTimeSettings: DateTimePreferences

    addFocusRecord: (
        completedAt: number,
        elapsedSeconds: number,
        note?: string
    ) => void
    updateFocusNote: (id: string, note: string) => void
    deleteFocusRecord: (id: string) => void
    updateDailyTitle: (date: string, title: string) => void
}

export default function PomodoroTimer({
    onTimerDisplayInfoChange,
    focusRecords,
    tasks,
    eventRecords,
    addEventRecord,
    updateEventRecord,
    deleteEventRecord,
    updateTask,
    deleteTask,
    dailyTitles,
    dateTimeSettings,
    addFocusRecord,
    updateFocusNote,
    deleteFocusRecord,
    updateDailyTitle,
}: Props) {
    // 讀取已儲存的時間設定。
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
            return Math.ceil((savedState.endTime - Date.now()) / 1000)
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

    // 讀取本次尚未結算的專注內容。
    const [focusNote, setFocusNote] = useState(() => {
        return localStorage.getItem('pomodoroFocusNote') ?? ''
    })

    // 記錄設定選單是否展開。
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // 讀取已儲存的提示音開關。
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('pomodoroSoundEnabled') !== 'false'
    })

    // 讀取已儲存的提示音種類。
    const [timerSound, setTimerSound] = useState<TimerSound>(() => {
        return (localStorage.getItem('pomodoroTimerSound') as TimerSound) ?? 'soft'
    })

    // 讀取已儲存的提示音音量。
    const [soundVolume, setSoundVolume] = useState(() => {
        return Number(localStorage.getItem('pomodoroSoundVolume') ?? 50)
    })

    // 記錄目前所屬的工作區日期。
    const [workspaceDate, setWorkspaceDate] = useState(
        () => getWorkspaceDate()
    )

    // 記錄本次計時是否已播放結束提示音。
    const hasPlayedSound = useRef(remainingSeconds <= 0)

    // 判斷目前是否處於超時正計時。
    const isOvertime = remainingSeconds < 0

    // 使用共用函式格式化計時時間。
    const displayTime = formatDuration(remainingSeconds)

    // 回報目前番茄鐘的顯示資訊給 App。
    useEffect(() => {
        if (!hasStarted) {
            onTimerDisplayInfoChange(null)
            return
        }

        const modeLabel = modes.find(item => item.id === mode)?.label ?? ''

        onTimerDisplayInfoChange({
            displayTime,
            modeLabel,
            isRunning,
        })
    }, [
        hasStarted,
        mode,
        isRunning,
        displayTime,
        onTimerDisplayInfoChange,
    ])

    // 目前所處的循環階段。
    const currentRound = Math.min(
        4,
        Math.max(1, mode === 'focus' ? focusCount + 1 : focusCount)
    )

    // 篩選屬於今日的專注紀錄。
    const todayRecords = focusRecords.filter(record =>
        getWorkspaceDate(record.completedAt) === workspaceDate
    )

    // 計算今日番茄總數。
    const todayTomatoes = todayRecords.reduce(
        (total, record) => total + record.tomatoes,
        0
    )

    // 計算今日累計專注秒數。
    const todayFocusSeconds = todayRecords.reduce(
        (total, record) => total + record.elapsedSeconds,
        0
    )

    // 將累計專注時間轉換成小時與分鐘。
    const todayFocusHours = Math.floor(todayFocusSeconds / 3600)
    const todayFocusMinutes = Math.floor((todayFocusSeconds % 3600) / 60)

    // 持續檢查是否進入新的工作區日期。
    useEffect(() => {
        const timer = window.setInterval(() => {
            setWorkspaceDate(getWorkspaceDate())
        }, 1000)

        return () => window.clearInterval(timer)
    }, [])

    // 自動儲存本次專注內容。
    useEffect(() => {
        localStorage.setItem('pomodoroFocusNote', focusNote)
    }, [focusNote])

    // 自動儲存提示音設定。
    useEffect(() => {
        localStorage.setItem(
            'pomodoroSoundEnabled',
            String(soundEnabled)
        )
        localStorage.setItem(
            'pomodoroTimerSound',
            timerSound
        )
        localStorage.setItem(
            'pomodoroSoundVolume',
            String(soundVolume)
        )
    }, [soundEnabled, timerSound, soundVolume])

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

    // 根據結束時間戳記計算倒數與超時時間。
    useEffect(() => {
        if (!isRunning || endTime === null) return

        const timer = window.setInterval(() => {
            const remaining = Math.ceil(
                (endTime - Date.now()) / 1000
            )

            setRemainingSeconds(remaining)
        }, 100)

        return () => window.clearInterval(timer)
    }, [isRunning, endTime])

    // 倒數歸零時播放提示音，每次計時只觸發一次。
    useEffect(() => {
        if (!hasStarted) {
            hasPlayedSound.current = false
            return
        }

        if (
            !isRunning ||
            remainingSeconds > 0 ||
            hasPlayedSound.current
        ) {
            return
        }

        hasPlayedSound.current = true

        if (soundEnabled) {
            void playTimerSound(
                timerSound,
                soundVolume,
                3
            ).catch(console.warn)
        }
    }, [
        hasStarted,
        isRunning,
        remainingSeconds,
        soundEnabled,
        timerSound,
        soundVolume,
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

    // 結算本次專注時間及內容。
    const settleFocus = useCallback(() => {
        if (mode !== 'focus' || !hasStarted) return

        const remaining = isRunning && endTime !== null
            ? Math.ceil((endTime - Date.now()) / 1000)
            : remainingSeconds

        const elapsedSeconds = Math.max(
            0,
            durations.focus - remaining
        )

        if (elapsedSeconds === 0) return

        addFocusRecord(Date.now(), elapsedSeconds, focusNote)
        setFocusNote('')
    }, [
        mode,
        hasStarted,
        isRunning,
        endTime,
        remainingSeconds,
        durations.focus,
        focusNote,
        addFocusRecord,
    ])

    // 重置目前模式的計時器。
    const resetTimer = () => {
        settleFocus()

        setIsSettingsOpen(false)
        setIsRunning(false)
        setEndTime(null)
        setHasStarted(false)
        setRemainingSeconds(durations[mode])
    }

    // 依照番茄鐘循環進入下一階段。
    const nextPhase = useCallback(() => {
        settleFocus()

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
    }, [mode, focusCount, changeMode, settleFocus])

    // 開始、暫停或繼續計時。
    const toggleTimer = () => {
        // 透過使用者操作解除瀏覽器的音訊播放限制。
        void initializeTimerAudio().catch(console.warn)

        setIsSettingsOpen(false)
        setHasStarted(true)

        if (isRunning) {
            // 暫停計時。
            if (endTime !== null) {
                setRemainingSeconds(
                    Math.ceil((endTime - Date.now()) / 1000)
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
                <div className={`relative text-6xl font-bold leading-none tabular-nums sm:text-8xl ${isOvertime ? 'text-green-600' : ''}`}>
                    {isOvertime && (
                        <span className="absolute right-full mr-1">+</span>
                    )}
                    {displayTime.replace(/^\+/, '')}
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
                    className="h-11 w-28 cursor-pointer rounded-lg bg-gray-800 text-white hover:bg-gray-700"
                >
                    {isRunning
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
                    soundEnabled={soundEnabled}
                    onSoundEnabledChange={setSoundEnabled}
                    timerSound={timerSound}
                    onTimerSoundChange={setTimerSound}
                    soundVolume={soundVolume}
                    onSoundVolumeChange={setSoundVolume}
                />
            )}

            {/* 本次專注內容 */}
            {mode === 'focus' && (
                <textarea
                    value={focusNote}
                    onChange={e => setFocusNote(e.target.value)}
                    placeholder="這次專注做了什麼？"
                    aria-label="本次專注內容"
                    rows={2}
                    className="w-full max-w-2xl resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500"
                />
            )}

            {/* 今日專注成果 */}
            <div className="flex flex-col items-center gap-2 pt-4">
                <div className="text-sm text-gray-400">
                    今日專注成果
                </div>

                <div className="text-3xl font-bold tabular-nums">
                    🍅 {todayTomatoes}
                </div>

                <div className="text-sm text-gray-500">
                    累計專注 {todayFocusHours} 小時 {todayFocusMinutes} 分鐘
                </div>
            </div>

            {/* 今日專注紀錄 */}
            <div className="w-full max-w-2xl">
                <WorkHistory
                    records={todayRecords}
                    tasks={tasks}
                    eventRecords={eventRecords}
                    onAddEvent={addEventRecord}
                    onUpdateEvent={updateEventRecord}
                    onDeleteEvent={deleteEventRecord}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                    dateTimeSettings={dateTimeSettings}
                    workspaceDate={workspaceDate}
                    dailyTitle={dailyTitles[workspaceDate] ?? ''}
                    onUpdateDailyTitle={title =>
                        updateDailyTitle(workspaceDate, title)
                    }
                    onAdd={addFocusRecord}
                    onUpdateNote={updateFocusNote}
                    onDelete={deleteFocusRecord}
                />
            </div>
        </div>
    )
}
