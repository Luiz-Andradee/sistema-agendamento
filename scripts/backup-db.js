import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Para __dirname em ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Script de backup do banco de dados D1
 * 
 * Cria backup com timestamp e salva em backups/
 */

function backupDatabase() {
    console.log('💾 Iniciando backup do banco de dados...\n')

    try {
        // Criar diretório de backups
        const backupDir = path.join(__dirname, '..', 'backups')
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true })
            console.log(`📁 Diretório criado: ${backupDir}`)
        }

        // Gerar nome do arquivo com timestamp
        const now = new Date()
        const timestamp = now.toISOString()
            .replace(/:/g, '-')
            .replace(/\..+/, '')
            .replace('T', '_')

        const filename = `backup-${timestamp}.sql`
        const filepath = path.join(backupDir, filename)

        // Executar export do banco
        console.log('📤 Exportando banco de dados...')
        const result = execSync(
            `wrangler d1 export estudio-aline-andrade --local --output="${filepath}"`,
            { encoding: 'utf-8' }
        )

        // Verificar se arquivo foi criado
        if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath)
            const sizeKB = (stats.size / 1024).toFixed(2)

            console.log(`\n✅ Backup criado com sucesso!`)
            console.log(`📄 Arquivo: ${filename}`)
            console.log(`📦 Tamanho: ${sizeKB} KB`)
            console.log(`📍 Local: ${filepath}`)

            // Listar backups existentes
            const backups = fs.readdirSync(backupDir)
                .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
                .sort()
                .reverse()

            console.log(`\n📚 Total de backups: ${backups.length}`)
            if (backups.length > 5) {
                console.log(`⚠️  Você tem ${backups.length} backups. Considere limpar os antigos.`)
            }
        } else {
            throw new Error('Arquivo de backup não foi criado')
        }

    } catch (error) {
        console.error('\n❌ Erro durante backup:', error.message)
        process.exit(1)
    }
}

// Executar
backupDatabase()
