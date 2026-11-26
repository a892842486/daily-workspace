
// 將計時秒數轉換成 MM:SS 或 HH:MM:SS 格式。
export function formatDuration(totalSeconds: number): string {
    const isOvertime = totalSeconds < 0
    const absoluteSeconds = Math.abs(totalSeconds)

    const hours = Math.floor(absoluteSeconds / 3600)
    const minutes = Math.floor((absoluteSeconds % 3600) / 60)
    const seconds = absoluteSeconds % 60

    const formattedMinutes = String(minutes).padStart(2, '0')
    const formattedSeconds = String(seconds).padStart(2, '0')

    const time = hours > 0
        ? `${String(hours).padStart(2, '0')}:${formattedMinutes}:${formattedSeconds}`
        : `${formattedMinutes}:${formattedSeconds}`

    return `${isOvertime ? '+' : ''}${time}`
}
