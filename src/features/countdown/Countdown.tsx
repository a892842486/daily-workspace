
import { useEffect, useState } from 'react'
import { RotateCcw, Settings, Check, X } from 'lucide-react'
import { initializeTimerAudio, playTimerSound } from '../pomodoro-timer/playTimerSound'

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
        playTimerSound()
    }, [now, endTime])

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

    const handleStartPause = async () => {
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

                <div className="h-11 w-11" />
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

                {/* 只有點齒輪進入編輯模式時，才會看到小時選項 */}
                {isEditing && (
                    <div className="mt-3 w-full flex justify-center">
                        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={showHours}
                                onChange={(e) => setShowHours(e.target.checked)}
                            />
                            顯示小時
                        </label>
                    </div>
                )}
            </div>

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
