
import { useState } from 'react'
import AddButton from '../../components/AddButton'
import TaskCard, { type Task } from './TaskCard'

type KanbanBoardProps = {
  tasks: Task[]
  addTask: () => void
  updateTask: (id: string, title: string) => void
  updateTaskStatus: (id: string, status: Task['status']) => void
  moveTask: (draggedId: string, targetId: string) => void
  deleteTask: (id: string) => void
}

export default function KanbanBoard({
  tasks,
  addTask,
  updateTask,
  updateTaskStatus,
  moveTask,
  deleteTask,
}: KanbanBoardProps) {
  // 記錄目前拖曳經過的任務，用於顯示高亮。
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  // 刪除任務前，先向使用者確認。
  const handleDeleteTask = (id: string) => {
    if (!window.confirm('確定要刪除這項任務嗎？')) return

    deleteTask(id)
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
                onDelete={handleDeleteTask}
                onTitleChange={updateTask}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  )
}
