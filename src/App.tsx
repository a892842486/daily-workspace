
import { useEffect, useState } from 'react'

import DailyChecklist from './features/daily-checklist/DailyChecklist'
import KanbanBoard from './features/kanban/KanbanBoard'
import FreeNotes from './features/free-notes/FreeNotes'
import PomodoroTimer from './features/pomodoro-timer/PomodoroTimer'
import Calendar from './features/calendar/Calendar'
import Settings from './features/settings/Settings'

import { useFocusRecords } from './features/pomodoro-timer/useFocusRecords'
import { useDailyTitles } from './features/calendar/useDailyTitles'

import {
  DATE_TIME_SETTINGS_KEY,
  getDateTimeSettings,
} from './features/settings/dateTimePreferences'
import { formatDateTime } from './utils/formatTime'

function App() {
  // useState：管理 React 狀態，狀態改變時會重新渲染畫面。
  // [狀態, 更新函式] = useState(初始值)

  // 讀取上次停留的頁面；若沒有紀錄，預設進入工作區。
  // 使用 () => ... 延遲初始化，避免每次渲染都重新讀取 localStorage。
  const [page, setPage] = useState(() => {
    return localStorage.getItem('page') || '工作區'
  })

  // localStorage 只儲存字串，因此要將 'false' 轉換成布林判斷。
  // 沒有紀錄時預設展開導覽列。
  const [isNavOpen, setIsNavOpen] = useState(() => {
    return localStorage.getItem('isNavOpen') !== 'false'
  })

  // 工作區內部頁籤：工作代辦／自由便籤。
  // 讀取上次選擇的工作區頁籤；沒有紀錄時預設工作代辦。
  const [workspaceTab, setWorkspaceTab] = useState(() => {
    return localStorage.getItem('workspaceTab') || '工作代辦'
  })

  // new Date()：取得目前日期時間。
  const [now, setNow] = useState(() => new Date())

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

  // useEffect：處理 React 渲染後需要執行的副作用。
  // [page]：當 page 改變時，將最新頁面儲存到 localStorage。
  useEffect(() => {
    localStorage.setItem('page', page)
  }, [page])

  // String()：將 Boolean 轉成字串，供 localStorage 儲存。
  useEffect(() => {
    localStorage.setItem('isNavOpen', String(isNavOpen))
  }, [isNavOpen])

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

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* 頂部導覽列 */}
      <nav className="flex items-center gap-4 border-b border-gray-200 p-4">
        {/* !isNavOpen：反轉 Boolean，控制導覽列展開／收合。 */}
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          aria-label={isNavOpen ? '收合導覽列' : '展開導覽列'}
          aria-expanded={isNavOpen}
          className="cursor-pointer text-gray-500 hover:text-gray-900"
        >
          {isNavOpen ? '←' : '→'}
        </button>

        {/* 條件渲染：isNavOpen 為 true 才顯示頁面按鈕。 */}
        {isNavOpen && (
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setPage('工作區')}>工作區</button>
            <button onClick={() => setPage('寬鬆番茄鐘')}>寬鬆番茄鐘</button>
            <button onClick={() => setPage('日曆')}>日曆</button>
            <button onClick={() => setPage('設定')}>設定</button>
          </div>
        )}

        {/* 根據全域設定顯示右上角日期時間。 */}
        {dateTimeSettings.visible && (
          <span className="ml-auto shrink-0 text-sm text-gray-500 tabular-nums">
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
            <div className="mb-6 flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setWorkspaceTab('工作代辦')}
                className={`cursor-pointer pb-2 ${
                  workspaceTab === '工作代辦'
                    ? 'border-b-2 border-gray-800 font-bold'
                    : 'text-gray-400'
                }`}
              >
                工作代辦
              </button>

              <button
                onClick={() => setWorkspaceTab('自由便籤')}
                className={`cursor-pointer pb-2 ${
                  workspaceTab === '自由便籤'
                    ? 'border-b-2 border-gray-800 font-bold'
                    : 'text-gray-400'
                }`}
              >
                自由便籤
              </button>
            </div>

            {/* 根據 workspaceTab 切換工作代辦／自由便籤。 */}
            {workspaceTab === '自由便籤' ? (
              <FreeNotes />
            ) : (
              <KanbanBoard />
            )}
          </div>
        ) : page === '日曆' ? (
          <Calendar
            focusRecords={focusRecords}
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
          />
        ) : page === '寬鬆番茄鐘' ? (
          null
        ) : (
          <h1 className="text-2xl font-bold">{page}</h1>
        )}

        {/* 番茄鐘持續掛載，切換頁面時僅隱藏畫面。 */}
        <div className={page === '寬鬆番茄鐘' ? '' : 'hidden'}>
          <PomodoroTimer
            focusRecords={focusRecords}
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
