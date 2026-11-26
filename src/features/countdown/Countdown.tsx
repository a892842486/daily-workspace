
import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw, Settings, Check, X } from 'lucide-react'
import {
    initializeTimerAudio,
    playTimerSound,
    playTimerAlert,
    timerSounds,
} from '../pomodoro-timer/playTimerSound'

import type { TimerSound, TimerAlertMode } from '../pomodoro-timer/playTimerSound'

const STORAGE_KEY = 'countdownPresets'

type Props = {
    onDisplayTimeChange: (displayTime: string | null) => void
}

function Countdown({ onDisplayTimeChange }: Props) {
    const [presets, setPresets] = useState<number[]>(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved ? JSON.parse(saved) : [30, 60, 180]
    })

    const [selectedSeconds, setSelectedSeconds] = useState(300)
    const [remainingSeconds, setRemainingSeconds] = useState(300)
    const [endTime, setEndTime] = useState<number | null>(null)
    const [now, setNow] = useState(Date.now())
    const [overtimeStartTime, setOvertimeStartTime] = useState<number | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    // 提示音設定。
    const [soundEnabled, setSoundEnabled] = useState(() => {
        return localStorage.getItem('countdownSoundEnabled') !== 'false'
    })

    const [timerSound, setTimerSound] = useState<TimerSound>(() => {
        return (localStorage.getItem('countdownTimerSound') as TimerSound) ?? 'soft'
    })

    const [soundVolume, setSoundVolume] = useState(() => {
        return Number(localStorage.getItem('countdownSoundVolume') ?? 50)
    })

    const [alertMode, setAlertMode] = useState<TimerAlertMode>(() => {
        return (localStorage.getItem('countdownAlertMode') as TimerAlertMode) ?? '3'
    })

    // 提醒音播放狀態。
    const alertStopRef = useRef<(() => void) | null>(null)
    const [isAlertPlaying, setIsAlertPlaying] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [showHours, setShowHours] = useState(false)
    const [isTimeEditing, setIsTimeEditing] = useState(false)
    const [editHours, setEditHours] = useState('0')
    const [editMinutes, setEditMinutes] = useState('5')
    const [editSeconds, setEditSeconds] = useState('0')

    const [hours, setHours] = useState('0')
    const [minutes, setMinutes] = useState('0')
    const [seconds, setSeconds] = useState('0')

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
    }, [presets])

    // 自動儲存提示音設定。
    useEffect(() => {
        localStorage.setItem('countdownSoundEnabled', String(soundEnabled))
        localStorage.setItem('countdownTimerSound', timerSound)
        localStorage.setItem('countdownSoundVolume', String(soundVolume))
        localStorage.setItem('countdownAlertMode', alertMode)
    }, [soundEnabled, timerSound, soundVolume, alertMode])

    // 運行中時，以時間戳記更新倒數。
    useEffect(() => {
        if (endTime === null && overtimeStartTime === null) return

        const timer = window.setInterval(() => {
            setNow(Date.now())
        }, 250)

        return () => window.clearInterval(timer)
    }, [endTime, overtimeStartTime])

    // 倒數結束。
    useEffect(() => {
        if (endTime === null || now < endTime) return

        setRemainingSeconds(0)
        setEndTime(null)
        setOvertimeStartTime(endTime)

        if (soundEnabled) {
            setIsAlertPlaying(true)

            alertStopRef.current = playTimerAlert(
                timerSound,
                soundVolume,
                alertMode,
                () => {
                    alertStopRef.current = null
                    setIsAlertPlaying(false)
                }
            )
        }
    }, [now, endTime, soundEnabled, timerSound, soundVolume, alertMode])

    const currentSeconds = endTime !== null
        ? Math.max(0, Math.ceil((endTime - now) / 1000))
        : remainingSeconds

    const overtimeSeconds = overtimeStartTime !== null
        ? Math.max(0, Math.floor((now - overtimeStartTime) / 1000))
        : 0

    const overtimeDisplay = `+${String(Math.floor(overtimeSeconds / 60)).padStart(2, '0')}:${String(overtimeSeconds % 60).padStart(2, '0')}`

    const displayHours = Math.floor(currentSeconds / 3600)
    const displayMinutes = Math.floor((currentSeconds % 3600) / 60)
    const displaySeconds = currentSeconds % 60

    const displayTime = showHours
        ? `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`
        : `${String(displayMinutes).padStart(2, '0')}:${String(displaySeconds).padStart(2, '0')}`

    // 回報倒數時間給 App，供導覽列顯示。
    useEffect(() => {
        if (endTime === null && overtimeStartTime === null) {
            onDisplayTimeChange(null)
            return
        }

        onDisplayTimeChange(
            overtimeStartTime !== null
                ? overtimeDisplay
                : displayTime
        )
    }, [
        endTime,
        overtimeStartTime,
        displayTime,
        overtimeDisplay,
        onDisplayTimeChange,
    ])

    // 停止目前的提醒音。
    const stopAlert = useCallback(() => {
        alertStopRef.current?.()
        alertStopRef.current = null
        setIsAlertPlaying(false)
    }, [])

    const handleStartPause = async () => {
        stopAlert()

        if (isEditing || isAdding) return

        if (isTimeEditing) {
            const duration =
                (showHours ? Number(editHours) * 3600 : 0) +
                Number(editMinutes) * 60 +
                Number(editSeconds)

            if (duration <= 0) return

            setSelectedSeconds(duration)
            setRemainingSeconds(duration)
            setIsTimeEditing(false)
            setOvertimeStartTime(null)

            await initializeTimerAudio()
            setNow(Date.now())
            setEndTime(Date.now() + duration * 1000)
            return
        }

        if (currentSeconds <= 0) return

        if (endTime !== null) {
            setRemainingSeconds(currentSeconds)
            setEndTime(null)
        } else {
            await initializeTimerAudio()
            setNow(Date.now())
            setEndTime(Date.now() + currentSeconds * 1000)
        }
    }
    const handleReset = () => {
        stopAlert()

        setEndTime(null)
        setOvertimeStartTime(null)
        setRemainingSeconds(selectedSeconds)
        setNow(Date.now())
    }

    const handleEditTime = () => {
        if (endTime !== null) return

        setEditHours(String(Math.floor(remainingSeconds / 3600)))
        setEditMinutes(String(Math.floor((remainingSeconds % 3600) / 60)))
        setEditSeconds(String(remainingSeconds % 60))
        setIsTimeEditing(true)
    }

    const handleSelectPreset = (duration: number) => {
        stopAlert()

        setEndTime(null)
        setOvertimeStartTime(null)
        setSelectedSeconds(duration)
        setRemainingSeconds(duration)
        setNow(Date.now())
    }

    const handleAddPreset = () => {
        const duration =
            Number(hours) * 3600 +
            Number(minutes) * 60 +
            Number(seconds)

        if (duration <= 0) return

        setPresets([...presets, duration])
        handleSelectPreset(duration)

        setHours('0')
        setMinutes('0')
        setSeconds('0')
        setIsAdding(false)
    }

    const handleDeletePreset = (duration: number) => {
        const updatedPresets = presets.filter((preset) => preset !== duration)
        setPresets(updatedPresets)

        if (selectedSeconds === duration) {
            setEndTime(null)

            if (updatedPresets.length > 0) {
                setSelectedSeconds(updatedPresets[0])
                setRemainingSeconds(updatedPresets[0])
            } else {
                setSelectedSeconds(0)
                setRemainingSeconds(0)
            }
        }
    }

    const formatPreset = (duration: number) => {
        const h = Math.floor(duration / 3600)
        const m = Math.floor((duration % 3600) / 60)
        const s = duration % 60

        if (h > 0) {
            return `${h} 小時${m > 0 ? ` ${m} 分` : ''}${s > 0 ? ` ${s} 秒` : ''}`
        }

        if (m > 0) {
            return `${m} 分鐘${s > 0 ? ` ${s} 秒` : ''}`
        }

        return `${s} 秒`
    }

    return (
        <div className="mx-auto max-w-md">
            {/* 時間 */}
            <div className="relative mb-8 flex h-28 items-center justify-center">
                <div className="relative text-7xl font-bold leading-none tabular-nums tracking-tight">

                    {overtimeStartTime !== null && (
                        <span className="absolute right-full mr-1 text-green-600">
                            +
                        </span>
                    )}

                    {isTimeEditing ? (
                        <div className="flex items-center gap-1">
                            {showHours && (
                                <>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editHours}
                                        onChange={(e) => setEditHours(e.target.value)}
                                        className="w-20 rounded-lg border border-gray-200 p-2 text-center text-5xl font-bold tabular-nums"
                                    />
                                    <span className="text-4xl font-bold">:</span>
                                </>
                            )}

                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={editMinutes}
                                onChange={(e) => setEditMinutes(e.target.value)}
                                className="w-20 rounded-lg border border-gray-200 p-2 text-center text-5xl font-bold tabular-nums"
                            />
                            <span className="text-4xl font-bold">:</span>
                            <input
                                type="number"
                                min="0"
                                max="59"
                                value={editSeconds}
                                onChange={(e) => setEditSeconds(e.target.value)}
                                className="w-20 rounded-lg border border-gray-200 p-2 text-center text-5xl font-bold tabular-nums"
                            />
                        </div>
                    ) : overtimeStartTime !== null ? (
                        <div className="text-green-600">
                            {overtimeDisplay.replace(/^\+/, '')}
                        </div>
                    ) : (
                        <button
                            onClick={handleEditTime}
                            title="點擊編輯時間"
                            className="cursor-pointer text-gray-800 hover:text-gray-500 transition-colors"
                        >
                            {displayTime}
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setIsEditing(!isEditing)}
                    title={isEditing ? '完成編輯預設時間' : '編輯預設時間'}
                    className="absolute left-full ml-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                >
                    {isEditing ? <Check size={22} /> : <Settings size={22} />}
                </button>
            </div>

            {/* 操作按鈕 */}
            <div className="mb-8 flex items-center justify-center gap-4">
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
                    disabled={isEditing || isAdding || (!isTimeEditing && currentSeconds <= 0)}
                    className="h-11 w-28 cursor-pointer rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {endTime !== null
                        ? '暫停'
                        : remainingSeconds < selectedSeconds && remainingSeconds > 0
                            ? '繼續'
                            : '開始'}
                </button>

                {isAlertPlaying ? (
                    <button
                        type="button"
                        onClick={stopAlert}
                        className="cursor-pointer rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-200"
                    >
                        停止提醒
                    </button>
                ) : (
                    <div className="h-11 w-11" />
                )}
            </div>

            {/* 預設時間 */}
            <div className="flex flex-wrap items-center justify-center gap-2">
                {presets.map((duration, index) => (
                    <div
                        key={`${duration}-${index}`}
                        className={`flex items-center gap-1 rounded-lg border px-3 py-2 transition-colors ${selectedSeconds === duration
                            ? 'border-gray-800 bg-gray-800 text-white'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        <button
                            onClick={() => !isEditing && handleSelectPreset(duration)}
                            disabled={isEditing}
                            className="cursor-pointer disabled:cursor-default"
                        >
                            {formatPreset(duration)}
                        </button>

                        {isEditing && (
                            <button
                                onClick={() => handleDeletePreset(duration)}
                                title="刪除"
                                className="cursor-pointer text-red-400 hover:text-red-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ))}

            </div>

            {/* 提示音設定 */}
            {isEditing && (
                <div className="mt-6 rounded-xl border border-gray-200 p-4">

                    {/* 顯示小時 */}
                    <div className="mb-4">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={showHours}
                                onChange={(e) => setShowHours(e.target.checked)}
                            />
                            顯示小時
                        </label>
                    </div>

                    <div className="mb-4 flex items-center justify-between">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={soundEnabled}
                                onChange={e => {
                                    const enabled = e.target.checked
                                    setSoundEnabled(enabled)

                                    if (!enabled) {
                                        stopAlert()
                                    }
                                }}
                            />
                            計時結束提示音
                        </label>
                    </div>

                    {soundEnabled && (
                        <div className="flex flex-col gap-4">
                            {/* 音色 */}
                            <div className="flex items-center gap-3 text-sm">
                                <label htmlFor="countdown-sound" className="shrink-0">
                                    提示音
                                </label>

                                <select
                                    id="countdown-sound"
                                    value={timerSound}
                                    onChange={e => setTimerSound(e.target.value as TimerSound)}
                                    className="min-w-0 flex-1 cursor-pointer rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    {timerSounds.map(sound => (
                                        <option key={sound.id} value={sound.id}>
                                            {sound.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 音量 */}
                            <div className="flex items-center gap-3 text-sm">
                                <label htmlFor="countdown-volume" className="shrink-0">
                                    音量
                                </label>

                                <input
                                    id="countdown-volume"
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={soundVolume}
                                    onChange={e => setSoundVolume(Number(e.target.value))}
                                    className="min-w-0 flex-1 cursor-pointer"
                                />

                                <span className="w-10 text-right tabular-nums">
                                    {soundVolume}%
                                </span>
                            </div>

                            {/* 提醒方式 */}
                            <div className="flex items-center gap-3 text-sm">
                                <label htmlFor="countdown-alert-mode" className="shrink-0">
                                    提醒方式
                                </label>

                                <select
                                    id="countdown-alert-mode"
                                    value={alertMode}
                                    onChange={e => setAlertMode(e.target.value as TimerAlertMode)}
                                    className="min-w-0 flex-1 cursor-pointer rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-blue-500"
                                >
                                    <option value="1">響鈴 1 次</option>
                                    <option value="2">響鈴 2 次</option>
                                    <option value="3">響鈴 3 次</option>
                                    <option value="4">響鈴 4 次</option>
                                    <option value="5">響鈴 5 次</option>
                                    <option value="10s">響鈴 10 秒</option>
                                    <option value="30s">響鈴 30 秒</option>
                                </select>
                            </div>

                            {/* 試聽 */}
                            <div className="flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        void initializeTimerAudio()
                                            .then(() => playTimerSound(timerSound, soundVolume, 1))
                                            .catch(console.warn)
                                    }}
                                    className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                                >
                                    ▷ 試聽
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 新增倒數 */}
            <div className="mt-4">
                {!isAdding ? (
                    <button
                        onClick={() => setIsAdding(true)}
                        disabled={isEditing}
                        className="w-full cursor-pointer rounded-lg border border-dashed border-gray-300 py-3 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        + 新增倒數
                    </button>
                ) : (
                    <div className="rounded-lg border border-gray-200 p-4">
                        <div className="mb-4 flex items-center justify-center gap-3">
                            {showHours && (
                                <div className="flex flex-col items-center gap-1">
                                    <input
                                        type="number"
                                        min="0"
                                        value={hours}
                                        onChange={(value) => setHours(value.target.value)}
                                        className="w-16 rounded-lg border border-gray-200 p-2 text-center"
                                    />
                                    <span className="text-sm text-gray-500">時</span>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    value={minutes}
                                    onChange={(value) => setMinutes(value.target.value)}
                                    className="w-16 rounded-lg border border-gray-200 p-2 text-center"
                                />
                                <span className="text-sm text-gray-500">分</span>
                            </div>

                            <div className="flex flex-col items-center gap-1">
                                <input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={seconds}
                                    onChange={(value) => setSeconds(value.target.value)}
                                    className="w-16 rounded-lg border border-gray-200 p-2 text-center"
                                />
                                <span className="text-sm text-gray-500">秒</span>
                            </div>
                        </div>

                        <div className="flex justify-center gap-2">
                            <button
                                onClick={handleAddPreset}
                                className="cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                            >
                                新增
                            </button>

                            <button
                                onClick={() => setIsAdding(false)}
                                className="cursor-pointer rounded-lg px-4 py-2 text-gray-500 hover:bg-gray-100"
                            >
                                取消
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Countdown
