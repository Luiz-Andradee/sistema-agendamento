export const LoginPage = () => (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white">Estúdio Aline Andrade</h2>
                <p className="mt-2 text-sm text-slate-400">Área restrita para equipe</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
                <form id="loginForm" className="space-y-6">
                    <div>
                        <label htmlFor="user" className="block text-sm font-medium text-slate-300">
                            Usuário
                        </label>
                        <div className="mt-2">
                            <input
                                id="user"
                                name="user"
                                type="text"
                                required
                                className="block w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-0 sm:text-sm sm:leading-6"
                                placeholder="Nome de usuário"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="pass" className="block text-sm font-medium text-slate-300">
                            Senha
                        </label>
                        <div className="mt-2">
                            <input
                                id="pass"
                                name="pass"
                                type="password"
                                required
                                className="block w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-0 sm:text-sm sm:leading-6"
                                placeholder="Sua senha"
                            />
                        </div>
                    </div>

                    <div id="loginFeedback" className="hidden rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200"></div>

                    <div>
                        <button
                            type="submit"
                            className="flex w-full justify-center rounded-full bg-pink-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-pink-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                        >
                            Entrar no painel
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            id="forgotPasswordBtn"
                            className="text-sm text-pink-400 hover:text-pink-300 transition"
                        >
                            Esqueci minha senha
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* Modal: Recuperar Senha com CPF */}
        <div id="requestResetModal" className="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Recuperar Senha</h3>
                <form id="requestResetForm" className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nome de Usuário</label>
                        <input
                            id="resetUsername"
                            type="text"
                            required
                            className="block w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-0 text-sm"
                            placeholder="Seu nome de usuário"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">CPF</label>
                        <input
                            id="resetCPF"
                            type="text"
                            required
                            maxLength={14}
                            className="block w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-0 text-sm"
                            placeholder="000.000.000-00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nova Senha</label>
                        <input
                            id="resetNewPassword"
                            type="password"
                            required
                            className="block w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-0 text-sm"
                            placeholder="Digite sua nova senha"
                        />
                    </div>
                    <div id="requestResetFeedback" className="hidden rounded-lg border p-3 text-sm"></div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            id="cancelRequestResetBtn"
                            className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500"
                        >
                            Redefinir Senha
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* Modal: Redefinir Senha */}
        <div id="resetPasswordModal" className="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 p-6 shadow-2xl">
                <h3 className="text-lg font-semibold text-white mb-4">Nova Senha</h3>
                <form id="resetPasswordForm" className="space-y-4">
                    <input type="hidden" id="resetUsernameHidden" />
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Código de Recuperação</label>
                        <input
                            id="resetToken"
                            type="text"
                            required
                            maxLength={6}
                            className="block w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white text-center text-2xl font-mono tracking-widest focus:border-pink-500 focus:ring-0"
                            placeholder="000000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Nova Senha</label>
                        <input
                            id="newPassword"
                            type="password"
                            required
                            className="block w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-white placeholder:text-slate-500 focus:border-pink-500 focus:ring-0 text-sm"
                            placeholder="Digite sua nova senha"
                        />
                    </div>
                    <div id="resetPasswordFeedback" className="hidden rounded-lg border p-3 text-sm"></div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            id="cancelResetPasswordBtn"
                            className="flex-1 rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/5"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 rounded-full bg-pink-600 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-500"
                        >
                            Redefinir Senha
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
)
