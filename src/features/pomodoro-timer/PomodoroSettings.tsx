
import { useEffect, useRef, useState } from 'react'
import { Volume2, VolumeX, Play } from 'lucide-react'
import { timerSounds, playTimerSound } from './playTimerSound'
import type { TimerSound, TimerAlertMode } from './playTimerSound'

type TimerDurations = {
    focus: number
    shortBreak: number
    longBreak: number
}

type Props = {
    durations: TimerDurations
    onChange: (durations: TimerDurations) => void
    soundEnabled: boolean
    onSoundEnabledChange: (enabled: boolean) => void
    timerSound: TimerSound
    onTimerSoundChange: (sound: TimerSound) => void
    soundVolume: number
    onSoundVolumeChange: (volume: number) => void
    alertMode: TimerAlertMode
    onAlertModeChange: (mode: TimerAlertMode) => void
}

// 三種預設方案。
const presets = [
    {
        label: '動起來',
        time: '15/3',
        durations: {
            focus: 15 * 60,
            shortBreak: 3 * 60,
            longBreak: 15 * 60,
        },
    },
    {
        label: '經典',
        time: '25/5',
        durations: {
            focus: 25 * 60,
            shortBreak: 5 * 60,
            longBreak: 15 * 60,
        },
    },
    {
        label: '沉浸',
        time: '50/10',
        durations: {
            focus: 50 * 60,
            shortBreak: 10 * 60,
            longBreak: 20 * 60,
        },
    },
]

// 三種時間設定欄位。
const fields = [
    { id: 'focus', label: '專注' },
    { id: 'shortBreak', label: '短休息' },
    { id: 'longBreak', label: '長休息' },
] as const

// 可編輯的兩位數時間欄位。
function TimeInput({
    value,
    max,
    label,
    onChange,
}: {
    value: number
    max: number
    label: string
    onChange: (value: number) => void
}) {

    const [draft, setDraft] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // 使用滑鼠滾輪調整時間。
    useEffect(() => {
        const input = inputRef.current
        if (!input) return

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault()

            if (event.deltaY === 0) return

            const direction = event.deltaY < 0 ? 1 : -1

            const nextValue = Math.min(
                max,
                Math.max(0, value + direction)
            )

            setDraft(null)
            onChange(nextValue)
        }

        input.addEventListener('wheel', handleWheel, {
            passive: false,
        })

        return () => {
            input.removeEventListener('wheel', handleWheel)
        }
    }, [value, max, onChange])

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            aria-label={label}
            maxLength={2}
            value={draft ?? String(value).padStart(2, '0')}
            onFocus={event => event.target.select()}
            onChange={event => {
                const text = event.target.value

                if (!/^\d{0,2}$/.test(text)) return

                if (text === '') {
                    setDraft('')
                    return
                }

                const nextValue = Math.min(Number(text), max)

                setDraft(String(nextValue))
                onChange(nextValue)
            }}
            onBlur={() => setDraft(null)}
            onKeyDown={event => {
                if (event.key === 'Enter') {
                    event.currentTarget.blur()
                }
            }}
            className="w-8 rounded bg-transparent text-center tabular-nums text-text-primary outline-none focus:bg-surface-secondary"
        />
    )
}

export default function PomodoroSettings({
    durations,
    onChange,
    soundEnabled,
    onSoundEnabledChange,
    timerSound,
    onTimerSoundChange,
    soundVolume,
    onSoundVolumeChange,
    alertMode,
    onAlertModeChange,
}: Props) {
    // 更新指定模式的分鐘與秒數。
    const updateTime = (
        mode: keyof TimerDurations,
        minutes: number,
        seconds: number
    ) => {
        onChange({
            ...durations,
            [mode]: Math.max(1, minutes * 60 + seconds),
        })
    }

    return (
        <div className="w-full max-w-sm space-y-5 rounded-xl border border-border bg-surface p-5">
            {/* 預設方案 */}
            <div className="grid grid-cols-3 gap-2">
                {presets.map(preset => {
                    const isSelected = fields.every(
                        field =>
                            durations[field.id] === preset.durations[field.id]
                    )

                    return (
                        <button
                            key={preset.label}
                            type="button"
                            onClick={() => onChange(preset.durations)}
                            className={`cursor-pointer rounded-lg border px-2 py-3 transition-colors ${isSelected
                                ? 'border-accent bg-surface-secondary'
                                : 'border-border hover:bg-surface-secondary'
                                }`}
                        >
                            <div className="text-sm font-medium">
                                {preset.label}
                            </div>
                            <div className="text-xs text-text-secondary">
                                {preset.time}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* 時間設定 */}
            <div className="space-y-3">
                {fields.map(field => (
                    <div
                        key={field.id}
                        className="flex items-center justify-between"
                    >
                        <span className="text-sm text-text-secondary">
                            {field.label}
                        </span>

                        <div className="flex items-center rounded-lg border border-border bg-surface-secondary px-3 py-2">
                            <TimeInput
                                label={`${field.label}分鐘`}
                                value={Math.floor(durations[field.id] / 60)}
                                max={99}
                                onChange={minutes =>
                                    updateTime(
                                        field.id,
                                        minutes,
                                        durations[field.id] % 60
                                    )
                                }
                            />

                            <span>:</span>

                            <TimeInput
                                label={`${field.label}秒數`}
                                value={durations[field.id] % 60}
                                max={59}
                                onChange={seconds =>
                                    updateTime(
                                        field.id,
                                        Math.floor(durations[field.id] / 60),
                                        seconds
                                    )
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>
            {/* 提示音設定 */}
            <div className="space-y-4 border-t border-border pt-4">
                {/* 提示音開關 */}
                <div className="flex items-center gap-2 text-sm">
                    {soundEnabled
                        ? <Volume2 size={18} />
                        : <VolumeX size={18} />}

                    <span>計時結束提示音</span>

                    <button
                        type="button"
                        role="switch"
                        aria-label="計時結束提示音"
                        aria-checked={soundEnabled}
                        onClick={() => onSoundEnabledChange(!soundEnabled)}
                        className={`re<span className="w-10 text-right tabular-nums text-text-secondary">Enabled ? 'bg-primary' : 'bg-surface-secondary'
                            }`}
                    >
                        <span
                            className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-5' : ''
                                }`}
                        />
                    </button>
                </div>

                {soundEnabled && (
                    <>
                        {/* 提示音種類 */}
                        <div className="flex items-center gap-3 text-sm">
                            <label htmlFor="timer-sound">
                                提示音
                            </label>

                            <select
                                id="timer-sound"
                                value={timerSound}
                                onChange={e =>
                                    onTimerSoundChange(e.target.value as TimerSound)
                                }
                                className="min-w-0 flex-1 cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-accent"
                            >
                                {timerSounds.map(sound => (
                                    <option key={sound.id} value={sound.id}>
                                        {sound.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 音量調整 */}
                        <div className="flex items-center gap-3 text-sm">
                            <label htmlFor="timer-volume">
                                音量
                            </label>

                            <input
                                id="timer-volume"
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={soundVolume}
                                onChange={e =>
                                    onSoundVolumeChange(Number(e.target.value))
                                }
                                className="min-w-0 flex-1 cursor-pointer accent-primary"
                            />

                            <span className="w-10 text-right tabular-nums text-text-secondary">
                                {soundVolume}%
                            </span>
                        </div>

                        {/* 提醒方式 */}
                        <div className="flex items-center gap-3 text-sm">
                            <label htmlFor="timer-alert-mode">
                                提醒方式
                            </label>

                            <select
                                id="timer-alert-mode"
                                value={alertMode}
                                onChange={e =>
                                    onAlertModeChange(e.target.value as TimerAlertMode)
                                }
                                className="min-w-0 flex-1 cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-accent"
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

                        {/* 試聽提示音 */}
                        <button
                            type="button"
                            onClick={() => {
                                void playTimerSound(
                                    timerSound,
                                    soundVolume
                                ).catch(console.warn)
                            }}
                            className="mx-auto flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
                        >
                            <Play size={14} />
                            試聽
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
