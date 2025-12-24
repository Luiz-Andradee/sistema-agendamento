
const DEFAULT_AVAILABILITY_WINDOW = {
    startTime: '09:00',
    endTime: '19:00',
    slotInterval: 30
}

function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

function addMinutesToTime(time, minutesToAdd) {
    const total = timeToMinutes(time) + minutesToAdd
    const newHours = Math.floor(total / 60)
    const newMinutes = total % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}

function enumerateSlots(start, end, interval) {
    const slots = []
    let current = start
    while (timeToMinutes(current) < timeToMinutes(end)) {
        slots.push(current)
        current = addMinutesToTime(current, interval)
    }
    return slots
}

function isWithinWindows(startTime, endTime, windows) {
    return windows.some((window) => {
        return timeToMinutes(startTime) >= timeToMinutes(window.startTime) && timeToMinutes(endTime) <= timeToMinutes(window.endTime)
    })
}

function computeAvailability({ duration, context }) {
    const slots = []

    context.windows.forEach((window) => {
        const timeSlots = enumerateSlots(window.startTime, window.endTime, window.slotInterval)
        console.log(`Window: ${window.startTime}-${window.endTime}, Interval: ${window.slotInterval}. Generated ${timeSlots.length} potential slots.`)

        timeSlots.forEach((start) => {
            const end = addMinutesToTime(start, duration)
            if (timeToMinutes(end) > timeToMinutes(window.endTime)) {
                return
            }

            const available = isWithinWindows(start, end, context.windows)

            if (available) {
                slots.push({ time: start, status: 'available' })
            }
        })
    })

    return slots
}

// Test Case 1: Default Window, 120min Service
const context = {
    windows: [DEFAULT_AVAILABILITY_WINDOW],
    timeOff: [],
    appointments: []
}

console.log("Testing availability calculation...")
const slots = computeAvailability({ duration: 120, context })
console.log("Slots found:", slots.map(s => s.time))

if (slots.length === 0) {
    console.error("FAIL: No slots found!")
    process.exit(1)
} else {
    console.log("SUCCESS: Slots generated.")
}
