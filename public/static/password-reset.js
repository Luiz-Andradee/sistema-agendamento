// ==========================================
// Password Reset Logic - CPF Version
// ==========================================

function initPasswordReset() {
    const forgotBtn = document.getElementById('forgotPasswordBtn')
    const requestModal = document.getElementById('requestResetModal')
    const requestForm = document.getElementById('requestResetForm')
    const cancelRequestBtn = document.getElementById('cancelRequestResetBtn')

    if (!forgotBtn || !requestModal) return

    // Abrir modal de recuperação
    forgotBtn.addEventListener('click', () => {
        requestModal.classList.remove('hidden')
        requestModal.classList.add('flex')
        document.getElementById('resetUsername').value = ''
        document.getElementById('resetCPF').value = ''
        document.getElementById('resetNewPassword').value = ''
        document.getElementById('requestResetFeedback').classList.add('hidden')
    })

    // Fechar modal
    cancelRequestBtn?.addEventListener('click', () => {
        requestModal.classList.add('hidden')
        requestModal.classList.remove('flex')
    })

    // Redefinir senha com CPF
    requestForm?.addEventListener('submit', async (e) => {
        e.preventDefault()

        const username = document.getElementById('resetUsername').value
        const cpf = document.getElementById('resetCPF').value
        const newPassword = document.getElementById('resetNewPassword').value
        const feedback = document.getElementById('requestResetFeedback')

        try {
            const response = await fetch('/api/auth/reset-password-cpf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, cpf, newPassword })
            })

            const data = await response.json()

            if (response.ok) {
                // Sucesso
                feedback.textContent = data.message
                feedback.className = 'rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200'
                feedback.classList.remove('hidden')

                // Aguardar 2s e fechar modal
                setTimeout(() => {
                    requestModal.classList.add('hidden')
                    requestModal.classList.remove('flex')

                    // Mostrar mensagem no login
                    const loginFeedback = document.getElementById('loginFeedback')
                    if (loginFeedback) {
                        loginFeedback.textContent = '✅ Senha redefinida! Faça login com sua nova senha.'
                        loginFeedback.className = 'rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-200'
                        loginFeedback.classList.remove('hidden')
                    }
                }, 2000)

            } else {
                feedback.textContent = data.message || 'Erro ao redefinir senha'
                feedback.className = 'rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200'
                feedback.classList.remove('hidden')
            }
        } catch (error) {
            feedback.textContent = 'Erro de conexão. Tente novamente.'
            feedback.className = 'rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200'
            feedback.classList.remove('hidden')
        }
    })

    // Auto-formatar CPF
    const cpfInput = document.getElementById('resetCPF')
    cpfInput?.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '')
        if (value.length > 11) value = value.slice(0, 11)

        // Formatar: 000.000.000-00
        if (value.length > 9) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        } else if (value.length > 6) {
            value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3')
        } else if (value.length > 3) {
            value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2')
        }

        e.target.value = value
    })
}

// Inicializar quando a página carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordReset)
} else {
    initPasswordReset()
}

// Expor globalmente
window.initPasswordReset = initPasswordReset
