
import { useEffect, useState } from 'react'
import type { Task } from './TaskCard'

// 更新任務狀態，並同步處理完成時間。
function changeTaskStatus(
  task: Task,
  status: Task['status'],
  completedAt: number
): Task {
  if (task.status === status) return task

  return {
    ...task,
    status,
    completedAt: status === '完成' ? completedAt : undefined,
  }
}

export function useTasks() {
  // 初始化工作任務：優先讀取 localStorage。
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('tasks')
    return savedTasks ? JSON.parse(savedTasks) as Task[] : []
  })

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
    const completedAt = Date.now()

    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? changeTaskStatus(task, status, completedAt)
          : task
      )
    )
  }

  // 移動任務：依拖曳方向，插入目標前方或後方。
  const moveTask = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return

    const completedAt = Date.now()

    setTasks(prev => {
      const newTasks = [...prev]

      const fromIndex = newTasks.findIndex(task => task.id === draggedId)
      const originalTargetIndex = newTasks.findIndex(task => task.id === targetId)

      if (fromIndex === -1 || originalTargetIndex === -1) return prev

      const movingDown = fromIndex < originalTargetIndex

      const [movedTask] = newTasks.splice(fromIndex, 1)
      const targetIndex = newTasks.findIndex(task => task.id === targetId)

      // 跨欄拖曳時，同步更新任務狀態與完成時間。
      const updatedTask = changeTaskStatus(
        movedTask,
        newTasks[targetIndex].status,
        completedAt
      )

      newTasks.splice(targetIndex + (movingDown ? 1 : 0), 0, updatedTask)

      return newTasks
    })
  }

  // 刪除指定任務。
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id))
  }

  return {
    tasks,
    addTask,
    updateTask,
    updateTaskStatus,
    moveTask,
    deleteTask,
  }
}
