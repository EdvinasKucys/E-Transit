INSERT INTO transporto_priemone (valstybiniai_num, rida, vietu_sk, kuro_tipas) VALUES
('ABC123', 50000, 5, 'Benzinas'),
('DEF456', 80000, 7, 'Dyzelinas'),
('GHI789', 30000, 4, 'Elektra'),
('JKL012', 120000, 5, 'LPG'),
('MNO345', 15000, 8, 'Benzinas')
ON CONFLICT (valstybiniai_num) DO NOTHING;

-- Insert sample fuel consumption data
INSERT INTO sanaudos (data, nukeliautas_atstumas, kuro_kiekis, fk_transporto_priemone_valstybiniai_num) VALUES
-- ABC123 (Benzinas) - Last 30 days
(CURRENT_DATE - INTERVAL '30 days', 120.5, 9.8, 'ABC123'),
(CURRENT_DATE - INTERVAL '25 days', 145.2, 11.5, 'ABC123'),
(CURRENT_DATE - INTERVAL '20 days', 98.3, 7.9, 'ABC123'),
(CURRENT_DATE - INTERVAL '15 days', 167.8, 13.2, 'ABC123'),
(CURRENT_DATE - INTERVAL '10 days', 134.6, 10.8, 'ABC123'),
(CURRENT_DATE - INTERVAL '5 days', 156.4, 12.1, 'ABC123'),
(CURRENT_DATE - INTERVAL '2 days', 89.7, 7.3, 'ABC123'),

-- DEF456 (Dyzelinas) - Last 30 days
(CURRENT_DATE - INTERVAL '30 days', 215.4, 14.2, 'DEF456'),
(CURRENT_DATE - INTERVAL '25 days', 198.6, 13.1, 'DEF456'),
(CURRENT_DATE - INTERVAL '20 days', 234.8, 15.8, 'DEF456'),
(CURRENT_DATE - INTERVAL '15 days', 189.2, 12.5, 'DEF456'),
(CURRENT_DATE - INTERVAL '10 days', 267.3, 17.6, 'DEF456'),
(CURRENT_DATE - INTERVAL '5 days', 201.5, 13.4, 'DEF456'),
(CURRENT_DATE - INTERVAL '2 days', 178.9, 11.9, 'DEF456'),

-- GHI789 (Elektra) - Last 30 days (kWh instead of liters)
(CURRENT_DATE - INTERVAL '30 days', 95.3, 18.5, 'GHI789'),
(CURRENT_DATE - INTERVAL '25 days', 112.7, 21.8, 'GHI789'),
(CURRENT_DATE - INTERVAL '20 days', 87.4, 16.9, 'GHI789'),
(CURRENT_DATE - INTERVAL '15 days', 103.8, 20.1, 'GHI789'),
(CURRENT_DATE - INTERVAL '10 days', 98.2, 19.0, 'GHI789'),
(CURRENT_DATE - INTERVAL '5 days', 115.6, 22.4, 'GHI789'),
(CURRENT_DATE - INTERVAL '2 days', 91.5, 17.7, 'GHI789'),

-- JKL012 (LPG) - Last 30 days
(CURRENT_DATE - INTERVAL '30 days', 178.3, 15.2, 'JKL012'),
(CURRENT_DATE - INTERVAL '25 days', 195.7, 16.8, 'JKL012'),
(CURRENT_DATE - INTERVAL '20 days', 167.9, 14.3, 'JKL012'),
(CURRENT_DATE - INTERVAL '15 days', 189.4, 16.1, 'JKL012'),
(CURRENT_DATE - INTERVAL '10 days', 212.6, 18.2, 'JKL012'),
(CURRENT_DATE - INTERVAL '5 days', 183.8, 15.7, 'JKL012'),
(CURRENT_DATE - INTERVAL '2 days', 156.2, 13.3, 'JKL012'),

-- MNO345 (Benzinas) - Last 30 days
(CURRENT_DATE - INTERVAL '30 days', 142.8, 11.9, 'MNO345'),
(CURRENT_DATE - INTERVAL '25 days', 158.3, 13.2, 'MNO345'),
(CURRENT_DATE - INTERVAL '20 days', 134.6, 11.2, 'MNO345'),
(CURRENT_DATE - INTERVAL '15 days', 167.9, 14.0, 'MNO345'),
(CURRENT_DATE - INTERVAL '10 days', 149.2, 12.4, 'MNO345'),
(CURRENT_DATE - INTERVAL '5 days', 176.5, 14.7, 'MNO345'),
(CURRENT_DATE - INTERVAL '2 days', 128.7, 10.7, 'MNO345');