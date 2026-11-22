
import { useEffect, useState } from 'react'

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

  // new Date()：取得目前日期時間。
  const [now, setNow] = useState(() => new Date())

  // 工作區內部頁籤：工作代辦／自由便籤。
  // 讀取上次選擇的工作區頁籤；沒有紀錄時預設工作代辦。
  const [workspaceTab, setWorkspaceTab] = useState(() => {
    return localStorage.getItem('workspaceTab') || '工作代辦'
  })

  // Boolean：true 為展開，false 為收合。
  const [isChecklistOpen, setIsChecklistOpen] = useState(false)

  // 初始化便籤：優先讀取 localStorage，沒有紀錄則使用空陣列。
  // JSON.parse()：將儲存的 JSON 字串轉回 JavaScript 陣列。
  // Note：定義每張便籤的資料結構。
  type Note = {
    id: string
    content: string
    size: 'small' | 'medium' | 'large'
  }

  // 工作任務的資料結構。
  type Task = {
    id: string
    title: string
    status: '待辦' | '進行中' | '完成'
  }

  // 讀取已儲存的便籤；舊資料沒有 size 時，預設使用 small。
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem('notes')
    const parsedNotes = savedNotes ? JSON.parse(savedNotes) as Note[] : []

    return parsedNotes.map(note => ({
      ...note,
      size: note.size || 'small',
    }))
  })

  // 記錄目前正在拖曳的便籤 ID。
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null)

  // 初始化工作任務：優先讀取 localStorage，沒有紀錄則使用空陣列。
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks')
    return savedTasks ? JSON.parse(savedTasks) as Task[] : []
  })

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

  // 當 notes 改變時，自動儲存所有便籤。
  // JSON.stringify()：將陣列轉換成 JSON 字串。
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  }, [notes])

  // 當 tasks 改變時，自動儲存所有工作任務。
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  // setInterval：每秒更新目前時間。
  // []：不依賴任何狀態，元件掛載後建立計時器。
  // return：清除計時器，避免元件卸載後仍持續執行。
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  // 新增便籤：建立新物件，再更新 notes 陣列。
  const addNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content: '',
      size: 'small',
    }

    // ...prev：保留原本的便籤，再加入新便籤。
    // React State 應建立新陣列，不直接修改原陣列。
    setNotes(prev => [...prev, newNote])
  }

  // 新增任務，預設放入「待辦」欄位。
  const addTask = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: '',
      status: '待辦',
    }

    setTasks(prev => [...prev, newTask])
  }

  // 修改指定任務的名稱。
  const updateTask = (id: string, title: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, title } : task
      )
    )
  }

  // 修改任務狀態，讓任務移動到指定欄位。
  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, status } : task
      )
    )
  }

  // 移動任務：依原本的排列方向，決定插入目標前方或後方。
  const moveTask = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return

    setTasks(prev => {
      const newTasks = [...prev]

      const fromIndex = newTasks.findIndex(task => task.id === draggedId)
      const originalTargetIndex = newTasks.findIndex(task => task.id === targetId)

      if (fromIndex === -1 || originalTargetIndex === -1) return prev

      // 原本在目標上方，往下拖時插入目標後方。
      const movingDown = fromIndex < originalTargetIndex

      const [movedTask] = newTasks.splice(fromIndex, 1)
      const targetIndex = newTasks.findIndex(task => task.id === targetId)

      // 跨欄時，同步更新任務狀態。
      movedTask.status = newTasks[targetIndex].status

      // 往下插入目標後方；往上插入目標前方。
      newTasks.splice(targetIndex + (movingDown ? 1 : 0), 0, movedTask)

      return newTasks
    })
  }

  // 刪除任務：先確認，再依照 id 移除指定任務。
  const deleteTask = (id: string) => {
    if (!window.confirm('確定要刪除這項任務嗎？')) return

    // filter()：保留所有 id 不符合的任務。
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  // 編輯便籤：透過 id 找到指定便籤，更新文字內容。
  const updateNote = (id: string, content: string) => {
    // map()：逐一檢查便籤，只有 id 符合的才更新。
    // ...note：保留原本屬性，再覆蓋 content。
    setNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, content } : note
      )
    )
  }

  // 修改指定便籤的尺寸。
  const updateNoteSize = (id: string, size: Note['size']) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, size } : note
      )
    )
  }
  
  // 刪除便籤：先確認，再依 id 移除指定便籤。
  const deleteNote = (id: string) => {
    // confirm()：瀏覽器內建確認視窗，按取消會回傳 false。
    if (!window.confirm('確定要刪除這張便籤嗎？')) return

    // filter()：建立新陣列，只保留 id 不符合的便籤。
    setNotes(prev => prev.filter(note => note.id !== id))
  }

  // 拖曳排序：交換兩張便籤在陣列中的位置。
  const swapNotes = (targetId: string) => {
    if (!draggedNoteId || draggedNoteId === targetId) return

    setNotes(prev => {
      const newNotes = [...prev]

      // findIndex()：取得指定便籤在陣列中的索引位置。
      const fromIndex = newNotes.findIndex(note => note.id === draggedNoteId)
      const toIndex = newNotes.findIndex(note => note.id === targetId)

      if (fromIndex === -1 || toIndex === -1) return prev

      // 解構賦值：交換陣列中的兩個元素。
      ;[newNotes[fromIndex], newNotes[toIndex]] = [
        newNotes[toIndex],
        newNotes[fromIndex],
      ]

      return newNotes
    })

    setDraggedNoteId(null)
  }

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

        {/* toLocaleString：依指定語系與格式顯示日期時間。 */}
        <span className="ml-auto shrink-0 text-sm text-gray-500">
          {now.toLocaleString('zh-TW', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </span>
      </nav>

      <main className="p-6">
        {/* 三元運算子：條件 ? 成立時顯示 : 不成立時顯示 */}
        {page === '工作區' ? (
          <div>
            {/* 每日打卡：可展開／收合的獨立區塊。 */}
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

            {/* 三元運算子：根據 workspaceTab 切換工作代辦／自由便籤。 */}
            {workspaceTab === '自由便籤' ? (
              <div>
                <button
                  onClick={addNote}
                  className="mb-6 cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                >
                  + 新增便籤
                </button>

                {/* items-start：讓每張便籤維持自己的高度，不隨同排最高的卡片拉伸。 */}
                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {notes.map(note => (
                    <div
                      key={note.id}
                      draggable
                      onDragStart={e => {
                        setDraggedNoteId(note.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault()
                        swapNotes(note.id)
                      }}
                      onDragEnd={() => setDraggedNoteId(null)}
                      className={`relative flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-4 ${
                        note.size === 'large'
                          ? 'min-h-80'
                          : note.size === 'medium'
                            ? 'min-h-60'
                            : 'min-h-40'
                      }`}
                    >

                    {/* 便籤操作：尺寸選擇與刪除。 */}
                    <div className="absolute top-2 right-3 flex items-center gap-2">
                      <select
                        value={note.size}
                        onChange={e =>
                          updateNoteSize(note.id, e.target.value as Note['size'])
                        }
                        aria-label="便籤尺寸"
                        className="cursor-pointer bg-transparent text-xs text-gray-500 outline-none"
                      >
                        <option value="small">小</option>
                        <option value="medium">中</option>
                        <option value="large">大</option>
                      </select>

                      {/* 拖曳提示：整張卡片都可以拖曳，此圖示僅作為視覺提示。 */}
                      <span
                        title="按住便籤拖曳排序"
                        aria-label="可拖曳排序"
                        className="cursor-grab select-none text-lg leading-none text-gray-400"
                      >
                        ⠿
                      </span>

                      <button
                        onClick={() => deleteNote(note.id)}
                        aria-label="刪除便籤"
                        title="刪除便籤"
                        className="cursor-pointer text-lg text-gray-400 hover:text-gray-800"
                      >
                        ×
                      </button>
                    </div>

                    {/* pr-6：避免文字與右上角刪除按鈕重疊。 */}
                    <textarea
                      value={note.content}
                      onChange={e => updateNote(note.id, e.target.value)}
                      placeholder=""
                      aria-label="便籤內容"
                      className="min-h-32 w-full resize-none bg-transparent outline-none"
                    />
                  </div>
                  ))}
                </div>
              </div>
            ) : (

<div>
  {/* 新增任務按鈕 */}
  <button
    onClick={addTask}
    className="mb-4 cursor-pointer rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
  >
    + 新增任務
  </button>
            {/* Kanban：依照任務狀態分成三個欄位。 */}
            <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
              {(['待辦', '進行中', '完成'] as const).map(status => (
                <section
                  key={status}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()

                    // 取得拖曳中的任務 ID，並更新成目前欄位的狀態。
                    const taskId = e.dataTransfer.getData('text/plain')
                    updateTaskStatus(taskId, status)
                  }}
                  className="min-h-60 rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <h2 className="mb-4 font-bold">{status}</h2>

                  {/* filter()：只顯示屬於目前欄位的任務。 */}
                  {tasks.filter(task => task.status === status).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragOver={e => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={e => {
                        e.preventDefault()
                        e.stopPropagation()

                        const draggedId = e.dataTransfer.getData('text/plain')
                        moveTask(draggedId, task.id)
                      }}
                      onDragStart={e => {
                        e.dataTransfer.setData('text/plain', task.id)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      className="relative mb-2 rounded-lg border border-gray-200 bg-white p-3 text-sm"
                    >
                      {/* 刪除任務按鈕 */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        aria-label="刪除任務"
                        title="刪除任務"
                        className="absolute top-2 right-3 cursor-pointer text-lg text-gray-400 hover:text-gray-800"
                      >
                        ×
                      </button>

                      {/* 編輯任務名稱 */}
                      <input
                        type="text"
                        value={task.title}
                        onChange={e => updateTask(task.id, e.target.value)}
                        placeholder=""
                        className="w-full bg-transparent pr-6 outline-none"
                      />
                    </div>
                  ))}
                </section>
              ))}
            </div>
          </div>
          )}
        </div>
      ) : (
        <h1 className="text-2xl font-bold">{page}</h1>
      )}
      </main>
    </div>
  )
}

// export default：讓 main.tsx 可以匯入並使用 App 元件。
export default App
