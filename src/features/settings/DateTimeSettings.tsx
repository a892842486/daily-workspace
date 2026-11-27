
import {
    ArrowLeft,
    LayoutDashboard,
    Timer,
    CalendarDays,
    Settings as SettingsIcon,
    X,
} from 'lucide-react'
import {
    defaultDateTimeSettings,
    type DateTimePreferences,
    type DateFormat,
    type WeekFormat,
    type TimeFormat,
} from './dateTimePreferences'
import { formatDateTime, formatTime } from '../../utils/formatTime'

type Props = {
    settings: DateTimePreferences
    onChange: (settings: DateTimePreferences) => void
}

// 日期與時間設定介面。
export default function DateTimeSettings({
    settings,
    onChange,
}: Props) {
    const now = Date.now()

    // 更新單一設定項目。
    function update<K extends keyof DateTimePreferences>(
        key: K,
        value: DateTimePreferences[K]
    ) {
        onChange({ ...settings, [key]: value })
    }

    const displayItems = [
        { key: 'showYear', label: '年份' },
        { key: 'showDate', label: '月日' },
        { key: 'showWeek', label: '星期' },
        { key: 'showTime', label: '時間' },
    ] as const

    const selectClass =
        'w-48 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm text-text-primary outline-none cursor-pointer'

    return (
        <section className="flex w-full flex-col gap-5">
            <h2 className="text-lg font-semibold">
                日期與時間
            </h2>

            {/* 導覽列預覽 */}
            <div className="flex min-h-14 flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-secondary p-3">
                <ArrowLeft size={16} className="text-text-secondary" />
                <LayoutDashboard size={20} />
                <Timer size={20} />
                <CalendarDays size={20} />
                <SettingsIcon size={20} />

                {settings.visible && (
                    <span className="ml-auto text-sm text-text-secondary tabular-nums">
                        {formatDateTime(now, settings)}
                    </span>
                )}
            </div>

            {/* 右上角顯示開關 */}
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                    顯示右上角日期時間
                </span>

                <button
                    type="button"
                    role="switch"
                    aria-label="顯示右上角日期時間"
                    aria-checked={settings.visible}
                    onClick={() => update('visible', !settings.visible)}
                    className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${settings.visible
                            ? 'bg-primary'
                            : 'bg-surface-secondary'
                        }`}
                >
                    <span
                        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform ${settings.visible ? 'translate-x-5' : ''
                            }`}
                    />
                </button>
            </div>

            {/* 顯示項目 */}
            <div className="flex flex-col gap-3">
                <span className="text-sm text-text-secondary">
                    顯示項目
                </span>

                <div className="flex flex-wrap gap-5">
                    {displayItems.map(item => (
                        <label
                            key={item.key}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                            <input
                                type="checkbox"
                                checked={settings[item.key]}
                                onChange={event =>
                                    update(item.key, event.target.checked)
                                }
                                className="h-4 w-4 cursor-pointer accent-primary"
                            />
                            {item.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* 日期格式 */}
            <label className="flex items-center justify-between gap-3 text-sm">
                日期格式

                <select
                    value={settings.dateFormat}
                    onChange={event =>
                        update('dateFormat', event.target.value as DateFormat)
                    }
                    className={selectClass}
                >
                    <option value="slash">2026/11/24</option>
                    <option value="chinese">2026年11月24日</option>
                    <option value="reverse">24/11/2026</option>
                </select>
            </label>

            {/* 星期格式 */}
            <label className="flex items-center justify-between gap-3 text-sm">
                星期格式

                <select
                    value={settings.weekFormat}
                    onChange={event =>
                        update('weekFormat', event.target.value as WeekFormat)
                    }
                    className={selectClass}
                >
                    <option value="short">(二)</option>
                    <option value="week">(週二)</option>
                    <option value="full">星期二</option>
                    <option value="english">(Tue)</option>
                </select>
            </label>

            {/* 時間格式 */}
            <label className="flex items-center justify-between gap-3 text-sm">
                時間格式

                <select
                    value={settings.timeFormat}
                    onChange={event =>
                        update('timeFormat', event.target.value as TimeFormat)
                    }
                    className={selectClass}
                >
                    <option value="casual">生活口語</option>
                    <option value="chinese">上午／下午</option>
                    <option value="english">AM / PM</option>
                    <option value="24">24 小時制</option>
                </select>
            </label>

            {/* 小時補零 */}
            {settings.timeFormat !== '24' && (
                <label className="flex cursor-pointer items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm">小時補零</span>
                        <span className="text-xs text-text-secondary">
                            8:46 → 08:46
                        </span>
                    </div>

                    <input
                        type="checkbox"
                        checked={settings.padHour}
                        onChange={event =>
                            update('padHour', event.target.checked)
                        }
                        className="h-4 w-4 cursor-pointer accent-primary"
                    />
                </label>
            )}

            {/* 專注紀錄預覽 */}
            <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
                <span className="w-24 shrink-0 text-sm text-text-secondary tabular-nums">
                    {formatTime(now, settings)}
                </span>

                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />

                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-center gap-3 text-sm">
                        <span>50 分鐘</span>
                        <span className="ml-auto">🍅 2</span>
                        <X size={14} className="text-text-secondary" />
                    </div>

                    <span className="text-sm text-text-secondary">
                        開發 Daily Workspace
                    </span>
                </div>
            </div>

            {/* 恢復預設值 */}
            <button
                type="button"
                onClick={() => onChange({ ...defaultDateTimeSettings })}
                className="cursor-pointer rounded-lg border border-border px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
            >
                恢復預設值
            </button>
        </section>
    )
}
