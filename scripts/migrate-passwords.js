import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'

/**
 * Script para migrar senhas de texto plano para hash bcrypt
 * 
 * Este script:
 * 1. Lê todas as senhas atuais do banco
 * 2. Gera hash bcrypt para cada senha
 * 3. Atualiza o banco de dados
 * 4. Mantém as mesmas senhas (usuários não precisam trocar)
 */

async function migratePasswords() {
    console.log('🔐 Iniciando migração de senhas...\n')

    try {
        // 1. Buscar todos os usuários
        console.log('📋 Buscando usuários...')
        const result = execSync(
            'wrangler d1 execute estudio-aline-andrade --local --command="SELECT id, username, password FROM users"',
            { encoding: 'utf-8' }
        )

        // Parse do resultado
        const lines = result.split('\n').filter(line => line.trim())
        const users = []

        // Encontrar linhas com dados (pular cabeçalho e separadores)
        for (const line of lines) {
            if (line.includes('|') && !line.includes('id') && !line.includes('---')) {
                const parts = line.split('|').map(p => p.trim()).filter(p => p)
                if (parts.length >= 3) {
                    users.push({
                        id: parts[0],
                        username: parts[1],
                        password: parts[2]
                    })
                }
            }
        }

        console.log(`✅ Encontrados ${users.length} usuário(s)\n`)

        // 2. Migrar cada usuário
        for (const user of users) {
            // Verificar se já está hasheada
            if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
                console.log(`⏭️  ${user.username}: Senha já hasheada, pulando...`)
                continue
            }

            // Gerar hash
            console.log(`🔄 ${user.username}: Gerando hash...`)
            const hashedPassword = await bcrypt.hash(user.password, 10)

            // Atualizar no banco
            const updateCmd = `UPDATE users SET password = '${hashedPassword}' WHERE id = '${user.id}'`
            execSync(
                `wrangler d1 execute estudio-aline-andrade --local --command="${updateCmd}"`,
                { encoding: 'utf-8' }
            )

            console.log(`✅ ${user.username}: Senha migrada com sucesso!`)
        }

        console.log('\n🎉 Migração concluída com sucesso!')
        console.log('\n📝 Próximos passos:')
        console.log('1. Teste o login com as senhas antigas (devem funcionar)')
        console.log('2. Execute o mesmo script em produção quando estiver pronto')
        console.log('3. Comando produção: npm run db:migrate-passwords:prod\n')

    } catch (error) {
        console.error('❌ Erro durante migração:', error.message)
        process.exit(1)
    }
}

// Executar
migratePasswords()
