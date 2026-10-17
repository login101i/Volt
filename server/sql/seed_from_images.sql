-- Seed dopasowany do lokalnych JPG w frontend/public/pictures/electricComponents
-- Pomija pliki temp_*
-- Wygenerowano automatycznie — uruchom w phpMyAdmin na bazie lxsxnvawhg_volt

USE `lxsxnvawhg_volt`;

-- fuse_types (bez zdjęć; standardowy seed)
INSERT INTO `fuse_types` (`fuse_type`, `phase_type`) VALUES
  ('6A', '1φ'), ('10A', '1φ'), ('13A', '1φ'), ('16A', '1φ'),
  ('20A', '1φ'), ('25A', '1φ'), ('32A', '1φ'), ('40A', '1φ'),
  ('50A', '1φ'), ('63A', '1φ'),
  ('16A', '3φ'), ('20A', '3φ'), ('25A', '3φ'), ('32A', '3φ'),
  ('40A', '3φ'), ('50A', '3φ'), ('63A', '3φ'), ('80A', '3φ'),
  ('100A', '3φ'), ('125A', '3φ')
ON DUPLICATE KEY UPDATE `fuse_type` = VALUES(`fuse_type`);

-- electric_components: 54 pozycji ze zdjęciami
INSERT INTO `electric_components`
  (`id`, `name`, `fields`, `description`, `price`, `image`, `category`, `subcategory`)
VALUES
('ammeter', 'Amperomierz modułowy', 2, 'Amperomierz modułowy - miernik prądu elektrycznego do kontroli wartości prądu w obwodach rozdzielnicy', 120.00, '/pictures/electricComponents/ammeter.jpg', 'measurement_control', NULL),
('mcb_b10', 'B10A', 1, 'Wyłącznik nadprądowy modułowy MCB B10 10A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', 28.00, '/pictures/electricComponents/mcb_b10.jpg', 'overcurrent_protection', NULL),
('mcb_b16', 'B16A', 1, 'Wyłącznik nadprądowy modułowy MCB B16 16A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', 32.00, '/pictures/electricComponents/mcb_b16.jpg', 'overcurrent_protection', NULL),
('distribution_block', 'Blok rozdzielczy modułowy', 4, 'Blok rozdzielczy modułowy - element elektryczny do rozdziału obwodów w rozdzielnicy modułowej', 85.00, '/pictures/electricComponents/distribution_block.jpg', 'connection_elements', NULL),
('branch_distribution_block_simblock', 'Blok rozdzielczy odgałęźny  SIMBLOCK SCB 25-5X Al/Cu 80150', 4, 'Blok rozdzielczy rozgałęźny modułowy - element elektryczny do rozgałęziania i rozdziału obwodów w rozdzielnicy modułowej', 76.00, '/pictures/electricComponents/branch_distribution_block_simblock.jpg', 'connection_elements', NULL),
('branch_distribution_block', 'Blok rozdzielczy rozgałęźny "ZUBI"', 4, 'Blok rozdzielczy rozgałęźny modułowy - element elektryczny do rozgałęziania i rozdziału obwodów w rozdzielnicy modułowej', 95.00, '/pictures/electricComponents/branch_distribution_block.jpg', 'connection_elements', NULL),
('module_labels', 'Etykiety opisowe modułów elektrycznych', 0, 'Etykiety opisowe modułów elektrycznych - oznaczenia i opisy modułów w rozdzielnicy do dokumentacji i identyfikacji obwodów', 25.00, '/pictures/electricComponents/module_labels.jpg', 'organization', NULL),
('gsu', 'Główna Szyna Uziemiająca (GSU)', 1, 'Główna Szyna Uziemiająca GSU - szyna elektryczna do połączenia wszystkich przewodów ochronnych PE i przewodów uziemiających w rozdzielnicy elektrycznej', 45.00, '/pictures/electricComponents/gsu.jpg', 'connection_elements', NULL),
('cable_ydyp_3x15', 'Kabel YDYp 3x1,5', 0, 'Kabel płaski YDYp 3x1,5 mm² - kabel instalacyjny płaski do oświetlenia i obwodów małej mocy', 0.00, '/pictures/electricComponents/cable_ydyp_3x15.jpg', 'cables', NULL),
('cable_ydypzo_5x4', 'Kabel YDYpżo 5x4', 0, 'Kabel płaski YDYpżo 5x4 mm² - kabel instalacyjny do obwodów trójfazowych i urządzeń o większej mocy', 0.00, '/pictures/electricComponents/cable_ydypzo_5x4.jpg', 'cables', NULL),
('cable_yky_3x15', 'Kabel YKY 3x1,5', 0, 'Kabel YKY 3x1,5 mm² - kabel instalacyjny okrągły w osłonie PVC do oświetlenia i obwodów małej mocy', 0.00, '/pictures/electricComponents/cable_yky_3x15.jpg', 'pv_ev', NULL),
('cable_yky_3x25', 'Kabel YKY 3x2,5', 0, 'Kabel YKY 3x2,5 mm² - kabel instalacyjny okrągły w osłonie PVC do gniazd wtyczkowych i obwodów standardowych', 0.00, '/pictures/electricComponents/cable_yky_3x25.jpg', 'pv_ev', NULL),
('cable_yky_3x4', 'Kabel YKY 3x4', 0, 'Kabel YKY 3x4 mm² - kabel instalacyjny okrągły w osłonie PVC do obwodów o większej mocy', 0.00, '/pictures/electricComponents/cable_yky_3x4.jpg', 'pv_ev', NULL),
('cable_yky_5x4', 'Kabel YKY 5x4', 0, 'Kabel YKY 5x4 mm² - kabel instalacyjny okrągły w osłonie PVC do obwodów trójfazowych', 0.00, '/pictures/electricComponents/cable_yky_5x4.jpg', 'pv_ev', NULL),
('cable_duct', 'Kanały kablowe do rozdzielnicy', 1, 'Kanały kablowe modułowe - kanały elektryczne do organizacji i prowadzenia przewodów w rozdzielnicy modułowej', 15.00, '/pictures/electricComponents/cable_duct.jpg', 'organization', NULL),
('phase_indicator_1f', 'Kontrolka napięcia jednofazowa', 1, 'Kontrolka napięcia jednofazowa modułowa 230V - wskaźnik obecności napięcia elektrycznego w obwodzie jednofazowym', 18.00, '/pictures/electricComponents/phase_indicator_1f.jpg', 'organization', NULL),
('phase_indicator', 'Kontrolki obecności faz L1 L2 L3', 3, 'Kontrolki obecności faz modułowe L1 L2 L3 - wskaźniki napięcia elektrycznego do kontroli obecności faz w rozdzielnicy trójfazowej', 45.00, '/pictures/electricComponents/phase_indicator.jpg', 'measurement_control', NULL),
('energy_meter_1f', 'Licznik energii elektrycznej jednofazowy', 4, 'Licznik energii elektrycznej jednofazowy MID - licznik modułowy do pomiaru energii elektrycznej dla podliczników, PV, pompy ciepła', 280.00, '/pictures/electricComponents/energy_meter_1f.jpg', 'measurement_control', NULL),
('energy_meter_3f', 'Licznik energii elektrycznej trójfazowy', 6, 'Licznik energii elektrycznej trójfazowy MID - licznik modułowy do pomiaru energii elektrycznej dla podliczników, PV, pompy ciepła', 450.00, '/pictures/electricComponents/energy_meter_3f.jpg', 'measurement_control', NULL),
('power_meter', 'Miernik mocy modułowy', 2, 'Miernik mocy modułowy - miernik elektryczny do kontroli zużycia mocy i energii w instalacji elektrycznej', 180.00, '/pictures/electricComponents/power_meter.jpg', 'measurement_control', NULL),
('smart_module', 'Moduł automatyki budynkowej', 2, 'Moduł automatyki budynkowej - sterownik elektryczny KNX, MODBUS, WiFi, ZigBee do systemu inteligentnego domu w rozdzielnicy', 1660.00, '/pictures/electricComponents/smart_module.jpg', 'control_automation', NULL),
('ups_module', 'Moduł UPS zasilania awaryjnego', 4, 'Moduł UPS zasilania awaryjnego - modułowy zasilacz awaryjny UPS do zapewnienia ciągłości zasilania w rozdzielnicy', 450.00, '/pictures/electricComponents/ups_module.jpg', 'emergency_special', NULL),
('io_module', 'Moduł wejść i wyjść cyfrowych', 2, 'Moduł wejść i wyjść cyfrowych - moduł elektryczny do sterowania i monitorowania sygnałów cyfrowych w automatyce', 180.00, '/pictures/electricComponents/io_module.jpg', 'organization', NULL),
('comb_bridge_1f', 'Mostki grzebieniowe jednofazowe', 1, 'Mostki grzebieniowe jednofazowe modułowe - mostki elektryczne do łączenia wyłączników nadprądowych jednofazowych', 18.00, '/pictures/electricComponents/comb_bridge_1f.jpg', 'overcurrent_protection', NULL),
('comb_bridge_3f', 'Mostki grzebieniowe trójfazowe', 1, 'Mostki grzebieniowe trójfazowe modułowe - mostki elektryczne do łączenia wyłączników nadprądowych trójfazowych', 28.00, '/pictures/electricComponents/comb_bridge_3f.jpg', 'overcurrent_protection', NULL),
('surge_protection_3plus0', 'Ogranicznik przepięć 3 + 0', 3, 'Ogranicznik przepięć warystorowy 3 + 0 klasa B+C - zabezpieczenie elektryczne przed przepięciami i wyładowaniami atmosferycznymi w układzie 3 fazy bez neutralnej', 280.00, '/pictures/electricComponents/surge_protection_3plus0.jpg', 'surge_protection_detailed', NULL),
('surge_protection', 'Ogranicznik przepięć 4 + 0', 4, 'Ogranicznik przepięć warystorowy Simtec ST30B+C/4 klasa B+C 30kA 275V | 85201010 Simet - zabezpieczenie elektryczne przed przepięciami i wyładowaniami atmosferycznymi', 320.00, '/pictures/electricComponents/surge_protection.jpg', 'surge_protection_detailed', NULL),
('spd_dc', 'Ogranicznik przepięć DC dla instalacji PV', 4, 'Ogranicznik przepięć modułowy SPD DC - ochrona przed przepięciami dla instalacji fotowoltaicznej prądu stałego', 520.00, '/pictures/electricComponents/spd_dc.jpg', 'surge_protection_detailed', NULL),
('spd_data', 'Ogranicznik przepięć dla linii danych', 2, 'Ogranicznik przepięć modułowy SPD dla linii danych - ochrona przed przepięciami dla sieci LAN, anteny, bramy, domofonu', 95.00, '/pictures/electricComponents/spd_data.jpg', 'surge_protection_detailed', NULL),
('spd_t1', 'Ogranicznik przepięć SPD Typ 1', 4, 'Ogranicznik przepięć modułowy SPD Typ 1 - ochrona odgromowa przed bezpośrednimi wyładowaniami atmosferycznymi w instalacji elektrycznej', 450.00, '/pictures/electricComponents/spd_t1.jpg', 'surge_protection_detailed', NULL),
('spd_t2', 'Ogranicznik przepięć SPD Typ 2', 4, 'Ogranicznik przepięć modułowy SPD Typ 2 - standardowa ochrona przed przepięciami w instalacji elektrycznej domowej', 320.00, '/pictures/electricComponents/spd_t2.jpg', 'surge_protection_detailed', NULL),
('bistable_relay', 'Przekaźnik bistabilny modułowy', 2, 'Przekaźnik bistabilny modułowy - przekaźnik elektryczny do sterowania oświetleniem z wielu przycisków bez podtrzymania zasilania', 85.00, '/pictures/electricComponents/bistable_relay.jpg', 'control_automation', NULL),
('timer_relay', 'Przekaźnik czasowy modułowy', 2, 'Przekaźnik czasowy modułowy - przekaźnik elektryczny z funkcją opóźnienia czasowego do automatycznego wyłączania oświetlenia i wentylacji', 95.00, '/pictures/electricComponents/timer_relay.jpg', 'control_automation', NULL),
('current_relay', 'Przekaźnik kontroli prądu', 2, 'Przekaźnik kontroli prądu modułowy - przekaźnik elektryczny do kontroli wartości prądu w obwodach elektrycznych', 125.00, '/pictures/electricComponents/current_relay.jpg', 'control_automation', NULL),
('priority_relay', 'Przekaźnik priorytetowy obciążenia', 2, 'Przekaźnik priorytetowy obciążenia modułowy - przekaźnik elektryczny do kontroli priorytetów obciążenia load shedding', 195.00, '/pictures/electricComponents/priority_relay.jpg', 'control_automation', NULL),
('network_generator_switch', 'Przełącznik sieć-agregat UPS', 4, 'Przełącznik sieć-agregat UPS modułowy - przełącznik elektryczny do automatycznego przełączania między zasilaniem sieciowym a agregatem lub UPS', 80.00, '/pictures/electricComponents/network_generator_switch.jpg', 'emergency_special', NULL),
('cable_lgy_3x4', 'Przewód LGY 4 niebieski (H07V-K) 450/750V', 0, 'Przewód LgY to jednożyłowy przewód elektryczny, który charakteryzuje się elastyczną budową i jest powszechnie stosowany w instalacjach niskonapięciowych. Przewody LgY przeznaczone są do połączenia urządzeń i aparatów elektrycznych w systemach automatyki oraz instalacji w rozdzielnicach i tablicach elektrycznych.', 0.00, '/pictures/electricComponents/cable_lgy_3x4.jpg', 'cables', NULL),
('pv_dc_disconnect', 'Rozłącznik DC dla instalacji fotowoltaicznej', 4, 'Rozłącznik DC modułowy dla instalacji fotowoltaicznej - rozłącznik prądu stałego do bezpiecznego odłączenia modułów PV', 320.00, '/pictures/electricComponents/pv_dc_disconnect.jpg', 'basic_protection', NULL),
('isolator', 'Rozłącznik izolacyjny modułowy', 3, 'Rozłącznik izolacyjny modułowy 3-polowy - wyłącznik główny rozdzielnicy elektrycznej do bezpiecznego odłączenia zasilania', 180.00, '/pictures/electricComponents/isolator.jpg', 'basic_protection', NULL),
('contactor', 'Stycznik modułowy elektryczny', 2, 'Stycznik modułowy elektryczny - przekaźnik elektromagnetyczny do sterowania obwodami elektrycznymi bojlera, podłogówki, rekuperacji, gniazd nocnych', 125.00, '/pictures/electricComponents/contactor.jpg', 'control_automation', NULL),
('rod_connecting_busbar', 'Szyna łączeniowa sztyftowa', 1, 'Szyna łączeniowa sztyftowa modułowa - szyna elektryczna sztyftowa do łączenia i rozdziału obwodów w rozdzielnicy modułowej', 42.00, '/pictures/electricComponents/rod_connecting_busbar.jpg', 'connection_elements', NULL),
('emergency_switch', 'Wyłącznik awaryjny modułowy', 2, 'Wyłącznik awaryjny modułowy - wyłącznik elektryczny awaryjny do szybkiego odłączenia zasilania w sytuacji awaryjnej', 125.00, '/pictures/electricComponents/emergency_switch.jpg', 'overcurrent_protection', NULL),
('mcb_c16', 'Wyłącznik nadprądowy MCB C16', 1, 'Wyłącznik nadprądowy modułowy MCB C16 16A - zabezpieczenie nadprądowe charakterystyki C do rozdzielnicy elektrycznej', 35.00, '/pictures/electricComponents/mcb_c16.jpg', 'overcurrent_protection', NULL),
('fire_switch', 'Wyłącznik przeciwpożarowy modułowy', 2, 'Wyłącznik przeciwpożarowy modułowy - wyłącznik elektryczny do szybkiego odłączenia zasilania w przypadku pożaru, wymagany przy instalacjach PV', 195.00, '/pictures/electricComponents/fire_switch.jpg', 'overcurrent_protection', NULL),
('rcbo', 'Wyłącznik różnicowo-nadprądowy RCBO', 2, 'Wyłącznik różnicowo-nadprądowy RCBO modułowy - połączenie wyłącznika różnicowoprądowego i nadprądowego w jednym module elektrycznym', 195.00, '/pictures/electricComponents/rcbo.jpg', 'overcurrent_protection', NULL),
('rcd_1f', 'Wyłącznik różnicowoprądowy jednofazowy', 2, 'Wyłącznik różnicowoprądowy RCD jednofazowy 230V - zabezpieczenie przeciwporażeniowe modułowe', 145.00, '/pictures/electricComponents/rcd_1f.jpg', 'overcurrent_protection', NULL),
('rcd_3f', 'Wyłącznik różnicowoprądowy trójfazowy', 4, 'Wyłącznik różnicowoprądowy RCD trójfazowy 400V - zabezpieczenie przeciwporażeniowe modułowe', 280.00, '/pictures/electricComponents/rcd_3f.jpg', 'overcurrent_protection', NULL),
('pv_ac_protection', 'Zabezpieczenia strony AC falownika fotowoltaicznego', 4, 'Zabezpieczenia elektryczne strony AC falownika fotowoltaicznego - wyłączniki i ograniczniki przepięć dla instalacji PV', 280.00, '/pictures/electricComponents/pv_ac_protection.jpg', 'surge_protection_detailed', NULL),
('power_supply_12v', 'Zasilacz modułowy 12V DC', 2, 'Zasilacz modułowy 12V DC - zasilacz elektryczny do automatyki, przekaźników i systemów sterowania w rozdzielnicy', 85.00, '/pictures/electricComponents/power_supply_12v.jpg', 'control_automation', NULL),
('power_supply_24v', 'Zasilacz modułowy 24V DC', 2, 'Zasilacz modułowy 24V DC - zasilacz elektryczny do automatyki, przekaźników i systemów sterowania w rozdzielnicy', 95.00, '/pictures/electricComponents/power_supply_24v.jpg', 'control_automation', NULL),
('pen_splitter', 'Złączka podziału przewodu PEN', 2, 'Złączka podziału przewodu PEN na PE i N - element elektryczny do rozdzielenia przewodu ochronno-neutralnego w rozdzielnicy', 15.00, '/pictures/electricComponents/pen_splitter.jpg', 'basic_protection', NULL),
('phase_connector', 'Złączki przewodów fazowych L', 1, 'Złączki przewodów fazowych L modułowe - złączki elektryczne do łączenia przewodów fazowych w rozdzielnicy', 8.00, '/pictures/electricComponents/phase_connector.jpg', 'organization', NULL),
('n_connector', 'Złączki przewodów neutralnych N', 1, 'Złączki przewodów neutralnych N modułowe - złączki elektryczne do łączenia przewodów neutralnych w rozdzielnicy', 8.00, '/pictures/electricComponents/n_connector.jpg', 'organization', NULL),
('pe_connector', 'Złączki przewodów ochronnych PE', 1, 'Złączki przewodów ochronnych PE modułowe - złączki elektryczne do łączenia przewodów ochronnych w rozdzielnicy', 8.00, '/pictures/electricComponents/pe_connector.jpg', 'organization', NULL)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `fields` = VALUES(`fields`),
  `description` = VALUES(`description`),
  `price` = VALUES(`price`),
  `image` = VALUES(`image`),
  `category` = VALUES(`category`),
  `subcategory` = VALUES(`subcategory`);
