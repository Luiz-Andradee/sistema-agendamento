import { Hono, type Context } from 'hono'
import { cors } from 'hono/cors'
import { renderer } from './renderer'
import type {
  Bindings,
  Variables,
  Professional,
  Service,
  AppointmentStatus,
  RebookRequest,
  Appointment,
  Client,
  AvailabilitySlot,
  AvailabilityWindow,
  TimeOffBlock,
  SchedulingContext,
  CatalogData,
  ServiceRow,
  ProfessionalRow,
  AppointmentRow,
  ClientRow,
  ProfessionalAvailabilityRow,
  ProfessionalTimeOffRow
} from './types'

import {
  getStudioPhone,
  getCatalog,
  listServices,
  listProfessionals,
  getService,
  getProfessional,
  listAppointments,
  getAppointment,
  fetchAppointmentsForProfessional,
  mapAppointmentRow,
  getSchedulingContext,
  listAvailabilityWindows,
  listTimeOffBlocks,
  listWeeklyAvailability,
  listTimeOffForProfessional,
  replaceProfessionalAvailability,
  createTimeOffBlock,
  deleteTimeOffBlock,
  computeAvailability,
  isSlotBookable,
  enumerateSlots,
  isWithinWindows,
  overlapsTimeOff,
  isValidTime,
  isValidDate,
  timeToMinutes,
  addMinutesToTime,
  rangesOverlap,
  logAppointmentHistory,
  buildStudioToClientLink,
  buildStudioToClientMessage,
  normalizePhone,
  normalizeE164,
  triggerWhatsAppAutomation,
  buildAutomationMessage,
  enforcePanelAuth,
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  mapClientRow,
  mapProfessionalRow,
  mapServiceRow
} from './utils/database'

import { DashboardPage } from './components/DashboardPage'
import { LoginPage } from './components/LoginPage'
import { ClientsPage } from './components/ClientsPage'
import { FinancialPage } from './components/FinancialPage'
import { EmployeesPage } from './components/EmployeesPage'
import { ServicesPage } from './components/ServicesPage'
import { formatPrice, initials } from './utils/formatters'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()



app.use('/api/*', cors())
app.use(renderer)

app.get('/', (c) => {
  return c.redirect('/login')
})

// Redirects from old routes to new hierarchical structure
app.get('/clients', (c) => {
  return c.redirect('/painel/clients')
})

app.get('/financeiro', (c) => {
  return c.redirect('/painel/financeiro')
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
      title: 'Painel · Estúdio Aline Andrade',
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


app.get('/painel/clients', (c) => {
  return (c as any).render(
    <ClientsPage />,
    {
      title: 'Clientes · Estúdio Aline Andrade',
      data: {
        page: 'clients',
        panelProtected: true
      }
    }
  )
})

app.get('/painel/financeiro', (c) => {
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

app.get('/painel/funcionarios', (c) => {
  return (c as any).render(
    <EmployeesPage />,
    {
      title: 'Funcionários · Estúdio Aline Andrade',
      data: {
        page: 'employees',
        panelProtected: true
      }
    }
  )
})

app.get('/painel/servicos', (c) => {
  return (c as any).render(
    <ServicesPage />,
    {
      title: 'Serviços · Estúdio Aline Andrade',
      data: {
        page: 'services',
        panelProtected: true
      }
    }
  )
})

app.get('/login', (c) => {
  return (c as any).render(
    <LoginPage />,
    {
      title: 'Login · Estúdio Aline Andrade',
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

  // Buscar usuário apenas por username
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?')
    .bind(body.username)
    .first<{ id: string; username: string; password: string }>()

  if (!user) {
    return c.json({ message: 'Credenciais inválidas.' }, 401)
  }

  // Verificar se a senha é hash bcrypt ou texto plano (compatibilidade durante migração)
  let isValid = false

  if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
    // Senha já está hasheada - verificar com bcrypt
    const bcrypt = await import('bcryptjs')
    isValid = await bcrypt.compare(body.password, user.password)
  } else {
    // Senha ainda em texto plano - comparação direta (temporário)
    isValid = user.password === body.password
  }

  if (!isValid) {
    return c.json({ message: 'Credenciais inválidas.' }, 401)
  }

  // Generate a simple session token (base64 of userId:timestamp) for client storage
  // In a robust app, store this in a sessions table or use signed JWT.
  const token = btoa(`${user.id}:${Date.now()}`)

  return c.json({ ok: true, token })
})


// Endpoint para redefinir senha com token
app.post('/api/auth/reset-password', async (c) => {
  const body = (await c.req.json().catch(() => undefined)) as {
    username?: string
    token?: string
    newPassword?: string
  } | undefined

  if (!body?.username || !body?.token || !body?.newPassword) {
    return c.json({ message: 'Informe usuário, token e nova senha.' }, 400)
  }

  // Buscar usuário
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ?')
    .bind(body.username)
    .first<{ id: string }>()

  if (!user) {
    return c.json({ message: 'Token inválido ou expirado.' }, 401)
  }

  // Verificar token
  const resetToken = await c.env.DB.prepare(
    `SELECT * FROM password_reset_tokens 
     WHERE user_id = ? AND token = ? AND used = 0 AND expires_at > ?`
  ).bind(user.id, body.token, Math.floor(Date.now() / 1000))
    .first<{ id: string }>()

  if (!resetToken) {
    return c.json({ message: 'Token inválido ou expirado.' }, 401)
  }

  // Hashear nova senha
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash(body.newPassword, 10)

  // Atualizar senha
  await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
    .bind(hashedPassword, user.id)
    .run()

  // Marcar token como usado
  await c.env.DB.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?')
    .bind(resetToken.id)
    .run()

  return c.json({ ok: true, message: 'Senha redefinida com sucesso!' })
})

// Endpoint para redefinir senha com CPF (método simplificado)
app.post('/api/auth/reset-password-cpf', async (c) => {
  const body = (await c.req.json().catch(() => undefined)) as {
    username?: string
    cpf?: string
    newPassword?: string
  } | undefined

  if (!body?.username || !body?.cpf || !body?.newPassword) {
    return c.json({ message: 'Informe usuário, CPF e nova senha.' }, 400)
  }

  // Normalizar CPF (remover pontos e traços)
  const normalizedCPF = body.cpf.replace(/[^\d]/g, '')

  // Buscar usuário por username e CPF
  const user = await c.env.DB.prepare(
    'SELECT * FROM users WHERE username = ? AND cpf = ?'
  ).bind(body.username, normalizedCPF)
    .first<{ id: string }>()

  if (!user) {
    return c.json({ message: 'Usuário ou CPF inválido.' }, 401)
  }

  // Hashear nova senha
  const bcrypt = await import('bcryptjs')
  const hashedPassword = await bcrypt.hash(body.newPassword, 10)

  // Atualizar senha
  await c.env.DB.prepare('UPDATE users SET password = ? WHERE id = ?')
    .bind(hashedPassword, user.id)
    .run()

  return c.json({ ok: true, message: 'Senha redefinida com sucesso!' })
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

  // Validation removed: Any professional can perform any service
  // if (service && !service.professionalIds.includes(professionalId)) {
  //   return c.json({ message: 'Este serviço não está disponível para a profissional selecionada.' }, 400)
  // }

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

app.get('/api/dashboard/stats', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  // Get current date in Brazil timezone
  const now = new Date()
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const todayStr = `${brazilTime.getFullYear()}-${String(brazilTime.getMonth() + 1).padStart(2, '0')}-${String(brazilTime.getDate()).padStart(2, '0')}`

  // Get current month and last month
  const currentMonth = brazilTime.getMonth() + 1
  const currentYear = brazilTime.getFullYear()
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear

  // Fetch today's appointments with service names
  const { results: todayResults } = await c.env.DB.prepare(
    `SELECT a.*, s.name as service_name, s.duration_minutes
     FROM appointments a
     LEFT JOIN services s ON a.service_id = s.id
     WHERE a.date = ?
     ORDER BY a.start_time ASC`
  ).bind(todayStr).all<AppointmentRow & { service_name?: string; duration_minutes?: number }>()

  const todayAppointments = (todayResults ?? []).map(row => ({
    start_time: row.start_time,
    end_time: row.end_time,
    duration_minutes: row.duration_minutes ?? 60,
    customer_name: row.customer_name,
    service_name: row.service_name ?? 'Serviço',
    status: row.status,
    paid_at: row.paid_at ?? undefined
  }))

  // Calculate today's revenue
  const todayRevenue = todayAppointments.reduce((sum, appt) => {
    return sum + (appt.paid_at ? (todayResults?.find(r => r.start_time === appt.start_time)?.price_cents ?? 0) : 0)
  }, 0)

  const todayPaidCount = todayAppointments.filter(a => a.paid_at).length

  // Count pending appointments for today (confirmed but not paid)
  const { results: todayPendingResults } = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM appointments 
     WHERE date = ? 
     AND status = 'confirmed' 
     AND paid_at IS NULL`
  ).bind(todayStr).all<{ count: number }>()

  const todayPendingCount = todayPendingResults?.[0]?.count ?? 0

  // Count pending appointments (all statuses)
  const { results: pendingResults } = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM appointments WHERE status = 'pending'`
  ).all<{ count: number }>()

  const pendingCount = pendingResults?.[0]?.count ?? 0

  // Calculate current month revenue
  const { results: monthResults } = await c.env.DB.prepare(
    `SELECT SUM(price_cents) as total, COUNT(*) as count
     FROM appointments
     WHERE strftime('%Y', date) = ? 
     AND strftime('%m', date) = ?
     AND paid_at IS NOT NULL`
  ).bind(String(currentYear), String(currentMonth).padStart(2, '0')).all<{ total: number | null; count: number }>()

  const monthRevenue = monthResults?.[0]?.total ?? 0
  const monthCount = monthResults?.[0]?.count ?? 0

  // Count pending appointments for current month (confirmed but not paid)
  const { results: monthPendingResults } = await c.env.DB.prepare(
    `SELECT COUNT(*) as count
     FROM appointments
     WHERE strftime('%Y', date) = ? 
     AND strftime('%m', date) = ?
     AND status = 'confirmed'
     AND paid_at IS NULL`
  ).bind(String(currentYear), String(currentMonth).padStart(2, '0')).all<{ count: number }>()

  const monthPendingCount = monthPendingResults?.[0]?.count ?? 0

  // Calculate last month revenue for comparison
  const { results: lastMonthResults } = await c.env.DB.prepare(
    `SELECT SUM(price_cents) as total
     FROM appointments
     WHERE strftime('%Y', date) = ? 
     AND strftime('%m', date) = ?
     AND paid_at IS NOT NULL`
  ).bind(String(lastMonthYear), String(lastMonth).padStart(2, '0')).all<{ total: number | null }>()

  const lastMonthRevenue = lastMonthResults?.[0]?.total ?? 0

  return c.json({
    today: {
      date: todayStr,
      appointments: todayAppointments,
      revenue: {
        totalCents: todayRevenue,
        count: todayPaidCount
      },
      pending: {
        count: todayPendingCount
      }
    },
    pending: {
      count: pendingCount
    },
    month: {
      revenue: {
        totalCents: monthRevenue,
        count: monthCount
      },
      pending: {
        count: monthPendingCount
      },
      lastMonthTotalCents: lastMonthRevenue
    }
  })
})

app.get('/api/clients/search', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const query = c.req.query('q')
  if (!query) return c.json({ error: 'Query parameter required' }, 400)

  const normalized = normalizePhone(query)

  // Check if it's a phone or CPF search (exact match)
  const isPhoneOrCPF = /^[\d\s\-\(\)\.]+$/.test(query)

  if (isPhoneOrCPF) {
    // Exact match for phone or CPF - return single result
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM clients 
       WHERE phone = ? 
       OR cpf = ?
       LIMIT 1`
    ).bind(normalized, query).all<ClientRow>()

    const client = results?.[0]

    if (!client) {
      return c.json({ found: false, clients: [] }, 404)
    }

    return c.json({
      found: true,
      clients: [{
        id: client.id,
        name: client.name,
        phone: client.phone,
        cpf: client.cpf || ''
      }]
    })
  } else {
    // Name search - return multiple results
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM clients 
       WHERE name LIKE ?
       ORDER BY name
       LIMIT 10`
    ).bind(`%${query}%`).all<ClientRow>()

    if (!results || results.length === 0) {
      return c.json({ found: false, clients: [] }, 404)
    }

    return c.json({
      found: true,
      clients: results.map(client => ({
        id: client.id,
        name: client.name,
        phone: client.phone,
        cpf: client.cpf || ''
      }))
    })
  }
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

  // Validation removed: Any professional can perform any service
  // if (!service.professionalIds.includes(professional.id)) {
  //   return c.json({ message: 'Este serviço não está disponível com a profissional selecionada.' }, 400)
  // }

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
      service.priceCents
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

  let whatsappLink: string | undefined
  if (service && professional) {
    const studioPhone = getStudioPhone(c.env)
    whatsappLink = buildStudioToClientLink(updated, service, professional, 'cancelado')
    await triggerWhatsAppAutomation(c.env, 'cancelled', updated, service, professional)
  }

  return c.json({ appointment: updated, whatsappLink })
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

// Professional CRUD Endpoints
app.get('/api/professionals', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM professionals WHERE active = 1 ORDER BY name ASC'
  ).all<ProfessionalRow>()

  const professionals = (results ?? []).map(mapProfessionalRow)
  return c.json({ professionals })
})

app.post('/api/professionals', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const body = (await c.req.json().catch(() => undefined)) as {
    name?: string
    role?: string
    whatsapp?: string
    avatarColor?: string
    cpf?: string
    address?: string
    bankName?: string
    bankAccount?: string
    notes?: string
  } | undefined

  if (!body?.name || !body.role) {
    return c.json({ message: 'Nome e função são obrigatórios.' }, 400)
  }

  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO professionals (id, name, role, whatsapp, avatar_color, cpf, address, bank_name, bank_account, notes, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).bind(
    id,
    body.name,
    body.role,
    body.whatsapp || null,
    body.avatarColor || 'from-pink-400 to-rose-500',
    body.cpf || null,
    body.address || null,
    body.bankName || null,
    body.bankAccount || null,
    body.notes || null
  ).run()

  const professional = await getProfessional(c.env.DB, id)
  return c.json({ professional }, 201)
})

app.put('/api/professionals/:id', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const existing = await getProfessional(c.env.DB, id)

  if (!existing) {
    return c.json({ message: 'Profissional não encontrado.' }, 404)
  }

  const body = (await c.req.json().catch(() => undefined)) as {
    name?: string
    role?: string
    whatsapp?: string
    avatarColor?: string
    cpf?: string
    address?: string
    bankName?: string
    bankAccount?: string
    notes?: string
  } | undefined

  if (!body) {
    return c.json({ message: 'Dados inválidos.' }, 400)
  }

  await c.env.DB.prepare(
    `UPDATE professionals 
     SET name = ?, role = ?, whatsapp = ?, avatar_color = ?, cpf = ?, address = ?, bank_name = ?, bank_account = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    body.name ?? existing.name,
    body.role ?? existing.role,
    body.whatsapp ?? existing.whatsapp ?? null,
    body.avatarColor ?? existing.avatarColor,
    body.cpf ?? existing.cpf ?? null,
    body.address ?? existing.address ?? null,
    body.bankName ?? existing.bankName ?? null,
    body.bankAccount ?? existing.bankAccount ?? null,
    body.notes ?? existing.notes ?? null,
    id
  ).run()

  const professional = await getProfessional(c.env.DB, id)
  return c.json({ professional })
})

app.delete('/api/professionals/:id', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const existing = await getProfessional(c.env.DB, id)

  if (!existing) {
    return c.json({ message: 'Profissional não encontrado.' }, 404)
  }

  // Soft delete
  await c.env.DB.prepare(
    'UPDATE professionals SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(id).run()

  return c.json({ message: 'Profissional desativado com sucesso.' })
})

// Service CRUD Endpoints
app.get('/api/services', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM services WHERE active = 1 ORDER BY name ASC'
  ).all<ServiceRow>()

  const services = (results ?? []).map(mapServiceRow)
  return c.json({ services })
})

app.post('/api/services', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const body = (await c.req.json().catch(() => undefined)) as {
    name?: string
    description?: string
    durationMinutes?: number
    priceCents?: number
  } | undefined

  if (!body?.name || !body.durationMinutes || body.priceCents === undefined) {
    return c.json({ message: 'Nome, duração e preço são obrigatórios.' }, 400)
  }

  const id = crypto.randomUUID()
  await c.env.DB.prepare(
    `INSERT INTO services (id, name, description, duration_minutes, price_cents, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).bind(
    id,
    body.name,
    body.description || null,
    body.durationMinutes,
    body.priceCents
  ).run()

  const service = await getService(c.env.DB, id)
  return c.json({ service }, 201)
})

app.put('/api/services/:id', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const existing = await getService(c.env.DB, id)

  if (!existing) {
    return c.json({ message: 'Serviço não encontrado.' }, 404)
  }

  const body = (await c.req.json().catch(() => undefined)) as {
    name?: string
    description?: string
    durationMinutes?: number
    priceCents?: number
  } | undefined

  if (!body) {
    return c.json({ message: 'Dados inválidos.' }, 400)
  }

  await c.env.DB.prepare(
    `UPDATE services 
     SET name = ?, description = ?, duration_minutes = ?, price_cents = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(
    body.name ?? existing.name,
    body.description ?? existing.description ?? null,
    body.durationMinutes ?? existing.durationMinutes,
    body.priceCents ?? existing.priceCents,
    id
  ).run()

  const service = await getService(c.env.DB, id)
  return c.json({ service })
})

app.delete('/api/services/:id', async (c) => {
  const unauthorized = await enforcePanelAuth(c)
  if (unauthorized) return unauthorized

  const id = c.req.param('id')
  const existing = await getService(c.env.DB, id)

  if (!existing) {
    return c.json({ message: 'Serviço não encontrado.' }, 404)
  }

  // Soft delete
  await c.env.DB.prepare(
    'UPDATE services SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(id).run()

  return c.json({ message: 'Serviço desativado com sucesso.' })
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
  try {
    await deleteClient(c.env.DB, id)
    return c.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting client:', error)
    if (error.message && error.message.includes('constraint')) {
      return c.json({ message: 'Não é possível excluir cliente com agendamentos vinculados.' }, 409)
    }
    return c.json({ message: 'Erro ao excluir cliente. Verifique se existem agendamentos vinculados.' }, 500)
  }
})




export default app

