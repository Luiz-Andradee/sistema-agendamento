const API_BASE = '/api'
const STORAGE_KEYS = {
  panelToken: 'estudio-aline-panel-token'
}

const state = {
  services: [],
  professionals: [],
  availability: [],
  appointments: [],
  schedule: {},
  timeOff: {},
  studioPhone: '5547991518816',
  panelProtected: false,
  adminToken: null,
  activeRebook: null,
  activeRebook: null,
  currentFilter: 'all',
  availabilityInterval: 30,
  calendar: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    selectedDate: null
  }
}

const WEEKDAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const ui = {
  auth: {
    initialized: false,
    modal: null,
    form: null,
    input: null,
    feedback: null,
    cancel: null
  },
  rebook: {
    initialized: false,
    modal: null,
    form: null,
    date: null,
    time: null,
    availability: null,
    feedback: null,
    cancel: null
  },
  schedule: {
    initialized: false,
    section: null,
    professionalSelect: null,
    intervalInput: null,
    form: null,
    feedback: null,
    saveButton: null,
    timeOffForm: null,
    timeOffList: null,
    timeOffFeedback: null
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('[PWA] Service Worker registered:', registration.scope)

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New version available! Refresh to update.')
              // Optionally show update notification
            }
          })
        })
      })
      .catch(error => {
        console.error('[PWA] Service Worker registration failed:', error)
      })
  }

  // PWA Install Prompt
  let deferredPrompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    console.log('[PWA] Install prompt available')
    // Show install button if you have one
    const installBtn = document.getElementById('pwa-install-btn')
    if (installBtn) {
      installBtn.style.display = 'block'
      installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          console.log('[PWA] User choice:', outcome)
          deferredPrompt = null
          installBtn.style.display = 'none'
        }
      })
    }
  })

  // Track PWA installation
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully!')
    deferredPrompt = null
  })

  hydrateBootstrapData()

  const page = document.body?.dataset?.page

  if (page === 'booking') {
    initBookingPage().catch(console.error)
  }

  if (page === 'dashboard') {
    initDashboardPage().catch(console.error)
  }

  if (page === 'clients') {
    initClientsPage().catch(console.error)
  }

  if (page === 'financial') {
    initFinancialPage().catch(console.error)
  }

  // Force check for login form even if page tag is missing
  const loginFormInfo = document.getElementById('loginForm')
  if (page === 'login' || loginFormInfo) {
    initLoginPage().catch(console.error)
  }
})

async function initLoginPage() {
  const form = document.getElementById('loginForm')
  const feedback = document.getElementById('loginFeedback')

  if (!form) {
    console.error('Login form missing inside initLoginPage');
    return;
  }

  // Clear existing token on load
  clearPanelToken()

  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    feedback.classList.add('hidden')

    // Get values from the new inputs
    const username = form.user.value
    const password = form.pass.value

    try {
      // Call the new login endpoint
      const response = await apiPost('/auth/login', { username, password })

      // Store the token returned by the server
      if (response.token) {
        setPanelToken(response.token)
        window.location.href = '/painel'
      } else {
        throw new Error('Token não recebido.')
      }
    } catch (error) {
      // Requested behavior: Clear information on error
      form.pass.value = ''

      let message = extractErrorMessage(error)
      // Customize message for invalid credentials
      if (error?.status === 401 || message.includes('Credenciais inválidas')) {
        message = 'Usuário ou senha incorretos.'
      }

      feedback.textContent = message
      feedback.classList.remove('hidden')
    }
  })
}

function hydrateBootstrapData() {
  const script = document.getElementById('bootstrap-data')
  if (!script) return

  try {
    const payload = JSON.parse(script.textContent || '{}')
    if (Array.isArray(payload.services)) {
      state.services = payload.services
    }
    if (Array.isArray(payload.professionals)) {
      state.professionals = payload.professionals
    }
    if (typeof payload.studioPhone === 'string' && payload.studioPhone.trim()) {
      state.studioPhone = payload.studioPhone.replace(/\D/g, '') || state.studioPhone
    }
    if (typeof payload.panelProtected === 'boolean') {
      state.panelProtected = payload.panelProtected
    }
  } catch (error) {
    console.warn('não foi possível carregar os dados iniciais embutidos.', error)
  }

  // Fallback: check data attribute on body
  if (document.body.dataset.panelProtected === 'true') {
    state.panelProtected = true
  }
}

async function initBookingPage() {
  await ensureCatalogData()

  const bookingForm = document.getElementById('bookingForm')
  const serviceSelect = document.getElementById('serviceSelect')
  const professionalSelect = document.getElementById('professionalSelect')
  const dateInput = document.getElementById('dateInput')
  const timeSelect = document.getElementById('timeSelect')
  const availabilityInfo = document.getElementById('availabilityInfo')
  const alertBox = document.getElementById('bookingAlert')
  const summaryPanel = document.getElementById('bookingSummary')
  const summaryWhatsapp = document.getElementById('summaryWhatsapp')
  const summaryNewBooking = document.getElementById('summaryNewBooking')
  const rebookForm = document.getElementById('rebookForm')
  const rebookFeedback = document.getElementById('rebookFeedback')

  if (
    !bookingForm ||
    !serviceSelect ||
    !professionalSelect ||
    !dateInput ||
    !timeSelect ||
    !availabilityInfo ||
    !alertBox ||
    !summaryPanel ||
    !summaryWhatsapp ||
    !summaryNewBooking ||
    !rebookForm ||
    !rebookFeedback
  ) {
    console.warn('Elementos essenciais do formulário de agendamento não foram encontrados.')
    return
  }

  populateServiceOptions(serviceSelect)
  populateProfessionalOptions(professionalSelect)

  const today = new Date()
  const minDate = formatDateInput(today)
  dateInput.min = minDate
  dateInput.value = minDate

  // Client Search & Integration
  let currentCustomDuration = null
  const token = getPanelToken()

  if (token) {
    try {
      const container = document.createElement('div')
      container.className = 'mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100'
      container.innerHTML = `
        <label class="block text-sm font-semibold text-indigo-900 mb-2">Buscar Cliente (Admin)</label>
        <div class="relative">
          <input type="text" id="clientLookup" placeholder="Digite nome ou telefone..." class="w-full rounded-xl border-slate-200 px-4 py-2 text-sm outline-none focus:border-indigo-500">
          <div id="clientSuggestions" class="hidden absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white rounded-xl shadow-lg border border-slate-100 z-50"></div>
        </div>
        <p id="clientSelectedInfo" class="hidden mt-2 text-xs text-indigo-600 font-medium"></p>
      `
      bookingForm.insertBefore(container, bookingForm.firstChild)

      const lookupInput = container.querySelector('#clientLookup')
      const suggestions = container.querySelector('#clientSuggestions')
      const selectedInfo = container.querySelector('#clientSelectedInfo')
      let clients = []

      // Fetch all clients for search
      // Note: For large datasets, use server-side search. Here we fetch all as per previous step simplicity (or use the list endpoint with search param on type)
      // We will use the list endpoint with debounce

      let debounce = null
      lookupInput.addEventListener('input', (e) => {
        clearTimeout(debounce)
        const term = e.target.value
        if (term.length < 2) {
          suggestions.classList.add('hidden')
          return
        }

        debounce = setTimeout(async () => {
          try {
            const res = await apiGet(`/clients?search=${encodeURIComponent(term)}`, { token })
            renderSuggestions(res.clients || [])
          } catch (e) { console.error(e) }
        }, 300)
      })

      function renderSuggestions(list) {
        suggestions.innerHTML = ''
        if (list.length === 0) {
          suggestions.classList.add('hidden')
          return
        }

        list.forEach(c => {
          const div = document.createElement('div')
          div.className = 'px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-slate-700'
          div.textContent = `${c.name} - ${c.phone}`
          div.onclick = () => selectClient(c)
          suggestions.appendChild(div)
        })
        suggestions.classList.remove('hidden')
      }

      function selectClient(client) {
        suggestions.classList.add('hidden')
        lookupInput.value = client.name

        // Auto-fill
        if (document.getElementById('customerName')) document.getElementById('customerName').value = client.name
        if (document.getElementById('customerPhone')) document.getElementById('customerPhone').value = client.phone
        if (client.notes && document.getElementById('customerNotes')) document.getElementById('customerNotes').value = client.notes

        // Handle procedure
        if (client.procedureId && serviceSelect.querySelector(`option[value="${client.procedureId}"]`)) {
          serviceSelect.value = client.procedureId
          // Trigger change event to update professionals
          serviceSelect.dispatchEvent(new Event('change'))
        }

        // Handle custom duration
        if (client.avgTimeMinutes) {
          currentCustomDuration = client.avgTimeMinutes
          selectedInfo.textContent = `Cliente selecionado with tempo personalizado: ${client.avgTimeMinutes}min`
          selectedInfo.classList.remove('hidden')
        } else {
          currentCustomDuration = null
          selectedInfo.textContent = 'Cliente selecionado.'
          selectedInfo.classList.remove('hidden')
        }

        // Refresh availability if date/prof already selected
        fetchAvailability()
      }

      // Close suggestions on click outside
      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) suggestions.classList.add('hidden')
      })

    } catch (error) {
      console.error('Erro ao inicializar busca de clientes', error)
    }
  }

  serviceSelect.addEventListener('change', () => {
    updateProfessionalOptions(serviceSelect, professionalSelect)
    timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
    fetchAvailability()
  })

  professionalSelect.addEventListener('change', fetchAvailability)
  dateInput.addEventListener('change', fetchAvailability)

  bookingForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideElement(alertBox)

    if (!serviceSelect.value || !professionalSelect.value || !dateInput.value || !timeSelect.value) {
      showAlert(alertBox, 'Selecione serviço, profissional, data e horário para prosseguir.')
      return
    }

    const payload = {
      serviceId: serviceSelect.value,
      professionalId: professionalSelect.value,
      date: dateInput.value,
      time: timeSelect.value,
      customerName: (document.getElementById('customerName')?.value || '').trim(),
      customerPhone: normalizePhone(document.getElementById('customerPhone')?.value || ''),
      customerEmail: (document.getElementById('customerEmail')?.value || '').trim(),
      notes: (document.getElementById('customerNotes')?.value || '').trim()
    }

    if (!payload.customerName || !payload.customerPhone) {
      showAlert(alertBox, 'Informe nome e telefone para contato via WhatsApp.')
      return
    }

    try {
      setSubmitting(bookingForm, true)
      const response = await apiPost('/appointments', payload, { auth: false })
      renderBookingSummary(response, summaryPanel)
      bookingForm.reset()
      timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
      dateInput.value = minDate
      showElement(summaryPanel)
      summaryWhatsapp.dataset.whatsappLink = response.whatsappLink

      // Auto-open WhatsApp as requested
      if (response.whatsappLink) {
        window.open(response.whatsappLink, '_blank', 'noopener')
      }

      summaryNewBooking.focus()
      hideElement(alertBox)
    } catch (error) {
      showAlert(alertBox, extractErrorMessage(error))
    } finally {
      setSubmitting(bookingForm, false)
      await fetchAvailability()
    }
  })

  summaryWhatsapp.addEventListener('click', (event) => {
    const link = summaryWhatsapp.dataset.whatsappLink
    if (link) {
      window.open(link, '_blank', 'noopener')
    }
  })

  summaryNewBooking.addEventListener('click', () => {
    hideElement(summaryPanel)
    bookingForm.reset()
    dateInput.value = minDate
    timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
    fetchAvailability()
  })

  rebookForm.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideElement(rebookFeedback)

    const code = (document.getElementById('rebookCode')?.value || '').trim()
    const desiredDate = document.getElementById('rebookDate')?.value || ''
    const desiredTime = document.getElementById('rebookTime')?.value || ''
    const note = (document.getElementById('rebookNote')?.value || '').trim()

    if (!code || !desiredDate || !desiredTime) {
      showRebookFeedback(rebookFeedback, 'Informe código, data e horário desejados.', true)
      return
    }

    try {
      const token = getPanelToken()
      if (token) {
        // Admin: Approve directly
        const response = await apiPost(`/appointments/${code}/rebook-approve`, {
          date: desiredDate,
          time: desiredTime
        }, { token })

        rebookForm.reset()

        if (state.activeRebook) {
          await loadAppointments(state.currentFilter)
        }

        // WhatsApp Notification
        if (response.whatsappLink) {
          rebookFeedback.innerHTML = `
            <div class="text-center space-y-3">
              <p class="text-emerald-400 font-bold">Reagendado com sucesso!</p>
              <button onclick="markAsNotified('${response.appointment.id}', '${response.whatsappLink}')" class="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-400">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.54 1.651.712 2.806.712 3.18 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.795zm8.854 1.202c.536 1.362.8 2.884.666 4.417-.168 1.942-1.054 3.738-2.528 5.093l.366 1.25.176.598-2.618-1.554-1.393.755c-1.121.606-2.427.91-3.791.866l-.506-.016c-3.696-.067-6.903-2.695-7.796-6.388-.93-3.844 1.392-7.854 5.143-8.988l.608-.157c1.472-.38 2.946-.226 4.314.398 1.137.519 2.086 1.332 2.83 2.378 1.411 1.984 1.777 4.103 1.157 5.39.022-.057.067-.101.442-.99.584.246 1.168.492 1.752.738.034-.093-.051.126-.441 1.002a7.61 7.61 0 0 0 1.277-2.464 7.622 7.622 0 0 0-.256-4.524l-1.748.742c.205 1.08.163 2.19-.08 3.228a6.398 6.398 0 0 1-1.077 2.072l.966.425z"/></svg>
                Enviar Confirmação WhatsApp
              </button>
              <button onclick="closeRebookModal()" class="block w-full text-xs text-slate-400 hover:text-white mt-2">Fechar</button>
            </div>
           `
          rebookFeedback.classList.remove('hidden')
          rebookFeedback.className = 'mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4'
        } else {
          showRebookFeedback(rebookFeedback, 'Agendamento reagendado com sucesso!', false)
          setTimeout(closeRebookModal, 1500)
        }
      } else {
        // Public: Request
        await apiPost(`/appointments/${code}/rebook-request`, {
          desiredDate,
          desiredTime,
          note: note || undefined
        }, { auth: false })

        rebookForm.reset()
        showRebookFeedback(
          rebookFeedback,
          'Solicitação enviada! A equipe confirmará a nova data pelo WhatsApp.',
          false
        )
      }
    } catch (error) {
      showRebookFeedback(rebookFeedback, extractErrorMessage(error), true)
    }
  })

  await fetchAvailability()

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
      if (serviceSelect.value) {
        query.set('serviceId', serviceSelect.value)
      }
      if (currentCustomDuration) {
        query.set('duration', currentCustomDuration)
      }

      const { slots } = await apiGet(`/availability?${query.toString()}`, { auth: false })
      console.log('[DEBUG] Availability slots received:', slots)
      state.availability = Array.isArray(slots) ? slots : []

      timeSelect.innerHTML = ''
      const placeholder = document.createElement('option')
      placeholder.value = ''
      placeholder.textContent = 'Selecione um horário disponível'
      timeSelect.appendChild(placeholder)

      let availableCount = 0

      state.availability.forEach((slot) => {
        console.log('[DEBUG] Processing slot:', slot)
        const option = document.createElement('option')
        option.value = slot.time
        const formattedTime = formatTime(slot.time)
        console.log('[DEBUG] Formatted time:', formattedTime)

        option.textContent = formattedTime
        if (slot.status !== 'available') {
          option.disabled = true
          option.textContent = `${formattedTime} · Indisponível`
        } else {
          availableCount += 1
        }
        timeSelect.appendChild(option)
      })

      if (availableCount === 0) {
        availabilityInfo.textContent = 'Não há horários livres nessa data. Experimente outra data ou profissional.'
      } else {
        availabilityInfo.textContent = `${availableCount} horários livres para reservar.`
      }
    } catch (error) {
      availabilityInfo.textContent = extractErrorMessage(error)
    }
  }
}

async function initDashboardPage() {
  initLogoutButton() // Ensure logout button is functional
  await ensureCatalogData()
  setupRebookModal()
  attachDashboardListeners()
  initScheduleManager()
  initCalendar()
  await initInternalBooking()

  if (state.panelProtected) {
    const authenticated = await tryAuthenticateWithStoredToken()
    if (!authenticated) {
      window.location.href = '/login'
      return
    }
  }

  await Promise.all([loadAppointments(state.currentFilter), refreshScheduleView()])
}

function setupAuthModal() {
  if (ui.auth.initialized) return

  ui.auth.modal = document.getElementById('authModal')
  ui.auth.form = document.getElementById('authForm')
  ui.auth.input = document.getElementById('authToken')
  ui.auth.feedback = document.getElementById('authFeedback')
  ui.auth.cancel = document.getElementById('authCancel')

  if (!ui.auth.modal || !ui.auth.form || !ui.auth.input || !ui.auth.feedback || !ui.auth.cancel) {
    console.warn('Modal de autenticação não encontrado.')
    return
  }

  ui.auth.form.addEventListener('submit', async (event) => {
    event.preventDefault()
    hideElement(ui.auth.feedback)

    const token = ui.auth.input.value.trim()
    if (!token) {
      showAuthFeedback('Informe o token administrativo.', true)
      return
    }

    try {
      await apiPost('/auth/verify', {}, { token })
      setPanelToken(token)
      hideAuthModal()
      await loadAppointments(state.currentFilter)
    } catch (error) {
      showAuthFeedback(extractErrorMessage(error), true)
      clearPanelToken()
      ui.auth.input.focus()
    }
  })

  ui.auth.cancel.addEventListener('click', (event) => {
    event.preventDefault()
    clearPanelToken()
    ui.auth.input.value = ''
    showAuthFeedback('Autenticação necessária para acessar o painel.', true)
  })

  ui.auth.initialized = true
}

function setupRebookModal() {
  if (ui.rebook.initialized) return

  ui.rebook.modal = document.getElementById('rebookModal')
  ui.rebook.form = document.getElementById('rebookModalForm')
  ui.rebook.date = document.getElementById('rebookModalDate')
  ui.rebook.time = document.getElementById('rebookModalTime')
  ui.rebook.availability = document.getElementById('rebookModalAvailability')
  ui.rebook.feedback = document.getElementById('rebookModalFeedback')
  ui.rebook.cancel = document.getElementById('rebookModalCancel')

  if (!ui.rebook.modal || !ui.rebook.form || !ui.rebook.date || !ui.rebook.time || !ui.rebook.availability || !ui.rebook.feedback || !ui.rebook.cancel) {
    console.warn('Modal de reagendamento não encontrado.')
    return
  }

  ui.rebook.date.addEventListener('change', () => {
    populateRebookModalAvailability().catch(console.error)
  })

  ui.rebook.form.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!state.activeRebook) return

    hideElement(ui.rebook.feedback)

    const date = ui.rebook.date.value
    const time = ui.rebook.time.value

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
        ui.rebook.feedback.innerHTML = `
          <div class="text-center space-y-3">
            <p class="text-emerald-400 font-bold">Reagendado com sucesso!</p>
            <button onclick="markAsNotified('${state.activeRebook.id}', '${response.whatsappLink}')" class="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-400">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.54 1.651.712 2.806.712 3.18 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.768-5.795zm8.854 1.202c.536 1.362.8 2.884.666 4.417-.168 1.942-1.054 3.738-2.528 5.093l.366 1.25.176.598-2.618-1.554-1.393.755c-1.121.606-2.427.91-3.791.866l-.506-.016c-3.696-.067-6.903-2.695-7.796-6.388-.93-3.844 1.392-7.854 5.143-8.988l.608-.157c1.472-.38 2.946-.226 4.314.398 1.137.519 2.086 1.332 2.83 2.378 1.411 1.984 1.777 4.103 1.157 5.39.022-.057.067-.101.442-.99.584.246 1.168.492 1.752.738.034-.093-.051.126-.441 1.002a7.61 7.61 0 0 0 1.277-2.464 7.622 7.622 0 0 0-.256-4.524l-1.748.742c.205 1.08.163 2.19-.08 3.228a6.398 6.398 0 0 1-1.077 2.072l.966.425z"/></svg>
              Enviar Confirmação WhatsApp
            </button>
            <button onclick="closeRebookModal()" class="block w-full text-xs text-slate-400 hover:text-white mt-2">Fechar Janela</button>
          </div>
         `
        ui.rebook.feedback.classList.remove('hidden')
        ui.rebook.feedback.className = 'mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4'

        // Clear form but keep feedback visible
        ui.rebook.form.reset()
      } else {
        closeRebookModal()
      }
    } catch (error) {
      showRebookModalFeedback(extractErrorMessage(error), true)
    }
  })

  ui.rebook.cancel.addEventListener('click', (event) => {
    event.preventDefault()
    closeRebookModal()
  })

  ui.rebook.initialized = true
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
          await apiPost(`/appointments/${id}/confirm`, {})

          // Auto-send confirmation to client via WhatsApp
          const appointment = state.appointments.find((item) => item.id === id)
          if (appointment) {
            const service = state.services.find((s) => s.id === appointment.serviceId)
            const professional = state.professionals.find((p) => p.id === appointment.professionalId)

            const message = `Olá ${appointment.customerName}! Seu agendamento para ${service?.name || 'serviço'} com ${professional?.name || 'nossa equipe'} no dia ${formatDateTime(appointment.date, appointment.time)} foi confirmado! Te esperamos lá.`
            const whatsappUrl = `https://wa.me/${normalizePhone(appointment.customerPhone)}?text=${encodeURIComponent(message)}`

            window.open(whatsappUrl, '_blank', 'noopener')
          }
        } else if (action === 'cancel') {
          await apiPost(`/appointments/${id}/cancel`, {})
        } else if (action === 'open-rebook') {
          const appointment = state.appointments.find((item) => item.id === id)
          if (appointment) {
            openRebookModal(appointment)
          }
        } else if (action === 'delete') {
          if (confirm('Tem certeza que deseja excluir permanentemente este agendamento?')) {
            await apiDelete(`/appointments/${id}`)
            await Promise.all([loadAppointments(state.currentFilter), initCalendar()])
          }
          return
        } else if (action === 'whatsapp') {
          const link = actionButton.dataset.link
          if (link) {
            window.open(link, '_blank', 'noopener')
          }
          return
        }

        await loadAppointments(state.currentFilter)
      } catch (error) {
        if (error?.status === 401) {
          window.location.href = '/login'
          return
        }
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

async function tryAuthenticateWithStoredToken() {
  const stored = window.localStorage.getItem(STORAGE_KEYS.panelToken)
  if (!stored) {
    return false
  }

  try {
    await apiPost('/auth/verify', {}, { token: stored })
    setPanelToken(stored)
    hideAuthModal()
    return true
  } catch (error) {
    clearPanelToken()
    console.warn('Token armazenado inválido.', error)
    return false
  }
}

async function loadAppointments(status = 'all') {
  if (state.panelProtected && !getPanelToken()) {
    window.location.href = '/login'
    return
  }

  const listContainer = document.getElementById('appointmentsList')
  const emptyState = document.getElementById('appointmentsEmpty')

  if (!listContainer || !emptyState) {
    return
  }

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
  const statusLabel = translateStatus(appointment.status)
  const statusStyles = statusStyle(appointment.status)

  const whatsappLink = buildWhatsAppLink(appointment, service, professional)

  // Status badges
  let mainStatusHtml = ''
  if (appointment.status === 'confirmed' && appointment.isRescheduled) {
    mainStatusHtml = `<span class="bg-indigo-500/20 text-indigo-200 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1">🗓️ Reagendado</span>`
  } else {
    mainStatusHtml = `<span class="${statusStyle(appointment.status)} text-xs font-semibold uppercase tracking-wide px-2 py-0.5">${translateStatus(appointment.status)}</span>`
  }

  const notifiedHtml = appointment.client_notified ? `<span class="bg-blue-500/20 text-blue-200 text-xs font-semibold px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">✓ Avisado</span>` : ''
  // const rescheduledHtml = ... (Removed, integrated into main status)

  const wrapper = document.createElement('article')
  wrapper.className = 'rounded-3xl border border-white/10 bg-white/5 p-5'

  wrapper.innerHTML = `
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2 mb-1">
          ${mainStatusHtml}
          ${notifiedHtml}
        </div>
        <h3 class="text-lg font-semibold text-white">${escapeHtml(appointment.customerName)}</h3>
        <p class="text-sm text-slate-300">${escapeHtml(dateTime)}</p>
      </div>
    </div>
    <dl class="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
      <div>
        <dt class="text-xs uppercase tracking-wide text-slate-400">Profissional</dt>
        <dd class="text-white">${escapeHtml(professional?.name || 'Equipe do Estúdio')}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wide text-slate-400">Telefone</dt>
        <dd>${escapeHtml(appointment.customerPhone)}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wide text-slate-400">código</dt>
        <dd>${escapeHtml(appointment.id)}</dd>
      </div>
      <div>
        <dt class="text-xs uppercase tracking-wide text-slate-400">Criado em</dt>
        <dd>${escapeHtml(formatUtcToLocal(appointment.createdAt))}</dd>
      </div>
    </dl>
    ${appointment.notes
      ? `<p class="mt-3 text-sm text-slate-200/80">Observações: ${escapeHtml(appointment.notes)}</p>`
      : ''
    }
    ${appointment.rebookRequest
      ? `<div class="mt-4 rounded-2xl border border-amber-300/40 bg-amber-400/10 p-3 text-xs text-amber-100">Cliente solicitou reagendamento para <strong>${escapeHtml(
        formatDateTime(
          appointment.rebookRequest.desiredDate,
          appointment.rebookRequest.desiredTime
        )
      )}</strong>${appointment.rebookRequest.note
        ? ` com a observação: ${escapeHtml(appointment.rebookRequest.note)}`
        : ''
      }.</div>`
      : ''
    }
    <div class="mt-5 flex flex-wrap gap-3">
      ${renderAppointmentActions(appointment)}
      <button
        class="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/30"
        type="button"
        data-action="whatsapp"
        data-id="${appointment.id}"
        data-link="${whatsappLink}"
      >
        Abrir WhatsApp
      </button>
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

  if (appointment.status === 'rebook_requested') {
    actions.push(
      `<button class="rounded-full bg-pink-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-pink-400" type="button" data-action="open-rebook" data-id="${appointment.id}">Selecionar nova data</button>`
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

function openRebookModal(appointment) {
  if (!ui.rebook.modal || !ui.rebook.form || !ui.rebook.date || !ui.rebook.time || !ui.rebook.availability || !ui.rebook.feedback) {
    return
  }

  state.activeRebook = appointment
  const codeInput = document.getElementById('rebookCode')
  if (codeInput) codeInput.value = appointment.id

  ui.rebook.date.value = appointment.rebookRequest?.desiredDate || appointment.date
  ui.rebook.time.innerHTML = '<option value="">Selecione um horário disponível</option>'
  ui.rebook.availability.textContent = 'Carregando disponibilidade...'
  hideElement(ui.rebook.feedback)

  showModal(ui.rebook.modal)

  populateRebookModalAvailability().catch((error) => {
    showRebookModalFeedback(extractErrorMessage(error), true)
  })
}

function closeRebookModal() {
  if (!ui.rebook.modal) return
  hideModal(ui.rebook.modal)
  state.activeRebook = null
}

async function populateRebookModalAvailability() {
  if (!state.activeRebook || !ui.rebook.date || !ui.rebook.time || !ui.rebook.availability) return

  const date = ui.rebook.date.value
  if (!date) return

  ui.rebook.availability.textContent = 'Carregando disponibilidade...'
  ui.rebook.time.innerHTML = '<option value="">Selecione um horário disponível</option>'

  const params = new URLSearchParams({
    professionalId: state.activeRebook.professionalId,
    date,
    serviceId: state.activeRebook.serviceId,
    ignoreAppointmentId: state.activeRebook.id
  })

  const { slots } = await apiGet(`/availability?${params.toString()}`, { auth: false })
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
    ui.rebook.time.appendChild(option)
  })

  if (availableCount === 0) {
    ui.rebook.availability.textContent = 'não há horários livres para esta data.'
  } else {
    ui.rebook.availability.textContent = `${availableCount} horários livres encontrados.`
  }
}

function showAuthModal() {
  window.location.href = '/login'
}

function hideAuthModal() {
  // No-op
}

function showAuthFeedback(message) {
  if (!ui.auth.feedback) return
  ui.auth.feedback.textContent = message
  ui.auth.feedback.classList.remove('hidden')
}

function showRebookModalFeedback(message, isError) {
  if (!ui.rebook.feedback) return
  ui.rebook.feedback.textContent = message
  ui.rebook.feedback.classList.remove('hidden')
  ui.rebook.feedback.classList.toggle('border-red-300', isError)
  ui.rebook.feedback.classList.toggle('bg-red-50', isError)
  ui.rebook.feedback.classList.toggle('text-red-600', isError)
  ui.rebook.feedback.classList.toggle('border-emerald-300', !isError)
  ui.rebook.feedback.classList.toggle('bg-emerald-50', !isError)
  ui.rebook.feedback.classList.toggle('text-emerald-700', !isError)
}

function showModal(element) {
  element.classList.remove('hidden')
  document.body.classList.add('modal-open')
}

function hideModal(element) {
  element.classList.add('hidden')
  document.body.classList.remove('modal-open')
}

function populateServiceOptions(select) {
  if (!select) return
  select.innerHTML = '<option value="">Selecione um serviço</option>'
  state.services.forEach((service) => {
    const option = document.createElement('option')
    option.value = service.id
    option.textContent = `${service.name}`
    select.appendChild(option)
  })
}

function populateProfessionalOptions(select) {
  if (!select) return
  select.innerHTML = '<option value="">Selecione a profissional</option>'
  state.professionals.forEach((professional) => {
    const option = document.createElement('option')
    option.value = professional.id
    option.textContent = professional.name
    select.appendChild(option)
  })
}

function updateProfessionalOptions(serviceSelect, professionalSelect) {
  if (!serviceSelect || !professionalSelect) return

  const previousValue = professionalSelect.value
  const selectedService = state.services.find((service) => service.id === serviceSelect.value)

  // Re-populate all options (this resets the selection)
  populateProfessionalOptions(professionalSelect)

  if (selectedService) {
    // Disable professionals who don't perform this service
    Array.from(professionalSelect.options).forEach((option) => {
      if (!option.value) return
      if (!selectedService.professionalIds.includes(option.value)) {
        option.disabled = true
        option.textContent = `${option.textContent} (indisponível)`
      } else {
        option.disabled = false
        option.textContent = option.textContent.replace(' (indisponível)', '')
      }
    })

    // Try to restore previous selection if it's still valid/enabled
    const previousOption = Array.from(professionalSelect.options).find(
      (opt) => opt.value === previousValue && !opt.disabled && opt.value !== ''
    )

    if (previousOption) {
      professionalSelect.value = previousValue
    } else {
      // If previous selection is now invalid, select the first available one
      const firstEnabledOption = Array.from(professionalSelect.options).find((opt) => !opt.disabled && opt.value)
      if (firstEnabledOption) {
        professionalSelect.value = firstEnabledOption.value
      } else {
        professionalSelect.value = ''
      }
    }
  }
}

async function apiGet(path, options = {}) {
  const headers = {
    Accept: 'application/json'
  }

  if (options.auth !== false) {
    const token = options.token || getPanelToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers
  })

  return handleApiResponse(response)
}

async function apiPost(path, body, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  if (options.auth !== false) {
    const token = options.token || getPanelToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  return handleApiResponse(response)
}

async function apiPatch(path, body, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  if (options.auth !== false) {
    const token = options.token || getPanelToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body)
  })

  return handleApiResponse(response)
}

async function apiPut(path, body, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  if (options.auth !== false) {
    const token = options.token || getPanelToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  })

  return handleApiResponse(response)
}

async function apiDelete(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }

  if (options.auth !== false) {
    const token = options.token || getPanelToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers
  })

  return handleApiResponse(response)
}

async function handleApiResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const isJSON = contentType.includes('application/json')
  const data = isJSON ? await response.json() : null

  if (!response.ok) {
    const error = new Error(data?.message || response.statusText)
    error.status = response.status
    error.response = data
    throw error
  }

  return data
}

function setPanelToken(token) {
  state.adminToken = token
  window.localStorage.setItem(STORAGE_KEYS.panelToken, token)
}

function getPanelToken() {
  return state.adminToken || window.localStorage.getItem(STORAGE_KEYS.panelToken) || ''
}

function clearPanelToken() {
  state.adminToken = null
  window.localStorage.removeItem(STORAGE_KEYS.panelToken)
}

function renderBookingSummary(response, container) {
  if (!container || !response?.appointment) return

  const { appointment } = response
  const service = state.services.find((item) => item.id === appointment.serviceId)
  const professional = state.professionals.find((item) => item.id === appointment.professionalId)

  const codeEl = container.querySelector('[data-summary="code"]')
  const professionalEl = container.querySelector('[data-summary="professional"]')
  const serviceEl = container.querySelector('[data-summary="service"]')
  const datetimeEl = container.querySelector('[data-summary="datetime"]')

  if (codeEl) codeEl.textContent = appointment.id
  if (professionalEl) professionalEl.textContent = professional?.name || 'Equipe'
  if (serviceEl) serviceEl.textContent = service?.name || 'serviço'
  if (datetimeEl) datetimeEl.textContent = formatDateTime(appointment.date, appointment.time)
}

function showAlert(element, message) {
  element.textContent = message
  element.classList.remove('hidden')
}

function setSubmitting(form, submitting) {
  const submitButton = form.querySelector('button[type="submit"]')
  if (!submitButton) return
  submitButton.disabled = submitting
  submitButton.textContent = submitting ? 'Enviando...' : 'Enviar pedido de agendamento'
}

function initCalendar() {
  const prevBtn = document.getElementById('prevMonth')
  const nextBtn = document.getElementById('nextMonth')
  const clearBtn = document.getElementById('clearDateFilter')

  if (prevBtn) prevBtn.onclick = () => changeCalendarMonth(-1)
  if (nextBtn) nextBtn.onclick = () => changeCalendarMonth(1)
  if (clearBtn) clearBtn.addEventListener('click', clearCalendarFilter)

  renderCalendar()
}

function changeCalendarMonth(delta) {
  state.calendar.month += delta
  if (state.calendar.month > 11) {
    state.calendar.month = 0
    state.calendar.year++
  } else if (state.calendar.month < 0) {
    state.calendar.month = 11
    state.calendar.year--
  }
  renderCalendar()
}

function renderCalendar() {
  const grid = document.getElementById('calendarDays')
  const label = document.getElementById('currentMonthLabel')

  if (!grid || !label) return

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  label.textContent = `${monthNames[state.calendar.month]} ${state.calendar.year}`

  grid.innerHTML = ''

  const firstDay = new Date(state.calendar.year, state.calendar.month, 1).getDay()
  const daysInMonth = new Date(state.calendar.year, state.calendar.month + 1, 0).getDate()

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
    const dateStr = `${state.calendar.year}-${String(state.calendar.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const day = document.createElement('div')

    // Check if there are appointments
    const count = state.appointments.filter(a => a.date === dateStr && a.status !== 'cancelled').length

    // Build class names
    let classes = []

    if (count > 0) {
      classes.push('has-appointments')
    }

    if (state.calendar.selectedDate === dateStr) {
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
  state.calendar.selectedDate = date
  renderCalendar() // Re-render to update selection style

  const display = document.getElementById('selectedDateDisplay')
  const value = document.getElementById('selectedDateValue')
  if (display && value) {
    value.textContent = formatDateTime(date, '00:00').split(' Ã s ')[0]
    display.classList.remove('hidden')
  }

  loadAppointments(state.currentFilter)
}

function clearCalendarFilter() {
  state.calendar.selectedDate = null
  renderCalendar()

  const display = document.getElementById('selectedDateDisplay')
  if (display) display.classList.add('hidden')

  loadAppointments(state.currentFilter)
}


function showElement(element) {
  element.classList.remove('hidden')
}

function hideElement(element) {
  if (element) element.classList.add('hidden')
}

function formatUtcToLocal(utcDateString) {
  if (!utcDateString) return ''
  const isoString = utcDateString.includes('Z') ? utcDateString : utcDateString.replace(' ', 'T') + 'Z'
  const instance = new Date(isoString)
  return instance.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', weekday: 'short', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })
}

function showRebookFeedback(element, message, isError) {
  element.textContent = message
  element.classList.remove('hidden')
  element.classList.toggle('border-red-400/40', isError)
  element.classList.toggle('bg-red-500/10', isError)
  element.classList.toggle('text-red-100', isError)
  element.classList.toggle('border-white/20', !isError)
  element.classList.toggle('bg-white/10', !isError)
  element.classList.toggle('text-white', !isError)
}

function translateStatus(status) {
  switch (status) {
    case 'pending':
      return 'Pendente'
    case 'confirmed':
      return 'Confirmado'
    case 'cancelled':
      return 'Cancelado'
    case 'rebook_requested':
      return 'Reagendamento solicitado'
    default:
      return 'Status desconhecido'
  }
}

function statusStyle(status) {
  switch (status) {
    case 'pending':
      return 'rounded-full bg-amber-400/20 px-4 py-1 text-amber-100'
    case 'confirmed':
      return 'rounded-full bg-green-500/20 px-4 py-1 text-green-400 border border-green-500/30'
    case 'cancelled':
      return 'rounded-full bg-red-500/20 px-4 py-1 text-red-100'
    case 'rebook_requested':
      return 'rounded-full bg-pink-500/20 px-4 py-1 text-pink-100'
    default:
      return 'rounded-full bg-slate-500/20 px-4 py-1 text-slate-200'
  }
}

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTime(date, time) {
  if (!date || !time) return ''
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const instance = new Date(year, month - 1, day, hour, minute)
  return instance.toLocaleString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatTime(time) {
  const [hour, minute] = time.split(':')
  return `${hour}:${minute}`
}

function normalizePhone(raw) {
  return raw.replace(/\D/g, '')
}

function extractErrorMessage(error) {
  if (!error) return 'Ocorreu um erro inesperado.'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && 'message' in error) return String(error.message)
  return 'não foi possível concluir a operação.'
}

function escapeHtml(value) {
  if (value == null) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildWhatsAppLink(appointment, service, professional) {
  const formattedDate = formatDateTime(appointment.date, appointment.time)
  const formattedTime = appointment.time
  const statusLabel = translateStatus(appointment.status)

  // Ensure phone has country code (BR)
  let phone = normalizePhone(appointment.customerPhone || '')
  if (phone.length === 10 || phone.length === 11) {
    phone = '55' + phone
  }

  const lines = [
    `Ola ${appointment.customerName}, aqui e do Estudio Aline Andrade.`,
    '',
    `Seu agendamento para *${service?.name || 'servico'}* com *${professional?.name || 'Equipe'}* esta *${statusLabel}*.`,
    '',
    `Data: ${formattedDate}`,
    `Horario: ${formattedTime}`,
    '',
    'Te esperamos la.'
  ]

  if (appointment.status === 'rebook_requested' && appointment.rebookRequest) {
    const rebookDate = formatDateTime(
      appointment.rebookRequest.desiredDate,
      appointment.rebookRequest.desiredTime
    )
    lines.push('', `Solicitacao de Reagendamento para: ${rebookDate}`)
  }

  // Internal link: Studio -> Client
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`
}


function initScheduleManager() {
  ui.schedule.section = document.getElementById('scheduleSection')
  ui.schedule.professionalSelect = document.getElementById('scheduleProfessionalSelect')
  ui.schedule.intervalInput = document.getElementById('scheduleInterval')
  ui.schedule.form = document.getElementById('availabilityForm')
  ui.schedule.feedback = document.getElementById('availabilityFeedback')
  ui.schedule.saveButton = document.getElementById('saveAvailability')

  // Time Off Elements
  ui.schedule.timeOffForm = document.getElementById('timeOffForm')
  ui.schedule.timeOffList = document.getElementById('timeOffList')
  ui.schedule.timeOffFeedback = document.getElementById('timeOffFeedback')

  if (!ui.schedule.professionalSelect) return // Not on dashboard or schedule section hidden

  // Populate professionals
  populateProfessionalOptions(ui.schedule.professionalSelect)

  // Listeners
  ui.schedule.professionalSelect.addEventListener('change', refreshScheduleView)

  if (ui.schedule.saveButton) {
    ui.schedule.saveButton.addEventListener('click', saveSchedule)
  }

  if (ui.schedule.form) {
    // Delegate clear clicks
    ui.schedule.form.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-role="clear"]')
      if (btn) {
        const row = btn.closest('tr')
        if (row) {
          const start = row.querySelector('[data-role="start"]')
          const end = row.querySelector('[data-role="end"]')
          if (start) start.value = ''
          if (end) end.value = ''
        }
      }
    })
  }

  if (ui.schedule.timeOffForm) {
    ui.schedule.timeOffForm.addEventListener('submit', createTimeOffBlock)
  }

  // Initial load
  if (ui.schedule.professionalSelect.options.length > 1) {
    ui.schedule.professionalSelect.selectedIndex = 1
    refreshScheduleView()
  }
}

function formatDateString(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
  return `${day} de ${months[parseInt(month) - 1]}`
}

async function refreshScheduleView() {
  if (!ui.schedule.professionalSelect.value) return

  const professionalId = ui.schedule.professionalSelect.value
  const professionalName = ui.schedule.professionalSelect.options[ui.schedule.professionalSelect.selectedIndex].text

  // Update visual confirmation in Time Off form
  const timeOffBtn = document.querySelector('#timeOffForm button[type="submit"]')
  if (timeOffBtn) {
    timeOffBtn.textContent = `Cadastrar bloqueio para ${professionalName.split(' ')[0]}`
  }

  try {
    const { availability, timeOff } = await apiGet(`/professionals/${professionalId}/schedule`)

    state.schedule = availability || []
    state.timeOff = timeOff || []

    renderScheduleForm()
    renderTimeOffList()
  } catch (error) {
    console.error('Erro ao carregar agenda:', error)
  }
}

function renderScheduleForm() {
  if (!ui.schedule.form) return

  // Reset all rows first
  const rows = ui.schedule.form.querySelectorAll('tr[data-weekday]')
  rows.forEach(row => {
    const start = row.querySelector('[data-role="start"]')
    const end = row.querySelector('[data-role="end"]')
    if (start) start.value = ''
    if (end) end.value = ''
  })

  // Fill from state
  state.schedule.forEach(slot => {
    const row = ui.schedule.form.querySelector(`tr[data-weekday="${slot.weekday}"]`)
    if (!row) return

    const start = row.querySelector('[data-role="start"]')
    const end = row.querySelector('[data-role="end"]')

    if (start) start.value = slot.startTime
    if (end) end.value = slot.endTime
  })
}

async function saveSchedule(event) {
  event.preventDefault()
  if (!ui.schedule.professionalSelect.value) return

  const professionalId = ui.schedule.professionalSelect.value
  const availability = []
  const slotInterval = ui.schedule.intervalInput ? Number(ui.schedule.intervalInput.value) : 30

  // Collect data
  const rows = ui.schedule.form.querySelectorAll('tr[data-weekday]')
  rows.forEach(row => {
    const weekday = parseInt(row.dataset.weekday)
    const start = row.querySelector('[data-role="start"]').value
    const end = row.querySelector('[data-role="end"]').value

    if (start && end) {
      availability.push({
        weekday,
        startTime: start,
        endTime: end,
        slotInterval: slotInterval > 0 ? slotInterval : 30
      })
    }
  })

  try {
    ui.schedule.saveButton.textContent = 'Salvando...'
    ui.schedule.saveButton.disabled = true

    await fetch(`${API_BASE}/professionals/${professionalId}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getPanelToken()}`
      },
      body: JSON.stringify({ availability })
    })

    if (ui.schedule.feedback) {
      ui.schedule.feedback.textContent = 'Grade semanal atualizada com sucesso!'
      ui.schedule.feedback.classList.remove('hidden')
      setTimeout(() => ui.schedule.feedback.classList.add('hidden'), 3000)
    }
  } catch (error) {
    alert('Erro ao salvar: ' + extractErrorMessage(error))
  } finally {
    ui.schedule.saveButton.textContent = 'Salvar grade semanal'
    ui.schedule.saveButton.disabled = false
  }
}

async function createTimeOffBlock(event) {
  event.preventDefault()
  const professionalId = ui.schedule.professionalSelect.value
  if (!professionalId) return

  const date = document.getElementById('timeOffDate').value
  const start = document.getElementById('timeOffStart').value
  const end = document.getElementById('timeOffEnd').value
  const note = document.getElementById('timeOffNote').value

  const feedback = ui.schedule.timeOffFeedback

  try {
    await apiPost(`/professionals/${professionalId}/time-off`, {
      date, startTime: start, endTime: end, note
    })

    // Refresh
    await refreshScheduleView()

    // Reset form
    event.target.reset()

    if (feedback) {
      feedback.textContent = 'Bloqueio criado com sucesso!'
      feedback.classList.remove('hidden')
      setTimeout(() => feedback.classList.add('hidden'), 3000)
    }
  } catch (error) {
    if (feedback) {
      feedback.textContent = extractErrorMessage(error)
      feedback.classList.remove('hidden')
      // Ideally change style to error, but reusing success style for simplicity unless adding toggle logic
      // For now, let's just alert if feedback area is complex to styling toggle
      alert(extractErrorMessage(error))
    } else {
      alert(extractErrorMessage(error))
    }
  }
}

function renderTimeOffList() {
  if (!ui.schedule.timeOffList) return

  ui.schedule.timeOffList.innerHTML = ''

  const blocks = Array.isArray(state.timeOff) ? state.timeOff : []

  if (blocks.length === 0) {
    ui.schedule.timeOffList.innerHTML = '<p class="text-xs text-slate-400">Nenhum bloqueio cadastrado.</p>'
    return
  }

  blocks.forEach(block => {
    const item = document.createElement('div')
    item.className = 'flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg mb-2'
    item.innerHTML = `
            <div>
                <p class="text-white text-sm font-medium">${formatDateString(block.date)} · ${block.startTime} - ${block.endTime}</p>
                <p class="text-xs text-slate-400">${block.note || 'Bloqueio administrativo'}</p>
            </div>
            <button class="text-red-400 hover:text-red-300 text-xs px-2 py-1" onclick="deleteTimeOff(${block.id})">Remover</button>
        `
    ui.schedule.timeOffList.appendChild(item)
  })
}

async function deleteTimeOff(id) {
  if (!confirm('Remover este bloqueio?')) return
  const professionalId = ui.schedule.professionalSelect.value

  try {
    await apiDelete(`/professionals/${professionalId}/time-off/${id}`)
    refreshScheduleView()
  } catch (error) {
    alert(extractErrorMessage(error))
  }
}

window.deleteTimeOff = deleteTimeOff



// ==========================================
// Clients Page Logic
// ==========================================

async function initClientsPage() {
  const token = getPanelToken()
  if (!token) {
    window.location.href = '/login'
    return
  }

  const listContainer = document.getElementById('clientsList')
  const searchInput = document.getElementById('clientSearch')
  const addBtn = document.getElementById('addClientBtn')

  // Modal elements
  const modal = document.getElementById('clientModal')
  const form = document.getElementById('clientForm')
  const cancelBtn = document.getElementById('clientCancel')
  const feedback = document.getElementById('clientFeedback')
  const procedureSelect = document.getElementById('clientProcedure')

  if (!listContainer) return

  // Ensure we have catalog data
  await ensureCatalogData()

  // Populate procedures
  procedureSelect.innerHTML = '<option value="">Selecione...</option>'
  state.services.forEach(s => {
    const opt = document.createElement('option')
    opt.value = s.id
    opt.textContent = s.name
    procedureSelect.appendChild(opt)
  })

  // Load clients
  loadClients()

  async function loadClients(search = '') {
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await fetch(`${API_BASE}/clients${q}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Falha ao carregar clientes')
      const data = await res.json()
      renderClients(data.clients || [])
    } catch (error) {
      console.error(error)
      listContainer.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">Erro ao carregar clientes.</td></tr>'
    }
  }

  function renderClients(clients) {
    if (clients.length === 0) {
      listContainer.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-500">Nenhum cliente encontrado.</td></tr>'
      return
    }

    listContainer.innerHTML = clients.map(client => `
      <tr class="hover:bg-white/5 transition">
        <td class="px-4 py-3 font-medium text-white">${escapeHtml(client.name)}</td>
        <td class="px-4 py-3 text-slate-300">${escapeHtml(client.phone)}</td>
        <td class="px-4 py-3 text-slate-400 text-xs max-w-xs truncate">${escapeHtml(client.notes || '-')}</td>
        <td class="px-4 py-3 text-right">
          <button onclick="editClient('${client.id}')" class="text-pink-400 hover:text-pink-300 text-xs px-2 py-1 mr-2">Editar</button>
          <button onclick="deleteClient('${client.id}')" class="text-red-400 hover:text-red-300 text-xs px-2 py-1">Excluir</button>
        </td>
      </tr>
    `).join('')

    // Attach event handlers to dynamic buttons if needed, or use global references
    // Since we use onclick="editClient", we need to expose these functions to window
  }

  // Search handler
  let debounceTimer
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      loadClients(e.target.value)
    }, 300)
  })

  // Modal handlers
  function openModal(client = null) {
    feedback.classList.add('hidden')
    form.reset()
    document.getElementById('clientId').value = ''
    document.getElementById('clientModalTitle').textContent = client ? 'Editar Cliente' : 'Novo Cliente'

    if (client) {
      document.getElementById('clientId').value = client.id
      document.getElementById('clientName').value = client.name
      document.getElementById('clientPhone').value = client.phone
      document.getElementById('clientCPF').value = client.cpf || ''
      document.getElementById('clientNotes').value = client.notes || ''
      document.getElementById('clientProcedure').value = client.procedureId || ''
      document.getElementById('clientAvgTime').value = client.avgTimeMinutes || ''
    }

    modal.classList.remove('hidden')
  }

  function closeModal() {
    modal.classList.add('hidden')
  }

  addBtn.addEventListener('click', () => openModal())
  cancelBtn.addEventListener('click', closeModal)

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    feedback.classList.add('hidden')

    const id = document.getElementById('clientId').value
    const payload = {
      name: document.getElementById('clientName').value,
      phone: document.getElementById('clientPhone').value,
      cpf: document.getElementById('clientCPF').value || null,
      notes: document.getElementById('clientNotes').value,
      procedureId: document.getElementById('clientProcedure').value || null,
      avgTimeMinutes: document.getElementById('clientAvgTime').value || null
    }

    try {
      let res
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      if (id) {
        res = await fetch(`${API_BASE}/clients/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${API_BASE}/clients`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar')

      closeModal()
      loadClients(searchInput.value)
    } catch (error) {
      feedback.textContent = error.message
      feedback.classList.remove('hidden')
    }
  })

  // Expose helpers globally
  window.editClient = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/clients?search=`, { headers: { 'Authorization': `Bearer ${token}` } })
      // A bit inefficient to fetch all, better to fetch one if endpoint exists, but we can filter from existing list in memory strictly speaking
      // For now let's just use the loadClients data if we had it, but simplified: assume we fetch fresh or use a get endpoint if made.
      // We made a list endpoint.
      // Let's just PUT/POST based on the row data? No, we need full data.
      // Since we don't have GET /clients/:id explicitly exposed in my previous step (I only added list, post, put, delete), I will rely on the list data or fetch list again.
      // Wait, I didn't add GET /clients/:id route in index.tsx?
      // let me check index.tsx changes.
      // I added: GET /api/clients (list), POST /api/clients, PUT /api/clients/:id, DELETE /api/clients/:id.
      // So I can't fetch single client easily by ID unless I filter the list.
      // I'll fetch the list again with the specific ID? No, search param searches by name/phone.
      // I'll just iterate the rows currently in DOM? No.
      // I will assume I can pass the client object entirely to render? No, string interpolation.
      // Best way: Store clients in state variable.

      const resList = await fetch(`${API_BASE}/clients`, { headers: { 'Authorization': `Bearer ${token}` } })
      const data = await resList.json()
      const client = data.clients.find(c => c.id === id)
      if (client) openModal(client)
    } catch (e) { console.error(e) }
  }

  window.deleteClient = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return
    try {
      await apiDelete(`/clients/${id}`)
      loadClients(searchInput.value)
    } catch (error) {
      alert('Erro ao excluir cliente')
    }
  }
}

// ==========================================
// Internal Booking Logic (Dashboard Modal)
// ==========================================
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
    // Reset form on open
    form.reset()
    timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
    // Ensure form elements are visible and feedback is hidden
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

  // ---------------------------------------------------------
  // Reusing Logic for Options & Availability
  // ---------------------------------------------------------

  populateServiceOptions(serviceSelect)
  populateProfessionalOptions(professionalSelect)

  serviceSelect.addEventListener('change', () => {
    updateProfessionalOptions(serviceSelect, professionalSelect)

    // Update price input default
    const service = state.services.find(s => s.id === serviceSelect.value)
    const priceInput = document.getElementById('priceInput')
    if (service && priceInput) {
      // priceCents is from backend (Service type)
      priceInput.value = (service.priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
    fetchAvailability()
  })

  professionalSelect.addEventListener('change', fetchAvailability)
  dateInput.addEventListener('change', fetchAvailability)

  let currentCustomDuration = null

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
      if (currentCustomDuration) query.set('duration', currentCustomDuration)

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

  // ---------------------------------------------------------
  // Price Input Injection (before Client Lookup)
  // ---------------------------------------------------------
  try {
    const priceContainer = document.createElement('div')
    priceContainer.className = 'grid gap-2 mb-4' // Add margin bottom
    priceContainer.innerHTML = `
        <label class="text-sm font-medium text-slate-200" for="priceInput">
          Valor (R$)
        </label>
        <input
          id="priceInput"
          type="text"
          class="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-300/80"
          placeholder="R$ 0,00"
        />
     `
    // Insert after professional select container (which is typically the 2nd child in the form grid if we consider labels)
    // Actually let's replicate the structure:
    const form = document.getElementById('bookingForm')
    const professionalSelect = document.getElementById('professionalSelect') // This is the SELECT, not the container
    if (professionalSelect && professionalSelect.parentElement) {
      // professionalSelect.parentElement is the div with grid/gap around the select
      // We want to insert AFTER that div.
      professionalSelect.parentElement.insertAdjacentElement('afterend', priceContainer)
    }
  } catch (e) { console.error('Error injecting price input', e) }

  // ---------------------------------------------------------
  // Client Lookup Injection
  // ---------------------------------------------------------
  try {
    const container = document.createElement('div')
    container.className = 'p-3 rounded-xl bg-slate-800/50 border border-slate-700'
    container.innerHTML = `
      <label class="block text-sm font-medium text-slate-300 mb-2">Buscar Cliente Cadastrado</label>
      <div class="relative">
        <input type="text" id="internalClientLookup" placeholder="Nome, telefone ou CPF..." class="w-full rounded-xl border-white/10 bg-slate-900 px-4 py-2 text-sm text-white outline-none focus:border-pink-500">
        <div id="internalClientSuggestions" class="hidden absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-slate-800 rounded-xl shadow-xl border border-slate-700 z-50"></div>
      </div>
    `
    // Insert before Name input (which is roughly the 4th child group in the form)
    // Finding the "customerName" parent div
    const nameInput = document.getElementById('customerName')
    if (nameInput) {
      const parent = nameInput.parentElement
      form.insertBefore(container, parent)
    }

    const lookupInput = container.querySelector('#internalClientLookup')
    const suggestions = container.querySelector('#internalClientSuggestions')

    let debounce = null
    lookupInput.addEventListener('input', (e) => {
      clearTimeout(debounce)
      const term = e.target.value
      if (term.length < 2) {
        suggestions.classList.add('hidden')
        return
      }
      debounce = setTimeout(async () => {
        try {
          const res = await apiGet(`/clients?search=${encodeURIComponent(term)}`)
          renderInternalSuggestions(res.clients || [])
        } catch (e) { }
      }, 300)
    })

    function renderInternalSuggestions(list) {
      suggestions.innerHTML = ''
      if (list.length === 0) {
        suggestions.classList.add('hidden')
        return
      }
      list.forEach(c => {
        const div = document.createElement('div')
        div.className = 'px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-200'
        div.textContent = `${c.name} - ${c.phone}${c.cpf ? ' - ' + c.cpf : ''}`
        div.onclick = () => {
          selectClient(c)
          suggestions.classList.add('hidden')
          lookupInput.value = ''
        }
        suggestions.appendChild(div)
      })
      suggestions.classList.remove('hidden')
    }

    function selectClient(client) {
      document.getElementById('customerName').value = client.name
      document.getElementById('customerPhone').value = client.phone
      if (client.notes) document.getElementById('customerNotes').value = client.notes

      if (client.procedureId && serviceSelect.querySelector(`option[value="${client.procedureId}"]`)) {
        serviceSelect.value = client.procedureId
        updateProfessionalOptions(serviceSelect, professionalSelect)
      }

      if (client.avgTimeMinutes) {
        currentCustomDuration = client.avgTimeMinutes
        alertBox.textContent = `Tempo personalizado: ${client.avgTimeMinutes}min`
        alertBox.classList.remove('hidden')
      } else {
        currentCustomDuration = null
        alertBox.classList.add('hidden')
      }
      fetchAvailability()
    }

    function formatCurrency(cents) {
      return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    function parseCurrency(str) {
      return parseInt(str.replace(/\D/g, ''), 10)
    }

    // Money input mask
    const priceInput = document.getElementById('priceInput')
    if (priceInput) {
      priceInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '')
        value = (parseInt(value, 10) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        if (value === 'R$ NaN') value = ''
        e.target.value = value
      })
    }

  } catch (e) { console.error(e) }

  // ---------------------------------------------------------
  // Form Submission
  // ---------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    alertBox.classList.add('hidden')

    // Parse price safely
    const priceVal = document.getElementById('priceInput')?.value
    let priceCents = undefined
    if (priceVal) {
      // Remove non-digits and parse
      const numeric = parseInt(priceVal.replace(/\D/g, ''), 10)
      if (!isNaN(numeric)) {
        priceCents = numeric
      }
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
      // Call with auth (default behavior of apiPost if token exists)
      const response = await apiPost('/appointments', payload)

      // Success!
      form.classList.add('hidden') // Hide the form itself

      // Refresh list
      await loadAppointments(state.currentFilter)
      await initCalendar()

      // Show success state in the modal
      availabilityInfo.className = 'p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center'
      availabilityInfo.innerHTML = `
        <div class="flex flex-col items-center justify-center gap-3">
            <div class="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg class="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h3 class="text-lg font-bold text-white">Agendamento Realizado!</h3>
            ${response.whatsappLink ?
          `<a href="#" onclick="markAsNotified('${response.appointment.id}', '${response.whatsappLink}')" class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-full transition text-sm">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Enviar no WhatsApp
            </a>` : ''
        }
            <button id="resetBookingForm" class="text-sm text-slate-400 hover:text-white underline mt-2">Fazer novo agendamento</button>
        </div>

      `

      // Hide submit button to prevent double submit
      const submitBtn = form.querySelector('button[type="submit"]')
      if (submitBtn) submitBtn.classList.add('hidden')

      // Handle reset click
      document.getElementById('resetBookingForm').addEventListener('click', (ev) => {
        ev.preventDefault()
        form.reset()
        form.classList.remove('hidden') // Show form again
        availabilityInfo.textContent = 'Selecione a data para ver os horários disponíveis.'
        availabilityInfo.className = "rounded-2xl border border-pink-300/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-100"
        if (submitBtn) submitBtn.classList.remove('hidden')
        timeSelect.innerHTML = '<option value="">Selecione um horário disponível</option>'
        currentCustomDuration = null // Reset custom duration
        alertBox.classList.add('hidden') // Hide custom duration alert
      })

    } catch (error) {
      alertBox.textContent = extractErrorMessage(error)
      alertBox.classList.remove('hidden')
    } finally {
      setSubmitting(form, false)
    }
  })
}

// Helper to mark as notified
window.markAsNotified = async (id, link) => {
  if (link) window.open(link, '_blank', 'noopener')

  try {
    await apiPost(`/appointments/${id}/notify`, {}, { token: getPanelToken() })
    // Refresh list if visible
    if (state.appointments && state.appointments.length) {
      // Optimistic update
      const app = state.appointments.find(a => a.id === id)
      if (app) app.client_notified = true
      loadAppointments(state.currentFilter)
    }
  } catch (e) { console.error('Failed to mark notified', e) }
}

// ==========================================
// Financial Page Logic
// ==========================================
async function initFinancialPage() {
  const monthInput = document.getElementById('financialMonth')
  const refreshBtn = document.getElementById('refreshFinancial')
  const professionalSelect = document.getElementById('financialProfessional')
  const generatePdfBtn = document.getElementById('generatePdfBtn')
  const tableBody = document.getElementById('financialTableBody')
  const emptyState = document.getElementById('financialEmpty')
  const totalPaidEl = document.getElementById('totalPaid')
  const totalPendingEl = document.getElementById('totalPending')

  if (!monthInput || !tableBody) return

  // Store current appointments for PDF generation
  let currentAppointments = []
  let allProfessionals = []

  // Set default month to current
  const now = new Date()
  const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  const currentMonth = brazilTime.toISOString().slice(0, 7) // YYYY-MM
  monthInput.value = currentMonth

  // Load professionals for dropdown
  async function loadProfessionals() {
    try {
      const res = await apiGet('/professionals', { auth: false })
      allProfessionals = res.professionals || []

      professionalSelect.innerHTML = '<option value="">Todos os Profissionais</option>'
      allProfessionals.forEach(prof => {
        const option = document.createElement('option')
        option.value = prof.id
        option.textContent = prof.name
        professionalSelect.appendChild(option)
      })
    } catch (error) {
      console.error('Error loading professionals', error)
    }
  }

  refreshBtn.addEventListener('click', () => loadFinancialData())
  monthInput.addEventListener('change', () => loadFinancialData())
  professionalSelect.addEventListener('change', () => loadFinancialData())

  // Expose toggle globally
  window.togglePaymentStatus = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus
      await apiPatch(`/appointments/${id}/payment`, { paid: newStatus }, { token: getPanelToken() })
      loadFinancialData() // Reload to update totals and UI
    } catch (error) {
      console.error('Error toggling payment', error)
      alert('Erro ao atualizar pagamento.')
    }
  }

  // Expose price update globally
  window.updateAppointmentPrice = async (input) => {
    const id = input.dataset.id
    const originalCents = parseInt(input.dataset.original, 10)
    const newValue = input.value.trim()

    // Parse the currency input
    const numericValue = newValue.replace(/[^\d,]/g, '').replace(',', '.')
    const newCents = Math.round(parseFloat(numericValue) * 100)

    // Validate
    if (isNaN(newCents) || newCents < 0) {
      alert('Valor inválido. Use o formato: R$ 100,00')
      input.value = formatCurrency(originalCents)
      return
    }

    // Check if changed
    if (newCents === originalCents) {
      return
    }

    try {
      await apiPatch(`/appointments/${id}/price`, { priceCents: newCents }, { token: getPanelToken() })
      input.dataset.original = newCents
      loadFinancialData() // Reload to update totals
    } catch (error) {
      console.error('Error updating price', error)
      alert('Erro ao atualizar valor.')
      input.value = formatCurrency(originalCents)
    }
  }

  async function loadFinancialData() {
    try {
      const monthVal = monthInput.value // YYYY-MM
      const selectedProfId = professionalSelect.value
      // Convert to date range
      const [year, month] = monthVal.split('-').map(Number)

      const res = await apiGet('/appointments', { token: getPanelToken() })
      const allAppointments = res.appointments || []

      // Filter by confirmed status AND month AND professional
      const filtered = allAppointments.filter(app => {
        if (app.status !== 'confirmed') return false

        // Filter by professional if selected
        if (selectedProfId && app.professionalId !== selectedProfId) return false

        const [aYear, aMonth] = app.date.split('-').map(Number)
        return aYear === year && aMonth === month
      })

      currentAppointments = filtered // Store for PDF generation
      renderFinancialTable(filtered)
      calculateTotals(filtered)

    } catch (error) {
      console.error('Error loading financial data', error)
      alert('Erro ao carregar dados.')
    }
  }

  function calculateTotals(appointments) {
    let paid = 0
    let pending = 0

    appointments.forEach(app => {
      const val = app.priceCents || 0
      if (app.paidAt) {
        paid += val
      } else {
        pending += val
      }
    })

    totalPaidEl.textContent = formatCurrency(paid)
    totalPendingEl.textContent = formatCurrency(pending)
  }

  function formatCurrency(cents) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  function renderFinancialTable(appointments) {
    tableBody.innerHTML = ''
    if (appointments.length === 0) {
      emptyState.classList.remove('hidden')
      return
    }
    emptyState.classList.add('hidden')

    // Sort by date/time
    appointments.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return a.time.localeCompare(b.time)
    })

    tableBody.innerHTML = appointments.map(app => {
      const isPaid = !!app.paidAt
      const dateStr = new Date(app.date + 'T12:00:00').toLocaleDateString('pt-BR')

      return `
        <tr class="hover:bg-white/5 transition group">
          <td class="px-4 py-3 font-medium text-white">${dateStr} <span class="text-xs text-slate-400 ml-1 block">${app.time.slice(0, 5)}</span></td>
          <td class="px-4 py-3 text-slate-300">
            <div class="font-medium text-white">${escapeHtml(app.customerName)}</div>
            <div class="text-xs">${escapeHtml(app.customerPhone)}</div>
          </td>
          <td class="px-4 py-3 text-slate-300 text-sm">${escapeHtml(app.serviceName || 'Serviço não especificado')}</td>
          <td class="px-4 py-3">
            <input 
              type="text" 
              value="${formatCurrency(app.priceCents || 0)}"
              data-id="${app.id}"
              data-original="${app.priceCents || 0}"
              class="bg-transparent border-b border-white/20 text-white font-medium w-28 px-2 py-1 outline-none focus:border-pink-400 transition"
              onblur="updateAppointmentPrice(this)"
              onfocus="this.select()"
            />
          </td>
          <td class="px-4 py-3 text-center">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isPaid ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
              ${isPaid ? 'Pago' : 'Pendente'}
            </span>
          </td>
          <td class="px-4 py-3 text-right">
            <button 
              onclick="togglePaymentStatus('${app.id}', ${isPaid})"
              class="text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${isPaid ? 'border-amber-500/30 text-amber-200 hover:bg-amber-500/10' : 'border-green-500/30 text-green-200 hover:bg-green-500/10'}"
            >
              ${isPaid ? 'Marcar como Pendente' : 'Marcar como Pago'}
            </button>
          </td>
        </tr>
      `
    }).join('')
  }

  // PDF Generation
  generatePdfBtn.addEventListener('click', () => {
    if (!window.jspdf) {
      alert('Biblioteca de PDF não carregada. Recarregue a página.')
      return
    }

    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    const selectedProfId = professionalSelect.value
    const professionalName = selectedProfId
      ? professionalSelect.options[professionalSelect.selectedIndex].text
      : 'Todos os Profissionais'

    const monthVal = monthInput.value
    const [year, month] = monthVal.split('-')
    const monthName = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    // Load and add logo
    const loadLogo = async () => {
      try {
        const response = await fetch('/images/logo.png')
        const blob = await response.blob()
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
      } catch (error) {
        console.error('Erro ao carregar logo', error)
        return null
      }
    }



    loadLogo().then(logoBase64 => {
      // Add centered logo if loaded (much larger size for brand prominence)
      if (logoBase64) {
        // Center logo: 210mm width / 2 = 105mm center, logo width 90mm, so x = 105 - 45 = 60
        // Using larger dimensions for better visibility and brand presence
        doc.addImage(logoBase64, 'PNG', 60, 8, 90, 45)
      }

      // Header - Relatório Financeiro (moved down for larger logo)
      doc.setFontSize(16)
      doc.setTextColor(35, 38, 84) // Navy blue from logo
      doc.text('Relatório Financeiro', 105, logoBase64 ? 60 : 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Profissional: ${professionalName}`, 105, logoBase64 ? 65 : 28, { align: 'center' })
      doc.text(`Período: ${monthName}`, 105, logoBase64 ? 70 : 33, { align: 'center' })
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, logoBase64 ? 75 : 38, { align: 'center' })

      // Summary
      const totalPaid = currentAppointments.filter(a => a.paidAt).reduce((sum, a) => sum + (a.priceCents || 0), 0)
      const totalPending = currentAppointments.filter(a => !a.paidAt).reduce((sum, a) => sum + (a.priceCents || 0), 0)
      const totalGeneral = totalPaid + totalPending


      doc.setFontSize(11)
      doc.setTextColor(35, 38, 84) // Navy blue
      doc.text('RESUMO DO PERÍODO', 14, 84)

      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text(`Total Recebido: ${formatCurrency(totalPaid)}`, 14, 91)
      doc.text(`Pendente: ${formatCurrency(totalPending)}`, 14, 96)
      doc.text(`Total Geral: ${formatCurrency(totalGeneral)}`, 14, 101)
      doc.text(`Quantidade de Atendimentos: ${currentAppointments.length}`, 14, 106)

      // Table
      const tableData = currentAppointments.map(app => [
        new Date(app.date + 'T12:00:00').toLocaleDateString('pt-BR') + ' ' + app.time.slice(0, 5),
        app.customerName,
        app.serviceName || 'N/A',
        formatCurrency(app.priceCents || 0),
        app.paidAt ? 'Pago' : 'Pendente'
      ])

      doc.autoTable({
        startY: 112,
        head: [['Data/Hora', 'Cliente', 'Serviço', 'Valor', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [35, 38, 84], // Navy blue from logo
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 45 },
          2: { cellWidth: 50 },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 25, halign: 'center' }
        }
      })

      // Footer
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Estúdio Aline Andrade - Relatório Financeiro - Página ${i} de ${pageCount}`,
          105,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        )
      }

      // Save
      const fileName = `relatorio-${professionalName.replace(/\s+/g, '-')}-${monthVal}.pdf`
      doc.save(fileName)
    })
  })

  loadProfessionals()
  loadFinancialData()
}

// Global Logout Logic
// Global Logout Logic
function initLogoutButton() {
  const btn = document.getElementById('logoutBtn')
  if (btn) {
    // Avoid cloning nodes which might lose references or be heavy. Use direct replacement or just ensure one listener.
    // Simplest way to ensure single listener without cloning is to use 'onclick' property
    btn.onclick = (e) => {
      e.preventDefault()
      if (confirm('Deseja realmente sair do sistema?')) {
        localStorage.removeItem(STORAGE_KEYS.panelToken)
        sessionStorage.clear()
        window.location.href = '/login'
      }
    }
  }
}
