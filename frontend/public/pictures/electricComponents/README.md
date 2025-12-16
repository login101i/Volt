# Electric Components Images

This folder contains images for electrical components displayed in the calculation page.

## Image Naming Convention

Images should be named using the component ID from the `REQUIRED_COMPONENTS` array:

- `isolator.jpg` - Rozłącznik izolacyjny
- `pen_splitter.jpg` - Złączka podziału PEN
- `surge_protection.jpg` - Zabezpieczenie przepięciowe
- `distribution_block.jpg` - Blok rozdzielczy
- `rcd_1f.jpg` - Wyłącznik różnicowoprądowy 1F
- `rcd_3f.jpg` - Wyłącznik różnicowoprądowy 3F
- `mcb_b10.jpg` - Wyłącznik nadprądowy B10
- `mcb_b16.jpg` - Wyłącznik nadprądowy B16
- `mcb_c16.jpg` - Wyłącznik nadprądowy C16
- `rcbo.jpg` - Wyłącznik różnicowo-nadprądowy (RCBO)
- `spd_t1.jpg` - Ogranicznik przepięć T1
- `spd_t2.jpg` - Ogranicznik przepięć T2
- `spd_t3.jpg` - Ogranicznik przepięć T3
- `spd_dc.jpg` - Ogranicznik przepięć DC (PV)
- `spd_data.jpg` - Ogranicznik przepięć linie danych
- `contactor.jpg` - Stycznik modułowy
- `bistable_relay.jpg` - Przekaźnik bistabilny
- `timer_relay.jpg` - Przekaźnik czasowy
- `smart_module.jpg` - Moduły inteligentnego domu
- `energy_meter_1f.jpg` - Licznik energii 1F
- `energy_meter_3f.jpg` - Licznik energii 3F
- `voltmeter.jpg` - Woltomierz
- `ammeter.jpg` - Amperomierz
- `power_meter.jpg` - Miernik mocy
- `phase_indicator.jpg` - Kontrolki obecności faz (L1, L2, L3)
- `phase_indicator_1f.jpg` - Kontrolka napięcia 1-fazowa
- `spd_indicator.jpg` - Sygnalizator zadziałania SPD
- `power_supply_24v.jpg` - Zasilacz 24V DC
- `power_supply_12v.jpg` - Zasilacz 12V DC
- `network_generator_switch.jpg` - Przełącznik sieć-agregat/UPS
- `fire_switch.jpg` - Wyłącznik przeciwpożarowy
- `pv_ac_protection.jpg` - Zabezpieczenia strony AC falownika PV
- `pv_dc_disconnect.jpg` - Rozłącznik DC PV
- `ev_charger_protection.jpg` - Zabezpieczenie ładowarki EV
- `ev_energy_meter.jpg` - Licznik energii dla EV
- `n_pe_busbar.jpg` - Listwy N i PE
- `comb_busbar.jpg` - Szyny grzebieniowe
- `cable_duct.jpg` - Kanały kablowe
- `module_labels.jpg` - Opisówki / etykiety modułów
- `n_connector.jpg` - Złączki N
- `pe_connector.jpg` - Złączki PE
- `phase_connector.jpg` - Złączki fazowe
- `distribution_busbar.jpg` - Listwy rozdzielcze modułowe
- `comb_bridge_1f.jpg` - Mostki grzebieniowe 1F
- `comb_bridge_3f.jpg` - Mostki grzebieniowe 3F
- `supply_terminals.jpg` - Zaciski przyłączeniowe zasilania
- `emergency_switch.jpg` - Wyłącznik awaryjny (grzybek)
- `voltage_relay.jpg` - Przekaźnik kontroli napięcia
- `overvoltage_relay.jpg` - Przekaźnik nad-/podnapięciowy
- `current_relay.jpg` - Przekaźnik kontroli prądu
- `io_module.jpg` - Moduły wejść/wyjść
- `blind_controller.jpg` - Sterownik rolet
- `heating_controller.jpg` - Sterownik ogrzewania
- `ups_module.jpg` - UPS modułowy
- `priority_relay.jpg` - Przekaźnik priorytetowy
- `din_rail.jpg` - Szyny DIN
- `n_pe_rail.jpg` - Szyny N / PE
- `rcd_separator.jpg` - Separatory między RCD
- `blank_module.jpg` - Zaślepki pól
- `circuit_description.jpg` - Opis obwodów
- `door_schematic.jpg` - Drzwiczki z miejscem na schemat

## Image Format

- Recommended format: JPG or PNG
- Recommended size: 200x200px to 400x400px
- Aspect ratio: Square (1:1) works best
- File size: Keep images optimized (< 100KB recommended)

## Usage

Images are automatically loaded in the calculation page when components are displayed. If an image is missing, it will be hidden gracefully without breaking the UI.
