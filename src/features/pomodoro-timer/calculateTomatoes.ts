
// 根據單次實際專注秒數換算番茄數量。
// 滿 15 分鐘取得第一顆，之後每增加 25 分鐘取得一顆。
export function calculateTomatoes(elapsedSeconds: number): number {
    return Math.floor((Math.max(0, elapsedSeconds) + 600) / 1500)
}
