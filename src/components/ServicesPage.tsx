export const ServicesPage = () => (
    <div className="mx-auto min-h-screen w-full max-w-6xl space-y-12 px-6 py-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="text-sm uppercase tracking-[0.2em] text-pink-300/80">Painel Operacional</p>
                <h1 className="font-display text-3xl text-white">Gestão de Serviços</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                    Gerencie os serviços oferecidos pelo estúdio.
                </p>
            </div>
            <a
                href="/painel"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
            >
                Voltar ao Painel
            </a>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Lista de Serviços</h2>
                <button
                    id="addServiceBtn"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-pink-500"
                >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Serviço
                </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                        <tr>
                            <th className="px-4 py-3 text-left">Nome</th>
                            <th className="px-4 py-3 text-left">Duração</th>
                            <th className="px-4 py-3 text-left">Preço</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="servicesList" className="divide-y divide-white/5 text-slate-300">
                        {/* Rows injected by services.js */}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Service Modal - Managed by services.js */}
        <div id="serviceModal" className="fixed inset-0 z-50 flex hidden items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <form id="serviceForm" className="grid gap-4 text-slate-900">
                    <h2 id="serviceModalTitle" className="text-lg font-semibold text-slate-900">Novo Serviço</h2>
                    <input type="hidden" id="serviceId" />

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Nome do Serviço</label>
                        <input id="serviceName" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" />
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Descrição</label>
                        <textarea id="serviceDescription" rows={3} className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500"></textarea>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-1">
                            <label className="text-sm font-medium text-slate-700">Duração (minutos)</label>
                            <input id="serviceDuration" type="number" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" />
                        </div>

                        <div className="grid gap-1">
                            <label className="text-sm font-medium text-slate-700">Preço (R$)</label>
                            <input id="servicePrice" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="0,00" />
                        </div>
                    </div>

                    <p id="serviceFeedback" className="hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600"></p>

                    <div className="mt-4 flex justify-end gap-3">
                        <button type="button" id="serviceCancelBtn" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                        <button type="submit" className="rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-500">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div >
)
