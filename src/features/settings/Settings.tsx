
import { useState } from 'react'
import DateTimeSettings from './DateTimeSettings'
import type { DateTimePreferences } from './dateTimePreferences'

export const RESET_HOUR_KEY = 'dailyChecklistResetHour'
export const HIDE_STOPWATCH_KEY = 'hideStopwatch'
export const HIDE_COUNTDOWN_KEY = 'hideCountdown'

type Props = {
  dateTimeSettings: DateTimePreferences
  onDateTimeSettingsChange: (settings: DateTimePreferences) => void
  hideStopwatch: boolean
  hideCountdown: boolean
  onHideStopwatchChange: (hidden: boolean) => void
  onHideCountdownChange: (hidden: boolean) => void
}
export default function Settings({
  dateTimeSettings,
  onDateTimeSettingsChange,
  hideStopwatch,
  hideCountdown,
  onHideStopwatchChange,
  onHideCountdownChange,
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
      {/* 計時器顯示設定 */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h2 className="mb-3 font-medium">計時器</h2>

        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={hideStopwatch}
              onChange={e => onHideStopwatchChange(e.target.checked)}
            />
            隱藏碼表
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={hideCountdown}
              onChange={e => onHideCountdownChange(e.target.checked)}
            />
            隱藏倒數計時
          </label>
        </div>

        <p className="mt-3 text-sm text-gray-500">
          隱藏時會移除導航列按鈕並重置計時器。
        </p>
      </div>

      {/* 每日打卡重置時間 */}

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
