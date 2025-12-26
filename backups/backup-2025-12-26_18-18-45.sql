PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE d1_migrations(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" VALUES(1,'0001_initial_schema.sql','2025-12-25 15:30:21');
INSERT INTO "d1_migrations" VALUES(2,'0002_schedule_and_timeoff.sql','2025-12-25 15:30:21');
INSERT INTO "d1_migrations" VALUES(3,'0003_add_users_table.sql','2025-12-25 15:30:21');
INSERT INTO "d1_migrations" VALUES(4,'0004_create_clients_table.sql','2025-12-25 15:30:22');
INSERT INTO "d1_migrations" VALUES(5,'0005_add_client_notified.sql','2025-12-25 15:30:22');
INSERT INTO "d1_migrations" VALUES(6,'0006_add_is_rescheduled.sql','2025-12-25 15:30:22');
INSERT INTO "d1_migrations" VALUES(7,'0007_add_cpf_to_clients.sql','2025-12-25 15:30:22');
INSERT INTO "d1_migrations" VALUES(8,'0008_add_price_to_appointments.sql','2025-12-25 15:30:23');
INSERT INTO "d1_migrations" VALUES(9,'0009_add_paid_at_to_appointments.sql','2025-12-25 15:30:23');
INSERT INTO "d1_migrations" VALUES(10,'0010_add_buffer_to_services.sql','2025-12-25 16:38:15');
INSERT INTO "d1_migrations" VALUES(11,'0011_add_professional_details.sql','2025-12-25 17:09:22');
INSERT INTO "d1_migrations" VALUES(12,'0002_add_professional_fields.sql','2025-12-25 21:12:56');
INSERT INTO "d1_migrations" VALUES(13,'0012_deactivate_legacy_professionals.sql','2025-12-25 21:12:56');
INSERT INTO "d1_migrations" VALUES(14,'0003_add_services_updated_at.sql','2025-12-25 21:20:01');
INSERT INTO "d1_migrations" VALUES(15,'0013_password_reset_tokens.sql','2025-12-26 18:15:28');
CREATE TABLE professionals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  bio TEXT,
  whatsapp TEXT,
  avatar_color TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
, cpf TEXT, address TEXT, bank_name TEXT, bank_account TEXT, notes TEXT, updated_at DATETIME);
INSERT INTO "professionals" VALUES('aline-andrade','Aline Andrade','Nail Designer sênior','Especialista em alongamentos em gel, blindagem e tratamentos de fortalecimento. Fundadora do Estúdio Aline Andrade.','5547991518816','from-pink-400 to-rose-500',0,'2025-12-25 15:30:33','041.136.885-08',NULL,NULL,NULL,NULL,'2025-12-25 21:15:21');
INSERT INTO "professionals" VALUES('camila-ribeiro','Camila Ribeiro','Especialista em Nail Art','Criações exclusivas de nail art, técnicas de encapsulamento e pedrarias para ocasiões especiais.','5547991518816','from-fuchsia-400 to-purple-500',0,'2025-12-25 15:30:33',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "professionals" VALUES('leticia-martins','Letícia Martins','Spa das mãos e pés','Cuidados completos com spa relaxante, hidratação profunda e protocolos nutritivos.','5547991518816','from-amber-400 to-orange-500',0,'2025-12-25 15:30:33',NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO "professionals" VALUES('d7353182-8c72-4047-9ae2-b776da867bc4','Luiz Andrade ','Manicure ',NULL,'5547991789822','from-purple-400 to-indigo-500',0,'2025-12-25 17:35:04','055.662.535-80','Rua Ribeirão Areia','Bradesco ','25416416416416416','xfvzdfvzdf',NULL);
INSERT INTO "professionals" VALUES('b07ce705-f97d-43d7-8295-3ba1090b19d0','Maria','Manicure ',NULL,'5547952221212','from-pink-400 to-rose-500',0,'2025-12-25 19:09:52','000.000.000-00','dfvadfv','Bradesco ','25416416416416416',NULL,'2025-12-25 21:15:29');
INSERT INTO "professionals" VALUES('d7b251b5-f80a-42d9-8881-d6cdb434f074','tereza ','Nail Designer sênior',NULL,'5551956555555','from-blue-400 to-cyan-500',0,'2025-12-25 19:48:19','111.111.111-11','Rua Ribeirão Areia','Bradesco ','25416416416416416',NULL,'2025-12-25 21:15:25');
INSERT INTO "professionals" VALUES('8729c412-54cc-431a-abcc-d23afe31d4eb','bete ','faxina',NULL,NULL,'from-pink-400 to-rose-500',1,'2025-12-25 21:14:21','999.999.999-99',NULL,NULL,NULL,NULL,'2025-12-25 21:14:21');
INSERT INTO "professionals" VALUES('497c3f47-40b4-4802-bc52-296d73b68ecc','ali','Nail Designer sênior',NULL,NULL,'from-pink-400 to-rose-500',1,'2025-12-25 21:21:49',NULL,NULL,NULL,NULL,NULL,'2025-12-25 21:21:49');
INSERT INTO "professionals" VALUES('3dffdc1f-3a21-4953-b760-4f4a67867c32','lucas ','faxina ',NULL,NULL,'from-pink-400 to-rose-500',1,'2025-12-25 22:47:59',NULL,NULL,NULL,NULL,NULL,'2025-12-25 22:47:59');
INSERT INTO "professionals" VALUES('c20618bc-8c74-4706-81fb-4e0a8f4b82a9','tereza ','Nail Designer sênior',NULL,NULL,'from-pink-400 to-rose-500',1,'2025-12-25 22:54:58',NULL,NULL,NULL,NULL,NULL,'2025-12-25 22:54:58');
INSERT INTO "professionals" VALUES('80e31c4c-29da-4c6b-8644-cb800d3253bb','luiz','Nail Designer sênior',NULL,NULL,'from-pink-400 to-rose-500',1,'2025-12-25 23:53:09',NULL,NULL,NULL,NULL,NULL,'2025-12-25 23:53:09');
INSERT INTO "professionals" VALUES('fac80414-c277-4489-afc1-ab7a3ad240a0','carlos ','Nail Designer sênior',NULL,'5566666666666','from-pink-400 to-rose-500',1,'2025-12-26 01:50:24','041.136.885-08',NULL,NULL,NULL,NULL,'2025-12-26 01:50:24');
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
, buffer_minutes INTEGER DEFAULT 15, updated_at DATETIME);
INSERT INTO "services" VALUES('alongamento-gel','Alongamento em Gel ','Alongamento personalizado com reforço estrutural, acabamento impecável e manutenção de 21 dias',120,18000,1,'2025-12-25 15:30:33',15,'2025-12-25 21:22:08');
INSERT INTO "services" VALUES('blindagem-gel','Blindagem','Reforço com gel para proteção das unhas naturais, brilho intenso e alta resistência.',90,13000,1,'2025-12-25 15:30:33',15,NULL);
INSERT INTO "services" VALUES('nail-art-signature','Nail Art Signature','Design exclusivo com encapsulamento, pedrarias premium e acabamento artístico sofisticado.',75,9500,0,'2025-12-25 15:30:33',15,NULL);
INSERT INTO "services" VALUES('spa-maos','Spa das Mãos Luminoso','Esfoliação com cristais, máscara revitalizante, massagem relaxante e finalização nutritiva.',60,7500,0,'2025-12-25 15:30:33',15,NULL);
INSERT INTO "services" VALUES('a29b71df-7410-41da-95f2-3cd96cd71e57','Manutenção Alongamento ','Manutenção completa,',240,38000,1,'2025-12-25 18:00:46',15,NULL);
INSERT INTO "services" VALUES('2f38df6c-12db-4576-8ceb-5b05e5c82d17','fff','aegfa',50,13000,0,'2025-12-25 21:22:24',15,'2025-12-26 00:20:12');
INSERT INTO "services" VALUES('b8f8b89d-f7c4-4911-a489-c443d1137eeb','ras','dfre',60,30000,1,'2025-12-25 22:48:19',15,'2025-12-25 22:48:19');
INSERT INTO "services" VALUES('7ffa264b-2130-4204-b2e3-df47a9b10572','teste',NULL,30,3000,1,'2025-12-26 00:20:05',15,'2025-12-26 00:20:05');
INSERT INTO "services" VALUES('64169a3f-ad7b-41b5-8440-8c5004445c49','Cutilagem',NULL,30,10000,1,'2025-12-26 01:54:05',15,'2025-12-26 01:54:05');
INSERT INTO "services" VALUES('b8cfce86-3215-4940-a979-ac159bc39d8e','dancinha ',NULL,30,7500,1,'2025-12-26 17:16:17',15,'2025-12-26 17:16:17');
CREATE TABLE service_professionals (
  service_id TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  PRIMARY KEY (service_id, professional_id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);
INSERT INTO "service_professionals" VALUES('alongamento-gel','aline-andrade');
INSERT INTO "service_professionals" VALUES('blindagem-gel','aline-andrade');
INSERT INTO "service_professionals" VALUES('blindagem-gel','camila-ribeiro');
INSERT INTO "service_professionals" VALUES('nail-art-signature','camila-ribeiro');
INSERT INTO "service_professionals" VALUES('spa-maos','leticia-martins');
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  professional_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  notes TEXT,
  date TEXT NOT NULL, 
  start_time TEXT NOT NULL, 
  end_time TEXT NOT NULL, 
  status TEXT NOT NULL DEFAULT 'pending',
  rebook_desired_date TEXT,
  rebook_desired_time TEXT,
  rebook_note TEXT,
  rebook_requested_at DATETIME,
  confirmed_at DATETIME,
  cancelled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, client_notified BOOLEAN DEFAULT FALSE, is_rescheduled BOOLEAN DEFAULT FALSE, price_cents INTEGER, paid_at DATETIME,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE RESTRICT
);
INSERT INTO "appointments" VALUES('297e3a52-8586-4a8a-a211-6189afe1bd5b','64169a3f-ad7b-41b5-8440-8c5004445c49','fac80414-c277-4489-afc1-ab7a3ad240a0','Osmar ','47991789822',NULL,NULL,'2025-12-29','14:30','15:00','confirmed',NULL,NULL,NULL,NULL,'2025-12-26 01:55:09',NULL,'2025-12-26 01:54:50','2025-12-26 17:11:38',0,0,50000,NULL);
INSERT INTO "appointments" VALUES('ff7ad327-4678-4db7-9680-dcdaf9d1045b','a29b71df-7410-41da-95f2-3cd96cd71e57','497c3f47-40b4-4802-bc52-296d73b68ecc','jorge ','47991789822',NULL,'m','2025-12-26','13:00','17:00','confirmed',NULL,NULL,NULL,NULL,'2025-12-26 15:40:56',NULL,'2025-12-26 13:26:32','2025-12-26 15:49:09',1,1,38000,'2025-12-26T15:41:39.926Z');
INSERT INTO "appointments" VALUES('953e3f49-8181-4627-9247-99a2c880f411','a29b71df-7410-41da-95f2-3cd96cd71e57','497c3f47-40b4-4802-bc52-296d73b68ecc','tertuliano ','47991789822',NULL,NULL,'2026-01-06','13:00','17:00','confirmed',NULL,NULL,NULL,NULL,'2025-12-26 15:50:39',NULL,'2025-12-26 15:48:48','2025-12-26 15:50:39',1,1,38000,NULL);
INSERT INTO "appointments" VALUES('377c32ad-25db-48e1-ba75-91214aa904a7','b8f8b89d-f7c4-4911-a489-c443d1137eeb','497c3f47-40b4-4802-bc52-296d73b68ecc','vitor','47991789822',NULL,NULL,'2025-12-31','10:00','11:00','confirmed',NULL,NULL,NULL,NULL,'2025-12-26 16:53:30',NULL,'2025-12-26 15:55:40','2025-12-26 16:53:30',0,0,30000,NULL);
INSERT INTO "appointments" VALUES('8adbf8e2-4761-42e1-9b51-7833da383ccd','64169a3f-ad7b-41b5-8440-8c5004445c49','497c3f47-40b4-4802-bc52-296d73b68ecc','bb','47991789822',NULL,NULL,'2025-12-26','17:00','17:30','confirmed',NULL,NULL,NULL,NULL,'2025-12-26 16:53:30',NULL,'2025-12-26 16:17:54','2025-12-26 17:11:47',0,0,10000,'2025-12-26T17:11:47.971Z');
INSERT INTO "appointments" VALUES('d5407fd1-16cc-47a7-acbe-996bf053eb38','alongamento-gel','497c3f47-40b4-4802-bc52-296d73b68ecc','jarline ','47992457432',NULL,NULL,'2025-12-30','12:00','14:00','confirmed',NULL,NULL,NULL,NULL,'2025-12-26 16:53:30',NULL,'2025-12-26 16:35:12','2025-12-26 16:53:30',0,0,18000,NULL);
INSERT INTO "appointments" VALUES('6461897b-5f01-4bbf-b2e3-cdf719c4e332','a29b71df-7410-41da-95f2-3cd96cd71e57','497c3f47-40b4-4802-bc52-296d73b68ecc','Jarline','47992457432',NULL,NULL,'2025-12-31','13:00','17:00','confirmed',NULL,NULL,NULL,NULL,'2025-12-26 16:53:30',NULL,'2025-12-26 16:51:18','2025-12-26 16:53:30',0,0,38000,NULL);
INSERT INTO "appointments" VALUES('a4c9243e-7aeb-416d-a57c-74780fc2117d','b8cfce86-3215-4940-a979-ac159bc39d8e','497c3f47-40b4-4802-bc52-296d73b68ecc','carlos','4755555555',NULL,NULL,'2025-12-26','17:30','18:00','confirmed',NULL,NULL,NULL,NULL,'2025-12-26 17:17:33',NULL,'2025-12-26 17:16:48','2025-12-26 17:17:33',0,0,7500,NULL);
CREATE TABLE appointment_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  appointment_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);
INSERT INTO "appointment_history" VALUES(38,'297e3a52-8586-4a8a-a211-6189afe1bd5b','created','{"serviceId":"64169a3f-ad7b-41b5-8440-8c5004445c49","professionalId":"fac80414-c277-4489-afc1-ab7a3ad240a0","date":"2025-12-29","time":"14:30"}','2025-12-26 01:54:50');
INSERT INTO "appointment_history" VALUES(39,'297e3a52-8586-4a8a-a211-6189afe1bd5b','confirmed',NULL,'2025-12-26 01:55:09');
INSERT INTO "appointment_history" VALUES(40,'ff7ad327-4678-4db7-9680-dcdaf9d1045b','created','{"serviceId":"a29b71df-7410-41da-95f2-3cd96cd71e57","professionalId":"497c3f47-40b4-4802-bc52-296d73b68ecc","date":"2025-12-26","time":"10:30"}','2025-12-26 13:26:32');
INSERT INTO "appointment_history" VALUES(41,'ff7ad327-4678-4db7-9680-dcdaf9d1045b','confirmed',NULL,'2025-12-26 15:31:42');
INSERT INTO "appointment_history" VALUES(42,'ff7ad327-4678-4db7-9680-dcdaf9d1045b','rebook_approved','{"date":"2025-12-31","time":"12:00"}','2025-12-26 15:35:15');
INSERT INTO "appointment_history" VALUES(43,'ff7ad327-4678-4db7-9680-dcdaf9d1045b','rebook_approved','{"date":"2025-12-26","time":"13:00"}','2025-12-26 15:40:56');
INSERT INTO "appointment_history" VALUES(44,'953e3f49-8181-4627-9247-99a2c880f411','created','{"serviceId":"a29b71df-7410-41da-95f2-3cd96cd71e57","professionalId":"497c3f47-40b4-4802-bc52-296d73b68ecc","date":"2026-01-06","time":"09:00"}','2025-12-26 15:48:48');
INSERT INTO "appointment_history" VALUES(45,'953e3f49-8181-4627-9247-99a2c880f411','confirmed',NULL,'2025-12-26 15:50:00');
INSERT INTO "appointment_history" VALUES(46,'953e3f49-8181-4627-9247-99a2c880f411','rebook_approved','{"date":"2026-01-06","time":"13:00"}','2025-12-26 15:50:39');
INSERT INTO "appointment_history" VALUES(47,'377c32ad-25db-48e1-ba75-91214aa904a7','created','{"serviceId":"b8f8b89d-f7c4-4911-a489-c443d1137eeb","professionalId":"497c3f47-40b4-4802-bc52-296d73b68ecc","date":"2025-12-31","time":"10:00"}','2025-12-26 15:55:40');
INSERT INTO "appointment_history" VALUES(48,'8adbf8e2-4761-42e1-9b51-7833da383ccd','created','{"serviceId":"64169a3f-ad7b-41b5-8440-8c5004445c49","professionalId":"497c3f47-40b4-4802-bc52-296d73b68ecc","date":"2025-12-26","time":"17:00"}','2025-12-26 16:17:54');
INSERT INTO "appointment_history" VALUES(49,'d5407fd1-16cc-47a7-acbe-996bf053eb38','created','{"serviceId":"alongamento-gel","professionalId":"497c3f47-40b4-4802-bc52-296d73b68ecc","date":"2025-12-30","time":"12:00"}','2025-12-26 16:35:12');
INSERT INTO "appointment_history" VALUES(50,'6461897b-5f01-4bbf-b2e3-cdf719c4e332','created','{"serviceId":"a29b71df-7410-41da-95f2-3cd96cd71e57","professionalId":"497c3f47-40b4-4802-bc52-296d73b68ecc","date":"2025-12-31","time":"13:00"}','2025-12-26 16:51:18');
INSERT INTO "appointment_history" VALUES(51,'8adbf8e2-4761-42e1-9b51-7833da383ccd','confirmed',NULL,'2025-12-26 16:53:30');
INSERT INTO "appointment_history" VALUES(52,'d5407fd1-16cc-47a7-acbe-996bf053eb38','confirmed',NULL,'2025-12-26 16:53:30');
INSERT INTO "appointment_history" VALUES(53,'377c32ad-25db-48e1-ba75-91214aa904a7','confirmed',NULL,'2025-12-26 16:53:30');
INSERT INTO "appointment_history" VALUES(54,'6461897b-5f01-4bbf-b2e3-cdf719c4e332','confirmed',NULL,'2025-12-26 16:53:30');
INSERT INTO "appointment_history" VALUES(55,'a4c9243e-7aeb-416d-a57c-74780fc2117d','created','{"serviceId":"b8cfce86-3215-4940-a979-ac159bc39d8e","professionalId":"497c3f47-40b4-4802-bc52-296d73b68ecc","date":"2025-12-26","time":"17:30"}','2025-12-26 17:16:48');
INSERT INTO "appointment_history" VALUES(56,'a4c9243e-7aeb-416d-a57c-74780fc2117d','confirmed',NULL,'2025-12-26 17:17:33');
CREATE TABLE professional_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id TEXT NOT NULL,
  weekday INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_interval INTEGER NOT NULL DEFAULT 30,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (professional_id, weekday, start_time, end_time),
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);
INSERT INTO "professional_availability" VALUES(1,'aline-andrade',0,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(2,'aline-andrade',1,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(3,'aline-andrade',2,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(4,'aline-andrade',3,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(5,'aline-andrade',4,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(6,'aline-andrade',5,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(7,'camila-ribeiro',0,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(8,'camila-ribeiro',1,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(9,'camila-ribeiro',2,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(10,'camila-ribeiro',3,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(11,'camila-ribeiro',4,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(12,'camila-ribeiro',5,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(13,'leticia-martins',0,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(14,'leticia-martins',1,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(15,'leticia-martins',2,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(16,'leticia-martins',3,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(17,'leticia-martins',4,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(18,'leticia-martins',5,'09:00','19:00',30,'2025-12-25 15:30:33','2025-12-25 15:30:33');
INSERT INTO "professional_availability" VALUES(19,'d7353182-8c72-4047-9ae2-b776da867bc4',1,'07:00','17:00',30,'2025-12-25 17:42:18','2025-12-25 17:42:18');
INSERT INTO "professional_availability" VALUES(58,'8729c412-54cc-431a-abcc-d23afe31d4eb',1,'07:00','17:00',30,'2025-12-26 01:47:15','2025-12-26 01:47:15');
INSERT INTO "professional_availability" VALUES(59,'8729c412-54cc-431a-abcc-d23afe31d4eb',4,'07:00','23:59',30,'2025-12-26 01:47:15','2025-12-26 01:47:15');
INSERT INTO "professional_availability" VALUES(60,'3dffdc1f-3a21-4953-b760-4f4a67867c32',4,'07:00','23:59',30,'2025-12-26 01:48:37','2025-12-26 01:48:37');
INSERT INTO "professional_availability" VALUES(61,'3dffdc1f-3a21-4953-b760-4f4a67867c32',5,'07:00','23:59',30,'2025-12-26 01:48:37','2025-12-26 01:48:37');
INSERT INTO "professional_availability" VALUES(62,'fac80414-c277-4489-afc1-ab7a3ad240a0',1,'07:00','15:00',30,'2025-12-26 01:50:44','2025-12-26 01:50:44');
INSERT INTO "professional_availability" VALUES(63,'497c3f47-40b4-4802-bc52-296d73b68ecc',2,'07:00','17:00',30,'2025-12-26 16:17:07','2025-12-26 16:17:07');
INSERT INTO "professional_availability" VALUES(64,'497c3f47-40b4-4802-bc52-296d73b68ecc',3,'07:00','17:00',30,'2025-12-26 16:17:07','2025-12-26 16:17:07');
INSERT INTO "professional_availability" VALUES(65,'497c3f47-40b4-4802-bc52-296d73b68ecc',4,'07:00','23:59',30,'2025-12-26 16:17:07','2025-12-26 16:17:07');
INSERT INTO "professional_availability" VALUES(66,'497c3f47-40b4-4802-bc52-296d73b68ecc',5,'07:00','19:00',30,'2025-12-26 16:17:07','2025-12-26 16:17:07');
CREATE TABLE professional_time_off (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professional_id TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (professional_id) REFERENCES professionals(id) ON DELETE CASCADE
);
INSERT INTO "professional_time_off" VALUES(3,'8729c412-54cc-431a-abcc-d23afe31d4eb','2026-01-05','07:00','23:59','','2025-12-26 01:23:44');
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "users" VALUES('admin-user','Aline','Aline2709#','2025-12-25 15:30:21');
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notes TEXT,
  procedure_id TEXT, 
  avg_time_minutes INTEGER, 
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, cpf TEXT,
  FOREIGN KEY (procedure_id) REFERENCES services(id) ON DELETE SET NULL
);
INSERT INTO "clients" VALUES('d7e42a01-1106-4e60-999e-edf90aebedff','luiz','47991789822','m',NULL,NULL,'2025-12-26 00:16:06','2025-12-26 16:44:15','05566253580');
INSERT INTO "clients" VALUES('d40234af-03d1-41db-b73c-bb1199ac4452','Jarline','47992457432','',NULL,NULL,'2025-12-26 16:34:06','2025-12-26 16:44:02','66666666666');
INSERT INTO "clients" VALUES('e1565774-aa30-48c4-a82b-dd19f37c0c61','luiz augusto','47922554466','',NULL,NULL,'2025-12-26 16:44:38','2025-12-26 16:44:38','');
INSERT INTO "clients" VALUES('3e90429d-7b56-4001-9035-2f87f15f61ac','carlos','4755555555','',NULL,NULL,'2025-12-26 16:50:42','2025-12-26 16:50:42','');
INSERT INTO "clients" VALUES('b1fae777-6607-481d-acb1-39106cc66280','luiz andrade','47888888888','',NULL,NULL,'2025-12-26 17:19:44','2025-12-26 17:19:44','');
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('d1_migrations',15);
INSERT INTO "sqlite_sequence" VALUES('professional_availability',66);
INSERT INTO "sqlite_sequence" VALUES('appointment_history',56);
INSERT INTO "sqlite_sequence" VALUES('professional_time_off',3);
CREATE INDEX idx_appointments_professional_date ON appointments (professional_id, date, start_time);
CREATE INDEX idx_appointments_status ON appointments (status);
CREATE INDEX idx_availability_professional_weekday ON professional_availability (professional_id, weekday);
CREATE INDEX idx_time_off_professional_date ON professional_time_off (professional_id, date);
CREATE INDEX idx_reset_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_expires ON password_reset_tokens(expires_at);