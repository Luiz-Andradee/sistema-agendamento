// ========================================
// DASHBOARD WIDGETS
// ========================================

// Helper function to escape HTML - using global from utils.js
// function escapeHtml(text) { ... }

async function loadDashboardWidgets() {
    try {
        console.log('[Widgets] Iniciando carregamento...')

        // Usar window.getPanelToken se disponível, senão usar localStorage diretamente
        const token = window.getPanelToken ? window.getPanelToken() : localStorage.getItem('estudio-aline-panel-token')

        if (!token) {
            console.warn('[Widgets] Token não encontrado')
            return
        }

        console.log('[Widgets] Fazendo fetch para /api/dashboard/stats')
        const response = await fetch('/api/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) {
            console.error('[Widgets] Erro na resposta:', response.status, response.statusText)
            throw new Error('Erro ao carregar estatísticas')
        }

        const data = await response.json()
        console.log('[Widgets] Dados recebidos:', data)

        // Atualizar widgets
        updateTodayTimeline(data.today)
        updateRevenueWidget(data)
        updateAlertsWidget(data)
        updatePendingWidget(data.pending)
        updateGoalsWidget(data.month)

        console.log('[Widgets] Widgets atualizados com sucesso!')

    } catch (error) {
        console.error('[Widgets] Erro ao carregar widgets:', error)
    }
}

function updateTodayTimeline(todayData) {
    const timeline = document.getElementById('todayTimeline')
    const dateEl = document.getElementById('todayDate')
    const statsEl = document.getElementById('todayStats')

    if (!timeline) {
        console.warn('[Widgets] Elemento todayTimeline não encontrado')
        return
    }

    // Atualizar data
    if (dateEl) {
        const date = new Date(todayData.date + 'T00:00:00')
        dateEl.textContent = date.toLocaleDateString('pt-BR', {
            weekday: 'short', day: 'numeric', month: 'short'
        })
    }

    const appointments = todayData.appointments || []

    if (appointments.length === 0) {
        timeline.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-sm">
        Nenhum agendamento para hoje
      </div>
    `
        if (statsEl) statsEl.textContent = '0 agendamentos'
        return
    }

    // Renderizar timeline
    timeline.innerHTML = appointments.map(appt => {
        // Obter hora atual no Brasil
        const now = new Date()
        const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
        const currentHours = brazilTime.getHours()
        const currentMinutes = brazilTime.getMinutes()
        const currentTotalMinutes = currentHours * 60 + currentMinutes

        // Verificar se está atrasado (pendente e já passou da hora)
        const [apptHours, apptMinutes] = appt.start_time.split(':').map(Number)
        const apptTotalMinutes = apptHours * 60 + apptMinutes
        const isOverdue = appt.status === 'pending' && apptTotalMinutes < currentTotalMinutes

        const statusColors = {
            pending: isOverdue ? 'bg-red-500/20 border-red-500/30 text-red-200' : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-200',
            confirmed: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200',
            cancelled: 'bg-red-500/20 border-red-500/30 text-red-200'
        }

        const statusLabels = {
            pending: isOverdue ? 'Atrasado' : 'Pendente',
            confirmed: 'Confirmado',
            cancelled: 'Cancelado'
        }

        const isPaid = appt.paid_at ? '💰' : ''
        const overdueIcon = isOverdue ? '⚠️ ' : ''

        return `
      <div class="flex items-start gap-3 rounded-xl border ${statusColors[appt.status] || 'border-white/10 bg-white/5'} p-3">
        <div class="flex-shrink-0 text-center">
          <p class="text-sm font-bold text-white">${appt.start_time.slice(0, 5)}</p>
          <p class="text-xs text-slate-400">${appt.duration_minutes || 60}min</p>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-white truncate">${overdueIcon}${escapeHtml(appt.customer_name)} ${isPaid}</p>
          <p class="text-xs text-slate-400 truncate">${escapeHtml(appt.service_name || 'Serviço')}</p>
        </div>
        <span class="text-xs px-2 py-1 rounded-full ${statusColors[appt.status]}">
          ${statusLabels[appt.status]}
        </span>
      </div>
    `
    }).join('')

    // Atualizar estatísticas
    if (statsEl) {
        const now = new Date()
        const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
        const currentHours = brazilTime.getHours()
        const currentMinutes = brazilTime.getMinutes()
        const currentTotalMinutes = currentHours * 60 + currentMinutes

        const confirmed = appointments.filter(a => a.status === 'confirmed').length
        const overdue = appointments.filter(a => {
            const [h, m] = a.start_time.split(':').map(Number)
            return a.status === 'pending' && (h * 60 + m) < currentTotalMinutes
        }).length

        let statsText = `${appointments.length} agendamento${appointments.length !== 1 ? 's' : ''} (${confirmed} confirmado${confirmed !== 1 ? 's' : ''})`
        if (overdue > 0) {
            statsText += ` - ⚠️ ${overdue} atrasado${overdue !== 1 ? 's' : ''}`
        }
        statsEl.textContent = statsText
    }
}

function updateRevenueWidget(data) {
    const periodSelect = document.getElementById('revenuePeriod')
    const totalEl = document.getElementById('revenueTotal')
    const countEl = document.getElementById('revenueCount')
    const pendingEl = document.getElementById('revenuePending')
    const comparisonEl = document.getElementById('revenueComparison')
    const changeEl = document.getElementById('revenueChange')
    const iconEl = document.getElementById('revenueChangeIcon')

    if (!totalEl || !countEl) return

    const period = periodSelect?.value || 'today'
    const revenueData = period === 'today' ? data.today.revenue : data.month.revenue
    const pendingData = period === 'today' ? data.today.pending : data.month.pending

    // Formatar valor
    const totalBRL = (revenueData.totalCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    })

    totalEl.textContent = totalBRL
    countEl.textContent = `${revenueData.count} atendimento${revenueData.count !== 1 ? 's' : ''} pago${revenueData.count !== 1 ? 's' : ''}`

    // Atualizar contagem de pendentes
    if (pendingEl) {
        pendingEl.textContent = `${pendingData.count} atendimento${pendingData.count !== 1 ? 's' : ''} pendente${pendingData.count !== 1 ? 's' : ''}`
    }

    // Mostrar comparação apenas para mês
    if (period === 'month' && comparisonEl && changeEl && iconEl) {
        const lastMonth = data.month.lastMonthTotalCents
        const current = revenueData.totalCents

        if (lastMonth > 0) {
            const percentChange = ((current - lastMonth) / lastMonth * 100).toFixed(1)
            const isPositive = percentChange >= 0

            changeEl.textContent = `${isPositive ? '+' : ''}${percentChange}%`
            changeEl.className = `text-lg font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`
            iconEl.textContent = isPositive ? '📈' : '📉'

            comparisonEl.classList.remove('hidden')
        } else {
            comparisonEl.classList.add('hidden')
        }
    } else if (comparisonEl) {
        comparisonEl.classList.add('hidden')
    }
}

function updateAlertsWidget(data) {
    const alertsList = document.getElementById('alertsList')
    const alertCount = document.getElementById('alertCount')

    if (!alertsList) return

    const alerts = []

    // Obter hora atual no Brasil
    const now = new Date()
    const brazilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const currentHours = brazilTime.getHours()
    const currentMinutes = brazilTime.getMinutes()
    const currentTotalMinutes = currentHours * 60 + currentMinutes

    // Alerta PRIORITÁRIO: Agendamentos atrasados (pendentes que já passaram da hora)
    const overdueAppointments = data.today.appointments.filter(a => {
        if (a.status !== 'pending') return false
        const [h, m] = a.start_time.split(':').map(Number)
        return (h * 60 + m) < currentTotalMinutes
    })
    if (overdueAppointments.length > 0) {
        alerts.push({
            type: 'critical',
            icon: '🚨',
            message: `${overdueAppointments.length} agendamento${overdueAppointments.length > 1 ? 's' : ''} ATRASADO${overdueAppointments.length > 1 ? 'S' : ''} - confirme urgente!`
        })
    }

    // Alerta: Agendamentos pendentes de hoje (que ainda não passaram)
    const todayPending = data.today.appointments.filter(a => {
        if (a.status !== 'pending') return false
        const [h, m] = a.start_time.split(':').map(Number)
        return (h * 60 + m) >= currentTotalMinutes
    })
    if (todayPending.length > 0) {
        alerts.push({
            type: 'warning',
            icon: '⏰',
            message: `${todayPending.length} agendamento${todayPending.length > 1 ? 's' : ''} de hoje pendente${todayPending.length > 1 ? 's' : ''} de confirmação`
        })
    }

    // Alerta: Reagendamentos solicitados
    const rebookRequests = data.today.appointments.filter(a => a.status === 'rebook_requested')
    if (rebookRequests.length > 0) {
        alerts.push({
            type: 'info',
            icon: '🔄',
            message: `${rebookRequests.length} solicitaç${rebookRequests.length > 1 ? 'ões' : 'ão'} de reagendamento`
        })
    }

    // Alerta: Atendimentos do dia não pagos (confirmados mas sem pagamento)
    const todayUnpaid = data.today.appointments.filter(a => {
        return a.status === 'confirmed' && !a.paid_at
    })
    if (todayUnpaid.length > 0) {
        alerts.push({
            type: 'warning',
            icon: '💰',
            message: `${todayUnpaid.length} atendimento${todayUnpaid.length > 1 ? 's' : ''} do dia sem pagamento`
        })
    }

    // Atualizar contador
    if (alertCount) {
        alertCount.textContent = alerts.length
        alertCount.className = alerts.length > 0
            ? 'rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white'
            : 'rounded-full bg-slate-500 px-2 py-1 text-xs font-bold text-white'
    }

    // Renderizar alertas
    if (alerts.length === 0) {
        alertsList.innerHTML = `
      <div class="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
        <span class="text-2xl">✅</span>
        <p class="text-sm text-emerald-200">Tudo em ordem!</p>
      </div>
    `
        return
    }

    alertsList.innerHTML = alerts.map(alert => `
    <div class="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
      <span class="text-xl flex-shrink-0">${alert.icon}</span>
      <p class="flex-1 text-sm text-amber-100">${alert.message}</p>
    </div>
  `).join('')
}

function updatePendingWidget(pendingData) {
    const pendingList = document.getElementById('pendingList')
    const pendingCount = document.getElementById('pendingCount')
    const confirmAllBtn = document.getElementById('confirmAllPending')

    if (!pendingList) return

    const count = pendingData.count || 0

    if (pendingCount) {
        pendingCount.textContent = count
    }

    if (confirmAllBtn) {
        confirmAllBtn.disabled = count === 0
    }

    if (count === 0) {
        pendingList.innerHTML = `
      <div class="text-center py-8 text-slate-400 text-sm">
        Nenhum agendamento aguardando confirmação
      </div>
    `
    } else {
        pendingList.innerHTML = `
      <div class="text-center py-8 text-blue-200 text-sm">
        ${count} agendamento${count > 1 ? 's' : ''} aguardando confirmação
      </div>
      <p class="text-xs text-slate-400 text-center">
        Veja a lista completa abaixo no calendário
      </p>
    `
    }
}

function updateGoalsWidget(monthData) {
    // Metas padrão (podem ser configuráveis no futuro)
    const REVENUE_GOAL = 1000000 // R$ 10.000,00 em centavos
    const APPTS_GOAL = 50

    const revenueActual = monthData.revenue.totalCents
    const apptsActual = monthData.revenue.count

    // Faturamento
    const revenueActualEl = document.getElementById('goalRevenueActual')
    const revenueTargetEl = document.getElementById('goalRevenueTarget')
    const revenueProgressEl = document.getElementById('goalRevenueProgress')
    const revenuePercentEl = document.getElementById('goalRevenuePercent')

    if (revenueActualEl) {
        revenueActualEl.textContent = (revenueActual / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        })
    }

    if (revenueTargetEl) {
        revenueTargetEl.textContent = (REVENUE_GOAL / 100).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        })
    }

    const revenuePercent = Math.min((revenueActual / REVENUE_GOAL * 100), 100)
    if (revenueProgressEl) {
        revenueProgressEl.style.width = `${revenuePercent}%`
    }

    if (revenuePercentEl) {
        revenuePercentEl.textContent = `${revenuePercent.toFixed(1)}% da meta`
    }

    // Atendimentos
    const apptsActualEl = document.getElementById('goalApptsActual')
    const apptsTargetEl = document.getElementById('goalApptsTarget')
    const apptsProgressEl = document.getElementById('goalApptsProgress')
    const apptsPercentEl = document.getElementById('goalApptsPercent')

    if (apptsActualEl) apptsActualEl.textContent = apptsActual
    if (apptsTargetEl) apptsTargetEl.textContent = APPTS_GOAL

    const apptsPercent = Math.min((apptsActual / APPTS_GOAL * 100), 100)
    if (apptsProgressEl) {
        apptsProgressEl.style.width = `${apptsPercent}%`
    }

    if (apptsPercentEl) {
        apptsPercentEl.textContent = `${apptsPercent.toFixed(1)}% da meta`
    }
}

// Adicionar event listeners para widgets
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Widgets] DOMContentLoaded disparado')

    // Carregar widgets se estiver no dashboard
    const page = document.body.dataset.page
    console.log('[Widgets] Página atual:', page)

    if (page === 'dashboard') {
        console.log('[Widgets] Inicializando widgets do dashboard')
        let autoRefreshInterval = null

        // Função para atualizar e resetar timer
        const refreshWidgets = () => {
            loadDashboardWidgets()
            updateLastRefreshTime()

            // Limpar intervalo anterior se existir
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval)
            }

            // Configurar novo intervalo de 1 hora (3600000ms)
            autoRefreshInterval = setInterval(() => {
                console.log('[Widgets] Auto-refresh (1 hora)')
                loadDashboardWidgets()
                updateLastRefreshTime()
            }, 3600000) // 1 hora = 60 * 60 * 1000 = 3600000ms
        }

        // Função para atualizar indicador de última atualização
        const updateLastRefreshTime = () => {
            const now = new Date()
            const timeStr = now.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            })

            // Atualizar texto do botão refresh
            const refreshBtn = document.getElementById('refreshToday')
            if (refreshBtn) {
                refreshBtn.setAttribute('title', `Última atualização: ${timeStr}`)
            }
        }

        // Carregar widgets inicialmente (500ms após carregamento)
        setTimeout(() => {
            console.log('[Widgets] Executando refresh inicial')
            refreshWidgets()
        }, 500)

        // Refresh button - atualização manual
        const refreshBtn = document.getElementById('refreshToday')
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('[Widgets] Atualização manual')
                refreshWidgets()
            })
        }

        // Revenue period selector
        const periodSelect = document.getElementById('revenuePeriod')
        if (periodSelect) {
            periodSelect.addEventListener('change', loadDashboardWidgets)
        }

        // Confirm All Pending button
        const confirmAllBtn = document.getElementById('confirmAllPending')
        if (confirmAllBtn) {
            confirmAllBtn.addEventListener('click', async () => {
                if (confirmAllBtn.disabled) return

                if (!confirm('Deseja confirmar TODOS os agendamentos pendentes?')) return

                try {
                    confirmAllBtn.disabled = true
                    confirmAllBtn.textContent = 'Confirmando...'

                    // Buscar todos os agendamentos pendentes
                    const token = window.getPanelToken ? window.getPanelToken() : localStorage.getItem('estudio-aline-panel-token')
                    if (!token) {
                        alert('Erro: Token não encontrado')
                        return
                    }

                    const response = await fetch('/api/appointments?status=pending', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })

                    if (!response.ok) throw new Error('Erro ao buscar agendamentos')

                    const data = await response.json()
                    const pendingAppointments = data.appointments || []

                    if (pendingAppointments.length === 0) {
                        alert('Nenhum agendamento pendente encontrado')
                        return
                    }

                    // Confirmar todos em sequência
                    let confirmed = 0
                    let failed = 0

                    for (const appt of pendingAppointments) {
                        try {
                            const confirmResponse = await fetch(`/api/appointments/${appt.id}/confirm`, {
                                method: 'POST',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            })

                            if (confirmResponse.ok) {
                                confirmed++
                            } else {
                                failed++
                            }
                        } catch (error) {
                            console.error(`Erro ao confirmar ${appt.id}:`, error)
                            failed++
                        }
                    }

                    // Mostrar resultado
                    alert(`✅ ${confirmed} agendamento(s) confirmado(s)\n${failed > 0 ? `❌ ${failed} falha(s)` : ''}`)

                    // Recarregar widgets e lista de agendamentos
                    await loadDashboardWidgets()

                    // Recarregar lista de agendamentos se a função existir
                    if (window.loadAppointments) {
                        await window.loadAppointments()
                    }

                } catch (error) {
                    console.error('Erro ao confirmar todos:', error)
                    alert('Erro ao confirmar agendamentos. Tente novamente.')
                } finally {
                    confirmAllBtn.disabled = false
                    confirmAllBtn.textContent = 'Confirmar Todos'
                }
            })
        }

        // Limpar intervalo ao sair da página
        window.addEventListener('beforeunload', () => {
            if (autoRefreshInterval) {
                clearInterval(autoRefreshInterval)
            }
        })
    }
})
