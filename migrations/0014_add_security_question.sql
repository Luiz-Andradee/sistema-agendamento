-- Adicionar campo CPF na tabela users
ALTER TABLE users ADD COLUMN cpf TEXT;

-- Atualizar CPFs dos usuários existentes
UPDATE users SET cpf = '05566253580' WHERE username = 'Aline';
UPDATE users SET cpf = '04113688508' WHERE id IN (SELECT id FROM users WHERE username != 'Aline' LIMIT 1);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
