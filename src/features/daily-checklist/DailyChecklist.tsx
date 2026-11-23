
import { useState } from 'react'

export default function DailyChecklist() {
  // Boolean：true 為展開，false 為收合。
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)

  return (
    <section className="mb-6 rounded-lg border border-gray-200">
      <button
        onClick={() => setIsChecklistOpen(!isChecklistOpen)}
        aria-expanded={isChecklistOpen}
        className="flex w-full cursor-pointer items-center justify-between p-4 text-left"
      >
        <span className="font-medium">每日打卡　0 / 0</span>
        <span>{isChecklistOpen ? '⌃' : '⌄'}</span>
      </button>

      {/* && 條件渲染：只有展開時才顯示打卡內容。 */}
      {isChecklistOpen && (
        <div className="border-t border-gray-200 p-4 text-sm text-gray-500">
          每日打卡內容（待開發）
        </div>
      )}
    </section>
  )
}
