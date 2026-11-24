
import { useEffect, useState } from 'react'
import type { FocusRecord } from './FocusRecord'
import { calculateTomatoes } from './calculateTomatoes'

export function useFocusRecords() {
    // 讀取已儲存的專注紀錄。
    const [focusRecords, setFocusRecords] = useState<FocusRecord[]>(() => {
        const saved = localStorage.getItem('pomodoroFocusRecords')

        return saved ? JSON.parse(saved) : []
    })

    // 自動儲存專注紀錄。
    useEffect(() => {
        localStorage.setItem(
            'pomodoroFocusRecords',
            JSON.stringify(focusRecords)
        )
    }, [focusRecords])

    // 新增專注紀錄。
    const addFocusRecord = (
        completedAt: number,
        elapsedSeconds: number,
        note: string = ''
    ) => {
        const record: FocusRecord = {
            id: crypto.randomUUID(),
            completedAt,
            elapsedSeconds,
            tomatoes: calculateTomatoes(elapsedSeconds),
            note,
        }

        setFocusRecords(prev => [...prev, record])
    }

    // 更新指定紀錄的專注內容。
    const updateFocusNote = (id: string, note: string) => {
        setFocusRecords(prev =>
            prev.map(record =>
                record.id === id ? { ...record, note } : record
            )
        )
    }

    // 刪除指定的專注紀錄。
    const deleteFocusRecord = (id: string) => {
        if (!window.confirm('確定刪除此筆專注紀錄？')) return

        setFocusRecords(prev =>
            prev.filter(record => record.id !== id)
        )
    }

    return {
        focusRecords,
        addFocusRecord,
        updateFocusNote,
        deleteFocusRecord,
    }
}
