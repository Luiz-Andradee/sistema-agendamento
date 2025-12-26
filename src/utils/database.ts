import { Context } from 'hono'
import {
    Professional,
    Service,
    Appointment,
    Client,
    AvailabilitySlot,
    AvailabilityWindow,
    TimeOffBlock,
    SchedulingContext,
    AppointmentStatus,
    CatalogData,
    ServiceRow,
    ProfessionalRow,
    AppointmentRow,
    ClientRow,
    ProfessionalAvailabilityRow,
    ProfessionalTimeOffRow,
    Bindings
} from '../types'

const DEFAULT_STUDIO_PHONE = '5547991518816'
const DEFAULT_AVAILABILITY_WINDOW: AvailabilityWindow = {
    startTime: '09:00',
    endTime: '19:00',
    slotInterval: 30
}

export function getStudioPhone(env: Bindings): string {
    const phone = env.STUDIO_PHONE?.replace(/\D/g, '')
    return phone && phone.length >= 10 ? phone : DEFAULT_STUDIO_PHONE
}

export async function getCatalog(db: D1Database): Promise<CatalogData> {
    const [services, professionals] = await Promise.all([listServices(db), listProfessionals(db)])
    return { services, professionals }
}

export async function listServices(db: D1Database): Promise<Service[]> {
    const { results } = await db
        .prepare(
            `SELECT
        s.id,
        s.name,
        s.description,
        s.duration_minutes,
        s.price_cents,
        GROUP_CONCAT(DISTINCT sp.professional_id) AS professional_ids
      FROM services s
      LEFT JOIN service_professionals sp ON sp.service_id = s.id
      WHERE IFNULL(s.active, 1) = 1
      GROUP BY s.id
      ORDER BY s.name`
        )
        .all<ServiceRow>()

    return (results ?? []).map((row: ServiceRow) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        durationMinutes: Number(row.duration_minutes ?? 60),
        priceCents: Number(row.price_cents ?? 0),
        professionalIds: row.professional_ids ? String(row.professional_ids).split(',').map((id) => id.trim()).filter(Boolean) : []
    }))
}

export async function listProfessionals(db: D1Database): Promise<Professional[]> {
    const { results } = await db
        .prepare(
            `SELECT id, name, role, bio, whatsapp, avatar_color
       FROM professionals
       WHERE IFNULL(active, 1) = 1
       ORDER BY name`
        )
        .all<ProfessionalRow>()

    return (results ?? []).map((row: ProfessionalRow) => ({
        id: row.id,
        name: row.name,
        role: row.role ?? '',
        bio: row.bio ?? '',
        whatsapp: row.whatsapp ?? undefined,
        avatarColor: row.avatar_color ?? 'from-pink-400 to-rose-500'
    }))
}

export async function getService(db: D1Database, id: string): Promise<Service | undefined> {
    const row = await db
        .prepare(`SELECT id, name, description, duration_minutes, price_cents, active FROM services WHERE id = ?`)
        .bind(id)
        .first<ServiceRow>()

    if (!row || (row.active ?? 1) === 0) {
        return undefined
    }

    const { results } = await db
        .prepare(`SELECT professional_id FROM service_professionals WHERE service_id = ?`)
        .bind(id)
        .all<{ professional_id: string }>()

    return {
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        durationMinutes: Number(row.duration_minutes ?? 60),
        priceCents: Number(row.price_cents ?? 0),
        professionalIds: (results ?? []).map((item: { professional_id: string }) => item.professional_id)
    }
}

export async function getProfessional(db: D1Database, id: string): Promise<Professional | undefined> {
    const row = await db
        .prepare(`SELECT id, name, role, bio, whatsapp, avatar_color, active FROM professionals WHERE id = ?`)
        .bind(id)
        .first<ProfessionalRow>()

    if (!row || (row.active ?? 1) === 0) {
        return undefined
    }

    return {
        id: row.id,
        name: row.name,
        role: row.role ?? '',
        bio: row.bio ?? '',
        whatsapp: row.whatsapp ?? undefined,
        avatarColor: row.avatar_color ?? 'from-pink-400 to-rose-500'
    }
}

export async function listAppointments(db: D1Database, status?: string | null): Promise<Appointment[]> {
    const statusFilter = status && status !== 'all' ? status : undefined

    let statement
    if (statusFilter === 'rebook_requested') {
        statement = db.prepare(
            `SELECT a.*, s.name as service_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE (a.status = 'rebook_requested' OR a.is_rescheduled = TRUE) 
       ORDER BY a.date ASC, a.start_time ASC`
        )
    } else if (statusFilter) {
        statement = db.prepare(
            `SELECT a.*, s.name as service_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.status = ? 
       ORDER BY a.date ASC, a.start_time ASC`
        ).bind(statusFilter)
    } else {
        statement = db.prepare(
            `SELECT a.*, s.name as service_name
       FROM appointments a
       LEFT JOIN services s ON a.service_id = s.id
       ORDER BY a.date ASC, a.start_time ASC`
        )
    }

    const { results } = await statement.all<AppointmentRow>()
    return (results ?? []).map(mapAppointmentRow)
}

export async function getAppointment(db: D1Database, id: string): Promise<Appointment | undefined> {
    const row = await db.prepare(`SELECT * FROM appointments WHERE id = ?`).bind(id).first<AppointmentRow>()
    return row ? mapAppointmentRow(row) : undefined
}

export async function fetchAppointmentsForProfessional(
    db: D1Database,
    professionalId: string,
    date: string
): Promise<AppointmentRow[]> {
    const { results } = await db
        .prepare(
            `SELECT id, start_time, end_time, status FROM appointments
       WHERE professional_id = ? AND date = ? AND status != 'cancelled'`
        )
        .bind(professionalId, date)
        .all<AppointmentRow>()

    return results ?? []
}

export function mapAppointmentRow(row: AppointmentRow): Appointment {
    const rebookRequest =
        row.rebook_desired_date && row.rebook_desired_time
            ? {
                desiredDate: row.rebook_desired_date,
                desiredTime: row.rebook_desired_time,
                note: row.rebook_note ?? undefined,
                requestedAt: row.rebook_requested_at ?? row.updated_at ?? row.created_at ?? new Date().toISOString()
            }
            : undefined

    return {
        id: row.id,
        serviceId: row.service_id,
        professionalId: row.professional_id,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        customerEmail: row.customer_email ?? undefined,
        notes: row.notes ?? undefined,
        date: row.date,
        time: row.start_time,
        endTime: row.end_time,
        status: row.status as AppointmentStatus,
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? undefined,
        confirmedAt: row.confirmed_at ?? undefined,
        cancelledAt: row.cancelled_at ?? undefined,
        rebookRequest,
        client_notified: Boolean(row.client_notified),
        isRescheduled: Boolean(row.is_rescheduled),
        priceCents: row.price_cents ?? undefined,
        paidAt: row.paid_at ?? undefined,
        serviceName: row.service_name ?? undefined
    }
}

export function getWeekdayFromDate(date: string): number {
    const [year, month, day] = date.split('-').map(Number)
    if (!year || !month || !day) {
        throw new Error('Data inválida para cálculo de agenda.')
    }
    const parsed = new Date(Date.UTC(year, month - 1, day))
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('Data inválida para cálculo de agenda.')
    }
    return parsed.getUTCDay()
}

export async function getSchedulingContext(
    db: D1Database,
    professionalId: string,
    date: string
): Promise<SchedulingContext> {
    const weekday = getWeekdayFromDate(date)
    const [windows, timeOff, appointments, hasConfig] = await Promise.all([
        listAvailabilityWindows(db, professionalId, weekday),
        listTimeOffBlocks(db, professionalId, date),
        fetchAppointmentsForProfessional(db, professionalId, date),
        db.prepare('SELECT 1 FROM professional_availability WHERE professional_id = ? LIMIT 1').bind(professionalId).first()
    ])

    // Debugging logs
    console.log(`[getSchedulingContext] Date: ${date} Weekday: ${weekday} hasConfig: ${!!hasConfig}`)
    console.log(`[getSchedulingContext] Windows found: ${windows.length}`, windows)
    console.log(`[getSchedulingContext] TimeOff found: ${timeOff.length}`, timeOff)

    // If professional has configuration but no windows for this day, they are closed.
    // If they have NO configuration at all, we use the default fallback.
    const effectiveWindows = windows.length > 0
        ? windows
        : (hasConfig ? [] : [DEFAULT_AVAILABILITY_WINDOW])

    console.log(`[getSchedulingContext] Effective windows:`, effectiveWindows)

    return {
        windows: effectiveWindows,
        timeOff,
        appointments
    }
}

export async function listAvailabilityWindows(
    db: D1Database,
    professionalId: string,
    weekday: number
): Promise<AvailabilityWindow[]> {
    const { results } = await db
        .prepare(
            `SELECT id, weekday, start_time, end_time, slot_interval
       FROM professional_availability
       WHERE professional_id = ? AND weekday = ?
       ORDER BY start_time`
        )
        .bind(professionalId, weekday)
        .all<ProfessionalAvailabilityRow>()

    return (results ?? []).map((row: ProfessionalAvailabilityRow) => ({
        startTime: row.start_time,
        endTime: row.end_time,
        slotInterval: Number(row.slot_interval ?? 30)
    }))
}

export async function listTimeOffBlocks(
    db: D1Database,
    professionalId: string,
    date: string
): Promise<TimeOffBlock[]> {
    const { results } = await db
        .prepare(
            `SELECT id, start_time, end_time, note
       FROM professional_time_off
       WHERE professional_id = ? AND date = ?
       ORDER BY start_time`
        )
        .bind(professionalId, date)
        .all<ProfessionalTimeOffRow>()

    return (results ?? []).map((row: ProfessionalTimeOffRow) => ({
        id: row.id,
        startTime: row.start_time,
        endTime: row.end_time,
        note: row.note ?? undefined
    }))
}

export async function listWeeklyAvailability(db: D1Database, professionalId: string): Promise<Array<{ id: number; weekday: number; startTime: string; endTime: string; slotInterval: number }>> {
    const { results } = await db
        .prepare(
            `SELECT id, weekday, start_time, end_time, slot_interval
       FROM professional_availability
       WHERE professional_id = ?
       ORDER BY weekday, start_time`
        )
        .bind(professionalId)
        .all<ProfessionalAvailabilityRow>()

    return (results ?? []).map((row: ProfessionalAvailabilityRow) => ({
        id: row.id,
        weekday: row.weekday,
        startTime: row.start_time,
        endTime: row.end_time,
        slotInterval: Number(row.slot_interval ?? 30)
    }))
}

export async function listTimeOffForProfessional(db: D1Database, professionalId: string): Promise<Array<{ id: number; date: string; startTime: string; endTime: string; note?: string }>> {
    const { results } = await db
        .prepare(
            `SELECT id, date, start_time, end_time, note
       FROM professional_time_off
       WHERE professional_id = ?
       ORDER BY date, start_time`
        )
        .bind(professionalId)
        .all<ProfessionalTimeOffRow>()

    return (results ?? []).map((row: ProfessionalTimeOffRow) => ({
        id: row.id,
        date: row.date,
        startTime: row.start_time,
        endTime: row.end_time,
        note: row.note ?? undefined
    }))
}

export async function replaceProfessionalAvailability(
    db: D1Database,
    professionalId: string,
    availability: Array<{ weekday: number; startTime: string; endTime: string; slotInterval?: number }>
): Promise<void> {
    await db.prepare(`DELETE FROM professional_availability WHERE professional_id = ?`).bind(professionalId).run()

    if (!availability.length) {
        return
    }

    const statements = availability.map((item) =>
        db
            .prepare(
                `INSERT INTO professional_availability (professional_id, weekday, start_time, end_time, slot_interval)
         VALUES (?, ?, ?, ?, ?)`
            )
            .bind(professionalId, item.weekday, item.startTime, item.endTime, item.slotInterval ?? 30)
    )

    await db.batch(statements)
}

export async function createTimeOffBlock(
    db: D1Database,
    professionalId: string,
    payload: { date: string; startTime: string; endTime: string; note?: string }
): Promise<void> {
    await db
        .prepare(
            `INSERT INTO professional_time_off (professional_id, date, start_time, end_time, note)
       VALUES (?, ?, ?, ?, ?)`
        )
        .bind(professionalId, payload.date, payload.startTime, payload.endTime, payload.note ?? null)
        .run()
}

export async function deleteTimeOffBlock(db: D1Database, professionalId: string, timeOffId: number): Promise<void> {
    await db
        .prepare(`DELETE FROM professional_time_off WHERE professional_id = ? AND id = ?`)
        .bind(professionalId, timeOffId)
        .run()
}

type ComputeAvailabilityParams = {
    duration: number
    context: SchedulingContext
    ignoreAppointmentId?: string
}

type SlotBookability = {
    available: boolean
    overlappingAppointmentId?: string
}

export function computeAvailability({ duration, context, ignoreAppointmentId }: ComputeAvailabilityParams): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = []

    context.windows.forEach((window) => {
        const timeSlots = enumerateSlots(window.startTime, window.endTime, window.slotInterval)
        timeSlots.forEach((start) => {
            const end = addMinutesToTime(start, duration)
            if (timeToMinutes(end) > timeToMinutes(window.endTime)) {
                return
            }

            const bookable = isSlotBookable({
                context,
                startTime: start,
                endTime: end,
                ignoreAppointmentId
            })

            if (bookable.available) {
                slots.push({ time: start, status: 'available' })
            } else if (bookable.overlappingAppointmentId) {
                slots.push({ time: start, status: 'booked', appointmentId: bookable.overlappingAppointmentId })
            } else {
                slots.push({ time: start, status: 'booked' })
            }
        })
    })

    slots.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))
    return slots
}

type SlotBookableParams = {
    context: SchedulingContext
    startTime: string
    endTime: string
    ignoreAppointmentId?: string
}

export function isSlotBookable({ context, startTime, endTime, ignoreAppointmentId }: SlotBookableParams): SlotBookability {
    if (!isWithinWindows(startTime, endTime, context.windows)) {
        return { available: false }
    }

    if (overlapsTimeOff(startTime, endTime, context.timeOff)) {
        return { available: false }
    }

    const conflicting = context.appointments.find((appointment) => {
        if (ignoreAppointmentId && appointment.id === ignoreAppointmentId) return false
        return rangesOverlap(startTime, endTime, appointment.start_time, appointment.end_time)
    })

    if (conflicting) {
        return { available: false, overlappingAppointmentId: conflicting.id }
    }

    return { available: true }
}

export function enumerateSlots(start: string, end: string, interval: number): string[] {
    const slots: string[] = []
    let current = start
    while (timeToMinutes(current) < timeToMinutes(end)) {
        slots.push(current)
        current = addMinutesToTime(current, interval)
    }
    return slots
}

export function isWithinWindows(startTime: string, endTime: string, windows: AvailabilityWindow[]): boolean {
    return windows.some((window) => {
        return timeToMinutes(startTime) >= timeToMinutes(window.startTime) && timeToMinutes(endTime) <= timeToMinutes(window.endTime)
    })
}

export function overlapsTimeOff(startTime: string, endTime: string, blocks: TimeOffBlock[]): boolean {
    return blocks.some((block) => rangesOverlap(startTime, endTime, block.startTime, block.endTime))
}

export function isValidTime(value: string): boolean {
    return /^\d{2}:\d{2}$/.test(value)
}

export function isValidDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
}

export function addMinutesToTime(time: string, minutesToAdd: number): string {
    const total = timeToMinutes(time) + minutesToAdd
    const newHours = Math.floor(total / 60)
    const newMinutes = total % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}

export function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
    const aStart = timeToMinutes(startA)
    const aEnd = timeToMinutes(endA)
    const bStart = timeToMinutes(startB)
    const bEnd = timeToMinutes(endB)
    return aStart < bEnd && bStart < aEnd
}

export async function logAppointmentHistory(db: D1Database, appointmentId: string, event: string, payload?: unknown) {
    await db
        .prepare(
            `INSERT INTO appointment_history (appointment_id, event_type, payload) VALUES (?, ?, ?)`
        )
        .bind(appointmentId, event, payload ? JSON.stringify(payload) : null)
        .run()
}

export function buildStudioToClientLink(
    appointment: Appointment,
    service: Service,
    professional: Professional,
    statusLabel: string
): string {
    const message = buildStudioToClientMessage(appointment, service, professional, statusLabel)
    // Use client phone, ensure it has country code if possible, or just digits
    const phone = normalizeE164(appointment.customerPhone) || appointment.customerPhone.replace(/\D/g, '')
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}

export function buildStudioToClientMessage(
    appointment: Appointment,
    service: Service,
    professional: Professional,
    statusLabel: string
): string {
    const dateTime = new Date(`${appointment.date}T${appointment.time}:00`)
    const formattedDate = dateTime.toLocaleDateString('pt-BR')
    const formattedTime = appointment.time

    const closingLine = statusLabel.toLowerCase() === 'cancelado'
        ? 'Lamentamos o cancelamento do seu agendamento.'
        : 'Te esperamos lá!';

    const lines = [
        `Olá ${appointment.customerName}, aqui é do Estúdio Aline Andrade!`,
        '',
        `Seu agendamento para ${service.name} com ${professional.name} está ${statusLabel}.`,
        '',
        `Data: ${formattedDate}`,
        `Horário: ${formattedTime}`,
        `Código: ${appointment.id}`,
        '',
        closingLine
    ]

    return lines.join('\n')
}

export function normalizePhone(raw: string): string {
    return raw.replace(/\D/g, '')
}

export function normalizeE164(phone: string): string | null {
    const digits = phone.replace(/\D/g, '')
    if (!digits) return null
    if (digits.startsWith('55')) {
        return digits
    }
    if (digits.length === 11) {
        return `55${digits}`
    }
    if (digits.length >= 11) {
        return digits
    }
    return null
}

export async function triggerWhatsAppAutomation(
    env: Bindings,
    event: 'created' | 'confirmed' | 'cancelled' | 'rebook_approved',
    appointment: Appointment,
    service: Service,
    professional: Professional
) {
    if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID) {
        return
    }

    const recipient = normalizeE164(appointment.customerPhone)
    if (!recipient) {
        return
    }

    const message = buildAutomationMessage(event, appointment, service, professional)
    if (!message) {
        return
    }

    const response = await fetch(`https://graph.facebook.com/v20.0/${env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: recipient,
            type: 'text',
            text: { body: message }
        })
    })

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido na API do WhatsApp.')
        console.warn('WhatsApp API error', errorText)
    }
}

export function buildAutomationMessage(
    event: 'created' | 'confirmed' | 'cancelled' | 'rebook_approved',
    appointment: Appointment,
    service: Service,
    professional: Professional
): string {
    const baseInfo = `Serviço: ${service.name}\nProfissional: ${professional.name}\nData: ${appointment.date} às ${appointment.time}`

    switch (event) {
        case 'created':
            return `Olá, ${appointment.customerName}! Recebemos sua solicitação de agendamento no Estúdio Aline Andrade. Assim que confirmarmos o horário, entraremos em contato.\n\n${baseInfo}`
        case 'confirmed':
            return `Seu horário está confirmado!\n\n${baseInfo}\n\nTe esperamos no estúdio.`
        case 'cancelled':
            return `Seu agendamento foi cancelado conforme solicitado. Caso queira remarcar, estamos à disposição.\n\n${baseInfo}`
        case 'rebook_approved':
            return `Reagendamento concluído com sucesso! Veja os novos detalhes:\n\n${baseInfo}\n\nAté breve!`
        default:
            return ''
    }
}

export async function enforcePanelAuth(c: Context<any>) {
    const header = c.req.header('authorization') ?? ''
    const fallback = c.req.header('x-panel-token') ?? ''
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim() || fallback.trim()

    if (!token) {
        return c.json({ message: 'Acesso não autorizado.' }, 401)
    }

    // Simple token validation: check if it matches the format generated in login
    // Format: base64(userId:timestamp)
    try {
        const decoded = atob(token)
        const [userId, timestamp] = decoded.split(':')

        if (!userId || !timestamp) {
            throw new Error('Invalid token structure')
        }

        // Optional: Check if user actually exists in DB to be sure
        const user = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first()
        if (!user) {
            return c.json({ message: 'Sessão inválida.' }, 401)
        }

    } catch (e) {
        return c.json({ message: 'Token de sessão inválido.' }, 401)
    }

    return undefined
}

export async function listClients(db: D1Database, search?: string): Promise<Client[]> {
    let query = `SELECT * FROM clients`
    const params: any[] = []

    if (search) {
        query += ` WHERE name LIKE ? OR phone LIKE ? OR cpf LIKE ?`
        params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    query += ` ORDER BY name ASC`

    const { results } = await db.prepare(query).bind(...params).all<ClientRow>()
    return (results ?? []).map(mapClientRow)
}

export async function getClient(db: D1Database, id: string): Promise<Client | undefined> {
    const row = await db.prepare(`SELECT * FROM clients WHERE id = ?`).bind(id).first<ClientRow>()
    return row ? mapClientRow(row) : undefined
}

export async function createClient(
    db: D1Database,
    payload: { name: string; phone: string; cpf?: string; notes?: string; procedureId?: string; avgTimeMinutes?: number }
): Promise<Client> {
    const id = crypto.randomUUID()
    await db
        .prepare(
            `INSERT INTO clients (id, name, phone, cpf, notes, procedure_id, avg_time_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
        )
        .bind(
            id,
            payload.name,
            payload.phone,
            payload.cpf ?? null,
            payload.notes ?? null,
            payload.procedureId ?? null,
            payload.avgTimeMinutes ?? null
        )
        .run()

    const client = await getClient(db, id)
    if (!client) throw new Error('Failed to create client')
    return client
}

export async function updateClient(
    db: D1Database,
    id: string,
    payload: { name?: string; phone?: string; cpf?: string; notes?: string; procedureId?: string; avgTimeMinutes?: number }
): Promise<Client | undefined> {
    const current = await getClient(db, id)
    if (!current) return undefined

    await db
        .prepare(
            `UPDATE clients
       SET name = ?, phone = ?, cpf = ?, notes = ?, procedure_id = ?, avg_time_minutes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
        )
        .bind(
            payload.name ?? current.name,
            payload.phone ?? current.phone,
            payload.cpf ?? current.cpf ?? null,
            payload.notes ?? current.notes ?? null,
            payload.procedureId ?? current.procedureId ?? null,
            payload.avgTimeMinutes ?? current.avgTimeMinutes ?? null,
            id
        )
        .run()

    return getClient(db, id)
}

export async function deleteClient(db: D1Database, id: string): Promise<void> {
    await db.prepare(`DELETE FROM clients WHERE id = ?`).bind(id).run()
}

export function mapClientRow(row: ClientRow): Client {
    return {
        id: row.id,
        name: row.name,
        phone: row.phone,
        cpf: row.cpf ?? undefined,
        notes: row.notes ?? undefined,
        procedureId: row.procedure_id ?? undefined,
        avgTimeMinutes: row.avg_time_minutes ?? undefined,
        createdAt: row.created_at ?? new Date().toISOString(),
        updatedAt: row.updated_at ?? undefined
    }
}

export function mapProfessionalRow(row: ProfessionalRow): Professional {
    return {
        id: row.id,
        name: row.name,
        role: row.role ?? '',
        bio: row.bio ?? '',
        whatsapp: row.whatsapp ?? undefined,
        avatarColor: row.avatar_color ?? 'from-pink-400 to-rose-500',
        cpf: row.cpf ?? undefined,
        address: row.address ?? undefined,
        bankName: row.bank_name ?? undefined,
        bankAccount: row.bank_account ?? undefined,
        notes: row.notes ?? undefined
    }
}

export function mapServiceRow(row: ServiceRow): Service {
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? '',
        durationMinutes: Number(row.duration_minutes ?? 60),
        priceCents: Number(row.price_cents ?? 0),
        professionalIds: row.professional_ids ? String(row.professional_ids).split(',').map((id) => id.trim()).filter(Boolean) : []
    }
}
