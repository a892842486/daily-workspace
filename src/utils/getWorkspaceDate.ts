
import { RESET_HOUR_KEY } from '../features/settings/Settings'

// 預設凌晨 04:00 為日期分界，可由設定頁面修改。
function getResetHour() {
    return Number(localStorage.getItem(RESET_HOUR_KEY) ?? 4)
}

// 根據指定時間取得所屬的工作區日期。
export function getWorkspaceDate(timestamp = Date.now()) {
    const date = new Date(timestamp)

    if (date.getHours() < getResetHour()) {
        date.setDate(date.getDate() - 1)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}
