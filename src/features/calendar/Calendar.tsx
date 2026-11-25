
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import WorkHistory from '../work-history/WorkHistory'
import { getWorkspaceDate } from '../../utils/getWorkspaceDate'

import type { FocusRecord } from '../pomodoro-timer/FocusRecord'
import type { DateTimePreferences } from '../settings/dateTimePreferences'
import type { Task } from '../kanban/TaskCard'
import type { EventRecord } from '../event-records/EventRecord'

const weekdays = ['一', '二', '三', '四', '五', '六', '日']

type Props = {
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

// 將日期轉換成 YYYY-MM-DD。
function getDateKey(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

export default function Calendar({
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
    // 使用工作區日期作為今天。
    const today = getWorkspaceDate()

    // 記錄目前顯示的月份。
    const [currentMonth, setCurrentMonth] = useState(
        () => new Date(`${today}T00:00:00`)
    )

    // 記錄目前選取的日期。
    const [selectedDate, setSelectedDate] = useState(today)

    // 月曆日期計算。
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // 以星期一為每週起點，計算當月第一天的偏移量。
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7

    // 取得當月總天數。
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    // 計算月曆需要顯示的格數。
    const totalCells = Math.ceil(
        (firstWeekday + daysInMonth) / 7
    ) * 7

    // 建立月曆日期，包含前後月份的補齊日期。
    const calendarDays = Array.from(
        { length: totalCells },
        (_, index) => new Date(
            year,
            month,
            index - firstWeekday + 1
        )
    )

    // 取得選取日期的專注紀錄。
    const selectedRecords = focusRecords.filter(record =>
        getWorkspaceDate(record.completedAt) === selectedDate
    )

    // 切換月份。
    const changeMonth = (offset: number) => {
        setCurrentMonth(new Date(year, month + offset, 1))
    }

    // 回到今天。
    const goToToday = () => {
        const date = getWorkspaceDate()

        setCurrentMonth(new Date(`${date}T00:00:00`))
        setSelectedDate(date)
    }

    // 選取指定日期。
    const selectDate = (date: Date) => {
        setSelectedDate(getDateKey(date))

        if (
            date.getMonth() !== month ||
            date.getFullYear() !== year
        ) {
            setCurrentMonth(
                new Date(date.getFullYear(), date.getMonth(), 1)
            )
        }
    }

    return (
        <section className="mx-auto w-full max-w-5xl space-y-6">
            <h1 className="text-2xl font-bold">日曆</h1>

            {/* 月份切換 */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => changeMonth(-1)}
                    aria-label="上個月"
                    title="上個月"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <ChevronLeft size={20} />
                </button>

                <h2 className="text-lg font-semibold tabular-nums">
                    {year} 年 {month + 1} 月
                </h2>

                <button
                    type="button"
                    onClick={() => changeMonth(1)}
                    aria-label="下個月"
                    title="下個月"
                    className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                    <ChevronRight size={20} />
                </button>

                <button
                    type="button"
                    onClick={goToToday}
                    className="ml-auto cursor-pointer rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100"
                >
                    今天
                </button>
            </div>

            {/* 月曆 */}
            <div>
                {/* 星期標題 */}
                <div className="grid grid-cols-7">
                    {weekdays.map((day, index) => (
                        <div
                            key={day}
                            className={`py-3 text-center text-sm text-gray-400 ${index >= 5 ? 'bg-gray-50' : ''
                                }`}
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* 日期格子 */}
                <div className="grid grid-cols-7 overflow-hidden rounded-lg border-t border-l border-gray-200">
                    {calendarDays.map(date => {
                        const dateKey = getDateKey(date)
                        const isToday = dateKey === today
                        const isSelected = dateKey === selectedDate
                        const isCurrentMonth = date.getMonth() === month
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6

                        // 取得該日期的專注紀錄。
                        const dayRecords = focusRecords.filter(record =>
                            getWorkspaceDate(record.completedAt) === dateKey
                        )

                        // 計算每日番茄數量。
                        const dayTomatoes = dayRecords.reduce(
                            (total, record) => total + record.tomatoes,
                            0
                        )

                        // 計算每日專注總時間。
                        const dayFocusSeconds = dayRecords.reduce(
                            (total, record) => total + record.elapsedSeconds,
                            0
                        )

                        const dayFocusHours = Math.floor(dayFocusSeconds / 3600)
                        const dayFocusMinutes = Math.floor((dayFocusSeconds % 3600) / 60)

                        return (
                            <button
                                key={dateKey}
                                type="button"
                                onClick={() => selectDate(date)}
                                aria-pressed={isSelected}
                                aria-label={dateKey}
                                className={`flex min-h-20 min-w-0 cursor-pointer flex-col items-start border-r border-b border-gray-200 p-2 text-left transition-colors sm:min-h-28 ${isSelected
                                    ? 'bg-blue-50 ring-1 ring-inset ring-blue-500'
                                    : isWeekend
                                        ? 'bg-gray-50 hover:bg-gray-100'
                                        : 'hover:bg-gray-50'
                                    }`}
                            >
                                {/* 日期 */}
                                <span
                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm tabular-nums ${isToday
                                        ? 'bg-gray-800 text-white'
                                        : isCurrentMonth
                                            ? 'text-gray-800'
                                            : 'text-gray-300'
                                        }`}
                                >
                                    {date.getDate()}
                                </span>

                                {/* 每日專注成果 */}
                                {dayRecords.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="text-sm font-medium tabular-nums">
                                            🍅 {dayTomatoes}
                                        </div>

                                        <div className="text-xs text-gray-500 tabular-nums">
                                            {dayFocusHours}h {dayFocusMinutes}m
                                        </div>
                                    </div>
                                )}

                                {/* 每日標題 */}
                                {dailyTitles[dateKey] && (
                                    <div className="mt-1 w-full line-clamp-2 break-words text-xs font-medium text-gray-700">
                                        {dailyTitles[dateKey]}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* 選取日期的專注紀錄 */}
            <WorkHistory
                key={selectedDate}
                records={selectedRecords}
                tasks={tasks}
                eventRecords={eventRecords}
                onAddEvent={addEventRecord}
                onUpdateEvent={updateEventRecord}
                onDeleteEvent={deleteEventRecord}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                dateTimeSettings={dateTimeSettings}
                workspaceDate={selectedDate}
                defaultOpen={true}
                dailyTitle={dailyTitles[selectedDate] ?? ''}
                showDate={true}
                onUpdateDailyTitle={title =>
                    updateDailyTitle(selectedDate, title)
                }
                onAdd={addFocusRecord}
                onUpdateNote={updateFocusNote}
                onDelete={deleteFocusRecord}
            />
        </section>
    )
}
