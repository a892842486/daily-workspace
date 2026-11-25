
import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

import { calculateTomatoes } from './calculateTomatoes'
import { getWorkspaceDate } from '../../utils/getWorkspaceDate'
import { formatTime } from '../../utils/formatTime'

import type { FocusRecord } from './FocusRecord'
import type { DateTimePreferences } from '../settings/dateTimePreferences'

type Props = {
    records: FocusRecord[]
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
}

export default function FocusHistory({
    records,
    dateTimeSettings,
    workspaceDate = getWorkspaceDate(),
    defaultOpen = false,
    dailyTitle,
    showDate = false,
    onUpdateDailyTitle,
    onAdd,
    onUpdateNote,
    onDelete,
}: Props) {
    // 控制專注紀錄是否展開。
    const [isOpen, setIsOpen] = useState(defaultOpen)

    // 補登專注紀錄的表單狀態。
    const [isAdding, setIsAdding] = useState(false)
    const [manualTime, setManualTime] = useState('')
    const [manualMinutes, setManualMinutes] = useState('25')
    const [manualNote, setManualNote] = useState('')

    // 依照結算時間由早到晚排列。
    const sortedRecords = [...records].sort(
        (a, b) => a.completedAt - b.completedAt
    )

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

    // 展開補登表單並填入預設值。
    const openAddForm = () => {
        setManualTime(
            new Date().toTimeString().slice(0, 5)
        )
        setManualMinutes('25')
        setManualNote('')
        setIsAdding(true)
    }

    // 儲存補登的專注紀錄。
    const submitRecord = () => {
        const minutes = Number(manualMinutes)

        if (!manualTime || !Number.isInteger(minutes) || minutes <= 0) return

        const [hours, mins] = manualTime.split(':').map(Number)

        const date = new Date(`${workspaceDate}T00:00:00`)
        date.setHours(hours, mins, 0, 0)

        if (getWorkspaceDate(date.getTime()) < workspaceDate) {
            date.setDate(date.getDate() + 1)
        }

        if (date.getTime() > Date.now()) {
            window.alert('結算時間不可晚於目前時間。')
            return
        }

        onAdd(
            date.getTime(),
            minutes * 60,
            manualNote
        )

        setIsAdding(false)
    }

    return (
        <div className="w-full rounded-lg border border-gray-200">
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

                            <span className="text-sm text-gray-500">
                                {totalFocusHours}h {totalFocusMinutes}m
                            </span>
                        </div>
                    </>
                ) : (
                    <span className="font-medium">
                        {workspaceDate === getWorkspaceDate()
                            ? '今日專注紀錄'
                            : '專注紀錄'}

                        <span className="ml-2 text-sm font-normal text-gray-400">
                            {records.length} 筆
                        </span>
                    </span>
                )}

                {isOpen
                    ? <ChevronUp size={18} />
                    : <ChevronDown size={18} />}
            </button>

            {/* 專注紀錄列表 */}
            {isOpen && (
                <div className="border-t border-gray-200 px-4 py-4">
                    {/* 每日標題 */}
                    <input
                        type="text"
                        value={dailyTitle}
                        onChange={e => onUpdateDailyTitle(e.target.value)}
                        placeholder="一句話說這天做了什麼吧"
                        aria-label="每日標題"
                        className="mb-4 w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500"
                    />

                    {/* 補登專注紀錄 */}
                    <div className="mb-5">
                        {!isAdding ? (
                            <button
                                type="button"
                                onClick={openAddForm}
                                className="w-full cursor-pointer rounded-md border border-dashed border-gray-300 py-2 text-sm text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-800"
                            >
                                ＋ 補登專注紀錄
                            </button>
                        ) : (
                            <div className="space-y-3 rounded-lg border border-gray-200 p-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="space-y-1 text-sm">
                                        <span className="text-gray-500">
                                            結算時間
                                        </span>

                                        <input
                                            type="time"
                                            value={manualTime}
                                            onChange={e => setManualTime(e.target.value)}
                                            className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-blue-500"
                                        />
                                    </label>

                                    <label className="space-y-1 text-sm">
                                        <span className="text-gray-500">
                                            專注分鐘數
                                        </span>

                                        <input
                                            type="number"
                                            min={1}
                                            step={1}
                                            value={manualMinutes}
                                            onChange={e => setManualMinutes(e.target.value)}
                                            className="w-full rounded-md border border-gray-200 px-3 py-2 outline-none focus:border-blue-500"
                                        />
                                    </label>
                                </div>

                                <textarea
                                    value={manualNote}
                                    onChange={e => setManualNote(e.target.value)}
                                    placeholder="專注內容（選填）"
                                    aria-label="專注內容"
                                    rows={Math.min(3, manualNote.split('\n').length)}
                                    className="block w-full resize-none rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                />

                                <div className="flex items-center gap-3">
                                    <span className="text-sm">
                                        🍅 {calculateTomatoes(
                                            (Number(manualMinutes) || 0) * 60
                                        )}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="ml-auto cursor-pointer px-3 py-2 text-sm text-gray-500"
                                    >
                                        取消
                                    </button>

                                    <button
                                        type="button"
                                        onClick={submitRecord}
                                        disabled={
                                            !manualTime ||
                                            !Number.isInteger(Number(manualMinutes)) ||
                                            Number(manualMinutes) <= 0
                                        }
                                        className="cursor-pointer rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        新增紀錄
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 空白狀態 */}
                    {sortedRecords.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                            尚無專注紀錄
                        </div>
                    )}

                    {/* 專注紀錄時間軸 */}
                    {sortedRecords.map((record, index) => (
                        <div
                            key={record.id}
                            className="flex gap-3"
                        >
                            {/* 結算時間 */}
                            <div className="w-24 shrink-0 pt-1 text-sm text-gray-400 tabular-nums">
                                {formatTime(record.completedAt, dateTimeSettings)}
                            </div>

                            {/* 時間軸 */}
                            <div className="relative flex w-3 shrink-0 justify-center">
                                <div className="absolute top-2.5 z-10 h-2.5 w-2.5 rounded-full bg-gray-400" />

                                {index < sortedRecords.length - 1 && (
                                    <div className="absolute top-2.5 -bottom-2.5 w-0.5 bg-gray-200" />
                                )}
                            </div>

                            {/* 專注紀錄內容 */}
                            <div className="min-w-0 flex-1 space-y-2 pb-4">
                                <div className="flex items-center gap-3 pt-1 text-sm">
                                    <span>
                                        {Math.floor(record.elapsedSeconds / 60)} 分鐘
                                    </span>

                                    <span className="ml-auto">
                                        🍅 {record.tomatoes}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => onDelete(record.id)}
                                        aria-label="刪除專注紀錄"
                                        title="刪除專注紀錄"
                                        className="cursor-pointer text-gray-400 transition-colors hover:text-red-500"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <textarea
                                    value={record.note ?? ''}
                                    onChange={e => onUpdateNote(record.id, e.target.value)}
                                    placeholder="專注內容（選填）"
                                    aria-label="專注內容"
                                    rows={Math.min(3, (record.note ?? '').split('\n').length)}
                                    className="block w-full resize-none overflow-y-auto rounded-md border border-transparent px-2 py-1 text-sm leading-5 text-gray-600 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-200 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
