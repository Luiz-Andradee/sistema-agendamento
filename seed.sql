-- Seed data for Estúdio Aline Andrade scheduling app
-- Populates professionals, services, mapping table and example appointments

INSERT OR IGNORE INTO professionals (id, name, role, bio, whatsapp, avatar_color) VALUES
  ('aline-andrade', 'Aline Andrade', 'Nail Designer sênior', 'Especialista em alongamentos em gel, blindagem e tratamentos de fortalecimento. Fundadora do Estúdio Aline Andrade.', '5547991518816', 'from-pink-400 to-rose-500'),
  ('camila-ribeiro', 'Camila Ribeiro', 'Especialista em Nail Art', 'Criações exclusivas de nail art, técnicas de encapsulamento e pedrarias para ocasiões especiais.', '5547991518816', 'from-fuchsia-400 to-purple-500'),
  ('leticia-martins', 'Letícia Martins', 'Spa das mãos e pés', 'Cuidados completos com spa relaxante, hidratação profunda e protocolos nutritivos.', '5547991518816', 'from-amber-400 to-orange-500');

INSERT OR IGNORE INTO services (id, name, description, duration_minutes, price_cents) VALUES
  ('alongamento-gel', 'Alongamento em Gel Premium', 'Alongamento personalizado com reforço estrutural, acabamento impecável e manutenção de 21 dias.', 120, 18000),
  ('blindagem-gel', 'Blindagem Fortalecedora', 'Reforço com gel para proteção das unhas naturais, brilho intenso e alta resistência.', 90, 13000),
  ('nail-art-signature', 'Nail Art Signature', 'Design exclusivo com encapsulamento, pedrarias premium e acabamento artístico sofisticado.', 75, 9500),
  ('spa-maos', 'Spa das Mãos Luminoso', 'Esfoliação com cristais, máscara revitalizante, massagem relaxante e finalização nutritiva.', 60, 7500);

INSERT OR IGNORE INTO service_professionals (service_id, professional_id) VALUES
  ('alongamento-gel', 'aline-andrade'),
  ('blindagem-gel', 'aline-andrade'),
  ('blindagem-gel', 'camila-ribeiro'),
  ('nail-art-signature', 'camila-ribeiro'),
  ('spa-maos', 'leticia-martins');

-- Disponibilidade padrão (segunda a sábado das 09h às 19h com intervalos de 30 minutos)
-- Disponibilidade Aline Andrade
INSERT INTO professional_availability (professional_id, weekday, start_time, end_time, slot_interval) VALUES
  ('aline-andrade', 0, '09:00', '19:00', 30),
  ('aline-andrade', 1, '09:00', '19:00', 30),
  ('aline-andrade', 2, '09:00', '19:00', 30),
  ('aline-andrade', 3, '09:00', '19:00', 30),
  ('aline-andrade', 4, '09:00', '19:00', 30),
  ('aline-andrade', 5, '09:00', '19:00', 30);

-- Disponibilidade Camila Ribeiro
INSERT INTO professional_availability (professional_id, weekday, start_time, end_time, slot_interval) VALUES
  ('camila-ribeiro', 0, '09:00', '19:00', 30),
  ('camila-ribeiro', 1, '09:00', '19:00', 30),
  ('camila-ribeiro', 2, '09:00', '19:00', 30),
  ('camila-ribeiro', 3, '09:00', '19:00', 30),
  ('camila-ribeiro', 4, '09:00', '19:00', 30),
  ('camila-ribeiro', 5, '09:00', '19:00', 30);

-- Disponibilidade Leticia Martins
INSERT INTO professional_availability (professional_id, weekday, start_time, end_time, slot_interval) VALUES
  ('leticia-martins', 0, '09:00', '19:00', 30),
  ('leticia-martins', 1, '09:00', '19:00', 30),
  ('leticia-martins', 2, '09:00', '19:00', 30),
  ('leticia-martins', 3, '09:00', '19:00', 30),
  ('leticia-martins', 4, '09:00', '19:00', 30),
  ('leticia-martins', 5, '09:00', '19:00', 30);
