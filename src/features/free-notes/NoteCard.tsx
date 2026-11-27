
// 初始化便籤：優先讀取 localStorage，沒有紀錄則使用空陣列。
// JSON.parse()：將儲存的 JSON 字串轉回 JavaScript 陣列。
// Note：定義每張便籤的資料結構。
export type Note = {
  id: string
  content: string
  size: 'small' | 'medium' | 'large'
}

type NoteCardProps = {
  note: Note
  isDragOver: boolean
  onDragStart: (id: string) => void
  onDragOver: (id: string) => void
  onDragLeave: () => void
  onDrop: (id: string) => void
  onDragEnd: () => void
  onSizeChange: (id: string, size: Note['size']) => void
  onDelete: (id: string) => void
  onContentChange: (id: string, content: string) => void
}

export default function NoteCard({
  note,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onSizeChange,
  onDelete,
  onContentChange,
}: NoteCardProps) {
  return (
    <div
      draggable
      onDragStart={e => {
        onDragStart(note.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      onDragOver={e => {
        e.preventDefault()
        onDragOver(note.id)
      }}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          onDragLeave()
        }
      }}
      onDrop={e => {
        e.preventDefault()
        onDrop(note.id)
      }}
      onDragEnd={onDragEnd}
      className={`relative flex flex-col rounded-lg border p-4 transition-colors ${isDragOver
        ? 'border-accent bg-surface-secondary'
        : 'border-border bg-surface-secondary'
        } ${note.size === 'large'
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
          onChange={e => onSizeChange(note.id, e.target.value as Note['size'])}
          aria-label="便籤尺寸"
          className="cursor-pointer bg-transparent text-xs text-text-secondary outline-none"
        >
          <option value="small">小</option>
          <option value="medium">中</option>
          <option value="large">大</option>
        </select>

        {/* 拖曳提示：整張卡片都可以拖曳，此圖示僅作為視覺提示。 */}
        <span
          title="按住便籤拖曳排序"
          aria-label="可拖曳排序"
          className="cursor-grab select-none text-lg leading-none text-text-secondary"
        >
          ⠿
        </span>

        <button
          onClick={() => onDelete(note.id)}
          aria-label="刪除便籤"
          title="刪除便籤"
          className="cursor-pointer text-lg text-text-secondary hover:text-danger"
        >
          ×
        </button>
      </div>

      {/* 編輯便籤內容。 */}
      <textarea
        value={note.content}
        onChange={e => onContentChange(note.id, e.target.value)}
        placeholder=""
        aria-label="便籤內容"
        className="min-h-32 w-full resize-none bg-transparent outline-none"
      />
    </div>
  )
}
