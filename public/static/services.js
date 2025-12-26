// ==========================================
// Services Page Logic
// ==========================================

async function initServicesPage() {
    if (typeof tryAuthenticateWithStoredToken === 'function') {
        const auth = await tryAuthenticateWithStoredToken()
        if (!auth) {
            window.location.replace('/login')
            return
        }
    }

    initLogoutButton()
    loadServices()

    const form = document.getElementById('serviceForm')
    const modal = document.getElementById('serviceModal')
    const addBtn = document.getElementById('addServiceBtn')
    const cancelBtn = document.getElementById('serviceCancelBtn')
    const feedback = document.getElementById('serviceFeedback')

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (form) {
                form.reset()
                document.getElementById('serviceId').value = ''
                document.getElementById('serviceModalTitle').textContent = 'Novo Serviço'
            }
            showModal(modal)
        })
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => hideModal(modal))
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            const id = document.getElementById('serviceId').value
            const name = document.getElementById('serviceName').value
            const duration = document.getElementById('serviceDuration').value
            const price = document.getElementById('servicePrice').value

            // Price to cents
            const priceCents = Math.round(parseFloat(price.replace('R$', '').replace('.', '').replace(',', '.')) * 100)

            const payload = {
                name,
                durationMinutes: parseInt(duration),
                priceCents
            }

            try {
                if (id) {
                    await apiPut(`/services/${id}`, payload)
                } else {
                    await apiPost('/services', payload)
                }
                hideModal(modal)
                loadServices()
            } catch (error) {
                if (feedback) {
                    feedback.textContent = extractErrorMessage(error)
                    feedback.classList.remove('hidden')
                }
            }
        })
    }
}

async function loadServices() {
    const list = document.getElementById('servicesList')
    if (!list) return

    list.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Carregando...</td></tr>'

    try {
        const { services } = await apiGet('/services')
        renderServicesTable(services || [])
    } catch (error) {
        list.innerHTML = `<tr><td colspan="4" class="px-4 py-8 text-center text-red-400">${extractErrorMessage(error)}</td></tr>`
    }
}

function renderServicesTable(services) {
    const list = document.getElementById('servicesList')
    if (!list) return

    if (services.length === 0) {
        list.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Nenhum serviço cadastrad.</td></tr>'
        return
    }

    list.innerHTML = services.map(s => `
        <tr class="hover:bg-white/5 transition">
            <td class="px-4 py-3 font-medium text-white">${escapeHtml(s.name)}</td>
            <td class="px-4 py-3 text-slate-300">${s.durationMinutes} min</td>
            <td class="px-4 py-3 text-slate-300">${formatCurrency(s.priceCents)}</td>
            <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                    <button onclick='openServiceModal(${JSON.stringify(s)})' class="p-1 text-slate-400 hover:text-white transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button onclick="deleteService('${s.id}')" class="p-1 text-slate-400 hover:text-red-400 transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('')
}

window.openServiceModal = function (service) {
    const modal = document.getElementById('serviceModal')
    const form = document.getElementById('serviceForm')
    if (!modal || !form) return

    document.getElementById('serviceModalTitle').textContent = 'Editar Serviço'
    document.getElementById('serviceId').value = service.id
    document.getElementById('serviceName').value = service.name
    document.getElementById('serviceDuration').value = service.durationMinutes

    // Format price back to string if needed or handle logic
    // Simplified for this example
    document.getElementById('servicePrice').value = (service.priceCents / 100).toFixed(2).replace('.', ',')

    showModal(modal)
}

window.deleteService = async function (id) {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return
    try {
        await apiDelete(`/services/${id}`)
        loadServices()
    } catch (error) {
        alert(extractErrorMessage(error))
    }
}

// Global expose
window.initServicesPage = initServicesPage
