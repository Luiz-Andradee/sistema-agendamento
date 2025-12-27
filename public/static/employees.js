document.addEventListener('DOMContentLoaded', () => {
  console.log('[Employees] Inicializando...')

  if (document.getElementById('employeesList')) {
    loadEmployees()
    setupEmployeeEventListeners()
  }
})


// Estado local para o gerenciador de agenda
const scheduleState = {
  schedule: [],
  timeOff: [],
  professionals: []
}

// Estado para o modal de funcionário
let currentEmployeeId = null

async function loadEmployees() {
  const container = document.getElementById('employeesList')
  if (!container) return

  try {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center text-slate-500">
          <svg class="mx-auto h-8 w-8 animate-spin text-slate-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="mt-2 text-sm">Carregando profissionais...</p>
        </td>
      </tr>
    `

    const token = localStorage.getItem('estudio-aline-panel-token')
    const response = await fetch('/api/professionals', {
      headers: { 'Authorization': token }
    })

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/login'
        return
      }
      throw new Error('Falha ao carregar profissionais')
    }

    const data = await response.json()
    const professionals = data.professionals || []

    // Guardar no estado local para uso no select
    scheduleState.professionals = professionals

    renderEmployeesTable(professionals)

    // Inicializar o Schedule Manager após carregar os dados
    initScheduleManager()

  } catch (error) {
    console.error('Error loading employees:', error)
    container.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center text-red-400">
          Erro ao carregar profissionais. <br>
          <button onclick="loadEmployees()" class="mt-2 underline hover:text-red-300">Tentar novamente</button>
        </td>
      </tr>
    `
  }
}

function renderEmployeesTable(professionals) {
  const container = document.getElementById('employeesList')
  const mobileContainer = document.getElementById('employeesListMobile')

  if (!container) return

  if (professionals.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 text-center text-slate-400">
          Nenhum funcionário cadastrado.
        </td>
      </tr>
    `
    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <div class="py-12 text-center text-slate-400">
          Nenhum funcionário cadastrado.
        </div>
      `
    }
    return
  }

  // Desktop table rows
  container.innerHTML = professionals.map(emp => {
    const colorClass = emp.avatarColor || 'from-pink-400 to-rose-500'
    const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    const phone = emp.whatsapp ? emp.whatsapp.replace(/^55/, '') : '-'
    const formattedPhone = phone !== '-' && phone.length >= 10
      ? `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`
      : phone

    return `
      <tr class="group hover:bg-white/5 transition-colors cursor-pointer" onclick="selectProfessional('${emp.id}')">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${colorClass} text-sm font-bold text-white shadow-md">
              ${initials}
            </div>
            <span class="font-medium text-white">${emp.name}</span>
          </div>
        </td>
        <td class="px-4 py-3">${emp.role || '-'}</td>
        <td class="px-4 py-3 font-mono text-xs">${emp.cpf || '-'}</td>
        <td class="px-4 py-3">
          ${emp.whatsapp ? `
            <a href="https://wa.me/55${emp.whatsapp}" target="_blank" class="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors">
              <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              ${formattedPhone}
            </a>
          ` : '-'}
        </td>
        <td class="px-4 py-3 text-right">
          <div class="flex justify-end gap-2">
            <button onclick="event.stopPropagation(); openEmployeeModal('${emp.id}')" class="rounded-lg bg-blue-500/20 px-3 py-1.5 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/30" title="Editar">
              Editar
            </button>
            <button onclick="event.stopPropagation(); deleteEmployee('${emp.id}', '${emp.name}')" class="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/30" title="Excluir">
              Excluir
            </button>
          </div>
        </td>
      </tr>
    `
  }).join('')

  // Mobile cards
  if (mobileContainer) {
    mobileContainer.innerHTML = professionals.map(emp => {
      const colorClass = emp.avatarColor || 'from-pink-400 to-rose-500'
      const initials = emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      const phone = emp.whatsapp ? emp.whatsapp.replace(/^55/, '') : '-'
      const formattedPhone = phone !== '-' && phone.length >= 10
        ? `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`
        : phone

      return `
        <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm" onclick="selectProfessional('${emp.id}')">
          <div class="mb-3 flex items-center gap-3 border-b border-white/10 pb-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${colorClass} text-base font-bold text-white shadow-md">
              ${initials}
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-white">${emp.name}</h3>
              <p class="text-sm text-slate-400">${emp.role || 'Profissional'}</p>
            </div>
          </div>
          
          <div class="space-y-2 text-sm">
            ${emp.cpf ? `
              <div class="flex justify-between">
                <span class="text-slate-400">CPF:</span>
                <span class="font-mono text-white">${emp.cpf}</span>
              </div>
            ` : ''}
            
            ${emp.whatsapp ? `
              <div class="flex justify-between">
                <span class="text-slate-400">WhatsApp:</span>
                <a href="https://wa.me/55${emp.whatsapp}" target="_blank" onclick="event.stopPropagation()" class="inline-flex items-center gap-1 text-emerald-400">
                  <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  ${formattedPhone}
                </a>
              </div>
            ` : ''}
          </div>

          <div class="mt-3 flex gap-2 border-t border-white/10 pt-3">
            <button onclick="event.stopPropagation(); openEmployeeModal('${emp.id}')" class="flex-1 rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/30">
              Editar
            </button>
            <button onclick="event.stopPropagation(); deleteEmployee('${emp.id}', '${emp.name}')" class="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30">
              Excluir
            </button>
          </div>
        </div>
      `
    }).join('')
  }
}

function setupEmployeeEventListeners() {
  const modal = document.getElementById('employeeModal')
  const form = document.getElementById('employeeForm')
  const addBtn = document.getElementById('addEmployeeBtn')
  const closeBtn = document.getElementById('employeeCloseBtn')
  const cancelBtn = document.getElementById('employeeCancel')

  if (addBtn) {
    addBtn.addEventListener('click', () => openEmployeeModal())
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', closeEmployeeModal)
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEmployeeModal)
  }

  if (form) {
    form.addEventListener('submit', handleEmployeeSubmit)
  }

  // Máscaras
  const cpfInput = document.getElementById('employeeCPF')
  const phoneInput = document.getElementById('employeePhone')

  if (cpfInput) {
    cpfInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '')
      if (v.length > 11) v = v.slice(0, 11)
      if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
      else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, '$1.$2')
      e.target.value = v
    })
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '')
      if (v.length > 11) v = v.slice(0, 11)
      if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2')
      e.target.value = v
    })
  }
}

async function openEmployeeModal(id = null) {
  const modal = document.getElementById('employeeModal')
  const form = document.getElementById('employeeForm')
  const title = document.getElementById('employeeModalTitle')
  const feedback = document.getElementById('employeeFeedback')

  if (!modal || !form) return

  // Reset form
  form.reset()
  currentEmployeeId = id
  if (feedback) feedback.classList.add('hidden')

  if (id) {
    title.textContent = 'Editar Funcionário'
    // Carregar dados e preencher
    try {
      const token = localStorage.getItem('estudio-aline-panel-token')
      const response = await fetch('/api/professionals', { /* O ideal seria um GET /:id mas podemos filtrar da lista ou implementar endpoint específico se necessário */
        headers: { 'Authorization': token }
      })
      const data = await response.json()
      const employee = data.professionals.find(p => p.id === id)

      if (employee) {
        document.getElementById('employeeName').value = employee.name
        document.getElementById('employeeRole').value = employee.role
        document.getElementById('employeeColor').value = employee.avatarColor

        // Novos campos
        if (employee.cpf) document.getElementById('employeeCPF').value = employee.cpf
        if (employee.whatsapp) {
          // Formatar para exibição no input
          const p = employee.whatsapp.replace(/^55/, '')
          document.getElementById('employeePhone').value = `(${p.slice(0, 2)}) ${p.slice(2)}`
        }
        if (employee.address) document.getElementById('employeeAddress').value = employee.address
        if (employee.bankName) document.getElementById('employeeBank').value = employee.bankName
        if (employee.bankAccount) document.getElementById('employeeAccount').value = employee.bankAccount
        if (employee.notes) document.getElementById('employeeNotes').value = employee.notes
      }
    } catch (e) {
      console.error('Erro ao carregar detalhes', e)
    }
  } else {
    title.textContent = 'Novo Funcionário'
  }

  modal.classList.remove('hidden')
  modal.style.display = 'flex'
}

function closeEmployeeModal() {
  const modal = document.getElementById('employeeModal')
  if (modal) {
    modal.classList.add('hidden')
    modal.style.display = 'none'
  }
  currentEmployeeId = null
}

async function handleEmployeeSubmit(e) {
  e.preventDefault()

  // Button is outside form, so get it by ID or query the modal
  const submitBtn = document.querySelector('#employeeModal button[type="submit"]')
  const originalText = submitBtn ? submitBtn.textContent : 'Salvar'
  const feedback = document.getElementById('employeeFeedback')

  if (submitBtn) {
    submitBtn.disabled = true
    submitBtn.textContent = 'Salvando...'
  }
  if (feedback) feedback.classList.add('hidden')

  try {
    const rawPhone = document.getElementById('employeePhone').value.replace(/\D/g, '')
    const whatsapp = rawPhone ? (rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone) : ''

    const payload = {
      name: document.getElementById('employeeName').value,
      role: document.getElementById('employeeRole').value,
      avatarColor: document.getElementById('employeeColor').value,
      whatsapp: whatsapp || null,
      cpf: document.getElementById('employeeCPF').value || null,
      address: document.getElementById('employeeAddress').value || null,
      bankName: document.getElementById('employeeBank').value || null,
      bankAccount: document.getElementById('employeeAccount').value || null,
      notes: document.getElementById('employeeNotes').value || null
    }

    const token = localStorage.getItem('estudio-aline-panel-token')
    const url = currentEmployeeId
      ? `/api/professionals/${currentEmployeeId}`
      : '/api/professionals'

    const response = await fetch(url, {
      method: currentEmployeeId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao salvar')
    }

    closeEmployeeModal()
    loadEmployees()

    // Feedback visual (toast ou similar) poderia ser adicionado aqui

  } catch (error) {
    if (feedback) {
      feedback.textContent = error.message
      feedback.classList.remove('hidden')
    }
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false
      submitBtn.textContent = originalText
    }
  }
}

async function deleteEmployee(id) {
  if (!confirm('Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.')) {
    return
  }

  try {
    const token = localStorage.getItem('estudio-aline-panel-token')
    const response = await fetch(`/api/professionals/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.message || 'Erro ao excluir')
    }

    loadEmployees()
  } catch (error) {
    alert(error.message)
  }
}

// ==========================================
// Schedule Manager Logic
// ==========================================

// ==========================================
// Schedule Manager Logic
// ==========================================

function initScheduleManager() {
  console.log('[ScheduleManager] Initializing...')
  const professionalSelect = document.getElementById('scheduleProfessionalSelect')
  const saveButton = document.getElementById('saveAvailability')
  const form = document.getElementById('availabilityForm')
  const timeOffForm = document.getElementById('timeOffForm')

  if (professionalSelect) {
    if (scheduleState.professionals.length > 0) {
      console.log(`[ScheduleManager] Populating select with ${scheduleState.professionals.length} professionals`)
      populateProfessionalSelect(professionalSelect)
    } else {
      console.warn('[ScheduleManager] No professionals found in state during init')
    }

    professionalSelect.addEventListener('change', refreshScheduleView)
  } else {
    console.error('[ScheduleManager] Professional select element not found!')
  }

  if (saveButton) {
    saveButton.addEventListener('click', saveSchedule)
  }

  if (form) {
    // Delegate clear clicks
    form.addEventListener('click', (e) => {
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

  if (timeOffForm) {
    timeOffForm.addEventListener('submit', createTimeOffBlock)
  }
}

function populateProfessionalSelect(selectElement) {
  selectElement.innerHTML = '<option value="">Selecione um profissional...</option>'
  scheduleState.professionals.forEach(p => {
    const opt = document.createElement('option')
    opt.value = p.id
    opt.textContent = p.name
    selectElement.appendChild(opt)
  })
}

function selectProfessional(id) {
  console.log(`[ScheduleManager] Selecting professional: ${id}`)
  const professionalSelect = document.getElementById('scheduleProfessionalSelect')

  if (professionalSelect) {
    // Check if options are populated, if not, try to populate
    if (professionalSelect.options.length <= 1 && scheduleState.professionals.length > 0) {
      console.log('[ScheduleManager] Select was empty during click, re-populating...')
      populateProfessionalSelect(professionalSelect)
    }

    professionalSelect.value = id

    // Verify if value was actually set (it won't be if ID is not in options)
    if (professionalSelect.value !== id) {
      console.error(`[ScheduleManager] Failed to set value to ${id}. Available options: `, professionalSelect.options)
      return
    }

    refreshScheduleView()
    // Scroll suave até a seção da agenda
    document.getElementById('scheduleSection').scrollIntoView({ behavior: 'smooth' })
  } else {
    console.error('[ScheduleManager] Select element not found during selection')
  }
}

async function refreshScheduleView() {
  const professionalSelect = document.getElementById('scheduleProfessionalSelect')
  if (!professionalSelect || !professionalSelect.value) return

  const professionalId = professionalSelect.value
  const professionalName = professionalSelect.options[professionalSelect.selectedIndex].text

  console.log(`[ScheduleManager] Refreshing view for: ${professionalName} (${professionalId})`)

  // Update visual confirmation in Time Off form
  const timeOffBtn = document.querySelector('#timeOffForm button[type="submit"]')
  if (timeOffBtn) {
    timeOffBtn.textContent = `Cadastrar bloqueio para ${professionalName.split(' ')[0]}`
  }

  try {
    const token = localStorage.getItem('estudio-aline-panel-token')
    const response = await fetch(`/api/professionals/${professionalId}/schedule`, {
      headers: { 'Authorization': token }
    })
    const data = await response.json()

    scheduleState.schedule = data.availability || []
    scheduleState.timeOff = data.timeOff || []

    renderScheduleForm()
    renderTimeOffList()
  } catch (error) {
    console.error('Erro ao carregar agenda:', error)
  }
}

function renderScheduleForm() {
  const form = document.getElementById('availabilityForm')
  if (!form) return

  // Reset all rows first
  const rows = form.querySelectorAll('tr[data-weekday]')
  rows.forEach(row => {
    const start = row.querySelector('[data-role="start"]')
    const end = row.querySelector('[data-role="end"]')
    if (start) start.value = ''
    if (end) end.value = ''
  })

  // Fill from state
  scheduleState.schedule.forEach(slot => {
    const row = form.querySelector(`tr[data-weekday="${slot.weekday}"]`)
    if (!row) return

    const start = row.querySelector('[data-role="start"]')
    const end = row.querySelector('[data-role="end"]')

    if (start) start.value = slot.startTime
    if (end) end.value = slot.endTime
  })
}

async function saveSchedule(event) {
  event.preventDefault()
  const professionalSelect = document.getElementById('scheduleProfessionalSelect')
  const saveButton = document.getElementById('saveAvailability')
  const feedback = document.getElementById('availabilityFeedback')
  const form = document.getElementById('availabilityForm')
  const intervalInput = document.getElementById('scheduleInterval')

  if (!professionalSelect || !professionalSelect.value) return

  const professionalId = professionalSelect.value
  const availability = []
  const slotInterval = intervalInput ? Number(intervalInput.value) : 30

  // Collect data
  const rows = form.querySelectorAll('tr[data-weekday]')
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
    if (saveButton) {
      saveButton.textContent = 'Salvando...'
      saveButton.disabled = true
    }

    const token = localStorage.getItem('estudio-aline-panel-token')
    const response = await fetch(`/api/professionals/${professionalId}/schedule`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ availability })
    })

    if (!response.ok) throw new Error('Falha ao salvar')

    if (feedback) {
      feedback.textContent = 'Grade semanal atualizada com sucesso!'
      feedback.classList.remove('hidden')
      setTimeout(() => feedback.classList.add('hidden'), 3000)
    }
  } catch (error) {
    alert('Erro ao salvar: ' + error.message)
  } finally {
    if (saveButton) {
      saveButton.textContent = 'Salvar grade semanal'
      saveButton.disabled = false
    }
  }
}

async function createTimeOffBlock(event) {
  event.preventDefault()
  const professionalSelect = document.getElementById('scheduleProfessionalSelect')
  if (!professionalSelect || !professionalSelect.value) return

  const professionalId = professionalSelect.value
  const date = document.getElementById('timeOffDate').value
  const start = document.getElementById('timeOffStart').value
  const end = document.getElementById('timeOffEnd').value
  const note = document.getElementById('timeOffNote').value
  const feedback = document.getElementById('timeOffFeedback')

  try {
    const token = localStorage.getItem('estudio-aline-panel-token')
    const response = await fetch(`/api/professionals/${professionalId}/time-off`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ date, startTime: start, endTime: end, note })
    })

    if (!response.ok) throw new Error('Falha ao criar bloqueio')

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
    alert(error.message)
  }
}

function renderTimeOffList() {
  const list = document.getElementById('timeOffList')
  if (!list) return

  list.innerHTML = ''

  const blocks = Array.isArray(scheduleState.timeOff) ? scheduleState.timeOff : []

  if (blocks.length === 0) {
    list.innerHTML = '<p class="text-xs text-slate-400">Nenhum bloqueio cadastrado.</p>'
    return
  }

  blocks.forEach(block => {
    const day = block.date.split('-')[2]
    const month = block.date.split('-')[1]
    const formattedDate = `${day}/${month}`

    const item = document.createElement('div')
    item.className = 'flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg mb-2'
    item.innerHTML = `
              <div>
                  <p class="text-white text-sm font-medium">${formattedDate} · ${block.startTime} - ${block.endTime}</p>
                  <p class="text-xs text-slate-400">${block.note || 'Bloqueio administrativo'}</p>
              </div>
              <button class="text-red-400 hover:text-red-300 text-xs px-2 py-1" onclick="deleteTimeOff(${block.id})">Remover</button>
          `
    list.appendChild(item)
  })
}

async function deleteTimeOff(id) {
  if (!confirm('Remover este bloqueio?')) return
  const professionalSelect = document.getElementById('scheduleProfessionalSelect')
  if (!professionalSelect) return
  const professionalId = professionalSelect.value

  try {
    const token = localStorage.getItem('estudio-aline-panel-token')
    const response = await fetch(`/api/professionals/${professionalId}/time-off/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': token }
    })

    if (!response.ok) throw new Error('Erro ao deletar')

    refreshScheduleView()
  } catch (error) {
    alert(error.message)
  }
}

// Expor funções globais
window.openEmployeeModal = openEmployeeModal
window.deleteEmployee = deleteEmployee
window.loadEmployees = loadEmployees
window.selectProfessional = selectProfessional
window.deleteTimeOff = deleteTimeOff

