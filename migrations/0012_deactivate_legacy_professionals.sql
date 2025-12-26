-- Migration to deactivate legacy professionals
UPDATE professionals 
SET active = 0 
WHERE id IN ('camila-ribeiro', 'leticia-martins');
