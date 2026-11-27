
import { useEffect, useState } from 'react'

import DailyChecklist from './features/daily-checklist/DailyChecklist'
import KanbanBoard from './features/kanban/KanbanBoard'
import FreeNotes from './features/free-notes/FreeNotes'
import PomodoroTimer from './features/pomodoro-timer/PomodoroTimer'
import Stopwatch from './features/stopwatch/Stopwatch'
import Countdown from './features/countdown/Countdown'
import type { TimerDisplayInfo } from './features/pomodoro-timer/PomodoroTimer'
import Calendar from './features/calendar/Calendar'
import Settings, {
  HIDE_STOPWATCH_KEY,
  HIDE_COUNTDOWN_KEY,
} from './features/settings/Settings'
import GlobalTimer from './components/GlobalTimer'
import {
  LayoutDashboard,
  CalendarDays,
  Settings as SettingsIcon,
  Timer,
  Clock as StopwatchIcon,
} from 'lucide-react'

import { useFocusRecords } from './features/pomodoro-timer/useFocusRecords'
import { useDailyTitles } from './features/calendar/useDailyTitles'
import { useTasks } from './features/kanban/useTasks'
import { useEventRecords } from './features/event-records/useEventRecords'

import {
  DATE_TIME_SETTINGS_KEY,
  getDateTimeSettings,
} from './features/settings/dateTimePreferences'
import { formatDateTime } from './utils/formatTime'
import { getWorkspaceDate } from './utils/getWorkspaceDate'

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

const THEME_KEY = 'workspaceTheme'

// 字體
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

const FONT_KEY = 'workspaceFont'

const fontFamilies: Record<Font, string> = {
  system: 'inherit',
  'noto-sans': '"Noto Sans TC", sans-serif',
  'noto-serif': '"Noto Serif TC", serif',
  'open-huninn': '"Open Huninn", sans-serif',
  iansui: '"Iansui", sans-serif',
  'gensen-rounded': '"GenSenRounded", sans-serif',
  'jason-handwriting-1': '"JasonHandwriting1", sans-serif',
  'jason-handwriting-6': '"JasonHandwriting6", sans-serif',
  'jason-handwriting-7': '"JasonHandwriting7", sans-serif',
  'chenyu-luoyan': '"ChenYuLuoyan", sans-serif',
}

function App() {
  // useState：管理 React 狀態，狀態改變時會重新渲染畫面。
  // [狀態, 更新函式] = useState(初始值)

  // 讀取上次停留的頁面；若沒有紀錄，預設進入工作區。
  // 使用 () => ... 延遲初始化，避免每次渲染都重新讀取 localStorage。
  const [page, setPage] = useState(() => {
    return localStorage.getItem('page') || '工作區'
  })

  // 工作區內部頁籤：工作代辦／自由便籤。
  // 讀取上次選擇的工作區頁籤；沒有紀錄時預設工作代辦。
  const [workspaceTab, setWorkspaceTab] = useState(() => {
    return localStorage.getItem('workspaceTab') || '工作代辦'
  })

  // new Date()：取得目前日期時間。
  const [now, setNow] = useState(() => new Date())

  // 接收番茄鐘回報的全域計時顯示資訊。
  const [timerDisplayInfo, setTimerDisplayInfo] =
    useState<TimerDisplayInfo | null>(null)

  // 接收碼表回報的時間。
  const [stopwatchDisplayTime, setStopwatchDisplayTime] =
    useState<string | null>(null)

  // 接收倒數計時回報的時間。
  const [countdownDisplayTime, setCountdownDisplayTime] =
    useState<string | null>(null)

  // 計時器隱藏設定。
  const [hideStopwatch, setHideStopwatch] = useState(() => {
    return localStorage.getItem(HIDE_STOPWATCH_KEY) === 'true'
  })

  const [hideCountdown, setHideCountdown] = useState(() => {
    return localStorage.getItem(HIDE_COUNTDOWN_KEY) === 'true'
  })

  // 根據目前時間與換日設定，取得當前工作區日期。
  const workspaceDate = getWorkspaceDate(now.getTime())

  // 讀取已儲存的日期與時間設定。
  const [dateTimeSettings, setDateTimeSettings] = useState(
    getDateTimeSettings
  )

  // 共用專注紀錄。
  const {
    focusRecords,
    addFocusRecord,
    updateFocusNote,
    deleteFocusRecord,
  } = useFocusRecords()

  // 共用每日標題。
  const {
    dailyTitles,
    updateDailyTitle,
  } = useDailyTitles()

  // 共用工作任務。
  const {
    tasks,
    addTask,
    updateTask,
    updateTaskStatus,
    moveTask,
    deleteTask,
  } = useTasks()

  // 共用生活紀錄。
  const {
    eventRecords,
    addEventRecord,
    updateEventRecord,
    deleteEventRecord,
  } = useEventRecords()

  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(THEME_KEY)

    if (
      saved === 'classic-day' ||
      saved === 'midnight-blue' ||
      saved === 'forest' ||
      saved === 'warm-sand' ||
      saved === 'plum-night' ||
      saved === 'ocean-teal' ||
      saved === 'slate' ||
      saved === 'lavender-mist' ||
      saved === 'sage-light'
    ) {
      return saved
    }

    return 'classic-night'
  })

  // Font State
  const [font, setFont] = useState<Font>(() => {
    const saved = localStorage.getItem(FONT_KEY)

    if (
      saved === 'noto-sans' ||
      saved === 'noto-serif' ||
      saved === 'open-huninn' ||
      saved === 'iansui' ||
      saved === 'gensen-rounded' ||
      saved === 'jason-handwriting-1' ||
      saved === 'jason-handwriting-6' ||
      saved === 'jason-handwriting-7' ||
      saved === 'chenyu-luoyan'
    ) {
      return saved
    }

    return 'system'
  })

  // 自動儲存主題
  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  // 自動儲存字體
  useEffect(() => {
    localStorage.setItem(FONT_KEY, font)
  }, [font])

  // useEffect：處理 React 渲染後需要執行的副作用。
  // [page]：當 page 改變時，將最新頁面儲存到 localStorage。
  useEffect(() => {
    localStorage.setItem('page', page)
  }, [page])

  // 當工作區頁籤改變時，儲存到 localStorage。
  useEffect(() => {
    localStorage.setItem('workspaceTab', workspaceTab)
  }, [workspaceTab])

  // setInterval：每秒更新目前時間。
  // []：不依賴任何狀態，元件掛載後建立計時器。
  // return：清除計時器，避免元件卸載後仍持續執行。
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  // 自動儲存日期與時間設定。
  useEffect(() => {
    localStorage.setItem(
      DATE_TIME_SETTINGS_KEY,
      JSON.stringify(dateTimeSettings)
    )
  }, [dateTimeSettings])

  // 儲存計時器隱藏設定。
  useEffect(() => {
    localStorage.setItem(HIDE_STOPWATCH_KEY, String(hideStopwatch))
  }, [hideStopwatch])

  useEffect(() => {
    localStorage.setItem(HIDE_COUNTDOWN_KEY, String(hideCountdown))
  }, [hideCountdown])

  // 隱藏計時器時，清除導航列時間。
  useEffect(() => {
    if (hideStopwatch) {
      setStopwatchDisplayTime(null)
    }
  }, [hideStopwatch])

  useEffect(() => {
    if (hideCountdown) {
      setCountdownDisplayTime(null)
    }
  }, [hideCountdown])

  // 將三種計時器組合成瀏覽器分頁標題。
  useEffect(() => {
    const timerParts: string[] = []

    if (timerDisplayInfo) {
      timerParts.push(timerDisplayInfo.displayTime)
    }

    if (stopwatchDisplayTime) {
      timerParts.push(stopwatchDisplayTime)
    }

    if (countdownDisplayTime) {
      timerParts.push(countdownDisplayTime)
    }

    document.title = timerParts.length > 0
      ? timerParts.join(' | ')
      : '٩(^ᴗ^)۶'
  }, [timerDisplayInfo, stopwatchDisplayTime, countdownDisplayTime])

  return (
    <div
      data-theme={theme}
      style={{ fontFamily: fontFamilies[font] }}
      className="min-h-screen bg-background text-text-primary"
    >
      {/* 頂部導覽列 */}
      <nav className="flex items-center gap-4 border-b border-border p-4">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto whitespace-nowrap">
          {/* GlobalTimer */}
          <GlobalTimer
            label="🍅"
            displayTime={timerDisplayInfo?.displayTime ?? '--:--'}
            isRunning={timerDisplayInfo?.isRunning ?? false}
            onClick={() => setPage('寬鬆番茄鐘')}
          />

          {/* Stopwatch */}
          {!hideStopwatch && (
            <button
              onClick={() => setPage('碼表')}
              title="碼表"
              className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 transition-colors hover:bg-surface-secondary"
            >
              <StopwatchIcon size={18} />
              {stopwatchDisplayTime && (
                <span className="text-sm font-medium tabular-nums">
                  {stopwatchDisplayTime}
                </span>
              )}
            </button>
          )}

          {/* Countdown */}
          {!hideCountdown && (
            <button
              onClick={() => setPage('倒數計時')}
              title="倒數計時"
              className="flex items-center justify-center gap-1 rounded-lg px-2 py-2 transition-colors hover:bg-surface-secondary"
            >
              <Timer size={18} />
              {countdownDisplayTime && (
                <span className={`text-sm font-medium tabular-nums ${countdownDisplayTime.startsWith('+')
                  ? 'text-success'
                  : ''
                  }`}>
                  {countdownDisplayTime}
                </span>
              )}
            </button>
          )}

          {/* Workspace */}
          <button
            onClick={() => setPage('工作區')}
            title="工作區"
            className="flex items-center justify-center rounded-lg p-2 hover:bg-surface-secondary transition-colors"
          >
            <LayoutDashboard size={18} />
          </button>

          {/* Calendar */}
          <button
            onClick={() => setPage('日曆')}
            title="日歷"
            className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-surface-secondary"
          >
            <CalendarDays size={18} />
          </button>

          {/* Settings */}
          <button
            onClick={() => setPage('設定')}
            title="設定"
            className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-surface-secondary"

          >
            <SettingsIcon size={18} />
          </button>
        </div>

        {/* 根據全域設定顯示右上角日期時間。 */}
        {dateTimeSettings.visible && (
          <span className="ml-auto shrink-0 text-sm text-text-secondary tabular-nums">
            {formatDateTime(now.getTime(), dateTimeSettings)}
          </span>
        )}
      </nav>

      {/* 主要內容 */}
      <main className="p-6">
        {/* 三元運算子：條件 ? 成立時顯示 : 不成立時顯示 */}
        {page === '工作區' ? (
          <div>
            {/* 每日打卡 */}
            <DailyChecklist />

            {/* 工作區頁籤：依 workspaceTab 決定選取樣式。 */}
            <div className="mb-6 flex gap-4 border-b border-border">
              <button
                onClick={() => setWorkspaceTab('工作代辦')}
                className={`cursor-pointer pb-2 ${workspaceTab === '工作代辦'
                  ? 'border-b-2 border-accent font-bold text-text-primary'
                  : 'text-text-secondary'
                  }`}
              >
                工作代辦
              </button>

              <button
                onClick={() => setWorkspaceTab('自由便籤')}
                className={`cursor-pointer pb-2 ${workspaceTab === '自由便籤'
                  ? 'border-b-2 border-accent font-bold text-text-primary'
                  : 'text-text-secondary'
                  }`}
              >
                自由便籤
              </button>
            </div>
            {/* 根據 workspaceTab 切換工作代辦／自由便籤。 */}
            {workspaceTab === '自由便籤' ? (
              <FreeNotes />
            ) : (
              <KanbanBoard
                tasks={tasks}
                workspaceDate={workspaceDate}
                addTask={addTask}
                updateTask={updateTask}
                updateTaskStatus={updateTaskStatus}
                moveTask={moveTask}
                deleteTask={deleteTask}
              />
            )}
          </div>
        ) : page === '日曆' ? (
          <Calendar
            focusRecords={focusRecords}
            tasks={tasks}
            eventRecords={eventRecords}
            addEventRecord={addEventRecord}
            updateEventRecord={updateEventRecord}
            deleteEventRecord={deleteEventRecord}
            updateTask={updateTask}
            deleteTask={deleteTask}
            dailyTitles={dailyTitles}
            dateTimeSettings={dateTimeSettings}
            addFocusRecord={addFocusRecord}
            updateFocusNote={updateFocusNote}
            deleteFocusRecord={deleteFocusRecord}
            updateDailyTitle={updateDailyTitle}
          />
        ) : page === '設定' ? (
          <Settings
            dateTimeSettings={dateTimeSettings}
            onDateTimeSettingsChange={setDateTimeSettings}
            hideStopwatch={hideStopwatch}
            hideCountdown={hideCountdown}
            onHideStopwatchChange={setHideStopwatch}
            onHideCountdownChange={setHideCountdown}
            theme={theme}
            onThemeChange={setTheme}
            font={font}
            onFontChange={setFont}
          />
        ) : page === '碼表' ? (
          null
        ) : page === '倒數計時' ? (
          null
        ) : page === '寬鬆番茄鐘' ? (
          null
        ) : (
          <h1 className="text-2xl font-bold">{page}</h1>
        )}

        {/* 碼表持續掛載，切換頁面時僅隱藏畫面。 */}
        {!hideStopwatch && (
          <div className={page === '碼表' ? '' : 'hidden'}>
            <Stopwatch
              onDisplayTimeChange={setStopwatchDisplayTime}
            />
          </div>
        )}

        {/* 倒數計時持續掛載，切換頁面時僅隱藏畫面。 */}
        {!hideCountdown && (
          <div className={page === '倒數計時' ? '' : 'hidden'}>
            <Countdown
              onDisplayTimeChange={setCountdownDisplayTime}
            />
          </div>
        )}

        {/* 番茄鐘持續掛載，切換頁面時僅隱藏畫面。 */}
        <div className={page === '寬鬆番茄鐘' ? '' : 'hidden'}>
          <PomodoroTimer
            onTimerDisplayInfoChange={setTimerDisplayInfo}
            focusRecords={focusRecords}
            tasks={tasks}
            eventRecords={eventRecords}
            addEventRecord={addEventRecord}
            updateEventRecord={updateEventRecord}
            deleteEventRecord={deleteEventRecord}
            updateTask={updateTask}
            deleteTask={deleteTask}
            dailyTitles={dailyTitles}
            dateTimeSettings={dateTimeSettings}
            addFocusRecord={addFocusRecord}
            updateFocusNote={updateFocusNote}
            deleteFocusRecord={deleteFocusRecord}
            updateDailyTitle={updateDailyTitle}
          />
        </div>
      </main>
    </div>
  )
}

// export default：讓 main.tsx 可以匯入並使用 App 元件。
export default App
