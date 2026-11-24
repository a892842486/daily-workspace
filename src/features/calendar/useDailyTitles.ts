
import { useEffect, useState } from 'react'

export function useDailyTitles() {
    // 讀取已儲存的每日標題。
    const [dailyTitles, setDailyTitles] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('dailyTitles')
        return saved ? JSON.parse(saved) : {}
    })

    // 自動儲存每日標題。
    useEffect(() => {
        localStorage.setItem('dailyTitles', JSON.stringify(dailyTitles))
    }, [dailyTitles])

    // 更新指定日期的標題。
    const updateDailyTitle = (date: string, title: string) => {
        setDailyTitles(prev => ({
            ...prev,
            [date]: title,
        }))
    }

    return {
        dailyTitles,
        updateDailyTitle,
    }
}
