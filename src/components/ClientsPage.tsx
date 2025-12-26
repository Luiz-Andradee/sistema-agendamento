export const ClientsPage = () => (
    <div className="mx-auto min-h-screen w-full max-w-6xl space-y-12 px-6 py-12">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="text-sm uppercase tracking-[0.2em] text-pink-300/80">Painel Operacional</p>
                <h1 className="font-display text-3xl text-white">Gerenciar Clientes</h1>
                <p className="mt-2 text-sm text-slate-300">
                    Cadastre e edite informações dos clientes para agilizar os agendamentos.
                </p>
            </div>
            <div className="flex gap-3">
                <a
                    href="/painel"
                    className="rounded-full border border-white/10 px-6 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                >
                    Voltar ao painel
                </a>
                <button
                    id="addClientBtn"
                    className="rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-pink-500"
                >
                    Novo Cliente
                </button>
            </div>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="mb-6 flex gap-4">
                <input
                    id="clientSearch"
                    type="text"
                    placeholder="Buscar por nome, telefone ou CPF..."
                    className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm text-white outline-none focus:border-pink-500"
                />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-300">
                        <tr>
                            <th className="px-4 py-3 text-left">Nome</th>
                            <th className="px-4 py-3 text-left">Telefone</th>
                            <th className="px-4 py-3 text-left">Observações</th>
                            <th className="px-4 py-3 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody id="clientsList" className="divide-y divide-white/5 text-slate-300">
                        {/* Rows injected by JS */}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Client Modal */}
        <div id="clientModal" className="fixed inset-0 z-50 flex hidden items-center justify-center bg-black/80 backdrop-blur-sm" aria-hidden="true">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                <form id="clientForm" className="grid gap-4 text-slate-900">
                    <h2 id="clientModalTitle" className="text-lg font-semibold text-slate-900">Novo Cliente</h2>

                    <input type="hidden" id="clientId" />

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                        <input id="clientName" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" />
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">CPF (Opcional)</label>
                        <input id="clientCPF" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="000.000.000-00" />
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Telefone (WhatsApp)</label>
                        <input id="clientPhone" required className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="Apenas números com DDD" />
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Procedimento Padrão (Opcional)</label>
                        <select id="clientProcedure" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500">
                            <option value="">Selecione...</option>
                            {/* Options injected by JS */}
                        </select>
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Tempo Médio Personalizado (minutos)</label>
                        <input id="clientAvgTime" type="number" className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500" placeholder="Deixe vazio para usar o tempo do serviço" />
                        <p className="text-[10px] text-slate-500">Defina se este cliente tem um tempo de atendimento diferente do padrão.</p>
                    </div>

                    <div className="grid gap-1">
                        <label className="text-sm font-medium text-slate-700">Observações Internas</label>
                        <textarea id="clientNotes" rows={3} className="rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-pink-500"></textarea>
                    </div>

                    <p id="clientFeedback" className="hidden rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-600"></p>

                    <div className="mt-4 flex justify-end gap-3">
                        <button type="button" id="clientCancel" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button>
                        <button type="submit" className="rounded-full bg-pink-600 px-6 py-2 text-sm font-semibold text-white hover:bg-pink-500">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)
