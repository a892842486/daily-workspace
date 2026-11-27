
import { useState } from 'react'
import DateTimeSettings from './DateTimeSettings'
import type { DateTimePreferences } from './dateTimePreferences'

export const RESET_HOUR_KEY = 'dailyChecklistResetHour'
export const HIDE_STOPWATCH_KEY = 'hideStopwatch'
export const HIDE_COUNTDOWN_KEY = 'hideCountdown'

type Theme =
  | 'classic-night'
  | 'classic-day'
  | 'midnight-blue'
  | 'forest'
  | 'warm-sand'
  | 'plum-night'
  | 'ocean-teal'
  | 'slate'
  | 'lavender-mist'
  | 'sage-light'

type Font =
  | 'system'
  | 'noto-sans'
  | 'noto-serif'
  | 'open-huninn'
  | 'iansui'
  | 'gensen-rounded'
  | 'jason-handwriting-1'
  | 'jason-handwriting-6'
  | 'jason-handwriting-7'
  | 'chenyu-luoyan'

type Props = {
  dateTimeSettings: DateTimePreferences
  onDateTimeSettingsChange: (settings: DateTimePreferences) => void
  hideStopwatch: boolean
  hideCountdown: boolean
  onHideStopwatchChange: (hidden: boolean) => void
  onHideCountdownChange: (hidden: boolean) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
  font: Font
  onFontChange: (font: Font) => void
}

const themes: { id: Theme; color: string; name: string }[] = [
  { id: 'classic-night', color: '#22252a', name: 'Classic Night' },
  { id: 'midnight-blue', color: '#243447', name: 'Midnight Blue' },
  { id: 'forest', color: '#293a30', name: 'Forest' },
  { id: 'plum-night', color: '#302a3b', name: 'Plum Night' },
  { id: 'ocean-teal', color: '#283a3a', name: 'Ocean Teal' },
  { id: 'slate', color: '#353b44', name: 'Slate' },
  { id: 'warm-sand', color: '#e8ddd2', name: 'Warm Sand' },
  { id: 'sage-light', color: '#dfe9df', name: 'Sage Light' },
  { id: 'lavender-mist', color: '#e5dfef', name: 'Lavender Mist' },
  { id: 'classic-day', color: '#e6e8ec', name: 'Classic Day' },
]

const fonts: { id: Font; name: string; family: string }[] = [
  {
    id: 'system',
    name: '系統預設（預設）',
    family: 'inherit',
  },
  {
    id: 'noto-sans',
    name: '思源黑體',
    family: '"Noto Sans TC", sans-serif',
  },
  {
    id: 'noto-serif',
    name: '思源宋體',
    family: '"Noto Serif TC", serif',
  },
  {
    id: 'open-huninn',
    name: 'jf open 粉圓',
    family: '"Open Huninn", sans-serif',
  },
  {
    id: 'gensen-rounded',
    name: '源泉圓體',
    family: '"GenSenRounded", sans-serif',
  },
  {
    id: 'iansui',
    name: '芫荽',
    family: '"Iansui", sans-serif',
  },
  {
    id: 'jason-handwriting-1',
    name: '清松手寫體 1',
    family: '"JasonHandwriting1", sans-serif',
  },
  {
    id: 'jason-handwriting-6',
    name: '清松手寫體 6',
    family: '"JasonHandwriting6", sans-serif',
  },
  {
    id: 'jason-handwriting-7',
    name: '清松手寫體 7',
    family: '"JasonHandwriting7", sans-serif',
  },
  {
    id: 'chenyu-luoyan',
    name: '辰宇落雁體',
    family: '"ChenYuLuoyan", sans-serif',
  },
]

export default function Settings({
  dateTimeSettings,
  onDateTimeSettingsChange,
  hideStopwatch,
  hideCountdown,
  onHideStopwatchChange,
  onHideCountdownChange,
  theme,
  onThemeChange,
  font,
  onFontChange,
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
      <div className="mx-auto flex max-w-2xl flex-col gap-2">

        {/* 計時器顯示設定 */}
        <div className="rounded-lg border border-border bg-surface p-4">
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

          <p className="mt-3 text-sm text-text-secondary">
            隱藏時會移除導航列按鈕並重置計時器。
          </p>
        </div>

        {/* 外觀設定 */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">外觀</h2>

          <div className="grid grid-cols-5 gap-3">
            {themes.map(({ id, color, name }) => (
              <button
                key={id}
                type="button"
                title={name}
                aria-label={name}
                aria-pressed={theme === id}
                onClick={() => onThemeChange(id)}
                className={`aspect-square rounded-lg border-2 transition-all ${theme === id
                  ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-background'
                  : 'border-border hover:border-accent'
                  }`}
                style={{ backgroundColor: color }}
              >
                {theme === id && (
                  <span className="flex h-full items-center justify-center text-lg font-bold text-white drop-shadow">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 字體設定 */}
          <div className="mt-5 border-t border-border pt-4">
            <h3 className="mb-3 font-medium">字體</h3>

            <div className="grid grid-cols-2 gap-2">
              {fonts.map(({ id, name, family }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={font === id}
                  onClick={() => onFontChange(id)}
                  className={`rounded-lg border p-3 text-left transition-all ${font === id
                    ? 'border-accent ring-2 ring-accent'
                    : 'border-border hover:border-accent'
                    }`}
                >
                  <span
                    className="block text-lg"
                    style={{ fontFamily: family }}
                  >
                    今日，慢慢完成。
                  </span>

                  <span className="mt-1 block text-sm text-text-secondary">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 每日打卡重置時間 */}
        <div className="rounded-lg border border-border bg-surface p-4">
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
            className="rounded border border-border bg-surface-secondary px-3 py-2 text-text-primary"
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <option key={hour} value={hour}>
                {String(hour).padStart(2, '0')}:00
              </option>
            ))}
          </select>

          <p className="mt-3 text-sm text-text-secondary">
            每天 {String(resetHour).padStart(2, '0')}:00
            自動清空勾選狀態，保留打卡項目。
          </p>
        </div>

        {/* 日期與時間設定 */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <DateTimeSettings
            settings={dateTimeSettings}
            onChange={onDateTimeSettingsChange}
          />
        </div>
      </div>
    </section>
  )
}
