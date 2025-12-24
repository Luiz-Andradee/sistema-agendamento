// Mobile-specific JavaScript functionality

// Detect if device is mobile
function isMobile() {
    return window.innerWidth <= 768
}

// Add mobile navigation to page
function addMobileNavigation() {
    if (document.querySelector('.mobile-nav')) return // Already exists

    const currentPage = document.body?.dataset?.page || ''

    const nav = document.createElement('nav')
    nav.className = 'mobile-nav'
    nav.innerHTML = `
    <div class="mobile-nav-items">
      <a href="/" class="mobile-nav-item ${currentPage === 'booking' ? 'active' : ''}">
        <span class="mobile-nav-icon">📅</span>
        <span class="mobile-nav-label">Agendar</span>
      </a>
      <a href="/painel" class="mobile-nav-item ${currentPage === 'dashboard' ? 'active' : ''}">
        <span class="mobile-nav-icon">🏠</span>
        <span class="mobile-nav-label">Painel</span>
      </a>
      <a href="/financeiro" class="mobile-nav-item ${currentPage === 'financial' ? 'active' : ''}">
        <span class="mobile-nav-icon">💰</span>
        <span class="mobile-nav-label">Financeiro</span>
      </a>
      <a href="/clientes" class="mobile-nav-item ${currentPage === 'clients' ? 'active' : ''}">
        <span class="mobile-nav-icon">👤</span>
        <span class="mobile-nav-label">Clientes</span>
      </a>
    </div>
  `

    document.body.appendChild(nav)
}

// Convert table to mobile cards
function convertTableToCards(table, config) {
    if (!isMobile() || !table) return

    const tbody = table.querySelector('tbody')
    if (!tbody) return

    const rows = Array.from(tbody.querySelectorAll('tr'))
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim())

    const cardsContainer = document.createElement('div')
    cardsContainer.className = 'cards-mobile'

    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'))
        const card = document.createElement('div')
        card.className = 'mobile-card'

        let cardHTML = '<div class="mobile-card-body">'

        cells.forEach((cell, index) => {
            if (index < headers.length && headers[index]) {
                const value = cell.textContent.trim()
                if (value) {
                    cardHTML += `
            <div class="mobile-card-row">
              <span class="mobile-card-label">${headers[index]}:</span>
              <span class="mobile-card-value">${value}</span>
            </div>
          `
                }
            }
        })

        cardHTML += '</div>'

        // Add actions if row has buttons
        const buttons = row.querySelectorAll('button')
        if (buttons.length > 0) {
            cardHTML += '<div class="mobile-card-actions">'
            buttons.forEach(btn => {
                const btnClone = btn.cloneNode(true)
                cardHTML += btnClone.outerHTML
            })
            cardHTML += '</div>'
        }

        card.innerHTML = cardHTML
        cardsContainer.appendChild(card)
    })

    // Hide table, show cards
    table.classList.add('table-desktop')
    table.parentNode.insertBefore(cardsContainer, table.nextSibling)
}

// Show toast notification
function showToast(message, duration = 3000) {
    const toast = document.createElement('div')
    toast.className = 'toast'
    toast.textContent = message
    document.body.appendChild(toast)

    setTimeout(() => {
        toast.style.opacity = '0'
        setTimeout(() => toast.remove(), 300)
    }, duration)
}

// Optimize forms for mobile
function optimizeForms() {
    if (!isMobile()) return

    // Add autocomplete attributes
    document.querySelectorAll('input[type="tel"]').forEach(input => {
        input.setAttribute('autocomplete', 'tel')
    })

    document.querySelectorAll('input[type="email"]').forEach(input => {
        input.setAttribute('autocomplete', 'email')
    })

    // Prevent zoom on input focus (iOS)
    document.querySelectorAll('input, select, textarea').forEach(element => {
        element.style.fontSize = '16px'
    })
}

// Handle mobile gestures
function initMobileGestures() {
    if (!isMobile()) return

    let touchStartX = 0
    let touchEndX = 0

    document.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX
    })

    document.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX
        handleSwipe()
    })

    function handleSwipe() {
        const swipeThreshold = 50
        const diff = touchStartX - touchEndX

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe left
                console.log('Swiped left')
            } else {
                // Swipe right
                console.log('Swiped right')
            }
        }
    }
}

// Initialize mobile features
function initMobileFeatures() {
    if (isMobile()) {
        // addMobileNavigation() // Disabled per user request
        optimizeForms()
        initMobileGestures()

        // Convert all tables with class 'responsive-table'
        document.querySelectorAll('table.responsive-table').forEach(table => {
            convertTableToCards(table)
        })
    }
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileFeatures)
} else {
    initMobileFeatures()
}

// Re-run on resize (orientation change)
let resizeTimer
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        initMobileFeatures()
    }, 250)
})

// Export functions for use in other scripts
window.mobileUtils = {
    isMobile,
    showToast,
    convertTableToCards,
    addMobileNavigation
}
