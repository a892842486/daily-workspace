
import { useState } from 'react'
import AddButton from '../../components/AddButton'
import TaskCard, { type Task } from './TaskCard'
import { getWorkspaceDate } from '../../utils/getWorkspaceDate'

type KanbanBoardProps = {
  tasks: Task[]
  workspaceDate: string
  addTask: () => void
  updateTask: (id: string, title: string) => void
  updateTaskStatus: (id: string, status: Task['status']) => void
  moveTask: (draggedId: string, targetId: string) => void
  deleteTask: (id: string) => void
}

export default function KanbanBoard({
  tasks,
  workspaceDate,
  addTask,
  updateTask,
  updateTaskStatus,
  moveTask,
  deleteTask,
}: KanbanBoardProps) {
  // 記錄目前拖曳經過的任務，用於顯示高亮。
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

  // 已完成任務只顯示當日紀錄，跨日後保留資料但隱藏卡片。
  const visibleTasks = tasks.filter(task => {
    if (task.status !== '完成') return true
    if (task.completedAt === undefined) return true

    return getWorkspaceDate(task.completedAt) === workspaceDate
  })

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
            className="min-h-60 rounded-lg border border-border bg-surface-secondary p-4"
          >
            <h2 className="mb-4 font-bold">{status}</h2>

            {/* 只顯示目前欄位中符合顯示條件的任務。 */}
            {visibleTasks.filter(task => task.status === status).map(task => (
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
