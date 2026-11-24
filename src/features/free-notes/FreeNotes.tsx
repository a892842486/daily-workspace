
import { useEffect, useState } from 'react'
import AddButton from '../../components/AddButton'
import NoteCard, { type Note } from './NoteCard'

export default function FreeNotes() {
  // 初始化便籤：優先讀取 localStorage，沒有紀錄則使用空陣列。
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

  // 記錄拖曳經過的目標便籤。
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null)

  // 當 notes 改變時，自動儲存所有便籤。
  useEffect(() => {
    localStorage.setItem('notes', JSON.stringify(notes))
  }, [notes])

  // 新增便籤。
  const addNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content: '',
      size: 'small',
    }

    setNotes(prev => [...prev, newNote])
  }

  // 編輯便籤內容。
  const updateNote = (id: string, content: string) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, content } : note
      )
    )
  }

  // 修改便籤尺寸。
  const updateNoteSize = (id: string, size: Note['size']) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, size } : note
      )
    )
  }

  // 刪除便籤。
  const deleteNote = (id: string) => {
    if (!window.confirm('確定要刪除這張便籤嗎？')) return

    setNotes(prev => prev.filter(note => note.id !== id))
  }

  // 拖曳排序：交換兩張便籤的位置。
  const swapNotes = (targetId: string) => {
    if (!draggedNoteId || draggedNoteId === targetId) return

    setNotes(prev => {
      const newNotes = [...prev]

      const fromIndex = newNotes.findIndex(note => note.id === draggedNoteId)
      const toIndex = newNotes.findIndex(note => note.id === targetId)

      if (fromIndex === -1 || toIndex === -1) return prev

        ;[newNotes[fromIndex], newNotes[toIndex]] = [
          newNotes[toIndex],
          newNotes[fromIndex],
        ]

      return newNotes
    })

    setDraggedNoteId(null)
  }

  return (
    <div>
      <AddButton onClick={addNote}>+ 新增便籤</AddButton>

      {/* 自由便籤網格 */}
      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {notes.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            isDragOver={dragOverNoteId === note.id}
            onDragStart={setDraggedNoteId}
            onDragOver={id => {
              if (draggedNoteId && draggedNoteId !== id) {
                setDragOverNoteId(id)
              }
            }}
            onDragLeave={() => setDragOverNoteId(null)}
            onDrop={id => {
              swapNotes(id)
              setDragOverNoteId(null)
            }}
            onDragEnd={() => {
              setDraggedNoteId(null)
              setDragOverNoteId(null)
            }}
            onSizeChange={updateNoteSize}
            onDelete={deleteNote}
            onContentChange={updateNote}
          />
        ))}
      </div>
    </div>
  )
}
