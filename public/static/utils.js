const API_BASE = '/api'
const STORAGE_KEYS = {
    panelToken: 'estudio-aline-panel-token'
}

// ==========================================
// Helpers
// ==========================================

async function apiGet(path, options = {}) {
    const headers = {}
    if (options.auth !== false) { // Default true
        const token = getPanelToken()
        if (token) headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${path}`, { headers })
    return handleApiResponse(res)
}

async function apiPost(path, body, options = {}) {
    const headers = { 'Content-Type': 'application/json' }
    const token = options.token || (options.auth !== false ? getPanelToken() : null)
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    })
    return handleApiResponse(res)
}

async function apiPatch(path, body, options = {}) {
    const headers = { 'Content-Type': 'application/json' }
    const token = options.token || (options.auth !== false ? getPanelToken() : null)
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body)
    })
    return handleApiResponse(res)
}

async function apiPut(path, body, options = {}) {
    const headers = { 'Content-Type': 'application/json' }
    const token = options.token || (options.auth !== false ? getPanelToken() : null)
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
    })
    return handleApiResponse(res)
}

async function apiDelete(path, options = {}) {
    const headers = {}
    const token = options.token || (options.auth !== false ? getPanelToken() : null)
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers
    })
    if (res.status === 204) return true
    return handleApiResponse(res)
}

async function handleApiResponse(response) {
    if (response.ok) {
        return response.json().catch(() => ({}))
    }

    const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
    const error = new Error(errorData.message || 'Erro na requisição')
    error.status = response.status
    throw error
}

function getPanelToken() {
    return localStorage.getItem(STORAGE_KEYS.panelToken)
}

function setPanelToken(token) {
    localStorage.setItem(STORAGE_KEYS.panelToken, token)
}

function clearPanelToken() {
    localStorage.removeItem(STORAGE_KEYS.panelToken)
}

function extractErrorMessage(error) {
    if (typeof error === 'string') return error
    return error.message || 'Ocorreu um erro inesperado.'
}

function formatCurrency(cents) {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatTime(timeStr) {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
}

function formatDateString(dateStr) {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}/${month}/${year}`
}

function formatDateTime(date, time) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year} às ${time.slice(0, 5)}`
}

function formatUtcToLocal(utcDateString) {
    if (!utcDateString) return ''
    return new Date(utcDateString).toLocaleString('pt-BR')
}

function normalizePhone(phone) {
    return phone.replace(/\D/g, '')
}

function showModal(element) {
    if (element) {
        element.classList.remove('hidden')
    }
}

function hideModal(element) {
    if (element) {
        element.classList.add('hidden')
    }
}

function showElement(element) {
    if (element) element.classList.remove('hidden')
}

function hideElement(element) {
    if (element) element.classList.add('hidden')
}

function escapeHtml(text) {
    if (!text) return ''
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function translateStatus(status) {
    const map = {
        pending: 'Pendente',
        confirmed: 'Confirmado',
        cancelled: 'Cancelado',
        completed: 'Concluído',
        rebook_requested: 'Reagendamento Solicitado'
    }
    return map[status] || status
}

function statusStyle(status) {
    const map = {
        pending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
        confirmed: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
        cancelled: 'bg-red-500/10 text-red-500 border border-red-500/20',
        completed: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
        rebook_requested: 'bg-pink-500/10 text-pink-500 border border-pink-500/20'
    }
    return map[status] || 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
}

// Make globally available
window.apiGet = apiGet
window.apiPost = apiPost
window.apiPatch = apiPatch
window.apiPut = apiPut
window.apiDelete = apiDelete
window.getPanelToken = getPanelToken
window.setPanelToken = setPanelToken
window.clearPanelToken = clearPanelToken
window.extractErrorMessage = extractErrorMessage
window.formatCurrency = formatCurrency
window.formatTime = formatTime
window.formatDateString = formatDateString
window.formatDateTime = formatDateTime
window.formatUtcToLocal = formatUtcToLocal
window.normalizePhone = normalizePhone
window.showModal = showModal
window.hideModal = hideModal
window.showElement = showElement
window.hideElement = hideElement
window.escapeHtml = escapeHtml
window.translateStatus = translateStatus
window.statusStyle = statusStyle
window.STORAGE_KEYS = STORAGE_KEYS

function showAlert(element, message) {
    if (element) {
        element.textContent = message
        element.classList.remove('hidden')
    }
}

function setSubmitting(form, submitting) {
    const submitButton = form.querySelector('button[type="submit"]')
    if (!submitButton) return
    submitButton.disabled = submitting
    submitButton.textContent = submitting ? 'Enviando...' : (submitButton.dataset.originalText || 'Enviar')
    if (!submitting && !submitButton.dataset.originalText) {
        submitButton.dataset.originalText = submitButton.textContent
    }
}

function formatDateInput(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function populateServiceOptions(select) {
    if (!select) return
    select.innerHTML = '<option value="">Selecione um serviço</option>'

    // Ensure state.services exists (should be populated by ensureCatalogData or similar)
    const services = window.state?.services || []

    services.forEach((service) => {
        const option = document.createElement('option')
        option.value = service.id
        option.textContent = `${service.name} (${formatCurrency(service.priceCents || 0)})`
        option.dataset.price = service.priceCents
        select.appendChild(option)
    })
}

function populateProfessionalOptions(select) {
    if (!select) return
    select.innerHTML = '<option value="">Selecione um profissional</option>'

    const professionals = window.state?.professionals || []

    professionals.forEach((prof) => {
        const option = document.createElement('option')
        option.value = prof.id
        option.textContent = prof.name
        select.appendChild(option)
    })
}

function updateProfessionalOptions(serviceSelect, professionalSelect) {
    if (!serviceSelect || !professionalSelect) return
    const serviceId = serviceSelect.value

    // Reset
    professionalSelect.innerHTML = '<option value="">Selecione um profissional</option>'
    // validation removed: always enable
    professionalSelect.disabled = false

    const professionals = window.state?.professionals || []

    // SHOW ALL PROFESSIONALS (No filtering by service)
    professionals.forEach(prof => {
        const option = document.createElement('option')
        option.value = prof.id
        option.textContent = prof.name
        professionalSelect.appendChild(option)
    })
}

window.showAlert = showAlert
window.setSubmitting = setSubmitting
window.formatDateInput = formatDateInput
window.populateServiceOptions = populateServiceOptions
window.populateProfessionalOptions = populateProfessionalOptions
window.updateProfessionalOptions = updateProfessionalOptions
