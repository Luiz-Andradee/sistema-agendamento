export const EmployeesPage = () => (
    <div className="mx-auto min-h-screen w-full max-w-6xl space-y-12 px-6 py-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="text-sm uppercase tracking-[0.2em] text-pink-300/80">Painel Operacional</p>
                <h1 className="font-display text-3xl text-white">Gestão de Funcionários</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Gerencie os profissionais do estúdio e suas informações.
                </p>
            </div>
            <a
                href="/painel"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
            >
                Voltar ao Painel
            </a>
        </header>


        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-white">Lista de Funcionários</h2>
                <button
                    id="addEmployeeBtn"
                    className="w-full rounded-full bg-pink-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-pink-500 sm:w-auto"
                >
                    Adicionar Funcionário
                </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                        <tr>
                            <th className="px-4 py-3 text-left">Nome</th>
                            <th className="px-4 py-3 text-left">Função</th>
                            <th className="px-4 py-3 text-left">CPF</th>
                            <th className="px-4 py-3 text-left">WhatsApp</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="employeesList" className="divide-y divide-white/5 text-slate-300">
                        {/* Rows injected by JS */}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div id="employeesListMobile" className="block space-y-3 md:hidden">
                {/* Cards injected by JS */}
            </div>
        </div>

        {/* Schedule Manager Section (Moved from Dashboard) */}
        <section id="scheduleSection" className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="font-semibold text-white">Agenda personalizada por profissional</h2>
                    <p className="text-sm text-slate-300">
                        Ajuste a grade semanal de horários e bloqueios pontuais de cada profissional. Os horários disponíveis no site são gerados a partir dessas configurações.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="scheduleProfessionalSelect" className="text-sm text-slate-300">
                        Profissional
                    </label>
                    <select
                        id="scheduleProfessionalSelect"
                        className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
                    >
                        <option value="">Selecione um profissional...</option>
                        {/* Options will be populated by employees.js or app.js logic */}
                    </select>
                </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-5">
                    <div className="grid gap-2">
                        <label htmlFor="scheduleInterval" className="text-sm font-medium text-slate-200">
                            Intervalo padrão entre horários (minutos)
                        </label>
                        <input
                            id="scheduleInterval"
                            type="number"
                            min={15}
                            step={5}
                            defaultValue={30}
                            className="w-32 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                        />
                    </div>


                    <form id="availabilityForm" className="space-y-3">
                        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                            <div className="min-w-[600px] overflow-hidden rounded-2xl border border-white/10">
                                <table className="w-full divide-y divide-white/10 text-sm">
                                    <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Dia</th>
                                            <th className="px-4 py-3 text-left">Início</th>
                                            <th className="px-4 py-3 text-left">Fim</th>
                                            <th className="px-4 py-3 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[
                                            { label: 'Domingo', value: 0 },
                                            { label: 'Segunda-feira', value: 1 },
                                            { label: 'Terça-feira', value: 2 },
                                            { label: 'Quarta-feira', value: 3 },
                                            { label: 'Quinta-feira', value: 4 },
                                            { label: 'Sexta-feira', value: 5 },
                                            { label: 'Sábado', value: 6 }
                                        ].map((day) => (
                                            <tr key={day.value} data-weekday={day.value} className="divide-x divide-white/5">
                                                <td className="bg-white/5 px-4 py-3 font-medium text-white">{day.label}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="time"
                                                        data-role="start"
                                                        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="time"
                                                        data-role="end"
                                                        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        data-role="clear"
                                                        className="text-xs font-semibold text-slate-300 transition hover:text-white"
                                                    >
                                                        Sem atendimento
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </form>

                    <div id="availabilityFeedback" className="hidden rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-50" />

                    <div className="flex justify-end">
                        <button
                            id="saveAvailability"
                            type="button"
                            className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                        >
                            Salvar grade semanal
                        </button>
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <h3 className="font-semibold text-white">Adicionar bloqueio pontual</h3>
                        <form id="timeOffForm" className="mt-3 grid gap-3 text-sm">
                            <input
                                id="timeOffDate"
                                type="date"
                                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                                required
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    id="timeOffStart"
                                    type="time"
                                    className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                                    required
                                />
                                <input
                                    id="timeOffEnd"
                                    type="time"
                                    className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-300/80"
                                    required
                                />
                            </div>
                            <textarea
                                id="timeOffNote"
                                rows={2}
                                placeholder="Motivo do bloqueio (opcional)"
                                className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-pink-300/80"
                            />
                            <button
                                type="submit"
                                className="rounded-full bg-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-pink-400"
                            >
                                Cadastrar bloqueio
                            </button>
                        </form>
                        <p id="timeOffFeedback" className="hidden mt-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-50" />
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <h3 className="font-semibold text-white">Bloqueios programados</h3>
                        <div id="timeOffList" className="mt-3 space-y-3 text-sm text-slate-200">
                            <p className="text-xs text-slate-400">
                                Nenhum bloqueio cadastrado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Employee Modal - Managed by employees.js */}
        <div id="employeeModal" className="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 p-0 backdrop-blur-sm md:flex md:p-4">
            <div className="flex h-full w-full flex-col bg-white md:h-auto md:max-h-[90vh] md:w-full md:max-w-2xl md:rounded-2xl md:shadow-2xl">
                {/* Sticky Header */}
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 md:px-6">
                    <h2 id="employeeModalTitle" className="text-lg font-semibold text-slate-900 md:text-xl">Novo Funcionário</h2>
                    <button
                        type="button"
                        id="employeeCloseBtn"
                        className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Form */}
                <form id="employeeForm" className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
                    <input type="hidden" id="employeeId" />

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-1">
                            <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                            <input id="employeeName" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" />
                        </div>

                        <div className="grid gap-1">
                            <label className="text-sm font-medium text-slate-700">Função</label>
                            <input id="employeeRole" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="Ex: Manicure" />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-slate-700">CPF</label>
                            <input id="employeeCPF" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="000.000.000-00" />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                            <input id="employeePhone" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="Apenas números com DDD" />
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Endereço</label>
                        <input id="employeeAddress" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-1">
                            <label className="text-sm font-medium text-slate-700">Banco</label>
                            <input id="employeeBank" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" />
                        </div>

                        <div className="grid gap-1">
                            <label className="text-sm font-medium text-slate-700">Conta Bancária</label>
                            <input id="employeeAccount" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" />
                        </div>
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Cor do Avatar</label>
                        <select id="employeeColor" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500">
                            <option value="from-pink-400 to-rose-500">Rosa</option>
                            <option value="from-purple-400 to-pink-500">Roxo</option>
                            <option value="from-blue-400 to-cyan-500">Azul</option>
                            <option value="from-green-400 to-emerald-500">Verde</option>
                            <option value="from-yellow-400 to-orange-500">Amarelo</option>
                        </select>
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Observações</label>
                        <textarea id="employeeNotes" rows={3} className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500"></textarea>
                    </div>

                    <p id="employeeFeedback" className="hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600"></p>

                </form>

                {/* Fixed Bottom Buttons */}
                <div className="border-t border-slate-200 bg-white px-4 py-4 md:px-6">
                    <div className="flex gap-3">
                        <button
                            type="button"
                            id="employeeCancel"
                            className="flex-1 rounded-full border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:flex-none"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="employeeForm"
                            className="flex-1 rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-pink-500 md:flex-none"
                        >
                            Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div >
)
