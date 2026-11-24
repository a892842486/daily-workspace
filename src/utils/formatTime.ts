
import {
    getDateTimeSettings,
    type DateTimePreferences,
} from '../features/settings/dateTimePreferences'

// 取得生活口語的中文時段。
function getCasualPeriod(hour: number): string {
    if (hour < 3) return '半夜'
    if (hour < 6) return '凌晨'
    if (hour < 11) return '早上'
    if (hour < 13) return '中午'
    if (hour < 18) return '下午'
    return '晚上'
}

// 根據設定轉換時間顯示格式。
export function formatTime(
    timestamp = Date.now(),
    settings = getDateTimeSettings()
): string {
    const date = new Date(timestamp)
    const hour = date.getHours()
    const minute = String(date.getMinutes()).padStart(2, '0')

    // 24 小時制。
    if (settings.timeFormat === '24') {
        return `${String(hour).padStart(2, '0')}:${minute}`
    }

    // 12 小時制與小時補零。
    const hour12 = hour % 12 || 12
    const displayHour = settings.padHour
        ? String(hour12).padStart(2, '0')
        : String(hour12)

    const time = `${displayHour}:${minute}`

    // 上午／下午。
    if (settings.timeFormat === 'chinese') {
        return `${hour < 12 ? '上午' : '下午'} ${time}`
    }

    // AM / PM。
    if (settings.timeFormat === 'english') {
        return `${time} ${hour < 12 ? 'AM' : 'PM'}`
    }

    // 生活口語。
    return `${getCasualPeriod(hour)} ${time}`
}

// 根據設定轉換日期顯示格式。
function formatDate(
    date: Date,
    settings: DateTimePreferences
): string {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 中文日期格式。
    if (settings.dateFormat === 'chinese') {
        return [
            settings.showYear ? `${year}年` : '',
            settings.showDate ? `${month}月${day}日` : '',
        ].join('')
    }

    // 日／月／年。
    if (settings.dateFormat === 'reverse') {
        return [
            settings.showDate ? `${day}/${month}` : '',
            settings.showYear ? String(year) : '',
        ].filter(Boolean).join('/')
    }

    // 年／月／日。
    return [
        settings.showYear ? String(year) : '',
        settings.showDate ? `${month}/${day}` : '',
    ].filter(Boolean).join('/')
}

// 根據設定轉換星期顯示格式。
function formatWeek(
    date: Date,
    settings: DateTimePreferences
): string {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    const englishWeekdays = [
        'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
    ]

    const day = date.getDay()
    const weekday = weekdays[day]

    switch (settings.weekFormat) {
        case 'week':
            return `(週${weekday})`

        case 'full':
            return `星期${weekday}`

        case 'english':
            return `(${englishWeekdays[day]})`

        default:
            return `(${weekday})`
    }
}

// 組合完整的日期、星期與時間。
export function formatDateTime(
    timestamp = Date.now(),
    settings = getDateTimeSettings()
): string {
    const date = new Date(timestamp)

    return [
        formatDate(date, settings),
        settings.showWeek ? formatWeek(date, settings) : '',
        settings.showTime ? formatTime(timestamp, settings) : '',
    ].filter(Boolean).join(' ')
}
