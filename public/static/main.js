// ==========================================
// Main Entry Point
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // PWA Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => console.log('[PWA] Registered:', registration.scope))
            .catch(err => console.error('[PWA] Fail:', err))
    }

    // Bootstrap data hydration (if any)
    if (typeof hydrateBootstrapData === 'function') {
        hydrateBootstrapData()
    }

    // Routing based on data-page attribute
    const page = document.body?.dataset?.page

    if (!page) {
        console.warn('No page data attribute found on body.')
        // Check for login fallback
        if (document.getElementById('loginForm')) {
            initLoginPage && initLoginPage().catch(console.error)
        }
        return
    }

    console.log(`[Main] Initializing page: ${page}`)

    switch (page) {
        case 'dashboard':
            if (window.initDashboardPage) initDashboardPage().catch(console.error)
            break
        case 'clients':
            if (window.initClientsPage) initClientsPage().catch(console.error)
            break
        case 'employees':
            // Logic in employees.js. It attaches to window.loadEmployees etc.
            // Usually it auto-inits or waits for call. 
            // In current employees.js structure, we expose loadEmployees.
            // We can check if we should call it.
            if (window.loadEmployees) window.loadEmployees().catch(console.error)
            // Schedule Manager init is handled inside loadEmployees
            break
        case 'services':
            if (window.initServicesPage) initServicesPage().catch(console.error)
            break
        case 'financial':
            if (window.initFinancialPage) initFinancialPage().catch(console.error)
            break
        case 'login':
            if (window.initLoginPage) initLoginPage().catch(console.error)
            break
        default:
            console.log(`No specific init function for ${page}`)
    }
})

function hydrateBootstrapData() {
    const script = document.getElementById('bootstrap-data')
    if (!script) return
    try {
        const data = JSON.parse(script.textContent)
        // Populate global state if exists (defined in utils or implicit in modules)
        if (window.state) {
            Object.assign(window.state, data)
        } else {
            window.state = data
        }
    } catch (e) {
        console.error('Bootstrap hydration failed', e)
    }
}
