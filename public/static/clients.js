// ==========================================
// Clients Page Logic
// ==========================================

async function initClientsPage() {
    initLogoutButton()

    // UI Elements
    const addBtn = document.getElementById('addClientBtn')
    const modal = document.getElementById('clientModal')
    const form = document.getElementById('clientForm')
    const cancelBtn = document.getElementById('clientCancel')
    const searchInput = document.getElementById('clientSearch')
    const procedureSelect = document.getElementById('clientProcedure')

    // Load initial data
    await Promise.all([
        loadClients(),
        ensureServicesLoaded().then(() => populateServiceOptions(procedureSelect))
    ])

    // Event Listeners
    addBtn.addEventListener('click', () => openClientModal())
    cancelBtn.addEventListener('click', () => closeClientModal())

    // Search
    let searchTimeout
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => loadClients(e.target.value), 300)
    })

    // Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        await saveClient(e)
    })

    // Close modal on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeClientModal()
    })
}

const ui = {
    modal: () => document.getElementById('clientModal'),
    form: () => document.getElementById('clientForm'),
    title: () => document.getElementById('clientModalTitle'),
    feedback: () => document.getElementById('clientFeedback'),
    // Inputs
    id: () => document.getElementById('clientId'),
    name: () => document.getElementById('clientName'),
    cpf: () => document.getElementById('clientCPF'),
    phone: () => document.getElementById('clientPhone'),
    procedure: () => document.getElementById('clientProcedure'),
    avgTime: () => document.getElementById('clientAvgTime'),
    notes: () => document.getElementById('clientNotes')
}

// Open Modal (Add or Edit)
function openClientModal(client = null) {
    const modal = ui.modal()
    const form = ui.form()

    // Reset form
    form.reset()
    ui.feedback().classList.add('hidden')

    if (client) {
        ui.title().textContent = 'Editar Cliente'
        ui.id().value = client.id
        ui.name().value = client.name
        ui.cpf().value = client.cpf || ''
        ui.phone().value = client.phone
        ui.procedure().value = client.defaultProcedureId || ''
        ui.avgTime().value = client.averageTimeMinutes || ''
        ui.notes().value = client.notes || ''
    } else {
        ui.title().textContent = 'Novo Cliente'
        ui.id().value = ''
    }

    modal.classList.remove('hidden')
}

function closeClientModal() {
    ui.modal().classList.add('hidden')
}

// Save Client (Create or Update)
async function saveClient(e) {
    const formEl = ui.form()
    setSubmitting(formEl, true)

    const id = ui.id().value
    const data = {
        name: ui.name().value.trim(),
        cpf: ui.cpf().value.trim(),
        phone: ui.phone().value.trim(),
        defaultProcedureId: ui.procedure().value || null,
        averageTimeMinutes: ui.avgTime().value ? parseInt(ui.avgTime().value) : null,
        notes: ui.notes().value.trim()
    }

    try {
        if (id) {
            await apiPut(`/clients/${id}`, data)
        } else {
            await apiPost('/clients', data)
        }

        closeClientModal()
        loadClients()
        alert('Cliente salvo com sucesso!')
    } catch (error) {
        console.error('Error saving client', error)
        ui.feedback().textContent = extractErrorMessage(error)
        ui.feedback().classList.remove('hidden')
    } finally {
        setSubmitting(formEl, false)
    }
}

async function loadClients(search = '') {
    const list = document.getElementById('clientsList')
    if (!list) return

    list.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Carregando...</td></tr>'

    try {
        const query = search ? `?search=${encodeURIComponent(search)}` : ''
        const { clients } = await apiGet(`/clients${query}`)
        renderClientsTable(clients || [])
    } catch (error) {
        list.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-red-400">${extractErrorMessage(error)}</td></tr>`
    }
}

function renderClientsTable(clients) {
    const list = document.getElementById('clientsList')
    if (!list) return

    if (clients.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Nenhum cliente encontrado.</td></tr>'
        return
    }

    list.innerHTML = clients.map(c => `
        <tr class="hover:bg-white/5 transition group">
            <td class="px-4 py-3 font-medium text-white">${escapeHtml(c.name)}</td>
            <td class="px-4 py-3 text-slate-300">${escapeHtml(c.phone)}</td>
            <td class="px-4 py-3 text-slate-300 text-sm max-w-xs truncate">${c.notes || '-'}</td>
             <td class="px-4 py-3 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick='editClient(${JSON.stringify(c).replace(/'/g, "&#39;")})' class="text-blue-400 hover:text-blue-300 mr-3 text-sm font-medium">Editar</button>
                <button onclick="deleteClient('${c.id}')" class="text-red-400 hover:text-red-300 text-sm font-medium">Excluir</button>
            </td>
        </tr>
    `).join('')
}

// Edit helper called from HTML inline
window.editClient = function (client) {
    openClientModal(client)
}

window.deleteClient = async function (id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
        await apiDelete(`/clients/${id}`)
        loadClients()
        alert('Cliente excluído com sucesso.')
    } catch (err) {
        console.error(err)
        alert(extractErrorMessage(err))
    }
}

// Global expose
window.initClientsPage = initClientsPage
window.loadClients = loadClients

async function ensureServicesLoaded() {
    if (window.state && window.state.services && window.state.services.length > 0) return
    try {
        const { services } = await apiGet('/services')
        if (!window.state) window.state = {}
        window.state.services = services || []
    } catch (e) {
        console.error('Error loading services for dropdown', e)
    }
}
