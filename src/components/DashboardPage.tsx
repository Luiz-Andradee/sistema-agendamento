import type { Service, Professional } from '../types'

export const DashboardPage = ({
    services,
    professionals,
    studioPhone,
    panelProtected
}: {
    services: Service[]
    professionals: Professional[]
    studioPhone: string
    panelProtected: boolean
}) => {
    const weekdayOptions = [
        { label: 'Domingo', value: 0 },
        { label: 'Segunda-feira', value: 1 },
        { label: 'Terça-feira', value: 2 },
        { label: 'Quarta-feira', value: 3 },
        { label: 'Quinta-feira', value: 4 },
        { label: 'Sexta-feira', value: 5 },
        { label: 'Sábado', value: 6 }
    ]

    return (
        <div className="mx-auto min-h-screen w-full max-w-6xl space-y-12 px-6 py-12">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-pink-300/80">Painel Operacional</p>
                    <h1 className="font-display text-3xl text-white">Agenda do Estúdio</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300">
                        Acompanhe solicitações pendentes, confirme horários, gerencie reagendamentos e acione os clientes diretamente pelo WhatsApp.
                    </p>
                    {panelProtected ? (
                        <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                            <span aria-hidden>🔒</span> Acesso protegido por token administrativo
                        </p>
                    ) : (
                        <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-100">
                            <span aria-hidden>⚠️</span> Configure um token em PANEL_TOKEN para proteger este painel
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                        <p className="text-xs uppercase tracking-wide text-slate-300/80">Contato rápido</p>
                        <a
                            className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-pink-200 transition hover:text-pink-100"
                            href={`https://wa.me/${studioPhone}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Abrir WhatsApp geral do estúdio
                        </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href="/painel/funcionarios"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-500"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Funcionários
                        </a>
                        <a
                            href="/painel/servicos"
                            className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Serviços
                        </a>
                        <a
                            href="/painel/clients"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Clientes
                        </a>
                        <a
                            href="/painel/financeiro"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Financeiro
                        </a>
                        <button
                            id="logoutBtn"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/30 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
                        >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sair
                        </button>
                    </div>
                    <div className="flex w-full flex-wrap justify-end gap-2 sm:w-auto">
                        <button
                            id="newAppointmentBtn"
                            className="flex-auto whitespace-nowrap rounded-full bg-pink-600 px-5 py-2 text-center shadow-lg transition hover:bg-pink-500 sm:flex-none"
                        >
                            Novo Agendamento
                        </button>
                    </div>
                </div>
            </header>

            {/* Widgets Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Widget: Agenda do Dia */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500/20 text-lg">
                                🕒
                            </span>
                            <div>
                                <h3 className="font-semibold text-white">Agenda do Dia</h3>
                                <p id="todayDate" className="text-xs text-slate-400">Hoje</p>
                            </div>
                        </div>
                        <button id="refreshToday" className="text-xs text-pink-300 hover:text-pink-200" title="Atualizar">
                            Atualizar
                        </button>
                    </div>

                    <div id="todayTimeline" className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                        {/* Timeline items injected by JS */}
                        <div className="text-center py-8 text-slate-400 text-sm">
                            Carregando agenda...
                        </div>
                    </div>

                    <div className="mt-4 border-t border-white/5 pt-3">
                        <p id="todayStats" className="text-xs text-slate-400">
                            Carregando estatísticas...
                        </p>
                    </div>
                </div>

                {/* Widget: Faturamento */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-lg">
                                💰
                            </span>
                            <h3 className="font-semibold text-white">Faturamento</h3>
                        </div>
                        <select id="revenuePeriod" className="bg-slate-900 border border-white/10 rounded-lg text-xs text-slate-300 py-1 px-2 outline-none">
                            <option value="today">Hoje</option>
                            <option value="month">Mês Atual</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <h4 id="revenueTotal" className="text-3xl font-bold text-white">R$ 0,00</h4>
                        <p id="revenueCount" className="text-sm text-slate-400">0 atendimentos pagos</p>
                        <p id="revenuePending" className="text-sm text-amber-400">0 atendimentos pendentes</p>
                    </div>

                    <div id="revenueComparison" className="mt-4 flex items-center gap-2 hidden">
                        <span id="revenueChangeIcon" className="text-lg">📈</span>
                        <div>
                            <p id="revenueChange" className="text-sm font-semibold text-emerald-400">+0%</p>
                            <p className="text-xs text-slate-500">vs mês anterior</p>
                        </div>
                    </div>
                </div>

                {/* Widget: Alertas */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-lg">
                                ⚠️
                            </span>
                            <h3 className="font-semibold text-white">Alertas</h3>
                        </div>
                        <span id="alertCount" className="rounded-full bg-slate-500 px-2 py-1 text-xs font-bold text-white">0</span>
                    </div>

                    <div id="alertsList" className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
                        {/* Alerts injected by JS */}
                        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
                            <span className="text-2xl">✅</span>
                            <p className="text-sm text-emerald-200">Tudo em ordem!</p>
                        </div>
                    </div>
                </div>

                {/* Widget: Aguardando Confirmação */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            📱 Aguardando Confirmação
                            <span id="pendingCount" className="rounded-full bg-yellow-500/20 text-yellow-200 px-2 py-0.5 text-xs">0</span>
                        </h3>
                    </div>
                    <div id="pendingList" className="space-y-2 mb-4">
                        <div className="text-center py-4 text-slate-400 text-sm">
                            Nenhum pendente
                        </div>
                    </div>
                    <button id="confirmAllPending" className="w-full py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700 transition" disabled>
                        Confirmar Todos
                    </button>
                </div>

                {/* Widget: Metas do Mês */}
                <div className="col-span-1 md:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            🎯 Metas do Mês
                        </h3>
                        <button className="text-xs text-pink-300 hover:text-pink-200">Editar Metas</button>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {/* Meta Faturamento */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Faturamento</span>
                                <span id="goalRevenuePercent">0% da meta</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div id="goalRevenueProgress" className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000" style={{ width: '0%' }}></div>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span id="goalRevenueActual" className="text-white font-semibold">R$ 0</span>
                                <span id="goalRevenueTarget" className="text-slate-500">R$ 10.000</span>
                            </div>
                        </div>

                        {/* Meta Atendimentos */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Atendimentos</span>
                                <span id="goalApptsPercent">0% da meta</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                                <div id="goalApptsProgress" className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000" style={{ width: '0%' }}></div>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span id="goalApptsActual" className="text-white font-semibold">0</span>
                                <span id="goalApptsTarget" className="text-slate-500">50</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-xl font-semibold text-white">Calendário de Agendamentos</h2>
                        <div className="flex items-center justify-center gap-3">
                            <button id="prevMonth" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10">
                                ←
                            </button>
                            <span id="currentMonthLabel" className="min-w-[140px] text-center text-base font-medium text-white"></span>
                            <button id="nextMonth" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white transition hover:bg-white/10">
                                →
                            </button>
                        </div>
                    </div>

                    <div className="calendar-container">
                        <div className="mb-3 grid grid-cols-7 gap-2 text-center">
                            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map(day => (
                                <div key={day} className="py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div id="calendarDays" className="grid grid-cols-7 gap-2"></div>
                    </div>

                    <div id="selectedDateDisplay" className="mt-6 hidden flex-row items-center justify-between rounded-xl border border-pink-500/20 bg-pink-500/10 px-4 py-3 text-sm text-pink-200">
                        <span>Filtrando por: <strong id="selectedDateValue"></strong></span>
                        <button id="clearDateFilter" className="text-xs underline transition hover:text-white">Limpar filtro</button>
                    </div>
                </section>

                <section className="h-fit rounded-3xl border border-white/10 bg-white/5 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="font-semibold text-white">Solicitações e agendamentos</h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <label htmlFor="statusFilter" className="text-slate-300">
                                Filtrar por status
                            </label>
                            <select
                                id="statusFilter"
                                className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
                            >
                                <option value="all">Todos</option>
                                <option value="pending">Pendentes</option>
                                <option value="confirmed">Confirmados</option>
                                <option value="rebook_requested">Reagendamento solicitado</option>
                                <option value="cancelled">Cancelados</option>
                            </select>
                            <button
                                id="refreshAppointments"
                                className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/30"
                                type="button"
                            >
                                Atualizar lista
                            </button>
                        </div>
                    </div>

                    <div id="appointmentsEmpty" className="mt-10 hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
                        Nenhum agendamento encontrado para o filtro selecionado.
                    </div>

                    <div id="appointmentsList" className="mt-8 grid gap-4 max-h-[600px] overflow-y-auto pr-2" />
                </section>
            </div>

            <section className="rounded-3xl border border-pink-400/30 bg-pink-500/10 p-6 text-sm text-pink-50/90">
                <h2 className="text-lg font-semibold text-white">Como usar o painel</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                    <li>
                        <strong>Pendentes:</strong> confirme ou cancele conforme alinhamento com o cliente.
                    </li>
                    <li>
                        <strong>Reagendamento solicitado:</strong> utilize o modal para definir nova data/horário antes de confirmar.
                    </li>
                    <li>
                        <strong>WhatsApp:</strong> use os botões "Abrir WhatsApp" para contato imediato com mensagem pronta.
                    </li>
                    <li>Os horários cancelados ficam livres imediatamente para novas reservas.</li>
                </ul>
            </section>

            <div id="authModal" className="modal-backdrop hidden" data-modal="auth" aria-hidden="true">
                <div className="modal-panel">
                    <form id="authForm" className="grid gap-4 text-slate-900">
                        <h2 className="text-lg font-semibold text-slate-900">Autenticação do painel</h2>
                        <p className="text-sm text-slate-600">
                            Informe o token administrativo configurado na variável <code className="rounded bg-slate-200 px-1">PANEL_TOKEN</code>.
                        </p>
                        <input
                            id="authToken"
                            type="password"
                            placeholder="Token administrativo"
                            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-pink-500"
                            required
                        />
                        <p id="authFeedback" className="hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600" />
                        <div className="flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                id="authCancel"
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
                            >
                                Entrar
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="rebookModal" className="modal-backdrop hidden" data-modal="rebook" aria-hidden="true">
                <div className="modal-panel">
                    <form id="rebookModalForm" className="grid gap-4 text-slate-900">
                        <h2 className="text-lg font-semibold text-slate-900">Aprovar reagendamento</h2>
                        <p className="text-sm text-slate-600">
                            Escolha a nova data e o horário disponível para confirmar o reagendamento.
                        </p>
                        <input
                            type="date"
                            id="rebookModalDate"
                            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-pink-500"
                            required
                        />
                        <select
                            id="rebookModalTime"
                            className="rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-pink-500"
                            required
                        >
                            <option value="">Selecione um horário disponível</option>
                        </select>
                        <p id="rebookModalAvailability" className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-600" />
                        <p id="rebookModalFeedback" className="hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600" />
                        <div className="flex flex-wrap justify-end gap-3">
                            <button
                                type="button"
                                id="rebookModalCancel"
                                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300"
                            >
                                Fechar
                            </button>
                            <button
                                type="submit"
                                className="rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
                            >
                                Aprovar reagendamento
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <script
                id="bootstrap-data"
                type="application/json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({ services, professionals, studioPhone, panelProtected })
                }}
            />

            <div id="bookingModal" className="fixed inset-0 z-50 flex hidden items-center justify-center bg-black/80 backdrop-blur-sm" aria-hidden="true">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#1e293b] p-8 shadow-2xl">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white">Novo Agendamento Interno</h2>
                        <button id="closeBookingModal" className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                            <span className="sr-only">Fechar</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form id="bookingForm" className="grid gap-5">
                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-200" htmlFor="serviceSelect">
                                Serviço
                            </label>
                            <select
                                id="serviceSelect"
                                required
                                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-500"
                            >
                                <option value="">Selecione um serviço</option>
                                {services.map((service) => (
                                    <option key={service.id} value={service.id}>
                                        {service.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-200" htmlFor="professionalSelect">
                                Profissional
                            </label>
                            <select
                                id="professionalSelect"
                                required
                                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-500"
                            >
                                <option value="">Selecione a profissional</option>
                                {professionals.map((professional) => (
                                    <option key={professional.id} value={professional.id}>
                                        {professional.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-200" htmlFor="dateInput">
                                    Data
                                </label>
                                <input
                                    type="date"
                                    id="dateInput"
                                    required
                                    className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-500"
                                />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-medium text-slate-200" htmlFor="timeSelect">
                                    Horário
                                </label>
                                <select
                                    id="timeSelect"
                                    required
                                    className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white outline-none transition focus:border-pink-500"
                                >
                                    <option value="">Selecione um horário disponível</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-200" htmlFor="clientSearch">
                                Buscar Cliente (Nome, Telefone ou CPF)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    id="clientSearch"
                                    type="text"
                                    placeholder="Digite para buscar cliente cadastrado..."
                                    className="flex-1 rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
                                />
                                <button
                                    id="clientSearchBtn"
                                    type="button"
                                    className="rounded-2xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-pink-500"
                                >
                                    Buscar
                                </button>
                            </div>
                            <div id="clientSearchResults" className="hidden"></div>
                            <div id="clientSearchStatus" className="hidden mt-2"></div>
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-200" htmlFor="customerName">
                                Nome do Cliente
                            </label>
                            <input
                                id="customerName"
                                type="text"
                                required
                                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-200" htmlFor="customerPhone">
                                WhatsApp
                            </label>
                            <input
                                id="customerPhone"
                                type="tel"
                                required
                                placeholder="Ex: 47 99151-8816"
                                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-200" htmlFor="customerEmail">
                                E-mail (opcional)
                            </label>
                            <input
                                id="customerEmail"
                                type="email"
                                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
                            />
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-slate-200" htmlFor="customerNotes">
                                Observações
                            </label>
                            <textarea
                                id="customerNotes"
                                rows={2}
                                className="rounded-2xl border border-white/10 bg-slate-900/50 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-pink-500"
                            />
                        </div>

                        <div className="rounded-2xl border border-pink-300/40 bg-pink-500/10 px-4 py-3 text-sm text-pink-100" id="availabilityInfo">
                            Selecione a data para ver os horários disponíveis.
                        </div>

                        <button
                            type="submit"
                            className="mt-4 flex w-full items-center justify-center rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-pink-500"
                        >
                            Confirmar Agendamento
                        </button>
                        <div id="bookingAlert" className="hidden rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert" />
                    </form>
                </div>
            </div>
        </div>
    )
}
