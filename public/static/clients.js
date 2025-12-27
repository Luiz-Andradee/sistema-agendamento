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
    const closeBtn = document.getElementById('clientModalClose')
    const searchInput = document.getElementById('clientSearch')
    const procedureSelect = document.getElementById('clientProcedure')

    // Load initial data
    await Promise.all([
        loadClients(),
        ensureServicesLoaded().then(() => populateServiceOptions(procedureSelect))
    ])

    // Event Listeners
    if (addBtn) {
        addBtn.addEventListener('click', () => openClientModal())
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeClientModal)
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeClientModal)
    }

    // Search with debounce
    let searchTimeout
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout)
            searchTimeout = setTimeout(() => loadClients(e.target.value), 300)
        })
    }

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
    modal.style.display = 'flex'
}

function closeClientModal() {
    const modal = ui.modal()
    modal.classList.add('hidden')
    modal.style.display = 'none'
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
    const mobileContainer = document.getElementById('clientsListMobile')

    if (!list) return

    if (clients.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Nenhum cliente encontrado.</td></tr>'
        if (mobileContainer) {
            mobileContainer.innerHTML = '<p class="px-4 py-8 text-center text-slate-400">Nenhum cliente encontrado.</p>'
        }
        return
    }

    // Desktop table
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

    // Mobile cards
    if (mobileContainer) {
        mobileContainer.innerHTML = clients.map(c => {
            const formattedPhone = c.phone && c.phone.length >= 10
                ? `(${c.phone.slice(0, 2)}) ${c.phone.slice(2, 7)}-${c.phone.slice(7)}`
                : c.phone

            return `
                <div class="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div class="mb-3 border-b border-white/10 pb-3">
                        <h3 class="font-semibold text-white">${escapeHtml(c.name)}</h3>
                    </div>
                    
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-slate-400">Telefone:</span>
                            <a href="https://wa.me/55${c.phone}" target="_blank" class="inline-flex items-center gap-1 text-emerald-400">
                                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                ${formattedPhone}
                            </a>
                        </div>
                        
                        ${c.cpf ? `
                            <div class="flex justify-between">
                                <span class="text-slate-400">CPF:</span>
                                <span class="font-mono text-white">${c.cpf}</span>
                            </div>
                        ` : ''}
                        
                        ${c.notes ? `
                            <div class="flex flex-col gap-1">
                                <span class="text-slate-400">Observações:</span>
                                <span class="text-sm text-slate-300">${escapeHtml(c.notes)}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="mt-3 flex gap-2 border-t border-white/10 pt-3">
                        <button onclick='editClient(${JSON.stringify(c).replace(/'/g, "&#39;")})' class="flex-1 rounded-lg bg-blue-500/20 px-3 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/30">
                            Editar
                        </button>
                        <button onclick="deleteClient('${c.id}')" class="flex-1 rounded-lg bg-red-500/20 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/30">
                            Excluir
                        </button>
                    </div>
                </div>
            `
        }).join('')
    }
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
