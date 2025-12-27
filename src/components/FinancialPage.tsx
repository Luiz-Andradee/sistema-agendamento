export const FinancialPage = () => (
    <div className="mx-auto min-h-screen w-full max-w-6xl space-y-12 px-6 py-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="text-sm uppercase tracking-[0.2em] text-pink-300/80">Painel Operacional</p>
                <h1 className="font-display text-3xl text-white">Controle Financeiro</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Acompanhe os pagamentos dos agendamentos confirmados e gerencie o fluxo de caixa.
                </p>
            </div>
            <div className="flex gap-3">
                <a
                    href="/painel"
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                    Voltar ao Painel
                </a>
            </div>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-wide text-green-300/80">Total Recebido</p>
                <p id="totalPaid" className="mt-2 text-3xl font-bold text-white">R$ 0,00</p>
                <p className="mt-1 text-sm text-slate-400">Referente aos agendamentos pagos no período.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-wide text-amber-300/80">Pendente de Pagamento</p>
                <p id="totalPending" className="mt-2 text-3xl font-bold text-white">R$ 0,00</p>
                <p className="mt-1 text-sm text-slate-400">Agendamentos confirmados mas ainda não pagos.</p>
            </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-semibold text-white">Relatório de Recebimentos</h2>
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        type="month"
                        id="financialMonth"
                        className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
                    />
                    <select
                        id="financialProfessional"
                        className="rounded-full border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-white/30"
                    >
                        <option value="">Todos os Profissionais</option>
                        {/* Options injected by JS */}
                    </select>
                    <button
                        id="generatePdfBtn"
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-pink-500"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Gerar PDF
                    </button>
                    <button
                        id="refreshFinancial"
                        className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/30"
                    >
                        Atualizar
                    </button>
                </div>
            </div>

            <div className="mt-6">
                {/* Desktop Table */}
                <div className="hidden overflow-x-auto md:block">
                    <table id="financialTable" className="w-full text-left text-sm text-slate-300">
                        <thead className="border-b border-white/10 text-xs uppercase text-slate-400">
                            <tr>
                                <th className="px-4 py-3">Data</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Serviço</th>
                                <th className="px-4 py-3">Valor</th>
                                <th className="px-4 py-3 text-center">Status Pagamento</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="financialTableBody" className="divide-y divide-white/5">
                            {/* Rows injected by JS */}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div id="financialCardsMobile" className="block space-y-3 md:hidden">
                    {/* Cards injected by JS */}
                </div>

                <p id="financialEmpty" className="hidden py-8 text-center text-slate-400">Nenhum registro encontrado para este período.</p>
            </div>
        </section>
    </div>
)
