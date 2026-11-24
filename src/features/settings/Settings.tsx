
import { useState } from 'react'
import DateTimeSettings from './DateTimeSettings'
import type { DateTimePreferences } from './dateTimePreferences'

export const RESET_HOUR_KEY = 'dailyChecklistResetHour'

type Props = {
  dateTimeSettings: DateTimePreferences
  onDateTimeSettingsChange: (settings: DateTimePreferences) => void
}

export default function Settings({
  dateTimeSettings,
  onDateTimeSettingsChange,
}: Props) {
  const [resetHour, setResetHour] = useState(() => {
    return Number(localStorage.getItem(RESET_HOUR_KEY) ?? 4)
  })

  const updateResetHour = (hour: number) => {
    localStorage.setItem(RESET_HOUR_KEY, String(hour))
    setResetHour(hour)
  }

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">設定</h1>

      <div className="flex max-w-2xl flex-col gap-6">
        {/* 每日打卡重置時間 */}
        <div className="rounded-lg border border-gray-200 p-4">
          <label
            htmlFor="reset-hour"
            className="mb-2 block font-medium"
          >
            每日打卡重置時間
          </label>

          <select
            id="reset-hour"
            value={resetHour}
            onChange={e => updateResetHour(Number(e.target.value))}
            className="rounded border border-gray-300 bg-white px-3 py-2"
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, '0')}:00
              </option>
            ))}
          </select>

          <p className="mt-3 text-sm text-gray-500">
            每天 {String(resetHour).padStart(2, '0')}:00
            自動清空勾選狀態，保留打卡項目。
          </p>
        </div>

        {/* 日期與時間設定 */}
        <div className="rounded-lg border border-gray-200 p-4">
          <DateTimeSettings
            settings={dateTimeSettings}
            onChange={onDateTimeSettingsChange}
          />
        </div>
      </div>
    </section>
  )
}
