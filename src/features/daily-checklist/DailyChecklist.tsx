
import { useEffect, useState } from 'react'
import AddButton from '../../components/AddButton'
import { RESET_HOUR_KEY } from '../settings/Settings'

type ChecklistItem = {
    id: string
    title: string
    checked: boolean
}

// 預設凌晨 04:00 重置，可由設定頁面修改。
function getResetHour() {
    return Number(localStorage.getItem(RESET_HOUR_KEY) ?? 4)
}

// 取得目前所屬的「打卡日」。
function getChecklistDate() {
    const date = new Date()

    if (date.getHours() < getResetHour()) {
        date.setDate(date.getDate() - 1)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

export default function DailyChecklist() {
    const [isChecklistOpen, setIsChecklistOpen] = useState(false)

    const [checklistData, setChecklistData] = useState(() => {
        const savedItems = localStorage.getItem('dailyChecklistItems')
        const savedDate = localStorage.getItem('dailyChecklistDate')
        const today = getChecklistDate()

        const items = savedItems
            ? JSON.parse(savedItems) as ChecklistItem[]
            : []

        return {
            items: savedDate === today
                ? items
                : items.map(item => ({ ...item, checked: false })),
            date: today,
        }
    })

    const { items, date: checklistDate } = checklistData

    const setItems = (
        update: (prev: ChecklistItem[]) => ChecklistItem[]
    ) => {
        setChecklistData(prev => ({
            ...prev,
            items: update(prev.items),
        }))
    }

    // 每次進入新的打卡日，清空勾選狀態。
    useEffect(() => {
        const checkReset = () => {
            const today = getChecklistDate()

            setChecklistData(prev => {
                if (prev.date === today) return prev

                return {
                    date: today,
                    items: prev.items.map(item => ({
                        ...item,
                        checked: false,
                    })),
                }
            })
        }

        const timer = window.setInterval(checkReset, 1000)

        return () => window.clearInterval(timer)
    }, [])

    // 儲存打卡項目與日期。
    useEffect(() => {
        localStorage.setItem('dailyChecklistItems', JSON.stringify(items))
        localStorage.setItem('dailyChecklistDate', checklistDate)
    }, [checklistData])

    const addItem = () => {
        const newItem: ChecklistItem = {
            id: crypto.randomUUID(),
            title: '',
            checked: false,
        }

        setItems(prev => [...prev, newItem])
    }

    const updateItem = (id: string, title: string) => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, title } : item
            )
        )
    }

    const toggleItem = (id: string) => {
        setItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, checked: !item.checked } : item
            )
        )
    }

    const deleteItem = (id: string) => {
        if (!window.confirm('確定要刪除這項打卡嗎？')) return

        setItems(prev => prev.filter(item => item.id !== id))
    }

    const completedCount = items.filter(item => item.checked).length

    return (
        <section className="mb-6 rounded-lg border border-gray-200">
            <button
                onClick={() => setIsChecklistOpen(!isChecklistOpen)}
                aria-expanded={isChecklistOpen}
                className="flex w-full cursor-pointer items-center justify-between p-4 text-left"
            >
                <span className="font-medium">
                    每日打卡　{completedCount} / {items.length}
                </span>
                <span>{isChecklistOpen ? '⌃' : '⌄'}</span>
            </button>

            {isChecklistOpen && (
                <div className="border-t border-gray-200 p-4">
                    <AddButton onClick={addItem}>+ 新增打卡</AddButton>

                    <div className="space-y-3">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => toggleItem(item.id)}
                                    className="h-4 w-4 cursor-pointer"
                                />

                                <input
                                    type="text"
                                    value={item.title}
                                    onChange={e => updateItem(item.id, e.target.value)}
                                    placeholder="輸入打卡項目"
                                    className={`min-w-0 flex-1 rounded border border-gray-200 px-3 py-2 outline-none focus:border-gray-400 ${item.checked ? 'text-gray-400 line-through' : ''
                                        }`}
                                />

                                <button
                                    onClick={() => deleteItem(item.id)}
                                    className="cursor-pointer text-gray-400 hover:text-red-500"
                                    aria-label="刪除打卡項目"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}
