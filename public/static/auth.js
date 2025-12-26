// ==========================================
// Authentication Logic
// ==========================================

const uiAuth = {
    initialized: false,
    modal: null,
    form: null,
    input: null,
    feedback: null,
    cancel: null
}

async function initLoginPage() {
    const form = document.getElementById('loginForm')
    const feedback = document.getElementById('loginFeedback')

    if (!form) {
        console.warn('Login form missing inside initLoginPage');
        return;
    }

    // Clear existing token on load
    clearPanelToken()

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        feedback.classList.add('hidden')

        // Get values from the new inputs
        // Assuming inputs have name="user" and name="pass"
        const username = form.user.value
        const password = form.pass.value

        try {
            const response = await apiPost('/auth/login', { username, password })

            if (response.token) {
                setPanelToken(response.token)
                window.location.href = '/painel'
            } else {
                throw new Error('Token não recebido.')
            }
        } catch (error) {
            form.pass.value = ''
            let message = extractErrorMessage(error)
            if (error?.status === 401 || message.includes('Credenciais inválidas')) {
                message = 'Usuário ou senha incorretos.'
            }
            feedback.textContent = message
            feedback.classList.remove('hidden')
        }
    })
}

function setupAuthModal() {
    if (uiAuth.initialized) return

    uiAuth.modal = document.getElementById('authModal')
    uiAuth.form = document.getElementById('authForm')
    uiAuth.input = document.getElementById('authToken')
    uiAuth.feedback = document.getElementById('authFeedback')
    uiAuth.cancel = document.getElementById('authCancel')

    if (!uiAuth.modal || !uiAuth.form || !uiAuth.input || !uiAuth.feedback || !uiAuth.cancel) {
        // Only warn if we expect auth modal to be present (e.g. on Dashboard)
        // console.warn('Modal de autenticação não encontrado.')
        return
    }

    uiAuth.form.addEventListener('submit', async (event) => {
        event.preventDefault()
        hideElement(uiAuth.feedback)

        const token = uiAuth.input.value.trim()
        if (!token) {
            showAuthFeedback('Informe o token administrativo.', true)
            return
        }

        try {
            await apiPost('/auth/verify', {}, { token })
            setPanelToken(token)
            hideAuthModal()
            // Reload logic should be handled by the caller, or emit an event
            if (window.loadAppointments) window.loadAppointments()
        } catch (error) {
            showAuthFeedback(extractErrorMessage(error), true)
            clearPanelToken()
            uiAuth.input.focus()
        }
    })

    uiAuth.cancel.addEventListener('click', (event) => {
        event.preventDefault()
        clearPanelToken()
        uiAuth.input.value = ''
        showAuthFeedback('Autenticação necessária para acessar o painel.', true)
    })

    uiAuth.initialized = true
}

function showAuthModal() {
    if (uiAuth.modal) showModal(uiAuth.modal)
}

function hideAuthModal() {
    if (uiAuth.modal) hideModal(uiAuth.modal)
}

function showAuthFeedback(message, isError) {
    if (uiAuth.feedback) {
        uiAuth.feedback.textContent = message
        uiAuth.feedback.classList.remove('hidden')
        if (isError) {
            uiAuth.feedback.classList.remove('text-emerald-400')
            uiAuth.feedback.classList.add('text-red-400')
        } else {
            uiAuth.feedback.classList.remove('text-red-400')
            uiAuth.feedback.classList.add('text-emerald-400')
        }
    }
}

async function tryAuthenticateWithStoredToken() {
    const stored = getPanelToken()
    if (!stored) return false

    try {
        await apiPost('/auth/verify', {}, { token: stored })
        setPanelToken(stored)
        hideAuthModal()
        return true
    } catch (error) {
        clearPanelToken()
        return false
    }
}

function initLogoutButton() {
    const btn = document.getElementById('logoutBtn')
    if (btn) {
        btn.onclick = (e) => {
            e.preventDefault()
            if (confirm('Deseja realmente sair do sistema?')) {
                clearPanelToken()
                sessionStorage.clear()
                window.location.href = '/login'
            }
        }
    }
}

// Expose globals
window.initLoginPage = initLoginPage
window.setupAuthModal = setupAuthModal
window.showAuthModal = showAuthModal
window.hideAuthModal = hideAuthModal
window.tryAuthenticateWithStoredToken = tryAuthenticateWithStoredToken
window.initLogoutButton = initLogoutButton
