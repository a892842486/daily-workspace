
import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

import { calculateTomatoes } from '../pomodoro-timer/calculateTomatoes'
import { getWorkspaceDate } from '../../utils/getWorkspaceDate'
import { formatTime } from '../../utils/formatTime'

import type { FocusRecord } from '../pomodoro-timer/FocusRecord'
import type { Task } from '../kanban/TaskCard'
import type { EventRecord } from '../event-records/EventRecord'
import type { DateTimePreferences } from '../settings/dateTimePreferences'

// 混合時間軸的三種紀錄型別。
type HistoryItem =
    | {
        type: 'focus'
        timestamp: number
        record: FocusRecord
    }
    | {
        type: 'task'
        timestamp: number
        record: Task
    }
    | {
        type: 'event'
        timestamp: number
        record: EventRecord
    }

type Props = {
    records: FocusRecord[]
    tasks: Task[]
    eventRecords: EventRecord[]
    dateTimeSettings: DateTimePreferences
    workspaceDate?: string
    defaultOpen?: boolean
    dailyTitle: string
    showDate?: boolean
    onUpdateDailyTitle: (title: string) => void

    onAdd: (
        completedAt: number,
        elapsedSeconds: number,
        note: string
    ) => void
    onUpdateNote: (id: string, note: string) => void
    onDelete: (id: string) => void
    onAddEvent: (occurredAt: number, title: string) => void
    onUpdateEvent: (id: string, occurredAt: number, title: string) => void
    onDeleteEvent: (id: string) => void
    onUpdateTask: (id: string, title: string, completedAt?: number) => void
    onDeleteTask: (id: string) => void
}

export default function WorkHistory({
    records,
    tasks,
    eventRecords,
    dateTimeSettings,
    workspaceDate = getWorkspaceDate(),
    defaultOpen = false,
    dailyTitle,
    showDate = false,
    onUpdateDailyTitle,
    onAdd,
    onUpdateNote,
    onDelete,
    onAddEvent,
    onUpdateEvent,
    onDeleteEvent,
    onUpdateTask,
    onDeleteTask,
}: Props) {
    // 控制專注紀錄是否展開。
    const [isOpen, setIsOpen] = useState(defaultOpen)

    // 共用紀錄表單的狀態。
    const [formMode, setFormMode] = useState<'focus' | 'event' | null>(null)
    const [manualTime, setManualTime] = useState('')
    const [manualMinutes, setManualMinutes] = useState('25')
    const [manualNote, setManualNote] = useState('')

    // 建立專注紀錄、完成待辦與生活紀錄的混合時間軸。
    const historyItems: HistoryItem[] = records.map(record => ({
        type: 'focus',
        timestamp: record.completedAt,
        record,
    }))

    // 加入當日完成的待辦事項。
    for (const task of tasks) {
        if (
            task.status === '完成' &&
            task.completedAt !== undefined &&
            getWorkspaceDate(task.completedAt) === workspaceDate
        ) {
            historyItems.push({
                type: 'task',
                timestamp: task.completedAt,
                record: task,
            })
        }
    }

    // 加入當日生活紀錄。
    for (const record of eventRecords) {
        if (getWorkspaceDate(record.occurredAt) === workspaceDate) {
            historyItems.push({
                type: 'event',
                timestamp: record.occurredAt,
                record,
            })
        }
    }

    // 依照時間由早到晚排列。
    historyItems.sort((a, b) => a.timestamp - b.timestamp)

    // 計算當日番茄數量。
    const totalTomatoes = records.reduce(
        (total, record) => total + record.tomatoes,
        0
    )

    // 計算當日累計專注時間。
    const totalFocusSeconds = records.reduce(
        (total, record) => total + record.elapsedSeconds,
        0
    )

    const totalFocusHours = Math.floor(totalFocusSeconds / 3600)
    const totalFocusMinutes = Math.floor((totalFocusSeconds % 3600) / 60)

    // 收合紀錄表單。
    const closeForm = () => {
        setFormMode(null)
    }

    // 展開新增表單並填入預設值。
    const openAddForm = (mode: 'focus' | 'event') => {
        setManualTime(
            new Date().toTimeString().slice(0, 5)
        )
        setManualMinutes('25')
        setManualNote('')
        setFormMode(mode)
    }

    // 根據工作區日期與輸入時間建立時間戳記。
    const getRecordTimestamp = (time: string) => {
        if (!time) return null

        const [hours, mins] = time.split(':').map(Number)

        const date = new Date(`${workspaceDate}T00:00:00`)
        date.setHours(hours, mins, 0, 0)

        if (getWorkspaceDate(date.getTime()) < workspaceDate) {
            date.setDate(date.getDate() + 1)
        }

        if (date.getTime() > Date.now()) {
            window.alert('紀錄時間不可晚於目前時間。')
            return null
        }

        return date.getTime()
    }

    // 新增專注紀錄或生活紀錄。
    const submitRecord = () => {
        if (!manualTime || !formMode) return

        const minutes = Number(manualMinutes)
        const title = manualNote.trim()

        if (
            formMode === 'focus' &&
            (!Number.isInteger(minutes) || minutes <= 0)
        ) return

        if (formMode === 'event' && !title) return

        const timestamp = getRecordTimestamp(manualTime)

        if (timestamp === null) return

        if (formMode === 'focus') {
            onAdd(timestamp, minutes * 60, manualNote)
        } else {
            onAddEvent(timestamp, title)
        }

        closeForm()
    }

    // 直接修改灰色膠囊的文字。
    const updateHistoryTitle = (item: HistoryItem, title: string) => {
        if (item.type === 'task') {
            onUpdateTask(item.record.id, title)
        } else if (item.type === 'event') {
            onUpdateEvent(
                item.record.id,
                item.record.occurredAt,
                title
            )
        }
    }

    // 直接修改灰色膠囊的紀錄時間。
    const updateHistoryTime = (item: HistoryItem, time: string) => {
        const timestamp = getRecordTimestamp(time)

        if (timestamp === null) return

        if (item.type === 'task') {
            onUpdateTask(
                item.record.id,
                item.record.title,
                timestamp
            )
        } else if (item.type === 'event') {
            onUpdateEvent(
                item.record.id,
                timestamp,
                item.record.title
            )
        }
    }

    // 確認並刪除灰色膠囊的原始資料。
    const deleteHistoryItem = (item: HistoryItem) => {
        if (item.type === 'task') {
            if (!window.confirm('確定要刪除這筆待辦事項嗎？')) return

            onDeleteTask(item.record.id)
        } else if (item.type === 'event') {
            if (!window.confirm('確定要刪除這筆生活紀錄嗎？')) return

            onDeleteEvent(item.record.id)
        }
    }

    return (
        <div className="w-full rounded-lg border border-border bg-surface">
            {/* 展開與收合 */}
            <button
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3"
            >
                {showDate ? (
                    <>
                        <span className="font-semibold tabular-nums">
                            {workspaceDate.replaceAll('-', '/')}
                        </span>

                        <div className="ml-auto flex items-center gap-4 tabular-nums">
                            <span className="font-medium">
                                🍅 {totalTomatoes}
                            </span>

                            <span className="text-sm text-text-secondary">
                                {totalFocusHours}h {totalFocusMinutes}m
                            </span>
                        </div>
                    </>
                ) : (
                    <span className="font-medium">
                        {workspaceDate === getWorkspaceDate()
                            ? '今日活動紀錄'
                            : '活動紀錄'}

                        <span className="ml-2 text-sm font-normal text-text-secondary">
                            {historyItems.length} 筆
                        </span>
                    </span>
                )}

                {isOpen
                    ? <ChevronUp size={18} />
                    : <ChevronDown size={18} />}
            </button>

            {/* 專注紀錄列表 */}
            {
                isOpen && (
                    <div className="border-t border-border px-4 py-4">
                        {/* 每日標題 */}
                        <input
                            type="text"
                            value={dailyTitle}
                            onChange={e => onUpdateDailyTitle(e.target.value)}
                            placeholder="一句話說這天做了什麼吧"
                            aria-label="每日標題"
                            className="mb-4 w-full rounded-lg border border-border bg-surface text-text-primary px-4 py-3 text-sm outline-none transition-colors focus:border-accent"
                        />

                        {/* 新增紀錄與共用表單 */}
                        <div className="mb-5 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        formMode === 'focus'
                                            ? closeForm()
                                            : openAddForm('focus')
                                    }
                                    className="w-full cursor-pointer rounded-md border border-dashed border-border py-2 text-sm text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
                                >
                                    ＋ 補登專注紀錄
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        formMode === 'event'
                                            ? closeForm()
                                            : openAddForm('event')
                                    }
                                    className="w-full cursor-pointer rounded-md border border-dashed border-border py-2 text-sm text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
                                >
                                    ＋ 生活紀錄
                                </button>
                            </div>

                            {formMode !== null && (
                                <form
                                    onSubmit={e => {
                                        e.preventDefault()
                                        submitRecord()
                                    }}
                                    className="space-y-3 rounded-lg border border-border bg-surface p-3"
                                >

                                    <div className={`grid gap-3 ${formMode === 'focus'
                                        ? 'grid-cols-2'
                                        : 'grid-cols-1'
                                        }`}>
                                        <label className="space-y-1 text-sm">
                                            <span className="text-text-secondary">
                                                {formMode === 'focus'
                                                    ? '結算時間'
                                                    : '紀錄時間'}
                                            </span>

                                            <input
                                                type="time"
                                                value={manualTime}
                                                onChange={e => setManualTime(e.target.value)}
                                                className="w-full rounded-md border border-border bg-surface-secondary text-text-primary px-3 py-2 outline-none focus:border-accent"
                                            />
                                        </label>

                                        {formMode === 'focus' && (
                                            <label className="space-y-1 text-sm">
                                                <span className="text-text-secondary">
                                                    專注分鐘數
                                                </span>

                                                <input
                                                    type="number"
                                                    min={1}
                                                    step={1}
                                                    value={manualMinutes}
                                                    onChange={e => setManualMinutes(e.target.value)}
                                                    className="w-full rounded-md border border-border bg-surface-secondary text-text-primary px-3 py-2 outline-none focus:border-accent"
                                                />
                                            </label>
                                        )}
                                    </div>

                                    {formMode === 'focus' ? (
                                        <textarea
                                            value={manualNote}
                                            onChange={e => setManualNote(e.target.value)}
                                            placeholder="專注內容（選填）"
                                            aria-label="專注內容"
                                            rows={Math.min(3, manualNote.split('\n').length)}
                                            className="block w-full resize-none rounded-md border border-border bg-surface-secondary text-text-primary px-3 py-2 text-sm outline-none focus:border-accent"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={manualNote}
                                            onChange={e => setManualNote(e.target.value)}
                                            placeholder="發生了什麼事？"
                                            aria-label="生活紀錄內容"
                                            className="w-full rounded-md border border-border bg-surface-secondary text-text-primary px-3 py-2 text-sm outline-none focus:border-accent"
                                        />
                                    )}

                                    <div className="flex items-center gap-3">
                                        {formMode === 'focus' && (
                                            <span className="text-sm">
                                                🍅 {calculateTomatoes(
                                                    (Number(manualMinutes) || 0) * 60
                                                )}
                                            </span>
                                        )}

                                        <button
                                            type="button"
                                            onClick={closeForm}
                                            className="ml-auto cursor-pointer px-3 py-2 text-sm text-text-secondary hover:text-text-primary"
                                        >
                                            取消
                                        </button>

                                        <button
                                            type="submit"
                                            disabled={
                                                !manualTime ||
                                                (formMode === 'focus'
                                                    ? !Number.isInteger(Number(manualMinutes)) ||
                                                    Number(manualMinutes) <= 0
                                                    : !manualNote.trim())
                                            }
                                            className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm text-background hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            新增紀錄
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* 空白狀態 */}
                        {historyItems.length === 0 && (
                            <div className="px-4 py-6 text-center text-sm text-text-secondary">
                                尚無活動紀錄
                            </div>
                        )}

                        {/* 每日活動時間軸 */}
                        {historyItems.map((item, index) => (
                            <div
                                key={`${item.type}-${item.record.id}`}
                                className="flex gap-3"
                            >
                                {/* 紀錄時間 */}
                                <div className="w-24 shrink-0 pt-1 text-sm text-text-secondary tabular-nums">
                                    {item.type === 'focus' ? (
                                        formatTime(item.timestamp, dateTimeSettings)
                                    ) : (
                                        <div className="group relative">
                                            <span className="group-focus-within:invisible">
                                                {formatTime(item.timestamp, dateTimeSettings)}
                                            </span>

                                            <input
                                                type="time"
                                                value={new Date(item.timestamp).toTimeString().slice(0, 5)}
                                                onChange={e =>
                                                    updateHistoryTime(item, e.target.value)
                                                }
                                                aria-label="修改紀錄時間"
                                                className="absolute inset-0 w-full cursor-pointer bg-transparent opacity-0 outline-none focus:opacity-100"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* 時間軸 */}
                                <div className="relative flex w-3 shrink-0 justify-center">
                                    <div
                                        className={`absolute z-10 rounded-full ${item.type === 'focus'
                                            ? 'top-2.5 h-2.5 w-2.5 bg-accent'
                                            : 'top-3 h-1.5 w-1.5 bg-text-secondary'
                                            }`}
                                    />

                                    {index < historyItems.length - 1 && (
                                        <div className="absolute top-2.5 -bottom-2.5 w-0.5 bg-border" />
                                    )}
                                </div>

                                {item.type === 'focus' ? (
                                    /* 專注紀錄內容 */
                                    <div className="min-w-0 flex-1 space-y-2 pb-4">
                                        <div className="flex items-center gap-3 pt-1 text-sm">
                                            <span>
                                                {Math.floor(item.record.elapsedSeconds / 60)} 分鐘
                                            </span>

                                            <span className="ml-auto">
                                                🍅 {item.record.tomatoes}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => onDelete(item.record.id)}
                                                aria-label="刪除專注紀錄"
                                                title="刪除專注紀錄"
                                                className="cursor-pointer text-text-secondary transition-colors hover:text-danger"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>

                                        <textarea
                                            value={item.record.note ?? ''}
                                            onChange={e => onUpdateNote(item.record.id, e.target.value)}
                                            placeholder="專注內容（選填）"
                                            aria-label="專注內容"
                                            rows={Math.min(3, (item.record.note ?? '').split('\n').length)}
                                            className="block w-full resize-none overflow-y-auto rounded-md border border-transparent bg-surface text-text-primary px-2 py-1 text-sm leading-5 outline-none transition-colors placeholder:text-text-secondary hover:border-border focus:border-accent"
                                        />
                                    </div>
                                ) : (
                                    /* 完成待辦與生活紀錄 */
                                    <div className="flex min-w-0 flex-1 items-center gap-3 pb-3">
                                        <div className="min-w-0 flex-1 rounded-full bg-surface-secondary px-4 py-1.5 text-sm text-text-secondary">
                                            <input
                                                type="text"
                                                value={item.record.title}
                                                onChange={e =>
                                                    updateHistoryTitle(item, e.target.value)
                                                }
                                                aria-label="紀錄內容"
                                                className="w-full border-none bg-transparent outline-none"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => deleteHistoryItem(item)}
                                            aria-label="刪除紀錄"
                                            title="刪除紀錄"
                                            className="shrink-0 cursor-pointer text-text-secondary transition-colors hover:text-danger"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            }
        </div >
    )
}
