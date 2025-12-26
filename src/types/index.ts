// Type definitions for the scheduling system

export type Bindings = {
    DB: D1Database
    PANEL_TOKEN?: string
    WHATSAPP_TOKEN?: string
    WHATSAPP_PHONE_ID?: string
    STUDIO_PHONE?: string
}

export type Variables = {
    // render: (component: any, options?: { title?: string; data?: any }) => Response
}

export type Professional = {
    id: string
    name: string
    role: string
    bio: string
    whatsapp?: string
    avatarColor: string
    cpf?: string
    address?: string
    bankName?: string
    bankAccount?: string
    notes?: string
}

export type Service = {
    id: string
    name: string
    description: string
    durationMinutes: number
    priceCents: number
    professionalIds: string[]
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'rebook_requested'

export type RebookRequest = {
    desiredDate: string
    desiredTime: string
    note?: string
    requestedAt: string
}

export type Appointment = {
    id: string
    serviceId: string
    professionalId: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    notes?: string
    date: string
    time: string
    endTime: string
    status: AppointmentStatus
    createdAt: string
    updatedAt?: string
    confirmedAt?: string
    cancelledAt?: string
    rebookRequest?: RebookRequest
    client_notified: boolean
    isRescheduled?: boolean
    priceCents?: number
    paidAt?: string
    serviceName?: string
}

export type Client = {
    id: string
    name: string
    phone: string
    cpf?: string
    notes?: string
    procedureId?: string
    avgTimeMinutes?: number
    createdAt: string
    updatedAt?: string
}

export type AvailabilitySlot = {
    time: string
    status: 'available' | 'booked'
    appointmentId?: string
}

export type AvailabilityWindow = {
    startTime: string
    endTime: string
    slotInterval: number
}

export type TimeOffBlock = {
    id: number
    startTime: string
    endTime: string
    note?: string
}

export type SchedulingContext = {
    windows: AvailabilityWindow[]
    timeOff: TimeOffBlock[]
    appointments: AppointmentRow[]
}

export type CatalogData = {
    services: Service[]
    professionals: Professional[]
}

// Database row types
export type ServiceRow = {
    id: string
    name: string
    description?: string | null
    duration_minutes: number
    price_cents: number
    professional_ids?: string | null
    active?: number
    created_at?: string | null
    updated_at?: string | null
}

export type ProfessionalRow = {
    id: string
    name: string
    role?: string | null
    bio?: string | null
    whatsapp?: string | null
    avatar_color?: string | null
    cpf?: string | null
    address?: string | null
    bank_name?: string | null
    bank_account?: string | null
    notes?: string | null
    active?: number
}

export type AppointmentRow = {
    id: string
    service_id: string
    professional_id: string
    customer_name: string
    customer_phone: string
    customer_email?: string | null
    notes?: string | null
    date: string
    start_time: string
    end_time: string
    status: string
    rebook_desired_date?: string | null
    rebook_desired_time?: string | null
    rebook_note?: string | null
    rebook_requested_at?: string | null
    confirmed_at?: string | null
    cancelled_at?: string | null
    created_at?: string | null
    updated_at?: string | null
    client_notified?: number
    is_rescheduled?: number
    price_cents?: number | null
    paid_at?: string | null
    service_name?: string | null
}

export type ClientRow = {
    id: string
    name: string
    phone: string
    cpf?: string | null
    notes?: string | null
    procedure_id?: string | null
    avg_time_minutes?: number | null
    created_at?: string | null
    updated_at?: string | null
}

export type ProfessionalAvailabilityRow = {
    id: number
    professional_id: string
    weekday: number
    start_time: string
    end_time: string
    slot_interval: number
}

export type ProfessionalTimeOffRow = {
    id: number
    professional_id: string
    date: string
    start_time: string
    end_time: string
    note?: string | null
}
