
INSERT INTO users (id, username, password, cpf, created_at) VALUES
(lower(hex(randomblob(16))), 'Aline Andrade', '$2b$10$qPhFWQLJ76P7iOhQXM4NEu9un2PVBFCY4mA6M31q2E6p1rOp8cDRm', '05566253580', unixepoch()),
(lower(hex(randomblob(16))), 'Luiz Andrade', '$2b$10$DMZQPUY7BNELBhky5CRopeiI9lQoiAgA0aUKfbPLLeByko45uyrz2', '04113688508', unixepoch());

