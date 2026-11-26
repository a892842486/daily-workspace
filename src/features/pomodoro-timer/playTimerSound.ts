
// 可選擇的提示音。
export const timerSounds = [
    { id: 'soft', label: '柔和雙音' },
    { id: 'bell', label: '柔和鈴聲' },
    { id: 'beep', label: '清脆電子音' },
    { id: 'success', label: '輕快完成音' },
    { id: 'wood', label: '木魚敲擊音' },
    { id: 'chime', label: '風鈴' },
    { id: 'drop', label: '水滴' },
    { id: 'digital', label: '數位鬧鐘' },
    { id: 'morning', label: '晨光' },
    { id: 'zen', label: '禪意鐘聲' },
] as const

export type TimerSound = typeof timerSounds[number]['id']

// 單一音符：[頻率、開始時間、持續秒數]。
type Tone = [number, number, number]

// 各種提示音的音色與音符組合。
const soundPatterns: Record<TimerSound, {
    type: OscillatorType
    tones: Tone[]
}> = {
    soft: {
        type: 'sine',
        tones: [[440, 0, 0.6], [659, 0.4, 0.8]],
    },
    bell: {
        type: 'sine',
        tones: [[784, 0, 0.8], [1046, 0.5, 1.1]],
    },
    beep: {
        type: 'square',
        tones: [[880, 0, 0.13], [880, 0.25, 0.13], [880, 0.5, 0.13]],
    },
    success: {
        type: 'sine',
        tones: [[523, 0, 0.25], [659, 0.22, 0.25], [784, 0.44, 0.65]],
    },
    wood: {
        type: 'triangle',
        tones: [[330, 0, 0.09], [260, 0.3, 0.1]],
    },
    chime: {
        type: 'sine',
        tones: [[1046, 0, 0.8], [1318, 0.2, 0.8], [1568, 0.4, 1]],
    },
    drop: {
        type: 'sine',
        tones: [[1200, 0, 0.12], [800, 0.15, 0.25]],
    },
    digital: {
        type: 'triangle',
        tones: [[1000, 0, 0.12], [1500, 0.15, 0.12], [1000, 0.3, 0.12]],
    },
    morning: {
        type: 'sine',
        tones: [[392, 0, 0.4], [523, 0.3, 0.4], [659, 0.6, 0.4], [784, 0.9, 0.8]],
    },
    zen: {
        type: 'sine',
        tones: [[220, 0, 1.8], [440, 0, 1.2]],
    },
}

// 共用音訊環境，避免每次播放都重新建立。
let audioContext: AudioContext | null = null

// 初始化音訊環境，需由使用者操作觸發。
export async function initializeTimerAudio() {
    if (!audioContext) {
        audioContext = new AudioContext()
    }

    if (audioContext.state === 'suspended') {
        await audioContext.resume()
    }

    return audioContext
}

// 播放指定提示音。
export async function playTimerSound(
    sound: TimerSound = 'soft',
    volume = 50,
    repeat = 1
) {
    if (volume <= 0) return

    const context = await initializeTimerAudio()
    const pattern = soundPatterns[sound]

    // 計算完整音效的持續時間。
    const duration = Math.max(
        ...pattern.tones.map(([, start, length]) => start + length)
    )

    // 每次完整音效之間保留 0.5 秒間隔。
    const interval = duration + 0.5
    const startTime = context.currentTime + 0.02
    const gainValue = Math.min(100, volume) / 100 * 0.22

    for (let i = 0; i < repeat; i++) {
        for (const [frequency, offset, length] of pattern.tones) {
            const oscillator = context.createOscillator()
            const gain = context.createGain()

            oscillator.type = pattern.type
            oscillator.frequency.value = frequency

            const start = startTime + i * interval + offset

            // 淡入淡出，避免音效突然開始或停止。
            gain.gain.setValueAtTime(0.0001, start)
            gain.gain.exponentialRampToValueAtTime(
                Math.max(0.0001, gainValue),
                start + 0.012
            )
            gain.gain.exponentialRampToValueAtTime(
                0.0001,
                start + length
            )

            oscillator.connect(gain)
            gain.connect(context.destination)

            oscillator.start(start)
            oscillator.stop(start + length + 0.02)
        }
    }
}

// 提示音提醒模式。
export type TimerAlertMode = '1' | '2' | '3' | '4' | '5' | '10s' | '30s'

// 可取消的提示音提醒。
export function playTimerAlert(
    sound: TimerSound,
    volume: number,
    mode: TimerAlertMode,
    onFinish?: () => void
) {
    let cancelled = false
    const oscillators: OscillatorNode[] = []
    let timeoutId: number | undefined

    const stop = () => {
        if (cancelled) return
        cancelled = true

        if (timeoutId !== undefined) {
            window.clearTimeout(timeoutId)
        }

        for (const oscillator of oscillators) {
            try {
                oscillator.stop()
            } catch {
                // Oscillator 已停止。
            }
        }

        onFinish?.()
    }

    if (volume <= 0) {
        return stop
    }

    void (async () => {
        const context = await initializeTimerAudio()

        if (cancelled) return

        const pattern = soundPatterns[sound]

        const duration = Math.max(
            ...pattern.tones.map(([, start, length]) => start + length)
        )

        const interval = duration + 0.5
        const startTime = context.currentTime + 0.02
        const gainValue = Math.min(100, volume) / 100 * 0.22

        const repeat = mode.endsWith('s')
            ? Math.ceil(Number(mode.slice(0, -1)) / interval)
            : Number(mode)

        for (let i = 0; i < repeat; i++) {
            for (const [frequency, offset, length] of pattern.tones) {
                if (cancelled) return

                const oscillator = context.createOscillator()
                const gain = context.createGain()

                oscillator.type = pattern.type
                oscillator.frequency.value = frequency

                const start = startTime + i * interval + offset

                gain.gain.setValueAtTime(0.0001, start)
                gain.gain.exponentialRampToValueAtTime(
                    Math.max(0.0001, gainValue),
                    start + 0.012
                )
                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    start + length
                )

                oscillator.connect(gain)
                gain.connect(context.destination)

                oscillator.start(start)
                oscillator.stop(start + length + 0.02)

                oscillators.push(oscillator)
            }
        }

        const totalDuration =
            mode.endsWith('s')
                ? Number(mode.slice(0, -1))
                : (repeat - 1) * interval + duration

        timeoutId = window.setTimeout(stop, totalDuration * 1000)
    })().catch(console.warn)

    return stop
}
