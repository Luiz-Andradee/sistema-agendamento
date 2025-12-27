// ==========================================
// Dashboard Logic
// ==========================================

async function initDashboardPage() {
    initLogoutButton()
    await ensureCatalogData()
    setupRebookModal()
    setupAuthModal() // Verify if needed here
    attachDashboardListeners()
    initCalendar() // Assuming calendar logic is small enough to stay or be extracted
    await initInternalBooking()

    if (window.state && state.panelProtected) {
        const authenticated = await tryAuthenticateWithStoredToken()
        if (!authenticated) {
            window.location.href = '/login'
            return
        }
    }

    // Load appointments
    // Using global state for filter
    await loadAppointments(state.currentFilter)
}

async function loadAppointments(status = 'all') {
    if (state.panelProtected && !getPanelToken()) {
        window.location.href = '/login'
        return
    }

    const listContainer = document.getElementById('appointmentsList')
    const emptyState = document.getElementById('appointmentsEmpty')

    if (!listContainer || !emptyState) return

    listContainer.innerHTML = ''
    hideElement(emptyState)

    try {
        const query = new URLSearchParams({ status })
        const { appointments } = await apiGet(`/appointments?${query.toString()}`)
        state.appointments = Array.isArray(appointments) ? appointments : []

        if (state.appointments.length === 0) {
            showElement(emptyState)
            return
        }

        let displayedAppointments = state.appointments
        if (state.calendar.selectedDate) {
            displayedAppointments = displayedAppointments.filter(app => app.date === state.calendar.selectedDate)
        }

        if (displayedAppointments.length === 0) {
            listContainer.innerHTML = '<div class="text-center text-slate-400 py-8">Nenhum agendamento para esta data.</div>'
            return
        }

        displayedAppointments.forEach((appointment) => {
            const card = renderAppointmentCard(appointment)
            listContainer.appendChild(card)
        })
    } catch (error) {
        if (error?.status === 401) {
            window.location.href = '/login'
            return
        }

        listContainer.innerHTML = `<div class="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">${escapeHtml(
            extractErrorMessage(error)
        )}</div>`
    }
}

function renderAppointmentCard(appointment) {
    const service = state.services.find((item) => item.id === appointment.serviceId)
    const professional = state.professionals.find((item) => item.id === appointment.professionalId)

    const dateTime = formatDateTime(appointment.date, appointment.time)

    // Status badges
    let mainStatusHtml = ''
    if (appointment.status === 'confirmed' && appointment.isRescheduled) {
        mainStatusHtml = `<span class="bg-indigo-500/20 text-indigo-200 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">🗓️ Reagendado</span>`
    } else {
        mainStatusHtml = `<span class="${statusStyle(appointment.status)} text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border">${translateStatus(appointment.status)}</span>`
    }

    const notifiedHtml = appointment.client_notified ? `<span class="bg-blue-500/20 text-blue-200 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">✓ Avisado</span>` : ''

    const wrapper = document.createElement('article')
    wrapper.className = 'rounded-3xl border border-white/10 bg-white/5 p-5'

    const whatsappUrl = `https://wa.me/${appointment.customerPhone.replace(/\D/g, '')}`

    // WhatsApp button classes - full width on mobile only for rescheduled appointments
    const whatsappClasses = (appointment.status === 'confirmed' && appointment.isRescheduled)
        ? "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"
        : "inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500"

    wrapper.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          ${mainStatusHtml}
          ${notifiedHtml}
        </div>
        <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="${whatsappClasses}" title="Falar com ${escapeHtml(appointment.customerName)} no WhatsApp">
          <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
          WhatsApp
        </a>
      </div>
      <h3 class="text-lg font-semibold text-white">${escapeHtml(appointment.customerName)}</h3>
      <p class="text-sm text-slate-300">${escapeHtml(dateTime)}</p>
    </div>
    <dl class="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
      <div>
        <dt class="text-xs uppercase tracking-wide text-slate-400">Serviço</dt>
        <dd class="text-white">${escapeHtml(service?.name || 'Serviço')}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wide text-slate-400">Profissional</dt>
        <dd class="text-white">${escapeHtml(professional?.name || 'Equipe do Estúdio')}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wide text-slate-400">Telefone</dt>
        <dd>${escapeHtml(appointment.customerPhone)}</dd>
      </div>
      ${appointment.notes
            ? `<div class="col-span-2"><p class="mt-3 text-sm text-slate-200/80">Observações: ${escapeHtml(appointment.notes)}</p></div>`
            : ''
        }
    </dl>
    <div class="mt-5 flex flex-wrap gap-3">
      ${renderAppointmentActions(appointment)}
    </div>
  `

    return wrapper
}

function renderAppointmentActions(appointment) {
    const actions = []

    if (appointment.status === 'pending') {
        actions.push(
            `<button class="rounded-full bg-emerald-500/90 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400" type="button" data-action="confirm" data-id="${appointment.id}">Confirmar</button>`
        )
        actions.push(
            `<button class="rounded-full bg-pink-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:bg-pink-400" type="button" data-action="open-rebook" data-id="${appointment.id}">Reagendar</button>`
        )
        actions.push(
            `<button class="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30" type="button" data-action="cancel" data-id="${appointment.id}">Cancelar</button>`
        )
    }

    if (appointment.status === 'confirmed') {
        actions.push(
            `<button class="rounded-full bg-pink-500/80 px-4 py-2 text-xs font-semibold text-white transition hover:bg-pink-400" type="button" data-action="open-rebook" data-id="${appointment.id}">Reagendar</button>`
        )
        actions.push(
            `<button class="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30" type="button" data-action="cancel" data-id="${appointment.id}">Cancelar</button>`
        )
    }

    actions.push(
        `<button class="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20" type="button" data-action="delete" data-id="${appointment.id}">Excluir</button>`
    )

    return actions.join('')
}

function attachDashboardListeners() {
    const filterSelect = document.getElementById('statusFilter')
    const refreshButton = document.getElementById('refreshAppointments')
    const listContainer = document.getElementById('appointmentsList')

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            state.currentFilter = filterSelect.value
            loadAppointments(state.currentFilter)
        })
    }

    if (refreshButton) {
        refreshButton.addEventListener('click', () => {
            loadAppointments(state.currentFilter)
        })
    }

    if (listContainer) {
        listContainer.addEventListener('click', async (event) => {
            const actionButton = event.target.closest('[data-action]')
            if (!actionButton) return

            const { action, id } = actionButton.dataset
            if (!action || !id) return

            try {
                if (action === 'confirm') {
                    const response = await apiPost(`/appointments/${id}/confirm`, {})
                    if (response && response.whatsappLink) {
                        window.open(response.whatsappLink, '_blank')
                    }
                    // Notify (logic simplified)
                } else if (action === 'open-rebook') {
                    const appointment = state.appointments.find(a => a.id === id)
                    if (appointment) openRebookModal(appointment)
                } else if (action === 'cancel') {
                    const response = await apiPost(`/appointments/${id}/cancel`, {})
                    if (response && response.whatsappLink) {
                        window.open(response.whatsappLink, '_blank')
                    }
                } else if (action === 'delete') {
                    if (confirm('Excluir agendamento?')) await apiDelete(`/appointments/${id}`)
                }

                await loadAppointments(state.currentFilter)
            } catch (error) {
                alert(extractErrorMessage(error))
            }
        })
    }
}

async function ensureCatalogData() {
    if (!state.services.length) {
        const { services } = await apiGet('/services', { auth: false })
        if (Array.isArray(services)) state.services = services
    }

    if (!state.professionals.length) {
        const { professionals } = await apiGet('/professionals', { auth: false })
        if (Array.isArray(professionals)) state.professionals = professionals
    }
}

// Calendar Logic (Simplified)
// Calendar Logic
function initCalendar() {
    if (!window.state.calendar) {
        window.state.calendar = { month: new Date().getMonth(), year: new Date().getFullYear(), selectedDate: null }
    }

    const prevBtn = document.getElementById('prevMonth')
    const nextBtn = document.getElementById('nextMonth')
    const clearBtn = document.getElementById('clearDateFilter')

    if (prevBtn) prevBtn.onclick = () => changeCalendarMonth(-1)
    if (nextBtn) nextBtn.onclick = () => changeCalendarMonth(1)
    if (clearBtn) clearBtn.addEventListener('click', clearCalendarFilter)

    renderCalendar()
}

function changeCalendarMonth(delta) {
    if (!window.state.calendar) return
    window.state.calendar.month += delta
    if (window.state.calendar.month > 11) {
        window.state.calendar.month = 0
        window.state.calendar.year++
    } else if (window.state.calendar.month < 0) {
        window.state.calendar.month = 11
        window.state.calendar.year--
    }
    renderCalendar()
}

function renderCalendar() {
    const grid = document.getElementById('calendarDays')
    const label = document.getElementById('currentMonthLabel')

    if (!grid || !label) return

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    label.textContent = `${monthNames[window.state.calendar.month]} ${window.state.calendar.year}`

    grid.innerHTML = ''

    const firstDay = new Date(window.state.calendar.year, window.state.calendar.month, 1).getDay()
    const daysInMonth = new Date(window.state.calendar.year, window.state.calendar.month + 1, 0).getDate()

    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div')
        empty.className = 'empty'
        grid.appendChild(empty)
    }

    // Days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${window.state.calendar.year}-${String(window.state.calendar.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const day = document.createElement('div')

        // Check if there are appointments
        const count = (window.state.appointments || []).filter(a => a.date === dateStr && a.status !== 'cancelled').length

        // Build class names
        let classes = []

        if (count > 0) {
            classes.push('has-appointments')
        }

        if (window.state.calendar.selectedDate === dateStr) {
            classes.push('selected')
        }

        if (dateStr === todayStr) {
            classes.push('today')
        }

        day.className = classes.join(' ')
        day.textContent = d
        day.onclick = () => selectCalendarDate(dateStr)
        day.style.cursor = 'pointer'

        grid.appendChild(day)
    }
}

function selectCalendarDate(date) {
    window.state.calendar.selectedDate = date
    renderCalendar() // Re-render to update selection style

    const display = document.getElementById('selectedDateDisplay')
    const value = document.getElementById('selectedDateValue')
    if (display && value) {
        value.textContent = formatDateTime(date, '00:00').split(' às ')[0]
        display.classList.remove('hidden')
    }

    loadAppointments(state.currentFilter)
}

function clearCalendarFilter() {
    window.state.calendar.selectedDate = null
    renderCalendar()

    const display = document.getElementById('selectedDateDisplay')
    if (display) display.classList.add('hidden')

    loadAppointments(state.currentFilter)
}

// Internal Booking Logic (Dashboard Modal)
async function initInternalBooking() {
    const modal = document.getElementById('bookingModal')
    const openBtn = document.getElementById('newAppointmentBtn')
    const closeBtn = document.getElementById('closeBookingModal')

    if (!modal || !openBtn || !closeBtn) return

    const form = document.getElementById('bookingForm')
    const serviceSelect = document.getElementById('serviceSelect')
    const professionalSelect = document.getElementById('professionalSelect')
    const dateInput = document.getElementById('dateInput')
    const timeSelect = document.getElementById('timeSelect')
    const alertBox = document.getElementById('bookingAlert')
    const availabilityInfo = document.getElementById('availabilityInfo')

    // Open/Close handlers
    openBtn.addEventListener('click', () => {
        modal.classList.remove('hidden')
        form.reset()
        timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
        form.classList.remove('hidden')
        alertBox.classList.add('hidden')
        availabilityInfo.textContent = 'Selecione profissional e data para ver os horários disponíveis.'
        availabilityInfo.className = "rounded-2xl border border-pink-300/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-100" // Reset class
        const submitBtn = form.querySelector('button[type="submit"]')
        if (submitBtn) submitBtn.classList.remove('hidden')
    })

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'))
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden')
    })

    // Date constraints
    const today = new Date()
    const minDate = formatDateInput(today)
    dateInput.min = minDate

    // Options
    populateServiceOptions(serviceSelect)
    populateProfessionalOptions(professionalSelect)

    serviceSelect.addEventListener('change', () => {
        updateProfessionalOptions(serviceSelect, professionalSelect)

        // Update price input
        const service = window.state.services.find(s => s.id === serviceSelect.value)
        const priceInput = document.getElementById('priceInput')
        if (service && priceInput) {
            priceInput.value = (service.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        }

        timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
        fetchAvailability()
    })

    professionalSelect.addEventListener('change', fetchAvailability)
    dateInput.addEventListener('change', fetchAvailability)

    // Client search logic
    const clientSearchInput = document.getElementById('clientSearch')
    const clientSearchBtn = document.getElementById('clientSearchBtn')
    const clientSearchResults = document.getElementById('clientSearchResults')
    const clientSearchStatus = document.getElementById('clientSearchStatus')
    const customerNameInput = document.getElementById('customerName')
    const customerPhoneInput = document.getElementById('customerPhone')

    if (clientSearchBtn && clientSearchInput) {
        // Search on button click
        clientSearchBtn.addEventListener('click', async () => {
            const query = clientSearchInput.value.trim()

            // Clear previous results and status
            clientSearchResults.classList.add('hidden')
            clientSearchStatus.classList.add('hidden')

            if (!query) {
                return
            }

            try {
                const response = await apiGet(`/clients/search?q=${encodeURIComponent(query)}`)

                if (response.found && response.clients && response.clients.length > 0) {
                    // Show results list
                    if (response.clients.length === 1) {
                        // Single result - auto-fill directly
                        const client = response.clients[0]
                        customerNameInput.value = client.name
                        customerPhoneInput.value = client.phone

                        clientSearchResults.classList.add('hidden')
                        clientSearchStatus.innerHTML = `
                            <div class="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-50">
                                <span class="text-lg">✅</span>
                                <span>Cliente encontrado: <strong>${client.name}</strong></span>
                            </div>
                        `
                        clientSearchStatus.classList.remove('hidden')
                    } else {
                        // Multiple results - show list
                        clientSearchStatus.classList.add('hidden')
                        clientSearchResults.innerHTML = `
                            <div class="mt-2 rounded-xl border border-white/10 bg-slate-900/70 overflow-hidden">
                                <div class="px-4 py-2 bg-white/5 border-b border-white/10">
                                    <span class="text-xs font-semibold text-slate-300">${response.clients.length} cliente(s) encontrado(s)</span>
                                </div>
                                <div class="max-h-60 overflow-y-auto">
                                    ${response.clients.map(client => `
                                        <button
                                            type="button"
                                            class="w-full px-4 py-3 text-left hover:bg-white/5 transition border-b border-white/5 last:border-0"
                                            data-client-id="${client.id}"
                                            data-client-name="${escapeHtml(client.name)}"
                                            data-client-phone="${client.phone}"
                                        >
                                            <div class="flex flex-col gap-1">
                                                <span class="text-sm font-semibold text-white">${escapeHtml(client.name)}</span>
                                                <span class="text-xs text-slate-400">${client.phone}${client.cpf ? ' • ' + client.cpf : ''}</span>
                                            </div>
                                        </button>
                                    `).join('')}
                                </div>
                            </div>
                        `
                        clientSearchResults.classList.remove('hidden')

                        // Add click handlers to list items
                        clientSearchResults.querySelectorAll('button[data-client-id]').forEach(btn => {
                            btn.addEventListener('click', () => {
                                customerNameInput.value = btn.dataset.clientName
                                customerPhoneInput.value = btn.dataset.clientPhone

                                clientSearchResults.classList.add('hidden')
                                clientSearchStatus.innerHTML = `
                                    <div class="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-50">
                                        <span class="text-lg">✅</span>
                                        <span>Cliente selecionado: <strong>${btn.dataset.clientName}</strong></span>
                                    </div>
                                `
                                clientSearchStatus.classList.remove('hidden')
                            })
                        })
                    }
                }
            } catch (error) {
                // Client not found - check for 404 status
                console.log('Search error:', error)
                clientSearchResults.classList.add('hidden')
                clientSearchStatus.innerHTML = `
                    <div class="flex flex-col gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">⚠️</span>
                            <span>Cliente não cadastrado</span>
                        </div>
                        <a href="/painel/clients" class="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-400">
                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Cadastrar Novo Cliente
                        </a>
                    </div>
                `
                clientSearchStatus.classList.remove('hidden')
            }
        })

        // Also search on Enter key
        clientSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                clientSearchBtn.click()
            }
        })

        // Clear status when user starts typing again
        clientSearchInput.addEventListener('input', () => {
            if (clientSearchInput.value.trim() === '') {
                clientSearchResults.classList.add('hidden')
                clientSearchStatus.classList.add('hidden')
            }
        })
    }

    async function fetchAvailability() {
        if (!professionalSelect.value || !dateInput.value) {
            availabilityInfo.textContent = 'Selecione profissional e data para ver os horários disponíveis.'
            return
        }

        try {
            const query = new URLSearchParams({
                professionalId: professionalSelect.value,
                date: dateInput.value
            })
            if (serviceSelect.value) query.set('serviceId', serviceSelect.value)
            // Custom duration logic if we need it (skipped for now for simplicity as verified in app.js it was complex)

            const { slots } = await apiGet(`/availability?${query.toString()}`)

            timeSelect.innerHTML = ''
            const placeholder = document.createElement('option')
            placeholder.value = ''
            placeholder.textContent = 'Selecione um horário disponível'
            timeSelect.appendChild(placeholder)

            let availableCount = 0

            slots.forEach((slot) => {
                const option = document.createElement('option')
                option.value = slot.time
                const formattedTime = formatTime(slot.time)
                option.textContent = formattedTime
                if (slot.status !== 'available') {
                    option.disabled = true
                    option.textContent = `${formattedTime} · Indisponível`
                } else {
                    availableCount += 1
                }
                timeSelect.appendChild(option)
            })

            availabilityInfo.textContent = availableCount === 0
                ? 'Não há horários livres nessa data.'
                : `${availableCount} horários livres.`

        } catch (error) {
            availabilityInfo.textContent = 'Erro ao buscar horários.'
            console.error(error)
        }
    }

    // Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        alertBox.classList.add('hidden')

        const priceVal = document.getElementById('priceInput')?.value
        let priceCents = undefined
        if (priceVal) {
            const numeric = parseInt(priceVal.replace(/\D/g, ''), 10)
            if (!isNaN(numeric)) priceCents = numeric
        }

        const payload = {
            serviceId: serviceSelect.value,
            professionalId: professionalSelect.value,
            date: dateInput.value,
            time: timeSelect.value,
            customerName: document.getElementById('customerName').value,
            customerPhone: normalizePhone(document.getElementById('customerPhone').value),
            customerEmail: document.getElementById('customerEmail')?.value,
            notes: document.getElementById('customerNotes')?.value,
            price: priceCents
        }

        try {
            setSubmitting(form, true)
            const response = await apiPost('/appointments', payload)

            form.classList.add('hidden')
            await loadAppointments(state.currentFilter)
            initCalendar()

            availabilityInfo.className = 'p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center'
            availabilityInfo.innerHTML = `
        <div class="flex flex-col items-center justify-center gap-3">
             <h3 class="text-lg font-bold text-white">Agendamento Realizado!</h3>
             <button id="resetBookingForm" class="text-sm text-slate-400 hover:text-white underline mt-2">Fazer novo agendamento</button>
        </div>
      `

            const submitBtn = form.querySelector('button[type="submit"]')
            if (submitBtn) submitBtn.classList.add('hidden')

            document.getElementById('resetBookingForm').addEventListener('click', (ev) => {
                ev.preventDefault()
                form.reset()
                form.classList.remove('hidden')
                availabilityInfo.textContent = 'Selecione a data para ver os horários disponíveis.'
                availabilityInfo.className = "rounded-2xl border border-pink-300/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-100"
                if (submitBtn) submitBtn.classList.remove('hidden')
                timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
            })
        } catch (error) {
            alertBox.textContent = extractErrorMessage(error)
            alertBox.classList.remove('hidden')
        } finally {
            setSubmitting(form, false)
        }
    })
}

// Rebook Modal Logic (Moved from app.js)
// Rebook Modal Logic
const uiRebook = {
    initialized: false,
    modal: null,
    form: null,
    date: null,
    time: null,
    availability: null,
    feedback: null,
    cancel: null
}

function setupRebookModal() {
    if (uiRebook.initialized) return

    uiRebook.modal = document.getElementById('rebookModal')
    uiRebook.form = document.getElementById('rebookModalForm')
    uiRebook.date = document.getElementById('rebookModalDate')
    uiRebook.time = document.getElementById('rebookModalTime')
    uiRebook.availability = document.getElementById('rebookModalAvailability')
    uiRebook.feedback = document.getElementById('rebookModalFeedback')
    uiRebook.cancel = document.getElementById('rebookModalCancel')

    if (!uiRebook.modal || !uiRebook.form || !uiRebook.date || !uiRebook.time || !uiRebook.availability || !uiRebook.feedback || !uiRebook.cancel) {
        console.warn('Modal de reagendamento não encontrado.')
        return
    }

    uiRebook.date.addEventListener('change', () => {
        populateRebookModalAvailability().catch(console.error)
    })

    uiRebook.form.addEventListener('submit', async (event) => {
        event.preventDefault()
        if (!state.activeRebook) return

        hideElement(uiRebook.feedback)

        const date = uiRebook.date.value
        const time = uiRebook.time.value

        if (!date || !time) {
            showRebookModalFeedback('Selecione data e horário disponíveis.', true)
            return
        }

        try {
            const response = await apiPost(`/appointments/${state.activeRebook.id}/rebook-approve`, { date, time })

            // Update list in background
            await loadAppointments(state.currentFilter)

            if (response.whatsappLink) {
                // Show manual button
                uiRebook.feedback.innerHTML = `
          <div class="text-center space-y-3">
            <p class="text-emerald-400 font-bold">Reagendado com sucesso!</p>
            <button onclick="markAsNotified('${state.activeRebook.id}', '${response.whatsappLink}')" class="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-400">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.54 1.651.712 2.806.712 3.18 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.795zm8.854 1.202c.536 1.362.8 2.884.666 4.417-.168 1.942-1.054 3.738-2.528 5.093l.366 1.25.176.598-2.618-1.554-1.393.755c-1.121.606-2.427.91-3.791.866l-.506-.016c-3.696-.067-6.903-2.695-7.796-6.388-.93-3.844 1.392-7.854 5.143-8.988l.608-.157c1.472-.38 2.946-.226 4.314.398 1.137.519 2.086 1.332 2.83 2.378 1.411 1.984 1.777 4.103 1.157 5.39.022-.057.067-.101.442-.99.584.246 1.168.492 1.752.738.034-.093-.051.126-.441 1.002a7.61 7.61 0 0 0 1.277-2.464 7.622 7.622 0 0 0-.256-4.524l-1.748.742c.205 1.08.163 2.19-.08 3.228a6.398 6.398 0 0 1-1.077 2.072l.966.425z"/></svg>
              Enviar Confirmação WhatsApp
            </button>
            <button onclick="closeRebookModal()" class="block w-full text-xs text-slate-400 hover:text-white mt-2">Fechar Janela</button>
          </div>
         `
                uiRebook.feedback.classList.remove('hidden')
                uiRebook.feedback.className = 'mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4'

                // Clear form but keep feedback visible
                uiRebook.form.reset()
            } else {
                closeRebookModal()
            }
        } catch (error) {
            showRebookModalFeedback(extractErrorMessage(error), true)
        }
    })

    uiRebook.cancel.addEventListener('click', (event) => {
        event.preventDefault()
        closeRebookModal()
    })

    uiRebook.initialized = true
}

function openRebookModal(appointment) {
    if (!uiRebook.modal || !uiRebook.form || !uiRebook.date || !uiRebook.time || !uiRebook.availability || !uiRebook.feedback) {
        return
    }

    state.activeRebook = appointment
    const codeInput = document.getElementById('rebookCode')
    if (codeInput) codeInput.value = appointment.id

    uiRebook.date.value = appointment.rebookRequest?.desiredDate || appointment.date
    uiRebook.time.innerHTML = '<option value="">Selecione um horário disponível</option>'
    uiRebook.availability.textContent = 'Carregando disponibilidade...'
    hideElement(uiRebook.feedback)

    showModal(uiRebook.modal)

    populateRebookModalAvailability().catch((error) => {
        showRebookModalFeedback(extractErrorMessage(error), true)
    })
}

function closeRebookModal() {
    if (!uiRebook.modal) return
    hideModal(uiRebook.modal)
    state.activeRebook = null
}

async function populateRebookModalAvailability() {
    if (!state.activeRebook || !uiRebook.date || !uiRebook.time || !uiRebook.availability) return

    const date = uiRebook.date.value
    if (!date) return

    uiRebook.availability.textContent = 'Carregando disponibilidade...'
    uiRebook.time.innerHTML = '<option value="">Selecione um horário disponível</option>'

    const params = new URLSearchParams({
        professionalId: state.activeRebook.professionalId,
        date,
        serviceId: state.activeRebook.serviceId,
        ignoreAppointmentId: state.activeRebook.id
    })

    const { slots } = await apiGet(`/availability?${params.toString()}`)
    const availability = Array.isArray(slots) ? slots : []

    let availableCount = 0
    availability.forEach((slot) => {
        const option = document.createElement('option')
        option.value = slot.time
        option.textContent = formatTime(slot.time)
        if (slot.status !== 'available') {
            option.disabled = true
            option.textContent = `${formatTime(slot.time)} · Indisponível`
        } else {
            availableCount += 1
        }
        uiRebook.time.appendChild(option)
    })

    if (availableCount === 0) {
        uiRebook.availability.textContent = 'Não há horários livres para esta data.'
    } else {
        uiRebook.availability.textContent = `${availableCount} horários livres encontrados.`
    }
}

function showRebookModalFeedback(message, isError) {
    if (!uiRebook.feedback) return
    uiRebook.feedback.textContent = message
    uiRebook.feedback.classList.remove('hidden')
    uiRebook.feedback.classList.toggle('border-red-300', isError)
    uiRebook.feedback.classList.toggle('bg-red-50', isError)
    uiRebook.feedback.classList.toggle('text-red-600', isError)
    uiRebook.feedback.classList.toggle('border-emerald-300', !isError)
    uiRebook.feedback.classList.toggle('bg-emerald-50', !isError)
    uiRebook.feedback.classList.toggle('text-emerald-700', !isError)
}

// Global expose
window.openRebookModal = openRebookModal
window.closeRebookModal = closeRebookModal
window.markAsNotified = async (id, link) => {
    if (link) window.open(link, '_blank', 'noopener')
    try {
        await apiPost(`/appointments/${id}/notify`, {})
        loadAppointments(state.currentFilter)
    } catch (e) { console.error(e) }
}

// Global expose
window.initDashboardPage = initDashboardPage
window.loadAppointments = loadAppointments
