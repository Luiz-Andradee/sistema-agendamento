const bcrypt = require('bcryptjs');

const alineHash = bcrypt.hashSync('Aline2709#', 10);
const luizHash = bcrypt.hashSync('123456', 10);

console.log(`
INSERT INTO users (id, username, password, cpf, created_at) VALUES
(lower(hex(randomblob(16))), 'Aline Andrade', '${alineHash}', '05566253580', unixepoch()),
(lower(hex(randomblob(16))), 'Luiz Andrade', '${luizHash}', '04113688508', unixepoch());
`);
