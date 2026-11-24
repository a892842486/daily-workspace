
// 日期顯示格式。
export type DateFormat = 'slash' | 'chinese' | 'reverse'

// 星期顯示格式。
export type WeekFormat = 'short' | 'week' | 'full' | 'english'

// 時間顯示格式。
export type TimeFormat = 'casual' | 'chinese' | 'english' | '24'

// 日期與時間設定型別。
export type DateTimePreferences = {
    visible: boolean
    showYear: boolean
    showDate: boolean
    showWeek: boolean
    showTime: boolean
    dateFormat: DateFormat
    weekFormat: WeekFormat
    timeFormat: TimeFormat
    padHour: boolean
}

// localStorage 儲存鍵值。
export const DATE_TIME_SETTINGS_KEY = 'dateTimeSettings'

// 預設日期與時間設定。
export const defaultDateTimeSettings: DateTimePreferences = {
    visible: true,
    showYear: false,
    showDate: true,
    showWeek: true,
    showTime: true,
    dateFormat: 'slash',
    weekFormat: 'short',
    timeFormat: 'casual',
    padHour: false,
}

// 讀取已儲存的日期與時間設定。
export function getDateTimeSettings(): DateTimePreferences {
    const saved = localStorage.getItem(DATE_TIME_SETTINGS_KEY)

    return saved
        ? { ...defaultDateTimeSettings, ...JSON.parse(saved) }
        : { ...defaultDateTimeSettings }
}
