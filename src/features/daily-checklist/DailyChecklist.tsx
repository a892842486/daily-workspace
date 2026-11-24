
import { useEffect, useState } from 'react'
import AddButton from '../../components/AddButton'
import { getWorkspaceDate } from '../../utils/getWorkspaceDate'

type ChecklistItem = {
    id: string
    title: string
    checked: boolean
}

export default function DailyChecklist() {
    const [isChecklistOpen, setIsChecklistOpen] = useState(false)

    // 記錄目前正在拖曳的項目。
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null)

    // 記錄拖曳經過的目標項目，用於顯示藍色提示。
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null)

    const [checklistData, setChecklistData] = useState(() => {
        const savedItems = localStorage.getItem('dailyChecklistItems')
        const savedDate = localStorage.getItem('dailyChecklistDate')
        const today = getWorkspaceDate()

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
            const today = getWorkspaceDate()

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

    // 拖曳排序：將來源項目移動到目標項目的位置。
    const moveItem = (draggedId: string, targetId: string) => {
        if (draggedId === targetId) return

        setItems(prev => {
            const newItems = [...prev]

            const fromIndex = newItems.findIndex(item => item.id === draggedId)
            const targetIndex = newItems.findIndex(item => item.id === targetId)

            if (fromIndex === -1 || targetIndex === -1) return prev

            const [movedItem] = newItems.splice(fromIndex, 1)
            newItems.splice(targetIndex, 0, movedItem)

            return newItems
        })
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
                            <div
                                key={item.id}
                                draggable
                                onDragStart={e => {
                                    setDraggedItemId(item.id)
                                    e.dataTransfer.setData('text/plain', item.id)
                                    e.dataTransfer.effectAllowed = 'move'
                                }}
                                onDragEnd={() => {
                                    setDraggedItemId(null)
                                    setDragOverItemId(null)
                                }}
                                onDragOver={e => {
                                    e.preventDefault()

                                    if (draggedItemId && draggedItemId !== item.id) {
                                        setDragOverItemId(item.id)
                                    }
                                }}
                                onDragLeave={e => {
                                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                        setDragOverItemId(null)
                                    }
                                }}
                                onDrop={e => {
                                    e.preventDefault()

                                    const draggedId = e.dataTransfer.getData('text/plain')
                                    moveItem(draggedId, item.id)
                                    setDraggedItemId(null)
                                    setDragOverItemId(null)
                                }}
                                className={`flex items-center gap-3 rounded ${draggedItemId === item.id ? 'opacity-50' : ''
                                    }`}
                            >

                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    onChange={() => toggleItem(item.id)}
                                    className="h-4 w-4 cursor-pointer"
                                />

                                <div
                                    className={`flex min-w-0 flex-1 items-center gap-3 rounded border px-3 transition-colors ${dragOverItemId === item.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 bg-white focus-within:border-gray-400'
                                        }`}
                                >
                                    <input
                                        type="text"
                                        value={item.title}
                                        onChange={e => updateItem(item.id, e.target.value)}
                                        placeholder=""
                                        className={`min-w-0 flex-1 bg-transparent py-2 outline-none ${item.checked ? 'text-gray-400 line-through' : ''
                                            }`}
                                    />

                                    <span
                                        className="cursor-grab select-none text-gray-400 active:cursor-grabbing"
                                        title="拖曳排序"
                                    >
                                        ⠿
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => deleteItem(item.id)}
                                        className="cursor-pointer text-gray-400 hover:text-red-500"
                                        aria-label="刪除打卡項目"
                                    >
                                        ✕
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    )
}
