
// 工作任務的資料結構。
export type Task = {
  id: string
  title: string
  status: '待辦' | '進行中' | '完成'
}

type TaskCardProps = {
  task: Task
  isDragOver: boolean
  onDragOver: (id: string) => void
  onDragLeave: () => void
  onDrop: (draggedId: string, targetId: string) => void
  onDragEnd: () => void
  onDelete: (id: string) => void
  onTitleChange: (id: string, title: string) => void
}

export default function TaskCard({
  task,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDelete,
  onTitleChange,
}: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', task.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={e => {
        e.preventDefault()
        e.stopPropagation()
        onDragOver(task.id)
      }}
      onDragLeave={onDragLeave}
      onDrop={e => {
        e.preventDefault()
        e.stopPropagation()

        const draggedId = e.dataTransfer.getData('text/plain')
        onDrop(draggedId, task.id)
      }}
      onDragEnd={onDragEnd}
      className={`relative mb-2 rounded-lg border p-3 text-sm transition-colors ${
        isDragOver
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      {/* 刪除任務按鈕 */}
      <button
        onClick={() => onDelete(task.id)}
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
        onChange={e => onTitleChange(task.id, e.target.value)}
        placeholder=""
        className="w-full bg-transparent pr-6 outline-none"
      />
    </div>
  )
}
