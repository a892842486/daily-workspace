
type Props = {
    label: string
    displayTime: string
    isRunning: boolean
    onClick: () => void
}

// 顯示全域計時器資訊。
export default function GlobalTimer({
    label,
    displayTime,
    isRunning,
    onClick,
}: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            title="番茄鐘"
            className="flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-sm tabular-nums hover:bg-gray-100"
        >
            <span>{label}</span>

            {/* 根據計時器狀態顯示文字顏色。 */}
            <span className={`min-w-[2ch] text-center font-medium ${
                displayTime.startsWith('+') || isRunning
                    ? 'text-black'
                    : 'text-gray-400'
            }`}>
                {displayTime}
            </span>
        </button>
        
    )
}
