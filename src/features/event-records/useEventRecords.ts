
import { useEffect, useState } from 'react'
import type { EventRecord } from './EventRecord'

export function useEventRecords() {
    // 讀取已儲存的生活紀錄。
    const [eventRecords, setEventRecords] = useState<EventRecord[]>(() => {
        const saved = localStorage.getItem('eventRecords')

        return saved ? JSON.parse(saved) : []
    })

    // 自動儲存生活紀錄。
    useEffect(() => {
        localStorage.setItem(
            'eventRecords',
            JSON.stringify(eventRecords)
        )
    }, [eventRecords])

    // 新增生活紀錄。
    const addEventRecord = (
        occurredAt: number,
        title: string
    ) => {
        const record: EventRecord = {
            id: crypto.randomUUID(),
            occurredAt,
            title,
        }

        setEventRecords(prev => [...prev, record])
    }

    // 更新指定生活紀錄的時間與內容。
    const updateEventRecord = (
        id: string,
        occurredAt: number,
        title: string
    ) => {
        setEventRecords(prev =>
            prev.map(record =>
                record.id === id
                    ? { ...record, occurredAt, title }
                    : record
            )
        )
    }

    // 刪除指定生活紀錄。
    const deleteEventRecord = (id: string) => {
        setEventRecords(prev =>
            prev.filter(record => record.id !== id)
        )
    }

    return {
        eventRecords,
        addEventRecord,
        updateEventRecord,
        deleteEventRecord,
    }
}
