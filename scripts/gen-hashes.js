const bcrypt = require('bcryptjs');

const alineHash = bcrypt.hashSync('Aline2709#', 10);
const luizHash = bcrypt.hashSync('123456', 10);

console.log('Aline:', alineHash);
console.log('Luiz:', luizHash);
