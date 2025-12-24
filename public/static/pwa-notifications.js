
// ==========================================
// PWA Notification Functions
// ==========================================

// Request notification permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('[PWA] Notifications not supported')
        return false
    }

    if (Notification.permission === 'granted') {
        return true
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
    }

    return false
}

// Send push notification
async function sendPushNotification(title, options = {}) {
    const hasPermission = await requestNotificationPermission()

    if (!hasPermission) {
        console.log('[PWA] Notification permission denied')
        return false
    }

    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready

            await registration.showNotification(title, {
                body: options.body || '',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
                vibrate: [200, 100, 200],
                tag: options.tag || 'notification',
                requireInteraction: options.requireInteraction || false,
                data: options.data || {},
                actions: options.actions || [
                    { action: 'view', title: 'Ver Detalhes' },
                    { action: 'close', title: 'Fechar' }
                ]
            })

            console.log('[PWA] Notification sent:', title)
            return true
        } catch (error) {
            console.error('[PWA] Notification error:', error)
            return false
        }
    }

    return false
}

// Notification for new appointment
function notifyNewAppointment(appointment) {
    sendPushNotification('Novo Agendamento!', {
        body: `${appointment.customerName} - ${appointment.serviceName}\n${appointment.date} às ${appointment.time}`,
        tag: `appointment-${appointment.id}`,
        requireInteraction: true,
        data: {
            url: '/painel',
            appointmentId: appointment.id
        }
    })
}

// Notification for confirmed appointment
function notifyAppointmentConfirmed(appointment) {
    sendPushNotification('Agendamento Confirmado!', {
        body: `${appointment.customerName} - ${appointment.serviceName}\n${appointment.date} às ${appointment.time}`,
        tag: `confirmed-${appointment.id}`,
        data: {
            url: '/painel',
            appointmentId: appointment.id
        }
    })
}

// Notification for payment received
function notifyPaymentReceived(appointment) {
    sendPushNotification('Pagamento Recebido!', {
        body: `${appointment.customerName} - R$ ${(appointment.priceCents / 100).toFixed(2)}`,
        tag: `payment-${appointment.id}`,
        data: {
            url: '/financeiro',
            appointmentId: appointment.id
        }
    })
}

// Notification reminder (24h before)
function notifyAppointmentReminder(appointment) {
    sendPushNotification('Lembrete de Agendamento', {
        body: `Amanhã: ${appointment.customerName} - ${appointment.serviceName}\nÀs ${appointment.time}`,
        tag: `reminder-${appointment.id}`,
        requireInteraction: true,
        data: {
            url: '/painel',
            appointmentId: appointment.id
        }
    })
}

// Check online/offline status
window.addEventListener('online', () => {
    console.log('[PWA] Online')
    // Show toast notification
    const toast = document.createElement('div')
    toast.textContent = '✅ Conectado! Sincronizando dados...'
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#10b981;color:white;padding:16px 24px;border-radius:12px;z-index:9999;animation:slideIn 0.3s ease'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
})

window.addEventListener('offline', () => {
    console.log('[PWA] Offline')
    // Show toast notification
    const toast = document.createElement('div')
    toast.textContent = '📴 Modo offline ativado'
    toast.style.cssText = 'position:fixed;bottom:20px;right:20px;background:#f59e0b;color:white;padding:16px 24px;border-radius:12px;z-index:9999;animation:slideIn 0.3s ease'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
})

// Auto-request notification permission on first visit
if (localStorage.getItem('notification-permission-requested') !== 'true') {
    setTimeout(() => {
        requestNotificationPermission().then(granted => {
            localStorage.setItem('notification-permission-requested', 'true')
            if (granted) {
                console.log('[PWA] Notifications enabled')
            }
        })
    }, 5000) // Wait 5 seconds before asking
}
