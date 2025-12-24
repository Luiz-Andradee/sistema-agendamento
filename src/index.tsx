import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database
  PANEL_TOKEN?: string
  WHATSAPP_TOKEN?: string
  WHATSAPP_PHONE_ID?: string
  STUDIO_PHONE?: string
}

type Variables = {
  // render: (component: any, options?: { title?: string; data?: any }) => Response
}

type Professional = {
  id: string
  name: string
  role: string
  bio: string
  whatsapp?: string
  avatarColor: string
}

type Service = {
  id: string
  name: string
  description: string
  durationMinutes: number
  priceCents: number
  professionalIds: string[]
}

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'rebook_requested'

type RebookRequest = {
  desiredDate: string
  desiredTime: string
  note?: string
  requestedAt: string
}

type Appointment = {
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

type Client = {
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

type AvailabilitySlot = {
  time: string
  status: 'available' | 'booked'
  appointmentId?: string
}

type AvailabilityWindow = {
  startTime: string
  endTime: string
  slotInterval: number
}

type TimeOffBlock = {
  id: number
  startTime: string
  endTime: string
  note?: string
}

type SchedulingContext = {
  windows: AvailabilityWindow[]
  timeOff: TimeOffBlock[]
  appointments: AppointmentRow[]
}

type CatalogData = {
  services: Service[]
  professionals: Professional[]
}

type ServiceRow = {
  id: string
  name: string
  description?: string | null
  duration_minutes: number
  price_cents: number
  professional_ids?: string | null
  active?: number
}

type ProfessionalRow = {
  id: string
  name: string
  role?: string | null
  bio?: string | null
  whatsapp?: string | null
  avatar_color?: string | null
  active?: number
}

type AppointmentRow = {
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

type ClientRow = {
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

type ProfessionalAvailabilityRow = {
  id: number
  professional_id: string
  weekday: number
  start_time: string
  end_time: string
  slot_interval: number
}

type ProfessionalTimeOffRow = {
  id: number
  professional_id: string
  date: string
  start_time: string
  end_time: string
  note?: string | null
}

const DEFAULT_STUDIO_PHONE = '5547991518816'
const DEFAULT_AVAILABILITY_WINDOW: AvailabilityWindow = {
  startTime: '09:00',
  endTime: '19:00',
  slotInterval: 30
}
const WORKDAY = {
  start: '09:00',
  end: '19:00',
  intervalMinutes: 30
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

app.use('/api/*', cors())
app.use(renderer)

app.get('/', (c) => {
  return c.redirect('/login')
})

app.get('/painel', async (c) => {
  const catalog = await getCatalog(c.env.DB)
  const studioPhone = getStudioPhone(c.env)

  return (c as any).render(
    <DashboardPage
      services={catalog.services}
      professionals={catalog.professionals}
      studioPhone={studioPhone}
      panelProtected={true}
    />,
    {
      title: 'Painel do Estúdio · Estúdio Aline Andrade',
      data: {
        page: 'dashboard',
        panelProtected: true,
        bootstrap: {
          services: catalog.services,
          professionals: catalog.professionals,
          studioPhone
        }
      }
    }
  )
})


app.get('/clients', (c) => {
  return (c as any).render(
    <ClientsPage />,
    {
      title: 'Gerenciar Clientes · Estúdio Aline Andrade',
      data: {
        page: 'clients',
        panelProtected: true
      }
    }
  )
})

app.get('/financeiro', (c) => {
  return (c as any).render(
    <FinancialPage />,
    {
      title: 'Financeiro · Estúdio Aline Andrade',
      data: {
        page: 'financial',
        panelProtected: true
      }
    }
  )
})

app.get('/login', (c) => {
  return (c as any).render(
    <LoginPage />,
    {
      title: 'Acesso Restrito · Estúdio Aline Andrade',
      data: {
        page: 'login'
      }
    }
  )
})

app.post('/api/auth/login', async (c) => {
  const body = (await c.req.json().catch(() => undefined)) as { username?: string; password?: string } | undefined

  if (!body?.username || !body.password) {
    return c.json({ message: 'Informe usuário e senha.' }, 400)
  }

  // NOTE: Simple cleartext comparison for prototype. Use hashing in production.
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
    .bind(body.username, body.password)
    .first<{ id: string; username: string }>()

  if (!user) {
    return c.json({ message: 'Credenciais inválidas.' }, 401)
  }

  // Generate a simple session token (base64 of userId:timestamp) for client storage
  // In a robust app, store this in a sessions table or use signed JWT.
  const token = btoa(`${user.id}:${Date.now()}`)

  return c.json({ ok: true, token })
})

app.get('/health', (c) => c.json({ ok: true }))

app.patch('/api/appointments/:id/payment', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { paid?: boolean }
  const paid = Boolean(body.paid)

  // Update paid_at
  const paidAt = paid ? new Date().toISOString() : null

  await c.env.DB.prepare(
    `UPDATE appointments SET paid_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(paidAt, id).run()

  return c.json({ ok: true, paidAt })
})

app.patch('/api/appointments/:id/price', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { priceCents?: number }

  if (body.priceCents === undefined || body.priceCents < 0) {
    return c.json({ message: 'Valor inválido' }, 400)
  }

  await c.env.DB.prepare(
    `UPDATE appointments SET price_cents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(body.priceCents, id).run()

  return c.json({ ok: true, priceCents: body.priceCents })
})

app.get('/api/services', async (c) => {
  const services = await listServices(c.env.DB)
  return c.json({ services })
})

app.get('/api/professionals', async (c) => {
  const professionals = await listProfessionals(c.env.DB)
  return c.json({ professionals })
})

app.get('/api/availability', async (c) => {
  const professionalId = c.req.query('professionalId')
  const date = c.req.query('date')
  const serviceId = c.req.query('serviceId')
  const ignoreId = c.req.query('ignoreAppointmentId') ?? undefined
  const customDuration = c.req.query('duration') ? Number(c.req.query('duration')) : undefined

  if (!professionalId || !date) {
    return c.json({ message: 'Informe profissional e data para consultar a agenda.' }, 400)
  }

  const [professional, service] = await Promise.all([
    getProfessional(c.env.DB, professionalId),
    serviceId ? getService(c.env.DB, serviceId) : Promise.resolve(undefined)
  ])

  if (!professional) {
    return c.json({ message: 'Profissional não encontrada.' }, 404)
  }

  if (serviceId && !service) {
    return c.json({ message: 'Serviço não encontrado.' }, 404)
  }

  if (service && !service.professionalIds.includes(professionalId)) {
    return c.json({ message: 'Este serviço não está disponível para a profissional selecionada.' }, 400)
  }

  const serviceDuration = customDuration ?? service?.durationMinutes ?? 60
  const context = await getSchedulingContext(c.env.DB, professionalId, date)
  let slots = computeAvailability({
    duration: serviceDuration,
    context,
    ignoreAppointmentId: ignoreId
  })

  // Filter past slots if date is today (Brazil time)
  const now = new Date()
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const todayStr = brazilTime.toLocaleDateString('pt-BR').split('/').reverse().join('-') // YYYY-MM-DD

  if (date === todayStr) {
    const currentHours = brazilTime.getHours()
    const currentMinutes = brazilTime.getMinutes()
    const currentTotalMinutes = currentHours * 60 + currentMinutes

    slots = slots.filter(slot => {
      const [h, m] = slot.time.split(':').map(Number)
      return (h * 60 + m) > currentTotalMinutes
    })
  }

  return c.json({ date, professionalId, slots })
})

app.post('/api/auth/verify', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized
  return c.json({ ok: true })
})

app.get('/api/appointments', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const statusFilter = c.req.query('status')
  const appointments = await listAppointments(c.env.DB, statusFilter)
  return c.json({ appointments })
})

app.post('/api/appointments', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const body = (await c.req.json().catch(() => undefined)) as
    | {
      serviceId?: string
      professionalId?: string
      date?: string
      time?: string
      customerName?: string
      customerPhone?: string
      customerEmail?: string
      notes?: string
      price?: number
    }
    | undefined

  if (!body?.serviceId || !body.professionalId || !body.date || !body.time || !body.customerName || !body.customerPhone) {
    return c.json(
      {
        message: 'Preencha todas as informações obrigatórias: serviço, profissional, data, horário, nome e telefone.'
      },
      400
    )
  }

  const [service, professional] = await Promise.all([
    getService(c.env.DB, body.serviceId),
    getProfessional(c.env.DB, body.professionalId)
  ])

  if (!service || !professional) {
    return c.json({ message: 'Serviço ou profissional não encontrado.' }, 404)
  }

  if (!service.professionalIds.includes(professional.id)) {
    return c.json({ message: 'Este serviço não está disponível com a profissional selecionada.' }, 400)
  }

  const normalizedPhone = normalizePhone(body.customerPhone)
  const endTime = addMinutesToTime(body.time, service.durationMinutes)

  const context = await getSchedulingContext(c.env.DB, professional.id, body.date)
  const slotStatus = isSlotBookable({
    context,
    startTime: body.time,
    endTime,
    ignoreAppointmentId: undefined
  })

  if (!slotStatus.available) {
    return c.json({ message: 'Horário indisponível para a grade da profissional. Escolha outro horário.' }, 409)
  }

  const appointmentId = crypto.randomUUID()
  await c.env.DB
    .prepare(
      `INSERT INTO appointments (
        id, service_id, professional_id, customer_name, customer_phone, customer_email, notes,
        date, start_time, end_time, status, created_at, updated_at, price_cents
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)`
    )
    .bind(
      appointmentId,
      service.id,
      professional.id,
      body.customerName,
      normalizedPhone,
      body.customerEmail?.trim() || null,
      body.notes?.trim() || null,
      body.date,
      body.time,

      endTime,
      body.price ?? null
    )
    .run()

  await logAppointmentHistory(c.env.DB, appointmentId, 'created', {
    serviceId: service.id,
    professionalId: professional.id,
    date: body.date,
    time: body.time,
    price: body.price
  })

  const appointment = await getAppointment(c.env.DB, appointmentId)
  if (!appointment) {
    return c.json({ message: 'Não foi possível recuperar o agendamento recém-criado.' }, 500)
  }

  const studioPhone = getStudioPhone(c.env)
  // Changed to internal link: Studio -> Client
  const whatsappLink = buildStudioToClientLink(appointment, service, professional, 'confirmado com sucesso')

  await triggerWhatsAppAutomation(c.env, 'created', appointment, service, professional)

  return c.json({ appointment, whatsappLink }, 201)
})

app.post('/api/appointments/:id/confirm', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const appointmentId = c.req.param('id')
  const appointment = await getAppointment(c.env.DB, appointmentId)

  if (!appointment) {
    return c.json({ message: 'Agendamento não encontrado.' }, 404)
  }

  await c.env.DB
    .prepare(
      `UPDATE appointments
       SET status = 'confirmed',
           confirmed_at = CURRENT_TIMESTAMP,
           rebook_desired_date = NULL,
           rebook_desired_time = NULL,
           rebook_note = NULL,
           rebook_requested_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(appointmentId)
    .run()

  await logAppointmentHistory(c.env.DB, appointmentId, 'confirmed')

  const updated = await getAppointment(c.env.DB, appointmentId)
  if (!updated) {
    return c.json({ message: 'Não foi possível atualizar o agendamento.' }, 500)
  }

  const [service, professional] = await Promise.all([
    getService(c.env.DB, updated.serviceId),
    getProfessional(c.env.DB, updated.professionalId)
  ])

  if (!service || !professional) {
    return c.json({ message: 'Dados do serviço ou profissional não encontrados.' }, 500)
  }

  const studioPhone = getStudioPhone(c.env)
  const whatsappLink = buildStudioToClientLink(updated, service, professional, 'confirmado')

  await triggerWhatsAppAutomation(c.env, 'confirmed', updated, service, professional)

  return c.json({ appointment: updated, whatsappLink })
})

app.post('/api/appointments/:id/cancel', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const appointmentId = c.req.param('id')
  const appointment = await getAppointment(c.env.DB, appointmentId)

  if (!appointment) {
    return c.json({ message: 'Agendamento não encontrado.' }, 404)
  }

  await c.env.DB
    .prepare(
      `UPDATE appointments
       SET status = 'cancelled',
           cancelled_at = CURRENT_TIMESTAMP,
           rebook_desired_date = NULL,
           rebook_desired_time = NULL,
           rebook_note = NULL,
           rebook_requested_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(appointmentId)
    .run()

  await logAppointmentHistory(c.env.DB, appointmentId, 'cancelled')

  const updated = await getAppointment(c.env.DB, appointmentId)
  if (!updated) {
    return c.json({ message: 'Não foi possível atualizar o agendamento.' }, 500)
  }

  const [service, professional] = await Promise.all([
    getService(c.env.DB, updated.serviceId),
    getProfessional(c.env.DB, updated.professionalId)
  ])

  if (service && professional) {
    await triggerWhatsAppAutomation(c.env, 'cancelled', updated, service, professional)
  }

  return c.json({ appointment: updated })
})

app.patch('/api/appointments/:id/payment', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const body = (await c.req.json().catch(() => ({}))) as { paid?: boolean }
  const paid = Boolean(body.paid)

  // Update paid_at
  const paidAt = paid ? new Date().toISOString() : null

  await c.env.DB.prepare(
    `UPDATE appointments SET paid_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(paidAt, id).run()

  return c.json({ ok: true, paidAt })
})

app.post('/api/appointments/:id/notify', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const { success } = await c.env.DB
    .prepare('UPDATE appointments SET client_notified = TRUE WHERE id = ?')
    .bind(id)
    .run()

  if (!success) {
    return c.json({ message: 'Erro ao atualizar status de notificação.' }, 500)
  }

  const appointment = await getAppointment(c.env.DB, id)
  if (!appointment) return c.json({ message: 'Agendamento não encontrado.' }, 404)

  return c.json({ appointment })
})

app.delete('/api/appointments/:id', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const appointmentId = c.req.param('id')
  const appointment = await getAppointment(c.env.DB, appointmentId)

  if (!appointment) {
    return c.json({ message: 'Agendamento não encontrado.' }, 404)
  }

  await c.env.DB.prepare('DELETE FROM appointments WHERE id = ?').bind(appointmentId).run()

  return c.json({ message: 'Agendamento excluído com sucesso.' })
})

app.post('/api/appointments/:id/rebook-request', async (c) => {
  const appointmentId = c.req.param('id')
  const appointment = await getAppointment(c.env.DB, appointmentId)

  if (!appointment) {
    return c.json({ message: 'Agendamento não encontrado.' }, 404)
  }

  const body = (await c.req.json().catch(() => undefined)) as
    | {
      desiredDate?: string
      desiredTime?: string
      note?: string
    }
    | undefined

  if (!body?.desiredDate || !body.desiredTime) {
    return c.json({ message: 'Informe a nova data e horário desejados para solicitar reagendamento.' }, 400)
  }

  await c.env.DB
    .prepare(
      `UPDATE appointments
       SET status = 'rebook_requested',
           rebook_desired_date = ?,
           rebook_desired_time = ?,
           rebook_note = ?,
           rebook_requested_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(body.desiredDate, body.desiredTime, body.note?.trim() || null, appointmentId)
    .run()

  await logAppointmentHistory(c.env.DB, appointmentId, 'rebook_requested', {
    desiredDate: body.desiredDate,
    desiredTime: body.desiredTime
  })

  const updated = await getAppointment(c.env.DB, appointmentId)
  if (!updated) {
    return c.json({ message: 'Não foi possível atualizar o agendamento.' }, 500)
  }

  return c.json({ appointment: updated })
})

app.post('/api/appointments/:id/rebook-approve', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const appointmentId = c.req.param('id')
  const appointment = await getAppointment(c.env.DB, appointmentId)

  if (!appointment) {
    return c.json({ message: 'Agendamento não encontrado.' }, 404)
  }

  const body = (await c.req.json().catch(() => undefined)) as
    | {
      date?: string
      time?: string
    }
    | undefined

  if (!body?.date || !body.time) {
    return c.json({ message: 'Informe a nova data e horário para aprovar o reagendamento.' }, 400)
  }

  const service = await getService(c.env.DB, appointment.serviceId)

  if (!service) {
    return c.json({ message: 'Serviço não encontrado.' }, 404)
  }

  const endTime = addMinutesToTime(body.time, service.durationMinutes)

  const context = await getSchedulingContext(c.env.DB, appointment.professionalId, body.date)
  const slotStatus = isSlotBookable({
    context,
    startTime: body.time,
    endTime,
    ignoreAppointmentId: appointmentId
  })

  if (!slotStatus.available) {
    return c.json({ message: 'Horário indisponível para reagendamento. Escolha outro horário.' }, 409)
  }

  await c.env.DB
    .prepare(
      `UPDATE appointments
        SET date = ?,
            start_time = ?,
            end_time = ?,
            status = 'confirmed',
            is_rescheduled = TRUE,
            rebook_desired_date = NULL,
            rebook_desired_time = NULL,
            rebook_note = NULL,
           rebook_requested_at = NULL,
           confirmed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(body.date, body.time, endTime, appointmentId)
    .run()

  await logAppointmentHistory(c.env.DB, appointmentId, 'rebook_approved', {
    date: body.date,
    time: body.time
  })

  const updated = await getAppointment(c.env.DB, appointmentId)
  if (!updated) {
    return c.json({ message: 'Não foi possível atualizar o agendamento.' }, 500)
  }

  const professional = await getProfessional(c.env.DB, updated.professionalId)
  if (!professional) {
    return c.json({ message: 'Profissional não encontrada.' }, 500)
  }

  const studioPhone = getStudioPhone(c.env)
  const whatsappLink = buildStudioToClientLink(updated, service, professional, 'reagendado e confirmado')

  await triggerWhatsAppAutomation(c.env, 'rebook_approved', updated, service, professional)

  return c.json({ appointment: updated, whatsappLink })
})

app.get('/api/professionals/:id/schedule', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const professionalId = c.req.param('id')
  const professional = await getProfessional(c.env.DB, professionalId)
  if (!professional) {
    return c.json({ message: 'Profissional não encontrada.' }, 404)
  }

  const [availability, timeOff] = await Promise.all([
    listWeeklyAvailability(c.env.DB, professionalId),
    listTimeOffForProfessional(c.env.DB, professionalId)
  ])

  return c.json({ professionalId, availability, timeOff })
})

app.put('/api/professionals/:id/schedule', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const professionalId = c.req.param('id')
  const professional = await getProfessional(c.env.DB, professionalId)
  if (!professional) {
    return c.json({ message: 'Profissional não encontrada.' }, 404)
  }

  const body = (await c.req.json().catch(() => undefined)) as
    | {
      availability?: Array<{ weekday?: number; startTime?: string; endTime?: string; slotInterval?: number }>
    }
    | undefined

  if (!body || !Array.isArray(body.availability)) {
    return c.json({ message: 'Envie a lista de disponibilidade semanal para atualizar.' }, 400)
  }

  const sanitized: Array<{ weekday: number; startTime: string; endTime: string; slotInterval?: number }> = []

  for (const item of body.availability) {
    if (typeof item.weekday !== 'number') continue
    if (item.weekday < 0 || item.weekday > 6) {
      return c.json({ message: 'Dia da semana inválido.' }, 400)
    }
    if (!item.startTime || !item.endTime) {
      continue
    }
    if (!isValidTime(item.startTime) || !isValidTime(item.endTime)) {
      return c.json({ message: 'Formato de horário inválido. Utilize HH:MM.' }, 400)
    }
    if (timeToMinutes(item.endTime) <= timeToMinutes(item.startTime)) {
      return c.json({ message: 'Hora de término deve ser maior que a hora inicial.' }, 400)
    }
    sanitized.push({
      weekday: item.weekday,
      startTime: item.startTime,
      endTime: item.endTime,
      slotInterval: item.slotInterval && item.slotInterval > 0 ? item.slotInterval : 30
    })
  }

  await replaceProfessionalAvailability(c.env.DB, professionalId, sanitized)

  const [availability, timeOff] = await Promise.all([
    listWeeklyAvailability(c.env.DB, professionalId),
    listTimeOffForProfessional(c.env.DB, professionalId)
  ])

  return c.json({ professionalId, availability, timeOff })
})

app.post('/api/professionals/:id/time-off', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const professionalId = c.req.param('id')
  const professional = await getProfessional(c.env.DB, professionalId)
  if (!professional) {
    return c.json({ message: 'Profissional não encontrada.' }, 404)
  }

  const body = (await c.req.json().catch(() => undefined)) as
    | {
      date?: string
      startTime?: string
      endTime?: string
      note?: string
    }
    | undefined

  if (!body?.date || !body.startTime || !body.endTime) {
    return c.json({ message: 'Informe data, horário inicial e final para o bloqueio.' }, 400)
  }

  if (!isValidDate(body.date)) {
    return c.json({ message: 'Formato de data inválido. Utilize AAAA-MM-DD.' }, 400)
  }

  if (!isValidTime(body.startTime) || !isValidTime(body.endTime)) {
    return c.json({ message: 'Formato de horário inválido. Utilize HH:MM.' }, 400)
  }

  if (timeToMinutes(body.endTime) <= timeToMinutes(body.startTime)) {
    return c.json({ message: 'Hora de término deve ser maior que a hora inicial.' }, 400)
  }

  await createTimeOffBlock(c.env.DB, professionalId, {
    date: body.date,
    startTime: body.startTime,
    endTime: body.endTime,
    note: body.note?.trim()
  })

  const timeOff = await listTimeOffForProfessional(c.env.DB, professionalId)
  return c.json({ professionalId, timeOff })
})

app.delete('/api/professionals/:id/time-off/:timeOffId', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const professionalId = c.req.param('id')
  const professional = await getProfessional(c.env.DB, professionalId)
  if (!professional) {
    return c.json({ message: 'Profissional não encontrada.' }, 404)
  }

  const timeOffId = Number(c.req.param('timeOffId'))
  if (!Number.isFinite(timeOffId)) {
    return c.json({ message: 'Identificador de bloqueio inválido.' }, 400)
  }

  await deleteTimeOffBlock(c.env.DB, professionalId, timeOffId)
  const timeOff = await listTimeOffForProfessional(c.env.DB, professionalId)
  return c.json({ professionalId, timeOff })
})

app.get('/api/clients', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const search = c.req.query('search')
  const clients = await listClients(c.env.DB, search)
  return c.json({ clients })
})

app.post('/api/clients', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const body = await c.req.json().catch(() => ({})) as any
  if (!body.name || !body.phone) {
    return c.json({ message: 'Nome e telefone são obrigatórios.' }, 400)
  }

  try {
    const client = await createClient(c.env.DB, {
      name: body.name,
      phone: normalizePhone(body.phone),
      cpf: body.cpf,
      notes: body.notes,
      procedureId: body.procedureId,
      avgTimeMinutes: body.avgTimeMinutes ? Number(body.avgTimeMinutes) : undefined
    })
    return c.json({ client })
  } catch (error) {
    return c.json({ message: 'Erro ao criar cliente.' }, 500)
  }
})

app.put('/api/clients/:id', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({})) as any

  try {
    const client = await updateClient(c.env.DB, id, {
      name: body.name,
      phone: body.phone ? normalizePhone(body.phone) : undefined,
      cpf: body.cpf,
      notes: body.notes,
      procedureId: body.procedureId,
      avgTimeMinutes: body.avgTimeMinutes ? Number(body.avgTimeMinutes) : undefined
    })

    if (!client) return c.json({ message: 'Cliente não encontrado.' }, 404)
    return c.json({ client })
  } catch (error) {
    return c.json({ message: 'Erro ao atualizar cliente.' }, 500)
  }
})

app.delete('/api/clients/:id', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  await deleteClient(c.env.DB, id)
  return c.json({ success: true })
})

const LandingPage = ({
  services,
  professionals,
  studioPhone
}: {
  services: Service[]
  professionals: Professional[]
  studioPhone: string
}) => (
  <div className="relative isolate overflow-hidden">
    <div className="pointer-events-none absolute inset-x-0 -top-64 -z-10 flex justify-center opacity-70">
      <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-br from-brand-400 via-pink-500/80 to-fuchsia-600 blur-3xl" />
    </div>
    <header className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 pb-16 pt-12 md:flex-row md:items-center md:justify-between">
      <div className="max-w-xl space-y-6">
        <span className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1 text-sm font-medium text-pink-200">
          Estúdio Aline Andrade
        </span>
        <h1 className="font-display text-4xl leading-tight text-white md:text-5xl">
          Elegância nas suas mãos com agendamento online para o seu momento de beleza
        </h1>
        <p className="text-lg text-slate-200/80">
          Reserve experiências premium em nail design, alongamento em gel, blindagem e spa das mãos com a equipe especializada do estúdio.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="#agendar"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 via-pink-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold shadow-glow transition hover:from-brand-400 hover:via-pink-400 hover:to-fuchsia-400"
          >
            Reservar horário agora
          </a>
          <a
            href={`https://wa.me/${studioPhone}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40"
          >
            <svg aria-hidden className="h-4 w-4 text-pink-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 6.75c0 7.18 5.82 13 13 13h1.5a2.25 2.25 0 0 0 2.25-2.25v-1.31a1.5 1.5 0 0 0-1.307-1.488l-2.68-.38a1.5 1.5 0 0 0-1.137.331l-.9.75a11.048 11.048 0 0 1-4.878-4.878l.75-.9a1.5 1.5 0 0 0 .331-1.137l-.38-2.68A1.5 1.5 0 0 0 6.56 4.5H5.25A2.25 2.25 0 0 0 3 6.75v0z"
              />
            </svg>
            Falar no WhatsApp
          </a>
        </div>
      </div>
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Destaques da semana</h2>
        <ul className="mt-4 space-y-4 text-sm text-slate-200/80">
          {services.slice(0, 3).map((service) => (
            <li key={service.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-semibold text-white">{service.name}</p>
              <p className="mt-1 text-sm text-slate-200/70">{service.description}</p>
              <p className="mt-3 text-sm font-semibold text-pink-200">
                {formatPrice(service.priceCents)} · {Math.round(service.durationMinutes)} minutos
              </p>
            </li>
          ))}
        </ul>
      </div>
    </header>

    <main className="mx-auto w-full max-w-6xl space-y-24 px-6 pb-24">
      <section
        id="agendar"
        className="grid gap-12 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur lg:grid-cols-[1.1fr_0.9fr]"
      >
        <div>
          <h2 className="font-display text-3xl text-white">Reserve seu horário</h2>
          <p className="mt-3 max-w-xl text-base text-slate-200/70">
            Escolha o serviço, a profissional e o melhor horário. Enviaremos a solicitação para confirmação via WhatsApp.
          </p>

          <form id="bookingForm" className="mt-8 grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="serviceSelect">
                Serviço desejado
              </label>
              <select
                id="serviceSelect"
                required
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-300/80"
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="professionalSelect">
                Profissional
              </label>
              <select
                id="professionalSelect"
                required
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-300/80"
              >
                <option value="">Selecione a profissional</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="dateInput">
                  Data
                </label>
                <input
                  type="date"
                  id="dateInput"
                  required
                  className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-300/80"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="timeSelect">
                  Horário
                </label>
                <select
                  id="timeSelect"
                  required
                  className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-300/80"
                >
                  <option value="">Selecione um horário disponível</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customerName">
                Seu nome completo
              </label>
              <input
                id="customerName"
                type="text"
                required
                placeholder="Como devemos te chamar?"
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-pink-300/80"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customerPhone">
                WhatsApp para confirmação
              </label>
              <input
                id="customerPhone"
                type="tel"
                required
                placeholder="Ex: 47 99151-8816"
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-pink-300/80"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customerEmail">
                E-mail (opcional)
              </label>
              <input
                id="customerEmail"
                type="email"
                placeholder="Para receber lembretes"
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-pink-300/80"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customerNotes">
                Observações (opcional)
              </label>
              <textarea
                id="customerNotes"
                rows={3}
                placeholder="Alguma preferência, referências de nail art ou alergia?"
                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-400 outline-none transition focus:border-pink-300/80"
              />
            </div>

            <div className="rounded-2xl border border-pink-300/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-100" id="availabilityInfo">
              Selecione a data para ver os horários disponíveis com a profissional escolhida.
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 via-pink-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:from-brand-400 hover:via-pink-400 hover:to-fuchsia-400"
            >
              Enviar pedido de agendamento
            </button>
            <div id="bookingAlert" className="hidden rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert" />
          </form>

          <div
            id="bookingSummary"
            className="mt-10 hidden rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-sm text-slate-200"
          >
            <h3 className="text-lg font-semibold text-white">Sua solicitação foi enviada!</h3>
            <p className="mt-2 text-slate-300">
              Enviamos os dados para a equipe via painel interno. A confirmação final chega pelo WhatsApp em até 30 minutos.
            </p>
            <dl className="mt-4 grid gap-3 text-slate-200/80 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide">Código do agendamento</dt>
                <dd className="font-semibold text-white" data-summary="code" />
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Profissional</dt>
                <dd className="font-semibold text-white" data-summary="professional" />
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Serviço</dt>
                <dd className="font-semibold text-white" data-summary="service" />
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Data e horário</dt>
                <dd className="font-semibold text-white" data-summary="datetime" />
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-4">
              <button
                id="summaryWhatsapp"
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500/90 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Abrir conversa no WhatsApp
              </button>
              <button
                id="summaryNewBooking"
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/40"
              >
                Fazer um novo agendamento
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
            <h3 className="font-semibold text-white">Nossa equipe especializada</h3>
            <ul className="mt-6 space-y-5">
              {professionals.map((professional) => (
                <li key={professional.id} className="flex items-start gap-4 rounded-2xl border border-white/5 bg-white/5 p-4">
                  <span
                    className={`mt-1 inline-flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-to-br ${professional.avatarColor} text-sm font-semibold text-white`}
                    aria-hidden
                  >
                    {initials(professional.name)}
                  </span>
                  <div>
                    <p className="font-semibold text-white">{professional.name}</p>
                    <p className="text-xs uppercase tracking-wide text-pink-200/80">{professional.role}</p>
                    <p className="mt-2 text-sm text-slate-200/70">{professional.bio}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-pink-300/40 bg-pink-500/10 p-6">
            <h3 className="font-semibold text-white">Precisa reagendar?</h3>
            <p className="mt-2 text-sm text-pink-50/80">
              Informe o código do agendamento e solicite uma nova data. A equipe retorna confirmando pelo WhatsApp.
            </p>
            <form id="rebookForm" className="mt-4 grid gap-3 text-sm">
              <input
                id="rebookCode"
                type="text"
                placeholder="Código do agendamento"
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-300 outline-none focus:border-white/40"
                required
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  id="rebookDate"
                  type="date"
                  className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-white/40"
                  required
                />
                <input
                  id="rebookTime"
                  type="time"
                  className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none focus:border-white/40"
                  required
                />
              </div>
              <textarea
                id="rebookNote"
                rows={2}
                placeholder="Conte o motivo (opcional)"
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder:text-slate-300 outline-none focus:border-white/40"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 font-semibold text-slate-900 transition hover:bg-pink-100"
              >
                Solicitar reagendamento
              </button>
              <p id="rebookFeedback" className="hidden rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white" />
            </form>
          </div>
        </aside>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-3xl text-white">Experiências exclusivas</h2>
        <p className="max-w-3xl text-base text-slate-200/70">
          Cada sessão é pensada para entregar conforto, atenção aos detalhes e resultados duradouros. Conheça nossos serviços e escolha o ideal para o seu momento.
        </p>
        <div id="servicesGrid" className="grid gap-6 md:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.id}
              className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-pink-400/50 hover:bg-pink-500/10"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">{service.name}</h3>
                <span className="rounded-full border border-pink-400/40 bg-pink-500/10 px-3 py-1 text-xs text-pink-100">
                  {Math.round(service.durationMinutes)} min
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-200/70">{service.description}</p>
              <p className="mt-4 text-base font-semibold text-pink-200">
                {formatPrice(service.priceCents)}
              </p>
              <p className="mt-3 text-xs text-slate-200/60">
                Profissionais:{' '}
                {service.professionalIds
                  .map((id) => professionals.find((p) => p.id === id)?.name)
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>

    <footer className="border-t border-white/10 bg-slate-950/80 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Estúdio Aline Andrade · Nail Designer</p>
        <div className="flex flex-wrap gap-4 text-sm">
          <a className="text-slate-300 transition hover:text-white" href={`https://wa.me/${studioPhone}`} target="_blank" rel="noreferrer">
            WhatsApp: (47) 99151-8816
          </a>
          <a className="text-slate-300 transition hover:text-white" href="#agendar">
            Agendar horário
          </a>
          <a className="text-slate-300 transition hover:text-white" href="/login">
            Painel interno
          </a>
        </div>
      </div>
    </footer>

    <script
      id="bootstrap-data"
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ services, professionals, studioPhone })
      }}
    />
  </div>
)

const DashboardPage = ({
  services,
  professionals,
  studioPhone,
  panelProtected
}: {
  services: Service[]
  professionals: Professional[]
  studioPhone: string
  panelProtected: boolean
}) => {
  const weekdayOptions = [
    { label: 'Domingo', value: 0 },
    { label: 'Segunda-feira', value: 1 },
    { label: 'Terça-feira', value: 2 },
    { label: 'Quarta-feira', value: 3 },
    { label: 'Quinta-feira', value: 4 },
    { label: 'Sexta-feira', value: 5 },
    { label: 'Sábado', value: 6 }
  ]

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl space-y-12 px-6 py-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-pink-300/80">Painel Operacional</p>
          <h1 className="font-display text-3xl text-white">Agenda do Estúdio</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Acompanhe solicitações pendentes, confirme horários, gerencie reagendamentos e acione os clientes diretamente pelo WhatsApp.
          </p>
          {panelProtected ? (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
              <span aria-hidden>🔒</span> Acesso protegido por token administrativo
            </p>
          ) : (
            <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
              <span aria-hidden>⚠️</span> Configure um token em PANEL_TOKEN para proteger este painel
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <p className="text-xs uppercase tracking-wide text-slate-300/80">Contato rápido</p>
            <a
              className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-pink-200 transition hover:text-pink-100"
              href={`https://wa.me/${studioPhone}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir WhatsApp geral do estúdio
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-white">

            {/* Navigation Group */}
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <a
                href="/financeiro"
                className="flex-1 whitespace-nowrap rounded-full border border-white/10 px-4 py-2 text-center transition hover:bg-white/5 sm:flex-none"
              >
                Financeiro
              </a>
              <a
                href="/clients"
                className="flex-1 whitespace-nowrap rounded-full border border-white/10 px-4 py-2 text-center transition hover:bg-white/5 sm:flex-none"
              >
                Gerenciar Clientes
              </a>
            </div>

            {/* Action Group */}
            <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
              <button
                id="newAppointmentBtn"
                className="flex-auto whitespace-nowrap rounded-full bg-pink-600 px-5 py-2 text-center shadow-lg transition hover:bg-pink-500 sm:flex-none"
              >
                Novo Agendamento
              </button>
              <button
                id="logoutBtn"
                className="rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2 text-center text-red-200 transition hover:bg-red-500 hover:text-white sm:flex-none"
              >
                Sair
              </button>
            </div>

          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-white">Calendário de Agendamentos</h2>
            <div className="flex items-center justify-center gap-3">
              <button id="prevMonth" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10">
                ←
              </button>
              <span id="currentMonthLabel" className="min-w-[140px] text-center text-base font-medium text-white"></span>
              <button id="nextMonth" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10">
                →
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-container">
            {/* Weekday Headers */}
            <div className="mb-3 grid grid-cols-7 gap-2 text-center">
              {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                <div key={day} className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div id="calendarDays" className="grid grid-cols-7 gap-2"></div>
          </div>

          {/* Selected Date Display */}
          <div id="selectedDateDisplay" className="mt-6 hidden flex-row items-center justify-between rounded-xl border border-pink-500/20 bg-pink-500/10 px-4 py-3 text-sm text-pink-200">
            <span>Filtrando por: <strong id="selectedDateValue"></strong></span>
            <button id="clearDateFilter" className="text-xs underline transition hover:text-white">Limpar filtro</button>
          </div>
        </section>

        <section className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-semibold text-white">Solicitações e agendamentos</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <label htmlFor="statusFilter" className="text-slate-300">
                Filtrar por status
              </label>
              <select
                id="statusFilter"
                className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="confirmed">Confirmados</option>
                <option value="rebook_requested">Reagendamento solicitado</option>
                <option value="cancelled">Cancelados</option>
              </select>
              <button
                id="refreshAppointments"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/30"
                type="button"
              >
                Atualizar lista
              </button>
            </div>
          </div>

          <div id="appointmentsEmpty" className="mt-10 hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            Nenhum agendamento encontrado para o filtro selecionado.
          </div>

          <div id="appointmentsList" className="mt-8 grid gap-4 max-h-[600px] overflow-y-auto pr-2" />
        </section>
      </div>

      <section className="rounded-3xl border border-pink-400/30 bg-pink-500/10 p-6 text-sm text-pink-50/90">
        <h2 className="text-lg font-semibold text-white">Como usar o painel</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <strong>Pendentes:</strong> confirme ou cancele conforme alinhamento com o cliente.
          </li>
          <li>
            <strong>Reagendamento solicitado:</strong> utilize o modal para definir nova data/horário antes de confirmar.
          </li>
          <li>
            <strong>WhatsApp:</strong> use os botões "Abrir WhatsApp" para contato imediato com mensagem pronta.
          </li>
          <li>Os horários cancelados ficam livres imediatamente para novas reservas.</li>
        </ul>
      </section>

      <section id="scheduleSection" className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="font-semibold text-white">Agenda personalizada por profissional</h2>
            <p className="text-sm text-slate-300">
              Ajuste a grade semanal de horários e bloqueios pontuais de cada profissional. Os horários disponíveis no site são gerados a partir dessas configurações.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="scheduleProfessionalSelect" className="text-sm text-slate-300">
              Profissional
            </label>
            <select
              id="scheduleProfessionalSelect"
              className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
            >
              {professionals.map((professional) => (
                <option key={professional.id} value={professional.id}>
                  {professional.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="grid gap-2">
              <label htmlFor="scheduleInterval" className="text-sm font-medium text-slate-200">
                Intervalo padrão entre horários (minutos)
              </label>
              <input
                id="scheduleInterval"
                type="number"
                min={15}
                step={5}
                defaultValue={30}
                className="w-32 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-300/80"
              />
            </div>

            <form id="availabilityForm" className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                  <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                    <tr>
                      <th className="px-4 py-3 text-left">Dia</th>
                      <th className="px-4 py-3 text-left">Início</th>
                      <th className="px-4 py-3 text-left">Fim</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {weekdayOptions.map((day) => (
                      <tr key={day.value} data-weekday={day.value} className="divide-x divide-white/5">
                        <td className="bg-white/5 px-4 py-3 font-medium text-white">{day.label}</td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            data-role="start"
                            className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="time"
                            data-role="end"
                            className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            data-role="clear"
                            className="text-xs font-semibold text-slate-300 transition hover:text-white"
                          >
                            Sem atendimento
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </form>

            <div id="availabilityFeedback" className="hidden rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-50" />

            <div className="flex justify-end">
              <button
                id="saveAvailability"
                type="button"
                className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
              >
                Salvar grade semanal
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Adicionar bloqueio pontual</h3>
              <form id="timeOffForm" className="mt-3 grid gap-3 text-sm">
                <input
                  id="timeOffDate"
                  type="date"
                  className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    id="timeOffStart"
                    type="time"
                    className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                    required
                  />
                  <input
                    id="timeOffEnd"
                    type="time"
                    className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                    required
                  />
                </div>
                <textarea
                  id="timeOffNote"
                  rows={2}
                  placeholder="Motivo do bloqueio (opcional)"
                  className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-pink-300/80"
                />
                <button
                  type="submit"
                  className="rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
                >
                  Cadastrar bloqueio
                </button>
              </form>
              <p id="timeOffFeedback" className="hidden mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-50" />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">Bloqueios programados</h3>
              <div id="timeOffList" className="mt-3 space-y-3 text-sm text-slate-200">
                <p className="text-xs text-slate-400">
                  Nenhum bloqueio cadastrado.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div id="authModal" className="modal-backdrop hidden" data-modal="auth" aria-hidden="true">
        <div className="modal-panel">
          <form id="authForm" className="grid gap-4 text-slate-900">
            <h2 className="text-lg font-semibold text-slate-900">Autenticação do painel</h2>
            <p className="text-sm text-slate-600">
              Informe o token administrativo configurado na variável <code className="rounded bg-slate-200 px-1">PANEL_TOKEN</code>.
            </p>
            <input
              id="authToken"
              type="password"
              placeholder="Token administrativo"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-pink-500"
              required
            />
            <p id="authFeedback" className="hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600" />
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                id="authCancel"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="rebookModal" className="modal-backdrop hidden" data-modal="rebook" aria-hidden="true">
        <div className="modal-panel">
          <form id="rebookModalForm" className="grid gap-4 text-slate-900">
            <h2 className="text-lg font-semibold text-slate-900">Aprovar reagendamento</h2>
            <p className="text-sm text-slate-600">
              Escolha a nova data e o horário disponível para confirmar o reagendamento.
            </p>
            <input
              type="date"
              id="rebookModalDate"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-pink-500"
              required
            />
            <select
              id="rebookModalTime"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-pink-500"
              required
            >
              <option value="">Selecione um horário disponível</option>
            </select>
            <p id="rebookModalAvailability" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600" />
            <p id="rebookModalFeedback" className="hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600" />
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                id="rebookModalCancel"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
              >
                Aprovar reagendamento
              </button>
            </div>
          </form>
        </div>
      </div>

      <script
        id="bootstrap-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ services, professionals, studioPhone, panelProtected })
        }}
      />
      {/* Booking Modal via Admin */}
      <div id="bookingModal" className="fixed inset-0 z-50 flex hidden items-center justify-center bg-black/80 backdrop-blur-sm" aria-hidden="true">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#1e293b] p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Novo Agendamento Interno</h2>
            <button id="closeBookingModal" className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white">
              <span className="sr-only">Fechar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form id="bookingForm" className="grid gap-5">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="serviceSelect">
                Serviço
              </label>
              <select
                id="serviceSelect"
                required
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-500"
              >
                <option value="">Selecione um serviço</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="professionalSelect">
                Profissional
              </label>
              <select
                id="professionalSelect"
                required
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-500"
              >
                <option value="">Selecione a profissional</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="dateInput">
                  Data
                </label>
                <input
                  type="date"
                  id="dateInput"
                  required
                  className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-500"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-slate-200" htmlFor="timeSelect">
                  Horário
                </label>
                <select
                  id="timeSelect"
                  required
                  className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-500"
                >
                  <option value="">Selecione um horário disponível</option>
                </select>
              </div>
            </div>

            {/* Client Lookup Section will be injected here by app.js logic */}

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customerName">
                Nome do Cliente
              </label>
              <input
                id="customerName"
                type="text"
                required
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customerPhone">
                WhatsApp
              </label>
              <input
                id="customerPhone"
                type="tel"
                required
                placeholder="Ex: 47 99151-8816"
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customerEmail">
                E-mail (opcional)
              </label>
              <input
                id="customerEmail"
                type="email"
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-slate-200" htmlFor="customerNotes">
                Observações
              </label>
              <textarea
                id="customerNotes"
                rows={2}
                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
              />
            </div>

            <div className="rounded-2xl border border-pink-300/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-100" id="availabilityInfo">
              Selecione a data para ver os horários disponíveis.
            </div>

            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-pink-500"
            >
              Confirmar Agendamento
            </button>
            <div id="bookingAlert" className="hidden rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert" />
          </form>
        </div>
      </div>

      <script
        id="bootstrap-data"
        type="application/json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({ services, professionals, studioPhone, panelProtected })
        }}
      />
    </div>
  )
}

function getStudioPhone(env: Bindings): string {
  const phone = env.STUDIO_PHONE?.replace(/\D/g, '')
  return phone && phone.length >= 10 ? phone : DEFAULT_STUDIO_PHONE
}

async function getCatalog(db: D1Database): Promise<CatalogData> {
  const [services, professionals] = await Promise.all([listServices(db), listProfessionals(db)])
  return { services, professionals }
}

async function listServices(db: D1Database): Promise<Service[]> {
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

async function listProfessionals(db: D1Database): Promise<Professional[]> {
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

async function getService(db: D1Database, id: string): Promise<Service | undefined> {
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

async function getProfessional(db: D1Database, id: string): Promise<Professional | undefined> {
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

async function listAppointments(db: D1Database, status?: string | null): Promise<Appointment[]> {
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

async function getAppointment(db: D1Database, id: string): Promise<Appointment | undefined> {
  const row = await db.prepare(`SELECT * FROM appointments WHERE id = ?`).bind(id).first<AppointmentRow>()
  return row ? mapAppointmentRow(row) : undefined
}

async function fetchAppointmentsForProfessional(
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

function mapAppointmentRow(row: AppointmentRow): Appointment {
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

function getWeekdayFromDate(date: string): number {
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

async function getSchedulingContext(
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

  // If professional has configuration but no windows for this day, they are closed.
  // If they have NO configuration at all, we use the default fallback.
  const effectiveWindows = windows.length > 0
    ? windows
    : (hasConfig ? [] : [DEFAULT_AVAILABILITY_WINDOW])

  return {
    windows: effectiveWindows,
    timeOff,
    appointments
  }
}

async function listAvailabilityWindows(
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

async function listTimeOffBlocks(
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

async function listWeeklyAvailability(db: D1Database, professionalId: string): Promise<Array<{ id: number; weekday: number; startTime: string; endTime: string; slotInterval: number }>> {
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

async function listTimeOffForProfessional(db: D1Database, professionalId: string): Promise<Array<{ id: number; date: string; startTime: string; endTime: string; note?: string }>> {
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

async function replaceProfessionalAvailability(
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

async function createTimeOffBlock(
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

async function deleteTimeOffBlock(db: D1Database, professionalId: string, timeOffId: number): Promise<void> {
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

function computeAvailability({ duration, context, ignoreAppointmentId }: ComputeAvailabilityParams): AvailabilitySlot[] {
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

function isSlotBookable({ context, startTime, endTime, ignoreAppointmentId }: SlotBookableParams): SlotBookability {
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

function enumerateSlots(start: string, end: string, interval: number): string[] {
  const slots: string[] = []
  let current = start
  while (timeToMinutes(current) < timeToMinutes(end)) {
    slots.push(current)
    current = addMinutesToTime(current, interval)
  }
  return slots
}

function isWithinWindows(startTime: string, endTime: string, windows: AvailabilityWindow[]): boolean {
  return windows.some((window) => {
    return timeToMinutes(startTime) >= timeToMinutes(window.startTime) && timeToMinutes(endTime) <= timeToMinutes(window.endTime)
  })
}

function overlapsTimeOff(startTime: string, endTime: string, blocks: TimeOffBlock[]): boolean {
  return blocks.some((block) => rangesOverlap(startTime, endTime, block.startTime, block.endTime))
}

function isValidTime(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value)
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function addMinutesToTime(time: string, minutesToAdd: number): string {
  const total = timeToMinutes(time) + minutesToAdd
  const newHours = Math.floor(total / 60)
  const newMinutes = total % 60
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}

function rangesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = timeToMinutes(startA)
  const aEnd = timeToMinutes(endA)
  const bStart = timeToMinutes(startB)
  const bEnd = timeToMinutes(endB)
  return aStart < bEnd && bStart < aEnd
}

async function logAppointmentHistory(db: D1Database, appointmentId: string, event: string, payload?: unknown) {
  await db
    .prepare(
      `INSERT INTO appointment_history (appointment_id, event_type, payload) VALUES (?, ?, ?)`
    )
    .bind(appointmentId, event, payload ? JSON.stringify(payload) : null)
    .run()
}

function buildStudioToClientLink(
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

function buildStudioToClientMessage(
  appointment: Appointment,
  service: Service,
  professional: Professional,
  statusLabel: string
): string {
  const dateTime = new Date(`${appointment.date}T${appointment.time}:00`)
  const formattedDate = dateTime.toLocaleDateString('pt-BR')
  const formattedTime = appointment.time

  const lines = [
    `Olá ${appointment.customerName}, aqui é do Estúdio Aline Andrade!`,
    '',
    `Seu agendamento para *${service.name}* com *${professional.name}* está *${statusLabel}*.`,
    '',
    `Data: ${formattedDate}`,
    `Horário: ${formattedTime}`,
    `Código: ${appointment.id}`,
    '',
    'Te esperamos lá!'
  ]

  return lines.join('\n')
}

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '')
}

function normalizeE164(phone: string): string | null {
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

async function triggerWhatsAppAutomation(
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

function buildAutomationMessage(
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

async function enforcePanelAuth(c: Context<any>) {
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

function formatPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const LoginPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
    <div className="w-full max-w-sm space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-white">Estúdio Aline Andrade</h2>
        <p className="mt-2 text-sm text-slate-400">Área restrita para equipe</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
        <form id="loginForm" className="space-y-6">
          <div>
            <label htmlFor="user" className="block text-sm font-medium text-slate-300">
              Usuário
            </label>
            <div className="mt-2">
              <input
                id="user"
                name="user"
                type="text"
                required
                className="block w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="Nome de usuário"
              />
            </div>
          </div>

          <div>
            <label htmlFor="pass" className="block text-sm font-medium text-slate-300">
              Senha
            </label>
            <div className="mt-2">
              <input
                id="pass"
                name="pass"
                type="password"
                required
                className="block w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-0 sm:text-sm sm:leading-6"
                placeholder="Sua senha"
              />
            </div>
          </div>

          <div id="loginFeedback" className="hidden rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200"></div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-full bg-pink-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
            >
              Entrar no painel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)



const ClientsPage = () => (
  <div className="mx-auto min-h-screen w-full max-w-6xl space-y-12 px-6 py-12">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-pink-300/80">Painel Operacional</p>
        <h1 className="font-display text-3xl text-white">Gerenciar Clientes</h1>
        <p className="mt-2 text-sm text-slate-300">
          Cadastre e edite informações dos clientes para agilizar os agendamentos.
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href="/painel"
          className="rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
        >
          Voltar ao painel
        </a>
        <button
          id="addClientBtn"
          className="rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-pink-500"
        >
          Novo Cliente
        </button>
      </div>
    </header>

    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex gap-4">
        <input
          id="clientSearch"
          type="text"
          placeholder="Buscar por nome, telefone ou CPF..."
          className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-500"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="min-w-full divide-y divide-white/10 text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left">Nome</th>
              <th className="px-4 py-3 text-left">Telefone</th>
              <th className="px-4 py-3 text-left">Observações</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody id="clientsList" className="divide-y divide-white/5 text-slate-300">
            {/* Rows injected by JS */}
          </tbody>
        </table>
      </div>
    </div>

    {/* Client Modal */}
    <div id="clientModal" className="fixed inset-0 z-50 flex hidden items-center justify-center bg-black/80 backdrop-blur-sm" aria-hidden="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <form id="clientForm" className="grid gap-4 text-slate-900">
          <h2 id="clientModalTitle" className="text-lg font-semibold text-slate-900">Novo Cliente</h2>

          <input type="hidden" id="clientId" />

          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700">Nome Completo</label>
            <input id="clientName" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700">CPF (Opcional)</label>
            <input id="clientCPF" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="000.000.000-00" />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700">Telefone (WhatsApp)</label>
            <input id="clientPhone" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="Apenas números com DDD" />
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700">Procedimento Padrão (Opcional)</label>
            <select id="clientProcedure" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500">
              <option value="">Selecione...</option>
              {/* Options injected by JS */}
            </select>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700">Tempo Médio Personalizado (minutos)</label>
            <input id="clientAvgTime" type="number" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="Deixe vazio para usar o tempo do serviço" />
            <p className="text-[10px] text-slate-500">Defina se este cliente tem um tempo de atendimento diferente do padrão.</p>
          </div>

          <div className="grid gap-1">
            <label className="text-sm font-medium text-slate-700">Observações Internas</label>
            <textarea id="clientNotes" rows={3} className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500"></textarea>
          </div>

          <p id="clientFeedback" className="hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600"></p>

          <div className="mt-4 flex justify-end gap-3">
            <button type="button" id="clientCancel" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-500">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  </div>
)

const FinancialPage = () => (
  <div className="mx-auto min-h-screen w-full max-w-6xl space-y-12 px-6 py-12">
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-pink-300/80">Painel Operacional</p>
        <h1 className="font-display text-3xl text-white">Controle Financeiro</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Acompanhe os pagamentos dos agendamentos confirmados e gerencie o fluxo de caixa.
        </p>
      </div>
      <div className="flex gap-3">
        <a
          href="/painel"
          className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
        >
          Voltar ao Painel
        </a>
      </div>
    </header>

    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-wide text-green-300/80">Total Recebido</p>
        <p id="totalPaid" className="mt-2 text-3xl font-bold text-white">R$ 0,00</p>
        <p className="mt-1 text-sm text-slate-400">Referente aos agendamentos pagos no período.</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-wide text-amber-300/80">Pendente de Pagamento</p>
        <p id="totalPending" className="mt-2 text-3xl font-bold text-white">R$ 0,00</p>
        <p className="mt-1 text-sm text-slate-400">Agendamentos confirmados mas ainda não pagos.</p>
      </div>
    </div>

    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-semibold text-white">Relatório de Recebimentos</h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            id="financialMonth"
            className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
          />
          <select
            id="financialProfessional"
            className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
          >
            <option value="">Todos os Profissionais</option>
            {/* Options injected by JS */}
          </select>
          <button
            id="generatePdfBtn"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-500"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Gerar PDF
          </button>
          <button
            id="refreshFinancial"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/30"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table id="financialTable" className="w-full text-left text-sm text-slate-300">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Serviço</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3 text-center">Status Pagamento</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody id="financialTableBody" className="divide-y divide-white/5">
            {/* Rows injected by JS */}
          </tbody>
        </table>
        <p id="financialEmpty" className="hidden py-8 text-center text-slate-400">Nenhum registro encontrado para este período.</p>
      </div>
    </section>
  </div>
)

async function listClients(db: D1Database, search?: string): Promise<Client[]> {
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

async function getClient(db: D1Database, id: string): Promise<Client | undefined> {
  const row = await db.prepare(`SELECT * FROM clients WHERE id = ?`).bind(id).first<ClientRow>()
  return row ? mapClientRow(row) : undefined
}

async function createClient(
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

async function updateClient(
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

async function deleteClient(db: D1Database, id: string): Promise<void> {
  await db.prepare(`DELETE FROM clients WHERE id = ?`).bind(id).run()
}

function mapClientRow(row: ClientRow): Client {
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

export default app
