
import { useEffect, useState } from 'react'
import AddButton from '../../components/AddButton'
import TaskCard, { type Task } from './TaskCard'

export default function KanbanBoard() {
  // 初始化工作任務：優先讀取 localStorage。
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks')
    return savedTasks ? JSON.parse(savedTasks) as Task[] : []
  })

  // 記錄目前拖曳經過的任務，用於顯示高亮。
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  // 當 tasks 改變時，自動儲存任務。
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks))
  }, [tasks])

  // 新增任務，預設放入「待辦」欄位。
  const addTask = () => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: '',
      status: '待辦',
    }

    setTasks(prev => [...prev, newTask])
  }

  // 修改任務名稱。
  const updateTask = (id: string, title: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, title } : task
      )
    )
  }

  // 修改任務狀態，移動到指定欄位。
  const updateTaskStatus = (id: string, status: Task['status']) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, status } : task
      )
    )
  }

  // 移動任務：依拖曳方向，插入目標前方或後方。
  const moveTask = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return

    setTasks(prev => {
      const newTasks = [...prev]

      const fromIndex = newTasks.findIndex(task => task.id === draggedId)
      const originalTargetIndex = newTasks.findIndex(task => task.id === targetId)

      if (fromIndex === -1 || originalTargetIndex === -1) return prev

      const movingDown = fromIndex < originalTargetIndex

      const [movedTask] = newTasks.splice(fromIndex, 1)
      const targetIndex = newTasks.findIndex(task => task.id === targetId)

      // 跨欄拖曳時，同步更新任務狀態。
      movedTask.status = newTasks[targetIndex].status

      newTasks.splice(targetIndex + (movingDown ? 1 : 0), 0, movedTask)

      return newTasks
    })
  }

  // 刪除任務：先確認，再移除指定任務。
  const deleteTask = (id: string) => {
    if (!window.confirm('確定要刪除這項任務嗎？')) return

    setTasks(prev => prev.filter(task => task.id !== id))
  }

  return (
    <div>
      <AddButton onClick={addTask}>+ 新增任務</AddButton>

      {/* Kanban：依照任務狀態分成三個欄位。 */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        {(['待辦', '進行中', '完成'] as const).map(status => (
          <section
            key={status}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()

              // 取得拖曳中的任務 ID，更新成目前欄位狀態。
              const taskId = e.dataTransfer.getData('text/plain')
              updateTaskStatus(taskId, status)
            }}
            className="min-h-60 rounded-lg border border-gray-200 bg-gray-50 p-4"
          >
            <h2 className="mb-4 font-bold">{status}</h2>

            {/* filter()：只顯示屬於目前欄位的任務。 */}
            {tasks.filter(task => task.status === status).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isDragOver={dragOverTaskId === task.id}
                onDragOver={setDragOverTaskId}
                onDragLeave={() => setDragOverTaskId(null)}
                onDrop={(draggedId, targetId) => {
                  moveTask(draggedId, targetId)
                  setDragOverTaskId(null)
                }}
                onDragEnd={() => setDragOverTaskId(null)}
                onDelete={deleteTask}
                onTitleChange={updateTask}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
