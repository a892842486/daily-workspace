
import { useEffect, useRef, useState } from 'react'

type TimerDurations = {
    focus: number
    shortBreak: number
    longBreak: number
}

type Props = {
    durations: TimerDurations
    onChange: (durations: TimerDurations) => void
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
            className="w-8 rounded text-center tabular-nums outline-none focus:bg-gray-100"
        />
    )
}

export default function PomodoroSettings({
    durations,
    onChange,
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
        <div className="w-full max-w-sm space-y-5 rounded-xl border border-gray-200 p-5">
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
                                ? 'border-gray-800 bg-gray-100'
                                : 'border-gray-200 hover:bg-gray-100'
                                }`}
                        >
                            <div className="text-sm font-medium">
                                {preset.label}
                            </div>
                            <div className="text-xs text-gray-400">
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
                        <span className="text-sm text-gray-600">
                            {field.label}
                        </span>

                        <div className="flex items-center rounded-lg border border-gray-200 px-3 py-2">
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
        </div>
    )
}
