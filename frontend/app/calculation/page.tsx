'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import GlobalPopup from '@/components/GlobalPopup';
import { SearchComponent } from '@/components/SearchComponent';
import api from '@/lib/api';

interface Circuit {
  id: number;
  circuitNumber: number;
  description: string;
  socketSwitchCount: number; // Ilość gniazd lub włączników
  zone: 'Parter' | 'Piętro';
  voltage: number;
  cable: string;
  length: number; // Długość przewodu w metrach
  power: number;
  fuseType: string; // Typ bezpiecznika: 10A, 16A, 20A, 25A, 32A, 40A, 50A, 63A, etc.
  phase: 'L1' | 'L2' | 'L3' | '3Φ';
  type: '1φ' | '3φ';
}

interface CircuitTemplate {
  description: string;
  zone: 'Parter' | 'Piętro';
  voltage: number;
  cable: string;
  power: number;
  phase: 'L1' | 'L2' | 'L3' | '3Φ';
  type: '1φ' | '3φ';
}

interface RequiredComponent {
  id: string;
  name: string;
  fields: number; // Liczba pól zajmowanych przez komponent
  quantity: number;
  description?: string; // Opis elementu wyświetlany w tooltipie
  price?: number; // Cena przybliżona w PLN
  image?: string; // Ścieżka do obrazu komponentu
}

const REQUIRED_COMPONENTS: Omit<RequiredComponent, 'quantity'>[] = [
  // Zabezpieczenia podstawowe
  { id: 'isolator', name: 'Rozłącznik izolacyjny modułowy', fields: 3, description: 'Rozłącznik izolacyjny modułowy 3-polowy - wyłącznik główny rozdzielnicy elektrycznej do bezpiecznego odłączenia zasilania', price: 180, image: '/pictures/electricComponents/isolator.jpg' },
  { id: 'pen_splitter', name: 'Złączka podziału przewodu PEN', fields: 2, description: 'Złączka podziału przewodu PEN na PE i N - element elektryczny do rozdzielenia przewodu ochronno-neutralnego w rozdzielnicy', price: 15, image: '/pictures/electricComponents/pen_splitter.jpg' },
  { id: 'surge_protection', name: 'Ogranicznik przepięć modułowy', fields: 4, description: 'Ogranicznik przepięć modułowy SPD T1/T2/T3 - zabezpieczenie elektryczne przed przepięciami i wyładowaniami atmosferycznymi', price: 320, image: '/pictures/electricComponents/surge_protection.jpg' },
  { id: 'distribution_block', name: 'Blok rozdzielczy modułowy', fields: 4, description: 'Blok rozdzielczy modułowy - element elektryczny do rozdziału obwodów w rozdzielnicy modułowej', price: 85, image: '/pictures/electricComponents/distribution_block.jpg' },
  { id: 'rcd_1f', name: 'Wyłącznik różnicowoprądowy jednofazowy', fields: 2, description: 'Wyłącznik różnicowoprądowy RCD jednofazowy 230V - zabezpieczenie przeciwporażeniowe modułowe', price: 145, image: '/pictures/electricComponents/rcd_1f.jpg' },
  { id: 'rcd_3f', name: 'Wyłącznik różnicowoprądowy trójfazowy', fields: 4, description: 'Wyłącznik różnicowoprądowy RCD trójfazowy 400V - zabezpieczenie przeciwporażeniowe modułowe', price: 280, image: '/pictures/electricComponents/rcd_3f.jpg' },
  
  // Zabezpieczenia nadprądowe
  { id: 'mcb_b6', name: 'B6A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B6 6A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 25, image: '/pictures/electricComponents/mcb_b6.jpg' },
  { id: 'mcb_b10', name: 'B10A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B10 10A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 28, image: '/pictures/electricComponents/mcb_b10.jpg' },
  { id: 'mcb_b13', name: 'B13A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B13 13A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 30, image: '/pictures/electricComponents/mcb_b13.jpg' },
  { id: 'mcb_b16', name: 'B16A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B16 16A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 32, image: '/pictures/electricComponents/mcb_b16.jpg' },
  { id: 'mcb_b20', name: 'B20A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B20 20A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 35, image: '/pictures/electricComponents/mcb_b20.jpg' },
  { id: 'mcb_b25', name: 'B25A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B25 25A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 38, image: '/pictures/electricComponents/mcb_b25.jpg' },
  { id: 'mcb_b32', name: 'B32A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B32 32A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 42, image: '/pictures/electricComponents/mcb_b32.jpg' },
  { id: 'mcb_b40', name: 'B40A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B40 40A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 48, image: '/pictures/electricComponents/mcb_b40.jpg' },
  { id: 'mcb_b50', name: 'B50A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B50 50A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 55, image: '/pictures/electricComponents/mcb_b50.jpg' },
  { id: 'mcb_b63', name: 'B63A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B63 63A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 65, image: '/pictures/electricComponents/mcb_b63.jpg' },
  { id: 'mcb_b80', name: 'B80A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B80 80A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 85, image: '/pictures/electricComponents/mcb_b80.jpg' },
  { id: 'mcb_b100', name: 'B100A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B100 100A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 120, image: '/pictures/electricComponents/mcb_b100.jpg' },
  { id: 'mcb_b125', name: 'B125A', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB B125 125A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej', price: 145, image: '/pictures/electricComponents/mcb_b125.jpg' },
  { id: 'mcb_c16', name: 'Wyłącznik nadprądowy MCB C16', fields: 1, description: 'Wyłącznik nadprądowy modułowy MCB C16 16A - zabezpieczenie nadprądowe charakterystyki C do rozdzielnicy elektrycznej', price: 35, image: '/pictures/electricComponents/mcb_c16.jpg' },
  { id: 'rcbo', name: 'Wyłącznik różnicowo-nadprądowy RCBO', fields: 2, description: 'Wyłącznik różnicowo-nadprądowy RCBO modułowy - połączenie wyłącznika różnicowoprądowego i nadprądowego w jednym module elektrycznym', price: 195, image: '/pictures/electricComponents/rcbo.jpg' },
  
  // Zabezpieczenia przepięciowe - szczegółowe
  { id: 'spd_t1', name: 'Ogranicznik przepięć SPD Typ 1', fields: 4, description: 'Ogranicznik przepięć modułowy SPD Typ 1 - ochrona odgromowa przed bezpośrednimi wyładowaniami atmosferycznymi w instalacji elektrycznej', price: 450, image: '/pictures/electricComponents/spd_t1.jpg' },
  { id: 'spd_t2', name: 'Ogranicznik przepięć SPD Typ 2', fields: 4, description: 'Ogranicznik przepięć modułowy SPD Typ 2 - standardowa ochrona przed przepięciami w instalacji elektrycznej domowej', price: 320, image: '/pictures/electricComponents/spd_t2.jpg' },
  { id: 'spd_t3', name: 'Ogranicznik przepięć SPD Typ 3', fields: 2, description: 'Ogranicznik przepięć modułowy SPD Typ 3 - ochrona końcowa przed przepięciami w instalacji elektrycznej', price: 180, image: '/pictures/electricComponents/spd_t3.jpg' },
  { id: 'spd_dc', name: 'Ogranicznik przepięć DC dla instalacji PV', fields: 4, description: 'Ogranicznik przepięć modułowy SPD DC - ochrona przed przepięciami dla instalacji fotowoltaicznej prądu stałego', price: 520, image: '/pictures/electricComponents/spd_dc.jpg' },
  { id: 'spd_data', name: 'Ogranicznik przepięć dla linii danych', fields: 2, description: 'Ogranicznik przepięć modułowy SPD dla linii danych - ochrona przed przepięciami dla sieci LAN, anteny, bramy, domofonu', price: 95, image: '/pictures/electricComponents/spd_data.jpg' },
  
  // Sterowanie i automatyka
  { id: 'contactor', name: 'Stycznik modułowy elektryczny', fields: 2, description: 'Stycznik modułowy elektryczny - przekaźnik elektromagnetyczny do sterowania obwodami elektrycznymi bojlera, podłogówki, rekuperacji, gniazd nocnych', price: 125, image: '/pictures/electricComponents/contactor.jpg' },
  { id: 'bistable_relay', name: 'Przekaźnik bistabilny modułowy', fields: 2, description: 'Przekaźnik bistabilny modułowy - przekaźnik elektryczny do sterowania oświetleniem z wielu przycisków bez podtrzymania zasilania', price: 85, image: '/pictures/electricComponents/bistable_relay.jpg' },
  { id: 'timer_relay', name: 'Przekaźnik czasowy modułowy', fields: 2, description: 'Przekaźnik czasowy modułowy - przekaźnik elektryczny z funkcją opóźnienia czasowego do automatycznego wyłączania oświetlenia i wentylacji', price: 95, image: '/pictures/electricComponents/timer_relay.jpg' },
  { id: 'smart_module', name: 'Moduł automatyki budynkowej', fields: 2, description: 'Moduł automatyki budynkowej - sterownik elektryczny KNX, MODBUS, WiFi, ZigBee do systemu inteligentnego domu w rozdzielnicy', price: 350, image: '/pictures/electricComponents/smart_module.jpg' },
  
  // Pomiary i kontrola
  { id: 'energy_meter_1f', name: 'Licznik energii elektrycznej jednofazowy', fields: 4, description: 'Licznik energii elektrycznej jednofazowy MID - licznik modułowy do pomiaru energii elektrycznej dla podliczników, PV, pompy ciepła', price: 280, image: '/pictures/electricComponents/energy_meter_1f.jpg' },
  { id: 'energy_meter_3f', name: 'Licznik energii elektrycznej trójfazowy', fields: 6, description: 'Licznik energii elektrycznej trójfazowy MID - licznik modułowy do pomiaru energii elektrycznej dla podliczników, PV, pompy ciepła', price: 450, image: '/pictures/electricComponents/energy_meter_3f.jpg' },
  { id: 'voltmeter', name: 'Woltomierz modułowy', fields: 2, description: 'Woltomierz modułowy - miernik napięcia elektrycznego do kontroli wartości napięcia w rozdzielnicy', price: 120, image: '/pictures/electricComponents/voltmeter.jpg' },
  { id: 'ammeter', name: 'Amperomierz modułowy', fields: 2, description: 'Amperomierz modułowy - miernik prądu elektrycznego do kontroli wartości prądu w obwodach rozdzielnicy', price: 120, image: '/pictures/electricComponents/ammeter.jpg' },
  { id: 'power_meter', name: 'Miernik mocy modułowy', fields: 2, description: 'Miernik mocy modułowy - miernik elektryczny do kontroli zużycia mocy i energii w instalacji elektrycznej', price: 180, image: '/pictures/electricComponents/power_meter.jpg' },
  { id: 'phase_indicator', name: 'Kontrolki obecności faz L1 L2 L3', fields: 3, description: 'Kontrolki obecności faz modułowe L1 L2 L3 - wskaźniki napięcia elektrycznego do kontroli obecności faz w rozdzielnicy trójfazowej', price: 45, image: '/pictures/electricComponents/phase_indicator.jpg' },
  { id: 'phase_indicator_1f', name: 'Kontrolka napięcia jednofazowa', fields: 1, description: 'Kontrolka napięcia jednofazowa modułowa 230V - wskaźnik obecności napięcia elektrycznego w obwodzie jednofazowym', price: 18, image: '/pictures/electricComponents/phase_indicator_1f.jpg' },
  { id: 'spd_indicator', name: 'Sygnalizator zadziałania ogranicznika przepięć', fields: 1, description: 'Sygnalizator zadziałania ogranicznika przepięć SPD - moduł elektryczny do sygnalizacji zadziałania zabezpieczenia przepięciowego', price: 35, image: '/pictures/electricComponents/spd_indicator.jpg' },
  
  // Zasilanie awaryjne i specjalne
  { id: 'power_supply_24v', name: 'Zasilacz modułowy 24V DC', fields: 2, description: 'Zasilacz modułowy 24V DC - zasilacz elektryczny do automatyki, przekaźników i systemów sterowania w rozdzielnicy', price: 95, image: '/pictures/electricComponents/power_supply_24v.jpg' },
  { id: 'power_supply_12v', name: 'Zasilacz modułowy 12V DC', fields: 2, description: 'Zasilacz modułowy 12V DC - zasilacz elektryczny do automatyki, przekaźników i systemów sterowania w rozdzielnicy', price: 85, image: '/pictures/electricComponents/power_supply_12v.jpg' },
  { id: 'network_generator_switch', name: 'Przełącznik sieć-agregat UPS', fields: 4, description: 'Przełącznik sieć-agregat UPS modułowy - przełącznik elektryczny do automatycznego przełączania między zasilaniem sieciowym a agregatem lub UPS', price: 380, image: '/pictures/electricComponents/network_generator_switch.jpg' },
  { id: 'fire_switch', name: 'Wyłącznik przeciwpożarowy modułowy', fields: 2, description: 'Wyłącznik przeciwpożarowy modułowy - wyłącznik elektryczny do szybkiego odłączenia zasilania w przypadku pożaru, wymagany przy instalacjach PV', price: 195, image: '/pictures/electricComponents/fire_switch.jpg' },
  
  // PV, EV i nowoczesne instalacje
  { id: 'pv_ac_protection', name: 'Zabezpieczenia strony AC falownika fotowoltaicznego', fields: 4, description: 'Zabezpieczenia elektryczne strony AC falownika fotowoltaicznego - wyłączniki i ograniczniki przepięć dla instalacji PV', price: 280, image: '/pictures/electricComponents/pv_ac_protection.jpg' },
  { id: 'pv_dc_disconnect', name: 'Rozłącznik DC dla instalacji fotowoltaicznej', fields: 4, description: 'Rozłącznik DC modułowy dla instalacji fotowoltaicznej - rozłącznik prądu stałego do bezpiecznego odłączenia modułów PV', price: 320, image: '/pictures/electricComponents/pv_dc_disconnect.jpg' },
  { id: 'ev_charger_protection', name: 'Zabezpieczenie elektryczne ładowarki EV', fields: 4, description: 'Zabezpieczenie elektryczne ładowarki samochodu elektrycznego EV - wyłączniki różnicowoprądowe i nadprądowe dla stacji ładowania', price: 350, image: '/pictures/electricComponents/ev_charger_protection.jpg' },
  { id: 'ev_energy_meter', name: 'Licznik energii dla ładowarki EV', fields: 4, description: 'Licznik energii elektrycznej dla ładowarki samochodu elektrycznego EV - miernik energii do rozliczeń ładowania pojazdu', price: 320, image: '/pictures/electricComponents/ev_energy_meter.jpg' },
  
  // Organizacja i estetyka
  { id: 'n_pe_busbar', name: 'Listwy szyn N i PE', fields: 1, description: 'Listwy szyn N i PE modułowe - szyny elektryczne do organizacji przewodów neutralnych i ochronnych w rozdzielnicy', price: 35, image: '/pictures/electricComponents/n_pe_busbar.jpg' },
  { id: 'comb_busbar', name: 'Szyny grzebieniowe modułowe', fields: 1, description: 'Szyny grzebieniowe modułowe - szyny elektryczne grzebieniowe jednofazowe i trójfazowe do rozdziału zasilania w rozdzielnicy', price: 25, image: '/pictures/electricComponents/comb_busbar.jpg' },
  { id: 'cable_duct', name: 'Kanały kablowe do rozdzielnicy', fields: 1, description: 'Kanały kablowe modułowe - kanały elektryczne do organizacji i prowadzenia przewodów w rozdzielnicy modułowej', price: 15, image: '/pictures/electricComponents/cable_duct.jpg' },
  { id: 'module_labels', name: 'Etykiety opisowe modułów elektrycznych', fields: 0, description: 'Etykiety opisowe modułów elektrycznych - oznaczenia i opisy modułów w rozdzielnicy do dokumentacji i identyfikacji obwodów', price: 25, image: '/pictures/electricComponents/module_labels.jpg' },
  
  // Elementy łączeniowe i rozdział
  { id: 'n_connector', name: 'Złączki przewodów neutralnych N', fields: 1, description: 'Złączki przewodów neutralnych N modułowe - złączki elektryczne do łączenia przewodów neutralnych w rozdzielnicy', price: 8, image: '/pictures/electricComponents/n_connector.jpg' },
  { id: 'pe_connector', name: 'Złączki przewodów ochronnych PE', fields: 1, description: 'Złączki przewodów ochronnych PE modułowe - złączki elektryczne do łączenia przewodów ochronnych w rozdzielnicy', price: 8, image: '/pictures/electricComponents/pe_connector.jpg' },
  { id: 'phase_connector', name: 'Złączki przewodów fazowych L', fields: 1, description: 'Złączki przewodów fazowych L modułowe - złączki elektryczne do łączenia przewodów fazowych w rozdzielnicy', price: 8, image: '/pictures/electricComponents/phase_connector.jpg' },
  { id: 'distribution_busbar', name: 'Listwy rozdzielcze modułowe', fields: 1, description: 'Listwy rozdzielcze modułowe - szyny elektryczne rozdzielcze do rozdziału zasilania między moduły w rozdzielnicy', price: 45, image: '/pictures/electricComponents/distribution_busbar.jpg' },
  { id: 'comb_bridge_1f', name: 'Mostki grzebieniowe jednofazowe', fields: 1, description: 'Mostki grzebieniowe jednofazowe modułowe - mostki elektryczne do łączenia wyłączników nadprądowych jednofazowych', price: 18, image: '/pictures/electricComponents/comb_bridge_1f.jpg' },
  { id: 'comb_bridge_3f', name: 'Mostki grzebieniowe trójfazowe', fields: 1, description: 'Mostki grzebieniowe trójfazowe modułowe - mostki elektryczne do łączenia wyłączników nadprądowych trójfazowych', price: 28, image: '/pictures/electricComponents/comb_bridge_3f.jpg' },
  { id: 'supply_terminals', name: 'Zaciski przyłączeniowe zasilania', fields: 2, description: 'Zaciski przyłączeniowe zasilania modułowe - zaciski elektryczne do przyłączenia głównego zasilania do rozdzielnicy', price: 55, image: '/pictures/electricComponents/supply_terminals.jpg' },
  
  // Ochrona i bezpieczeństwo - dodatkowe
  { id: 'emergency_switch', name: 'Wyłącznik awaryjny modułowy', fields: 2, description: 'Wyłącznik awaryjny modułowy - wyłącznik elektryczny awaryjny do szybkiego odłączenia zasilania w sytuacji awaryjnej', price: 125, image: '/pictures/electricComponents/emergency_switch.jpg' },
  { id: 'voltage_relay', name: 'Przekaźnik kontroli napięcia', fields: 2, description: 'Przekaźnik kontroli napięcia modułowy - przekaźnik elektryczny do kontroli zaniku fazy, asymetrii i kolejności faz', price: 145, image: '/pictures/electricComponents/voltage_relay.jpg' },
  { id: 'overvoltage_relay', name: 'Przekaźnik nad- i podnapięciowy', fields: 2, description: 'Przekaźnik nad- i podnapięciowy modułowy - przekaźnik elektryczny do ochrony przed nadnapięciem i podnapięciem w instalacji', price: 145, image: '/pictures/electricComponents/overvoltage_relay.jpg' },
  
  // Automatyka i sterowanie - dodatkowe
  { id: 'current_relay', name: 'Przekaźnik kontroli prądu', fields: 2, description: 'Przekaźnik kontroli prądu modułowy - przekaźnik elektryczny do kontroli wartości prądu w obwodach elektrycznych', price: 125, image: '/pictures/electricComponents/current_relay.jpg' },
  { id: 'io_module', name: 'Moduł wejść i wyjść cyfrowych', fields: 2, description: 'Moduł wejść i wyjść cyfrowych - moduł elektryczny do sterowania i monitorowania sygnałów cyfrowych w automatyce', price: 180, image: '/pictures/electricComponents/io_module.jpg' },
  { id: 'blind_controller', name: 'Sterownik rolet i żaluzji', fields: 2, description: 'Sterownik rolet i żaluzji modułowy - moduł elektryczny do automatyzacji sterowania roletami i żaluzjami', price: 195, image: '/pictures/electricComponents/blind_controller.jpg' },
  { id: 'heating_controller', name: 'Sterownik ogrzewania elektrycznego', fields: 2, description: 'Sterownik ogrzewania elektrycznego modułowy - moduł elektryczny do kontroli i sterowania systemem grzewczym', price: 220, image: '/pictures/electricComponents/heating_controller.jpg' },
  
  // Zasilanie pomocnicze - dodatkowe
  { id: 'ups_module', name: 'Moduł UPS zasilania awaryjnego', fields: 4, description: 'Moduł UPS zasilania awaryjnego - modułowy zasilacz awaryjny UPS do zapewnienia ciągłości zasilania w rozdzielnicy', price: 450, image: '/pictures/electricComponents/ups_module.jpg' },
  { id: 'priority_relay', name: 'Przekaźnik priorytetowy obciążenia', fields: 2, description: 'Przekaźnik priorytetowy obciążenia modułowy - przekaźnik elektryczny do kontroli priorytetów obciążenia load shedding', price: 195, image: '/pictures/electricComponents/priority_relay.jpg' },
  
  // Rzeczy obowiązkowe
  { id: 'din_rail', name: 'Szyna montażowa DIN', fields: 0, description: 'Szyna montażowa DIN - szyna elektryczna do montażu elementów modułowych w rozdzielnicy elektrycznej', price: 12, image: '/pictures/electricComponents/din_rail.jpg' },
  { id: 'n_pe_rail', name: 'Szyny N i PE', fields: 0, description: 'Szyny N i PE modułowe - szyny elektryczne do organizacji i łączenia przewodów neutralnych i ochronnych', price: 25, image: '/pictures/electricComponents/n_pe_rail.jpg' },
  { id: 'rcd_separator', name: 'Separator między wyłącznikami RCD', fields: 1, description: 'Separator między wyłącznikami RCD modułowy - separator elektryczny do izolacji między różnicówkami w rozdzielnicy', price: 15, image: '/pictures/electricComponents/rcd_separator.jpg' },
  { id: 'blank_module', name: 'Zaślepki modułowe pól', fields: 1, description: 'Zaślepki modułowe pól - zaślepki elektryczne do estetycznego zamykania wolnych miejsc w rozdzielnicy modułowej', price: 5, image: '/pictures/electricComponents/blank_module.jpg' },
  { id: 'circuit_description', name: 'Opis obwodów elektrycznych', fields: 0, description: 'Opis obwodów elektrycznych - etykiety i oznaczenia do dokumentacji obwodów w rozdzielnicy elektrycznej', price: 25, image: '/pictures/electricComponents/circuit_description.jpg' },
  { id: 'door_schematic', name: 'Drzwiczki rozdzielnicy z miejscem na schemat', fields: 0, description: 'Drzwiczki rozdzielnicy z miejscem na schemat - drzwiczki elektryczne z przezroczystą kieszenią na schemat instalacji', price: 85, image: '/pictures/electricComponents/door_schematic.jpg' },
];

// Sort components alphabetically by name
const SORTED_REQUIRED_COMPONENTS: Omit<RequiredComponent, 'quantity'>[] = [...REQUIRED_COMPONENTS].sort((a, b) => 
  a.name.localeCompare(b.name, 'pl', { sensitivity: 'base' })
);

// Fuse types for single phase (1φ)
const FUSE_TYPES_1PHASE = ['6A', '10A', '13A', '16A', '20A', '25A', '32A', '40A', '50A', '63A'];

// Fuse types for three phase (3φ)
const FUSE_TYPES_3PHASE = ['16A', '20A', '25A', '32A', '40A', '50A', '63A', '80A', '100A', '125A'];

const CIRCUIT_TEMPLATES: CircuitTemplate[] = [
  { description: 'Gniazda kuchnia piekarnik', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x2,5', power: 2, phase: 'L1', type: '1φ' },
  { description: 'Gniazda kuchnia zmywarka', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x2,5', power: 2, phase: 'L1', type: '1φ' },
  { description: 'Gniazda kuchnia lodówka', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x2,5', power: 2, phase: 'L2', type: '1φ' },
  { description: 'Zasilenie płyta indukcyjna', zone: 'Parter', voltage: 230, cable: 'YDYpżo 5x4', power: 7.5, phase: '3Φ', type: '3φ' },
  { description: 'Gniazda garaż', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x2,5', power: 2, phase: 'L3', type: '1φ' },
  { description: 'Gniazda kotłownia', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x2,5', power: 2, phase: 'L1', type: '1φ' },
  { description: 'Kotłownia – bojler', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x2,5', power: 2, phase: 'L2', type: '1φ' },
  { description: 'Oświetlenie zewnętrzne', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x1,5', power: 0.5, phase: 'L3', type: '1φ' },
  { description: 'Brama wjazdowa', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x2,5', power: 1, phase: 'L1', type: '1φ' },

  { description: 'Gniazda hol / strych', zone: 'Piętro', voltage: 230, cable: 'YDYpżo 3x2,5', power: 2, phase: 'L1', type: '1φ' },
  { description: 'Gniazda strych', zone: 'Piętro', voltage: 230, cable: 'YDYpżo 3x2,5', power: 2, phase: 'L2', type: '1φ' },
  { description: 'Rekuperator', zone: 'Piętro', voltage: 230, cable: 'YDYpżo 3x2,5', power: 1.5, phase: 'L3', type: '1φ' },
  { description: 'Zasilanie alarm', zone: 'Piętro', voltage: 230, cable: 'YDYpżo 3x1,5', power: 0.5, phase: 'L1', type: '1φ' },
  { description: 'Zasilanie tablica multimedialna', zone: 'Piętro', voltage: 230, cable: 'YDYpżo 3x2,5', power: 1, phase: 'L2', type: '1φ' },
  { description: 'Gniazdo 400V', zone: 'Parter', voltage: 400, cable: 'YDYpżo 5x4', power: 5, phase: '3Φ', type: '3φ' },
  { description: 'Rolety parter', zone: 'Parter', voltage: 230, cable: 'YDYpżo 3x1,5', power: 0.5, phase: 'L3', type: '1φ' },
];

// Component Item with Image Upload
function ComponentItem({ 
  component, 
  componentTemplate, 
  onQuantityChange 
}: { 
  component: RequiredComponent; 
  componentTemplate: Omit<RequiredComponent, 'quantity'> | undefined;
  onQuantityChange: (id: string, quantity: number) => void;
}) {
  // Helper function to get image path, trying both .jpg and .jpeg
  const getImagePath = (basePath: string | undefined): string | undefined => {
    if (!basePath) return undefined;
    // If path already has extension, use it as is
    if (basePath.includes('.')) {
      return basePath;
    }
    // Otherwise, try .jpg first, fallback to .jpeg
    return basePath.endsWith('.jpg') || basePath.endsWith('.jpeg') 
      ? basePath 
      : `${basePath}.jpg`;
  };

  // Helper function to generate Google search URL
  const getGoogleSearchUrl = (name: string, description?: string): string => {
    const searchQuery = description 
      ? `${name} ${description}`
      : name;
    const encodedQuery = encodeURIComponent(searchQuery);
    return `https://www.google.com/search?q=${encodedQuery}`;
  };

  const [image, setImage] = useState(getImagePath(componentTemplate?.image));
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      alert('Proszę wybrać plik obrazu (JPEG, PNG, GIF lub WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Plik jest zbyt duży. Maksymalny rozmiar to 5MB.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await api.upload.componentImage(component.id, file);
      if (response.success) {
        setImage(response.filePath);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Błąd podczas przesyłania obrazu: ' + (error instanceof Error ? error.message : 'Nieznany błąd'));
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const description = componentTemplate?.description || '';
  const price = componentTemplate?.price || 0;
  const totalPrice = price * component.quantity;

  return (
    <div className="flex items-start gap-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
      {/* Component Image - Left Side */}
      <div className="flex-shrink-0">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <div 
          className={`w-16 h-16 relative bg-white rounded border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-400 transition-colors ${isUploading ? 'opacity-50' : ''}`}
          onClick={handleImageClick}
          title="Kliknij, aby zmienić obraz"
        >
          {image ? (
            <Image
              src={image}
              alt={component.name}
              fill
              className="object-contain p-1"
              onError={(e) => {
                // Try .jpeg if .jpg fails
                const img = e.target as HTMLImageElement;
                const currentSrc = img.src;
                if (currentSrc.endsWith('.jpg')) {
                  const jpegSrc = currentSrc.replace('.jpg', '.jpeg');
                  img.src = jpegSrc;
                } else {
                  // Hide image if both fail
                  img.style.display = 'none';
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-1">
              Kliknij, aby dodać obraz
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-gray-200 bg-opacity-75 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Content - Right Side */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Component Title - Clickable Google Search Link */}
        <a
          href={getGoogleSearchUrl(component.name, description)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          title={`Szukaj w Google: ${component.name} ${description}`}
          onClick={(e) => e.stopPropagation()}
        >
          {component.name}
        </a>

        {/* Fields and Price Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          {component.fields > 0 && (
            <span>({component.fields} {component.fields === 1 ? 'pole' : 'pola'})</span>
          )}
          {price > 0 && (
            <span>~{price.toFixed(2)} zł</span>
          )}
          {description && (
            <div className="relative group flex-shrink-0">
              <span className="text-blue-600 cursor-help text-xs font-bold hover:text-blue-800">?</span>
              <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                {description}
              </div>
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => {
              const newQuantity = Math.max(0, component.quantity - 1);
              onQuantityChange(component.id, newQuantity);
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200 bg-white text-black font-bold min-w-[28px]"
            title="Zmniejsz ilość"
          >
            −
          </button>
          <span className="text-sm font-medium text-gray-900 min-w-[24px] text-center">
            {component.quantity}
          </span>
          <button
            onClick={() => {
              const newQuantity = Math.min(10, component.quantity + 1);
              onQuantityChange(component.id, newQuantity);
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-200 bg-white text-black font-bold min-w-[28px]"
            title="Zwiększ ilość"
          >
            +
          </button>
          {totalPrice > 0 && (
            <span className="text-xs font-semibold text-green-600 ml-auto">
              {totalPrice.toFixed(2)} zł
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalculationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerIdFromUrl = searchParams.get('offerId');
  const [circuits, setCircuits] = useState<Circuit[]>([
    {
      id: 1,
      circuitNumber: 1,
      description: 'Oświetlenie parter kuchnia 1',
      socketSwitchCount: 1,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L1',
      type: '1φ',
    },
    {
      id: 2,
      circuitNumber: 2,
      description: 'Oświetlenie parter kuchnia 2',
      socketSwitchCount: 1,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L2',
      type: '1φ',
    },
    {
      id: 3,
      circuitNumber: 3,
      description: 'Oświetlenie parter salon',
      socketSwitchCount: 2,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L3',
      type: '1φ',
    },
    {
      id: 4,
      circuitNumber: 4,
      description: 'Oświetlenie piętro sypialnia',
      socketSwitchCount: 1,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L1',
      type: '1φ',
    },
    {
      id: 5,
      circuitNumber: 5,
      description: 'Oświetlenie piętro korytarz',
      socketSwitchCount: 1,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L2',
      type: '1φ',
    },
    {
      id: 6,
      circuitNumber: 6,
      description: 'Gniazda parter salon',
      socketSwitchCount: 4,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L3',
      type: '1φ',
    },
    {
      id: 7,
      circuitNumber: 7,
      description: 'Klimatyzacja kuchnia',
      socketSwitchCount: 0,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L1',
      type: '1φ',
    },
    {
      id: 8,
      circuitNumber: 8,
      description: 'Gniazda parter kuchnia',
      socketSwitchCount: 6,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L2',
      type: '1φ',
    },
    {
      id: 9,
      circuitNumber: 9,
      description: 'Gniazda parter tv/skrętka/antena',
      socketSwitchCount: 3,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L3',
      type: '1φ',
    },
    {
      id: 10,
      circuitNumber: 10,
      description: 'Gniazda parter łazienka biuro',
      socketSwitchCount: 2,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L1',
      type: '1φ',
    },
    {
      id: 11,
      circuitNumber: 11,
      description: 'Gniazda parter łazienka grzejnik',
      socketSwitchCount: 1,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L2',
      type: '1φ',
    },
    {
      id: 12,
      circuitNumber: 12,
      description: 'Gniazda piętro łazienka',
      socketSwitchCount: 2,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 5x4',
      length: 20,
      power: 0.5,
      fuseType: '16A',
      phase: '3Φ',
      type: '3φ',
    },
    {
      id: 13,
      circuitNumber: 13,
      description: 'Oświetlenie parter korytarz, schody',
      socketSwitchCount: 3,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L3',
      type: '1φ',
    },
    {
      id: 14,
      circuitNumber: 14,
      description: 'Oświetlenie parter łazienka biuro',
      socketSwitchCount: 1,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L1',
      type: '1φ',
    },
    {
      id: 15,
      circuitNumber: 15,
      description: 'Oświetlenie piętro łazienka, salon',
      socketSwitchCount: 2,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L2',
      type: '1φ',
    },
    {
      id: 16,
      circuitNumber: 16,
      description: 'Oświetlenie piętro sypialnia, łazienka',
      socketSwitchCount: 2,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L3',
      type: '1φ',
    },
    {
      id: 17,
      circuitNumber: 17,
      description: 'Gniazda piętro sypialnia',
      socketSwitchCount: 4,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L1',
      type: '1φ',
    },
    {
      id: 18,
      circuitNumber: 18,
      description: 'Gniazda piętro salon',
      socketSwitchCount: 5,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L2',
      type: '1φ',
    },
    {
      id: 19,
      circuitNumber: 19,
      description: 'Gniazda piętro łazienka pralka',
      socketSwitchCount: 1,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L3',
      type: '1φ',
    },
    {
      id: 20,
      circuitNumber: 20,
      description: 'Gniazda piętro łazienka suszarka',
      socketSwitchCount: 1,
      zone: 'Piętro',
      voltage: 230,
      cable: 'YDYpżo 3x2,5',
      length: 15,
      power: 2,
      fuseType: '16A',
      phase: 'L1',
      type: '1φ',
    },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCircuit, setEditingCircuit] = useState<Circuit | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<'L1' | 'L2' | 'L3' | null>(null);
  const [highlightTotalPower, setHighlightTotalPower] = useState(false);
  const [highlightMaxPower, setHighlightMaxPower] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const [showMissingDescriptionPopup, setShowMissingDescriptionPopup] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof Circuit | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [activeFilter, setActiveFilter] = useState<keyof Circuit | null>(null);
  const [filters, setFilters] = useState<Partial<Record<keyof Circuit, any>>>({
    circuitNumber: null,
    description: '',
    socketSwitchCount: null,
    zone: '',
    voltage: null,
    cable: '',
    length: null,
    power: null,
    phase: '',
    type: '',
  });
  const [requiredComponents, setRequiredComponents] = useState<RequiredComponent[]>(
    SORTED_REQUIRED_COMPONENTS.map(comp => ({ ...comp, quantity: 0 }))
  );
  const [componentSearchQuery, setComponentSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Generate fuse type components from circuits
  useEffect(() => {
    // Count fuse types from circuits
    const fuseTypeCounts: Record<string, number> = {};
    circuits.forEach(circuit => {
      const fuseType = circuit.fuseType || '10A';
      // Count based on socketSwitchCount (each socket/switch needs a fuse)
      const count = circuit.socketSwitchCount || 1;
      fuseTypeCounts[fuseType] = (fuseTypeCounts[fuseType] || 0) + count;
    });

    // Map fuse types to component IDs (assuming B characteristic for most)
    const fuseTypeToComponentId: Record<string, string> = {
      '6A': 'mcb_b6',
      '10A': 'mcb_b10',
      '13A': 'mcb_b13',
      '16A': 'mcb_b16',
      '20A': 'mcb_b20',
      '25A': 'mcb_b25',
      '32A': 'mcb_b32',
      '40A': 'mcb_b40',
      '50A': 'mcb_b50',
      '63A': 'mcb_b63',
      '80A': 'mcb_b80',
      '100A': 'mcb_b100',
      '125A': 'mcb_b125',
    };

    // Update required components: keep manually added ones and add/update fuse components
    setRequiredComponents(prev => {
      // Filter out old fuse components (those with IDs starting with 'mcb_b' or names like 'B10A', 'B16A')
      const nonFuseComponents = prev.filter(comp => 
        !comp.id.startsWith('mcb_b') && 
        !comp.name.match(/^B\d+A$/)
      );

      // Create fuse components from circuits
      const fuseComponents: RequiredComponent[] = [];
      Object.entries(fuseTypeCounts).forEach(([fuseType, count]) => {
        const componentId = fuseTypeToComponentId[fuseType] || `mcb_b${fuseType.toLowerCase()}`;
        const componentName = `B${fuseType}`;
        
        // Check if component exists in REQUIRED_COMPONENTS
        const existingComponent = REQUIRED_COMPONENTS.find(c => c.id === componentId);
        
        if (existingComponent) {
          fuseComponents.push({
            id: componentId,
            name: componentName,
            fields: existingComponent.fields,
            quantity: count,
            description: existingComponent.description,
            price: existingComponent.price,
            image: existingComponent.image,
          });
        } else {
          // Create new component if not in REQUIRED_COMPONENTS
          const fusePrices: Record<string, number> = {
            '6A': 25, '10A': 28, '13A': 30, '16A': 32, '20A': 35, '25A': 38,
            '32A': 42, '40A': 48, '50A': 55, '63A': 65, '80A': 85, '100A': 120, '125A': 145
          };
          fuseComponents.push({
            id: componentId,
            name: componentName,
            fields: 1,
            quantity: count,
            description: `Wyłącznik nadprądowy modułowy MCB B${fuseType} ${fuseType} - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej`,
            price: fusePrices[fuseType] || 30,
            image: `/pictures/electricComponents/mcb_b${fuseType.toLowerCase()}.jpg`,
          });
        }
      });

      // Merge fuse components with non-fuse components
      const mergedComponents = [...nonFuseComponents];
      fuseComponents.forEach(fuseComp => {
        const existingIndex = mergedComponents.findIndex(c => c.id === fuseComp.id);
        if (existingIndex >= 0) {
          // Update existing fuse component quantity
          mergedComponents[existingIndex].quantity = fuseComp.quantity;
        } else {
          // Add new fuse component
          mergedComponents.push(fuseComp);
        }
      });

      // Ensure all REQUIRED_COMPONENTS are present (with quantity 0 if not used and not a fuse)
      SORTED_REQUIRED_COMPONENTS.forEach(template => {
        // Skip fuse components that are already handled above
        if (template.id.startsWith('mcb_b')) return;
        
        const exists = mergedComponents.find(c => c.id === template.id);
        if (!exists) {
          mergedComponents.push({ ...template, quantity: 0 });
        }
      });

      return mergedComponents;
    });
  }, [circuits]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setActiveFilter(null);
      }
    };

    if (activeFilter) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilter]);

  const handleEdit = (circuit: Circuit) => {
    // Save current editing if any
    if (editingCircuit && editingId !== null && editingId !== circuit.id) {
      setCircuits(circuits.map(c => c.id === editingId ? editingCircuit : c));
    }
    setEditingId(circuit.id);
    setEditingCircuit({ ...circuit });
  };

  const handleSave = () => {
    if (editingCircuit) {
      setCircuits(circuits.map(c => c.id === editingCircuit.id ? editingCircuit : c));
      setEditingId(null);
      setEditingCircuit(null);
    }
  };

  const handleAutoSave = () => {
    if (editingCircuit) {
      // Validate description before saving
      if (!editingCircuit.description || editingCircuit.description.trim() === '') {
        // Don't save if description is empty, but keep editing mode
        return;
      }
      setCircuits(circuits.map(c => c.id === editingCircuit.id ? editingCircuit : c));
      // Keep editing mode open for continuous editing
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingCircuit(null);
  };

  const handleAdd = () => {
    // Check if there's an editing circuit without description
    if (editingCircuit && editingId !== null) {
      if (!editingCircuit.description || editingCircuit.description.trim() === '') {
        setShowMissingDescriptionPopup(true);
        return;
      }
      // Save current editing before adding new
      setCircuits(circuits.map(c => c.id === editingId ? editingCircuit : c));
      setEditingId(null);
      setEditingCircuit(null);
    }
    
    // Add new circuit - it will be in edit mode, user must fill description before it can be saved
    const newCircuit: Circuit = {
      id: Math.max(...circuits.map(c => c.id), 0) + 1,
      circuitNumber: circuits.length + 1,
      description: '',
      socketSwitchCount: 0,
      zone: 'Parter',
      voltage: 230,
      cable: 'YDYpżo 3x1,5',
      length: 10,
      power: 0.5,
      fuseType: '10A',
      phase: 'L1',
      type: '1φ',
    };
    setCircuits([...circuits, newCircuit]);
    setEditingId(newCircuit.id);
    setEditingCircuit({ ...newCircuit });
  };

  const handleDelete = (id: number) => {
    setCircuits(circuits.filter(c => c.id !== id));
  };

  // Handle clicks outside the table to save and exit edit mode
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editingId !== null && tableRef.current && !tableRef.current.contains(event.target as Node)) {
        // Click outside table - save and exit edit mode
        if (editingCircuit) {
          setCircuits(circuits.map(c => c.id === editingId ? editingCircuit : c));
        }
        setEditingId(null);
        setEditingCircuit(null);
      }
    };

    if (editingId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editingId, editingCircuit, circuits]);

  const handleAddFromTemplate = (template: CircuitTemplate) => {
    const newCircuit: Circuit = {
      id: Math.max(...circuits.map(c => c.id), 0) + 1,
      circuitNumber: circuits.length + 1,
      description: template.description,
      socketSwitchCount: 0,
      zone: template.zone,
      voltage: template.voltage,
      cable: template.cable,
      length: 10, // Default length
      power: template.power,
      phase: template.phase,
      type: template.type,
      fuseType: template.type === '3φ' ? '16A' : '10A', // Default fuse type based on phase type
    };
    setCircuits([...circuits, newCircuit]);
  };

  const isTemplateUsed = (templateDescription: string): boolean => {
    return circuits.some(c => c.description === templateDescription);
  };

  const getCircuitUsingTemplate = (templateDescription: string): Circuit | undefined => {
    return circuits.find(c => c.description === templateDescription);
  };

  const handleTemplateClick = (template: CircuitTemplate) => {
    const isUsed = isTemplateUsed(template.description);
    if (isUsed) {
      // Remove the circuit that uses this template to make it available again
      const circuitToRemove = getCircuitUsingTemplate(template.description);
      if (circuitToRemove) {
        handleDelete(circuitToRemove.id);
      }
    } else {
      // Add new circuit from template
      handleAddFromTemplate(template);
    }
  };

  const getHighlightedRows = () => {
    // Highlight rows 7-12 (circuits 7-12)
    return circuits.filter(c => c.circuitNumber >= 7 && c.circuitNumber <= 12).map(c => c.id);
  };

  const highlightedIds = getHighlightedRows();

  // Filter circuits based on active filters
  const filteredCircuits = useMemo(() => {
    return circuits.filter(circuit => {
      // Filter by circuitNumber
      if (filters.circuitNumber !== null && circuit.circuitNumber !== filters.circuitNumber) {
        return false;
      }
      
      // Filter by description (case-insensitive partial match)
      if (filters.description && !circuit.description.toLowerCase().includes(filters.description.toLowerCase())) {
        return false;
      }
      
      // Filter by socketSwitchCount
      if (filters.socketSwitchCount !== null && circuit.socketSwitchCount !== filters.socketSwitchCount) {
        return false;
      }
      
      // Filter by zone (case-insensitive partial match)
      if (filters.zone && !circuit.zone.toLowerCase().includes(filters.zone.toLowerCase())) {
        return false;
      }
      
      // Filter by voltage
      if (filters.voltage !== null && circuit.voltage !== filters.voltage) {
        return false;
      }
      
      // Filter by cable (case-insensitive partial match)
      if (filters.cable && !circuit.cable.toLowerCase().includes(filters.cable.toLowerCase())) {
        return false;
      }
      
      // Filter by length
      if (filters.length !== null && circuit.length !== filters.length) {
        return false;
      }
      
      // Filter by power (exact match or range)
      if (filters.power !== null && circuit.power !== filters.power) {
        return false;
      }
      
      // Filter by phase (exact match)
      if (filters.phase && circuit.phase !== filters.phase) {
        return false;
      }
      
      // Filter by type (exact match)
      if (filters.type && circuit.type !== filters.type) {
        return false;
      }
      
      return true;
    });
  }, [circuits, filters]);

  // Sort circuits based on selected column
  const sortedCircuits = useMemo(() => {
    const circuitsToSort = filteredCircuits;
    if (!sortColumn) return circuitsToSort;
    
    const sorted = [...circuitsToSort].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr, 'pl');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [filteredCircuits, sortColumn, sortDirection]);

  const handleSort = (column: keyof Circuit, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleFilterClick = (column: keyof Circuit, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFilter(activeFilter === column ? null : column);
  };

  const handleFilterChange = (column: keyof Circuit, value: any) => {
    setFilters(prev => ({
      ...prev,
      [column]: value === '' ? null : value
    }));
  };

  const clearFilter = (column: keyof Circuit, e: React.MouseEvent) => {
    e.stopPropagation();
    setFilters(prev => ({
      ...prev,
      [column]: column === 'circuitNumber' || column === 'voltage' || column === 'power' || column === 'length' ? null : ''
    }));
    if (activeFilter === column) {
      setActiveFilter(null);
    }
  };

  const resetAllFiltersAndSorting = () => {
    setFilters({
      circuitNumber: null,
      description: '',
      zone: '',
      voltage: null,
    cable: '',
    length: null,
    power: null,
    phase: '',
    type: '',
  });
  setSortColumn(null);
    setSortDirection('asc');
    setActiveFilter(null);
  };

  const exportToCSV = () => {
    // Create CSV content - only table columns
    const csvRows: string[] = [];
    
    // Escape CSV value function
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Always quote if contains semicolon, comma, quote, or newline
      if (str.includes(';') || str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // Use semicolon as separator for better Excel compatibility (Polish locale)
    const separator = ';';
    
    // Add table header - exactly 11 columns matching the table
    const headerRow = [
      'Nr obwodu',
      'Opis obwodu',
      'Ilość gniazd/włączników',
      'Strefa',
      'Napięcie',
      'Przewód',
      'Długość [m]',
      'Moc [kW]',
      'Typ bezpiecznika',
      'Faza',
      'Typ'
    ].join(separator);
    csvRows.push(headerRow);
    
    // Add table data - exactly 11 columns, properly escaped
    sortedCircuits.forEach(circuit => {
      const row = [
        escapeCSV(circuit.circuitNumber),
        escapeCSV(circuit.description),
        escapeCSV(circuit.socketSwitchCount || 0),
        escapeCSV(circuit.zone),
        escapeCSV(circuit.voltage),
        escapeCSV(circuit.cable),
        escapeCSV(circuit.length || 0),
        escapeCSV(circuit.power),
        escapeCSV(circuit.fuseType || '10A'),
        escapeCSV(circuit.phase),
        escapeCSV(circuit.type)
      ].join(separator);
      csvRows.push(row);
    });
    
    // Create blob and download
    const csvContent = csvRows.join('\r\n'); // Use \r\n for Windows compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kalkulacja_obwodow_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          alert('Plik CSV jest pusty.');
          return;
        }
        
        // Detect separator
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : ',';
        
        // First line should be header - expect exactly 9 columns
        const expectedColumns = ['Nr obwodu', 'Opis obwodu', 'Ilość gniazd/włączników', 'Strefa', 'Napięcie', 'Przewód', 'Długość [m]', 'Moc [kW]', 'Typ bezpiecznika', 'Faza', 'Typ'];
        const headerColumns = firstLine.split(separator).map(col => col.trim());
        
        if (headerColumns.length !== 11) {
          alert(`Nieprawidłowy format pliku CSV. Oczekiwano 11 kolumn, znaleziono ${headerColumns.length}.`);
          return;
        }
        
        // Parse CSV data starting from second line
        const importedCircuits: Circuit[] = [];
        let idCounter = Math.max(...circuits.map(c => c.id), 0) + 1;
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue; // Skip empty lines
          
          // Parse CSV line (handle quoted values)
          const values: string[] = [];
          let currentValue = '';
          let inQuotes = false;
          
          // Try semicolon first (Polish locale), then comma
          const separator = line.includes(';') ? ';' : ',';
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if ((char === separator) && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());
          
          // Must have exactly 11 columns
          if (values.length === 11) {
            const circuit: Circuit = {
              id: idCounter++,
              circuitNumber: parseInt(values[0]) || importedCircuits.length + 1,
              description: values[1].replace(/^"|"$/g, '') || '',
              socketSwitchCount: parseInt(values[2]) || 0,
              zone: (values[3] as 'Parter' | 'Piętro') || 'Parter',
              voltage: parseFloat(values[4]) || 230,
              cable: values[5].replace(/^"|"$/g, '') || 'YDYpżo 3x1,5',
              length: parseFloat(values[6]) || 10,
              power: parseFloat(values[7]) || 0.5,
              fuseType: values[8].replace(/^"|"$/g, '') || '10A',
              phase: (values[9] as 'L1' | 'L2' | 'L3' | '3Φ') || 'L1',
              type: (values[10] as '1φ' | '3φ') || '1φ',
            };
            
            // Only add if description is not empty
            if (circuit.description.trim()) {
              importedCircuits.push(circuit);
            }
          } else if (values.length > 0) {
            // Skip rows with wrong number of columns
            console.warn(`Pominięto wiersz ${i + 1}: nieprawidłowa liczba kolumn (${values.length} zamiast 11)`);
          }
        }
        
        if (importedCircuits.length > 0) {
          setCircuits([...circuits, ...importedCircuits]);
          alert(`Zaimportowano ${importedCircuits.length} obwodów.`);
        } else {
          alert('Nie znaleziono żadnych obwodów do zaimportowania.');
        }
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  };

  const getUniqueValues = (column: keyof Circuit): any[] => {
    const values = new Set(circuits.map(c => c[column]));
    return Array.from(values).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
      }
      return String(a).localeCompare(String(b), 'pl');
    });
  };

  const hasActiveFilter = (column: keyof Circuit): boolean => {
    const filterValue = filters[column];
    if (filterValue === null || filterValue === undefined || filterValue === '') {
      return false;
    }
    return true;
  };

  // Calculate summary values
  const summary = useMemo(() => {
    // Sum power values directly from Moc column based on Faza column
    // Power values are already in kW, so no conversion needed
    
    let sumL1 = 0;
    let sumL2 = 0;
    let sumL3 = 0;
    let sum3Phase = 0;
    
    circuits.forEach(circuit => {
      // Power is already in kW
      if (circuit.phase === 'L1') {
        sumL1 += circuit.power;
      } else if (circuit.phase === 'L2') {
        sumL2 += circuit.power;
      } else if (circuit.phase === 'L3') {
        sumL3 += circuit.power;
      } else if (circuit.phase === '3Φ') {
        // For 3-phase circuits, add to separate sum (not distributed to L1/L2/L3)
        sum3Phase += circuit.power;
      }
    });
    
    // Total power is sum of all power values from Moc column (in kW)
    const totalPower = circuits.reduce((sum, circuit) => sum + circuit.power, 0);
    
    // Maximum phase power - maximum value from Moc column (in kW)
    const maxPhasePower = circuits.length > 0 ? Math.max(...circuits.map(c => c.power)) : 0;
    
    // Calculate phase current: I = P / U (assuming cos φ = 1)
    // Convert kW to W for current calculation: P in W = P in kW * 1000
    const voltage = 230; // Standard voltage
    const iReq = (maxPhasePower * 1000) / voltage;
    
    // Power with simultaneity factor 0.6 (in kW)
    const calculatedPower = totalPower * 0.6;
    
    // Count phase types based on Faza column
    const count1Phase = circuits.filter(c => c.phase === 'L1' || c.phase === 'L2' || c.phase === 'L3').length;
    const count3Phase = circuits.filter(c => c.phase === '3Φ').length;
    
    // Calculate recommended protection (simplified lookup)
    // Based on calculated power: I = P / U for single phase
    // Convert kW to W: P in W = P in kW * 1000
    const recommendedProtection = Math.ceil((calculatedPower * 1000) / voltage);
    
    // Suggested protection lookup (standard values: 6, 10, 16, 20, 25, 32, 40, 50, 63)
    const standardProtections = [6, 10, 16, 20, 25, 32, 40, 50, 63];
    const suggestedProtection = standardProtections.find(p => p >= recommendedProtection) || 63;
    
    // Suggested cable size based on protection (simplified)
    const getCableSize = (protection: number): number => {
      if (protection <= 10) return 1.5;
      if (protection <= 16) return 2.5;
      if (protection <= 25) return 4;
      if (protection <= 32) return 6;
      if (protection <= 40) return 10;
      return 16;
    };
    
    const suggestedCable = getCableSize(suggestedProtection);
    
    // Pre-meter protection (typically 32A or higher)
    const preMeterProtection = Math.max(32, suggestedProtection);
    
    return {
      sumL1,
      sumL2,
      sumL3,
      totalPower,
      maxPhasePower,
      iReq,
      calculatedPower,
      count1Phase,
      count3Phase,
      recommendedProtection,
      suggestedProtection,
      suggestedCable,
      preMeterProtection,
    };
  }, [circuits]);

  return (
    <div className="min-h-screen bg-gray-50">
      <GlobalPopup
        isOpen={showMissingDescriptionPopup}
        onClose={() => setShowMissingDescriptionPopup(false)}
        title="Brak opisu obwodu"
      >
        <p className="text-gray-700">Zapomniałeś dodać tytuł obwodu. Proszę uzupełnić pole &quot;Opis obwodu&quot; przed dodaniem wiersza.</p>
      </GlobalPopup>
      <div className="flex">
        {/* Left Sidebar - Templates */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4 sticky top-0 overflow-y-auto max-h-screen">
          <h2 className="text-lg font-bold text-gray-900 mb-4 sticky top-0 bg-white pb-2">Szablony obwodów</h2>
          <div className="space-y-1">
            {[...CIRCUIT_TEMPLATES].sort((a, b) => a.description.localeCompare(b.description, 'pl')).map((template, index) => {
              const isUsed = isTemplateUsed(template.description);
              return (
                <button
                  key={index}
                  onClick={() => handleTemplateClick(template)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isUsed
                      ? 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-600 cursor-pointer line-through'
                      : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
                  }`}
                  title={isUsed ? 'Kliknij aby usunąć obwód i przywrócić szablon' : 'Kliknij aby dodać'}
                >
                  {template.description}
                </button>
              );
            })}
          </div>
        </div>

        {/* Middle Content - Table (50% width) */}
        <div className="w-2/3 px-4 py-4 border-r border-gray-200 relative">
          {/* Header - Sticky */}
          <div className="sticky top-0 bg-gray-50 z-40 pb-1 pt-2 border-b border-gray-200">
            <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center mb-1 text-sm">
              <span className="text-lg mr-1">←</span>
              <span>Powrót</span>
            </Link>
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold text-gray-900">Kalkulacja Obwodów</h1>
              <div className="flex gap-2">
                <button
                  onClick={resetAllFiltersAndSorting}
                  className="px-4 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium text-sm"
                  title="Resetuj wszystkie filtry i sortowanie"
                >
                  Reset filters
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
                  title="Eksportuj do CSV"
                >
                  Export to CSV
                </button>
                <button
                  onClick={handleImportCSV}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm"
                  title="Importuj z CSV"
                >
                  Import from CSV
                </button>
                <button
                  onClick={handleAdd}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm"
                >
                  + Dodaj
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative" 
                    style={{ width: '20px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('circuitNumber')}
                      >
                        Nr obwodu
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'circuitNumber' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('circuitNumber', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('circuitNumber') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'circuitNumber' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Nr obwodu</span>
                          <button onClick={(e) => clearFilter('circuitNumber', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <input
                          type="number"
                          value={filters.circuitNumber || ''}
                          onChange={(e) => handleFilterChange('circuitNumber', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Wpisz numer..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('description')}
                      >
                        Opis obwodu
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'description' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('description', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('description') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'description' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Opis</span>
                          <button onClick={(e) => clearFilter('description', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <input
                          type="text"
                          value={filters.description}
                          onChange={(e) => handleFilterChange('description', e.target.value)}
                          placeholder="Wpisz tekst..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                    style={{ width: '120px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('socketSwitchCount')}
                      >
                        Ilość gniazd/włączników
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'socketSwitchCount' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('socketSwitchCount', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('socketSwitchCount') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'socketSwitchCount' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Ilość</span>
                          <button onClick={(e) => clearFilter('socketSwitchCount', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <input
                          type="number"
                          value={filters.socketSwitchCount || ''}
                          onChange={(e) => handleFilterChange('socketSwitchCount', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Wpisz liczbę..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative" 
                    style={{ width: '50px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('zone')}
                      >
                        Strefa
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'zone' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('zone', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('zone') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'zone' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Strefa</span>
                          <button onClick={(e) => clearFilter('zone', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <select
                          value={filters.zone}
                          onChange={(e) => handleFilterChange('zone', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Wszystkie</option>
                          {getUniqueValues('zone').map((val) => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative" 
                    style={{ width: '50px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('voltage')}
                      >
                        Napięcie
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'voltage' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('voltage', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('voltage') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'voltage' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Napięcie</span>
                          <button onClick={(e) => clearFilter('voltage', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <select
                          value={filters.voltage || ''}
                          onChange={(e) => handleFilterChange('voltage', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Wszystkie</option>
                          {getUniqueValues('voltage').map((val) => (
                            <option key={val} value={val}>{val}V</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative"
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('cable')}
                      >
                        Przewód
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'cable' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('cable', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('cable') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'cable' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Przewód</span>
                          <button onClick={(e) => clearFilter('cable', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <select
                          value={filters.cable || ''}
                          onChange={(e) => handleFilterChange('cable', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Wszystkie</option>
                          {getUniqueValues('cable').map((val) => (
                            <option key={val} value={val}>{val}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative" 
                    style={{ width: '70px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('length')}
                      >
                        Długość [m]
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'length' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('length', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('length') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'length' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Długość</span>
                          <button onClick={(e) => clearFilter('length', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <input
                          type="number"
                          value={filters.length || ''}
                          onChange={(e) => handleFilterChange('length', e.target.value ? parseFloat(e.target.value) : null)}
                          placeholder="Wpisz długość..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative" 
                    style={{ width: '50px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('power')}
                      >
                        Moc [W]
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'power' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('power', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('power') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'power' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Moc</span>
                          <button onClick={(e) => clearFilter('power', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <select
                          value={filters.power !== null && filters.power !== undefined ? filters.power : ''}
                          onChange={(e) => handleFilterChange('power', e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Wszystkie</option>
                          {getUniqueValues('power').map((val) => (
                            <option key={val} value={val}>{val} kW</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative" 
                    style={{ width: '80px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex-1">Typ bezpiecznika</span>
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 select-none relative" 
                    style={{ width: '50px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('phase')}
                      >
                        Faza
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'phase' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('phase', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('phase') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'phase' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Faza</span>
                          <button onClick={(e) => clearFilter('phase', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <select
                          value={filters.phase}
                          onChange={(e) => handleFilterChange('phase', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Wszystkie</option>
                          <option value="L1">L1</option>
                          <option value="L2">L2</option>
                          <option value="L3">L3</option>
                          <option value="3Φ">3Φ</option>
                        </select>
                      </div>
                    )}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider select-none relative" 
                    style={{ width: '50px' }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="cursor-pointer hover:bg-gray-100 px-1 py-1 rounded flex-1"
                        onClick={() => handleSort('type')}
                      >
                        Typ
                      </span>
                      <div className="flex items-center gap-1">
                        {sortColumn === 'type' && (
                          <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                        <button
                          onClick={(e) => handleFilterClick('type', e)}
                          className={`p-1 rounded hover:bg-gray-200 ${hasActiveFilter('type') ? 'text-blue-600' : 'text-gray-400'}`}
                          title="Filtruj"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {activeFilter === 'type' && (
                      <div ref={filterRef} className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-3 min-w-[200px]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold">Filtruj: Typ</span>
                          <button onClick={(e) => clearFilter('type', e)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                        </div>
                        <select
                          value={filters.type}
                          onChange={(e) => handleFilterChange('type', e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Wszystkie</option>
                          <option value="1φ">1φ</option>
                          <option value="3φ">3φ</option>
                        </select>
                      </div>
                    )}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedCircuits.map((circuit) => {
                  const isHighlighted = highlightedIds.includes(circuit.id);
                  const isEditing = editingId === circuit.id;
                  const isPhaseSelected = selectedPhase !== null;
                  const matchesSelectedPhase = selectedPhase === circuit.phase;
                  const shouldHighlight = isPhaseSelected && matchesSelectedPhase;
                  const shouldGrayOut = isPhaseSelected && !matchesSelectedPhase;
                  
                  // Check if this circuit should be highlighted for total power (all L1, L2, L3)
                  const shouldHighlightTotalPower = highlightTotalPower && (circuit.phase === 'L1' || circuit.phase === 'L2' || circuit.phase === 'L3');
                  
                  // Check if this circuit has maximum power value
                  const maxPower = circuits.length > 0 ? Math.max(...circuits.map(c => c.power)) : 0;
                  const shouldHighlightMaxPower = highlightMaxPower && circuit.power === maxPower;

                  return (
                    <tr
                      key={circuit.id}
                      onDoubleClick={() => {
                        if (!isEditing) {
                          handleEdit(circuit);
                        }
                      }}
                      onClick={(e) => {
                        // Single click on another row - validate and save current editing, then start editing new row
                        if (editingId !== null && editingId !== circuit.id && !isEditing) {
                          if (editingCircuit) {
                            // Validate description before saving
                            if (!editingCircuit.description || editingCircuit.description.trim() === '') {
                              setShowMissingDescriptionPopup(true);
                              return;
                            }
                            setCircuits(circuits.map(c => c.id === editingId ? editingCircuit : c));
                          }
                          handleEdit(circuit);
                        }
                      }}
                      className={`bg-white ${isEditing ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200" style={{ width: '20px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingCircuit?.circuitNumber || circuit.circuitNumber}
                            onChange={(e) => {
                              const updated = editingCircuit ? { ...editingCircuit, circuitNumber: parseInt(e.target.value) || 0 } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="w-16 px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          circuit.circuitNumber
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">
                        {isEditing ? (
                          <div className="relative">
                            <input
                              type="text"
                              list={`circuit-templates-${circuit.id}`}
                              value={editingCircuit?.description || circuit.description}
                              onChange={(e) => {
                                const newDescription = e.target.value;
                                // Check if the entered value matches a template
                                const matchingTemplate = CIRCUIT_TEMPLATES.find(t => t.description === newDescription);
                                let updated: Circuit | null = null;
                                if (matchingTemplate && editingCircuit) {
                                  // Auto-fill all fields from template
                                  updated = {
                                    ...editingCircuit,
                                    description: matchingTemplate.description,
                                    zone: matchingTemplate.zone,
                                    voltage: matchingTemplate.voltage,
                                    cable: matchingTemplate.cable,
                                    power: matchingTemplate.power,
                                    phase: matchingTemplate.phase,
                                    type: matchingTemplate.type,
                                  };
                                } else {
                                  // Just update description for custom text
                                  updated = editingCircuit ? { ...editingCircuit, description: newDescription } : null;
                                }
                                setEditingCircuit(updated);
                                if (updated) {
                                  setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                                }
                              }}
                              onInput={(e) => {
                                // Handle selection from datalist
                                const target = e.target as HTMLInputElement;
                                const newDescription = target.value;
                                const matchingTemplate = CIRCUIT_TEMPLATES.find(t => t.description === newDescription);
                                if (matchingTemplate && editingCircuit) {
                                  const updated = {
                                    ...editingCircuit,
                                    description: matchingTemplate.description,
                                    zone: matchingTemplate.zone,
                                    voltage: matchingTemplate.voltage,
                                    cable: matchingTemplate.cable,
                                    power: matchingTemplate.power,
                                    phase: matchingTemplate.phase,
                                    type: matchingTemplate.type,
                                  };
                                  setEditingCircuit(updated);
                                  setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                                }
                              }}
                              className="w-full px-2 py-1 border border-gray-300 rounded"
                              placeholder="Wybierz szablon lub wpisz własny"
                            />
                            <datalist id={`circuit-templates-${circuit.id}`}>
                              {CIRCUIT_TEMPLATES.map((template, idx) => (
                                <option key={idx} value={template.description} />
                              ))}
                            </datalist>
                          </div>
                        ) : (
                          circuit.description
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200" style={{ width: '120px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editingCircuit?.socketSwitchCount ?? circuit.socketSwitchCount ?? 0}
                            onChange={(e) => {
                              const updated = editingCircuit ? { ...editingCircuit, socketSwitchCount: parseInt(e.target.value) || 0 } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          circuit.socketSwitchCount ?? 0
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200" style={{ width: '50px' }}>
                        {isEditing ? (
                          <select
                            value={editingCircuit?.zone || circuit.zone}
                            onChange={(e) => {
                              const updated = editingCircuit ? { ...editingCircuit, zone: e.target.value as 'Parter' | 'Piętro' } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="Parter">Parter</option>
                            <option value="Piętro">Piętro</option>
                          </select>
                        ) : (
                          circuit.zone
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200" style={{ width: '50px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editingCircuit?.voltage || circuit.voltage}
                            onChange={(e) => {
                              const updated = editingCircuit ? { ...editingCircuit, voltage: parseInt(e.target.value) || 0 } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          circuit.voltage
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                        {isEditing ? (
                          <select
                            value={editingCircuit?.cable || circuit.cable}
                            onChange={(e) => {
                              const updated = editingCircuit ? { ...editingCircuit, cable: e.target.value } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="YDYpżo 3x1,5">YDYpżo 3x1,5</option>
                            <option value="YDYpżo 3x2,5">YDYpżo 3x2,5</option>
                            <option value="YDYpżo 5x4">YDYpżo 5x4</option>
                          </select>
                        ) : (
                          circuit.cable
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200" style={{ width: '70px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="1"
                            value={editingCircuit?.length || circuit.length || 0}
                            onChange={(e) => {
                              const updated = editingCircuit ? { ...editingCircuit, length: parseFloat(e.target.value) || 0 } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          circuit.length || 0
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200" style={{ width: '50px' }}>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingCircuit?.power || circuit.power}
                            onChange={(e) => {
                              const updated = editingCircuit ? { ...editingCircuit, power: parseFloat(e.target.value) || 0 } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="w-20 px-2 py-1 border border-gray-300 rounded"
                          />
                        ) : (
                          circuit.power
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200" style={{ width: '80px' }}>
                        {isEditing ? (
                          <select
                            value={editingCircuit?.fuseType || circuit.fuseType || '10A'}
                            onChange={(e) => {
                              const updated = editingCircuit ? { ...editingCircuit, fuseType: e.target.value } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-xs w-full"
                          >
                            {((editingCircuit?.phase || circuit.phase) === '3Φ' ? FUSE_TYPES_3PHASE : FUSE_TYPES_1PHASE).map((fuseType) => (
                              <option key={fuseType} value={fuseType}>{fuseType}</option>
                            ))}
                          </select>
                        ) : (
                          circuit.fuseType || '10A'
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200" style={{ width: '50px' }}>
                        {isEditing ? (
                          <select
                            value={editingCircuit?.phase || circuit.phase}
                            onChange={(e) => {
                              const newPhase = e.target.value as 'L1' | 'L2' | 'L3' | '3Φ';
                              const newType: '1φ' | '3φ' = newPhase === '3Φ' ? '3φ' : '1φ';
                              // Reset fuse type if switching between 1-phase and 3-phase
                              const currentFuseType = editingCircuit?.fuseType || circuit.fuseType || '10A';
                              const availableFuses = newPhase === '3Φ' ? FUSE_TYPES_3PHASE : FUSE_TYPES_1PHASE;
                              const newFuseType = availableFuses.includes(currentFuseType) ? currentFuseType : (newPhase === '3Φ' ? '16A' : '10A');
                              
                              const updated = editingCircuit ? {
                                ...editingCircuit,
                                phase: newPhase,
                                type: newType,
                                fuseType: newFuseType,
                              } : null;
                              setEditingCircuit(updated);
                              if (updated) {
                                setCircuits(circuits.map(c => c.id === updated.id ? updated : c));
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="L1">L1</option>
                            <option value="L2">L2</option>
                            <option value="L3">L3</option>
                            <option value="3Φ">3Φ</option>
                          </select>
                        ) : (
                          circuit.phase
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900" style={{ width: '50px' }}>
                        {circuit.type}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex space-x-2 items-center">
                            <button
                              onClick={() => {
                                // If description is empty, remove the row instead of canceling
                                if (editingCircuit && (!editingCircuit.description || editingCircuit.description.trim() === '')) {
                                  handleDelete(circuit.id);
                                } else {
                                  handleCancel();
                                }
                              }}
                              className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-100 transition-colors"
                              title="Anuluj"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2 items-center">
                            <button
                              onClick={() => handleEdit(circuit)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Edytuj"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(circuit.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Usuń"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={10} className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                      onClick={handleAdd}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center space-x-2"
                    >
                      <span>+</span>
                      <span>Dodaj obwód</span>
                    </button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        </div>

        {/* Right Sidebar - Summary */}
        <div className="w-1/4 bg-white p-4 overflow-y-auto max-h-screen sticky top-0">
          {/* Wymagane Komponenty */}
          <div className="mb-6">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-200 mb-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchComponent
                    value={componentSearchQuery}
                    onChange={setComponentSearchQuery}
                    placeholder="Szukaj po nazwie lub opisie..."
                  />
                </div>
                <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">Wymagane Komponenty</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {requiredComponents
                .filter((component) => {
                  if (!componentSearchQuery.trim()) return true;
                  const query = componentSearchQuery.toLowerCase();
                  const componentTemplate = REQUIRED_COMPONENTS.find(c => c.id === component.id);
                  const nameMatch = component.name.toLowerCase().includes(query);
                  const descriptionMatch = componentTemplate?.description?.toLowerCase().includes(query) || false;
                  return nameMatch || descriptionMatch;
                })
                .map((component) => {
                  const componentTemplate = REQUIRED_COMPONENTS.find(c => c.id === component.id);
                  return (
                    <ComponentItem
                      key={component.id}
                      component={component}
                      componentTemplate={componentTemplate}
                      onQuantityChange={(id, quantity) => {
                        setRequiredComponents(prev =>
                          prev.map(comp =>
                            comp.id === id ? { ...comp, quantity } : comp
                          )
                        );
                      }}
                    />
                  );
                })}
            </div>
            {/* Total components cost */}
            {(() => {
              const totalComponentsCost = requiredComponents.reduce((sum, comp) => {
                const componentTemplate = REQUIRED_COMPONENTS.find(c => c.id === comp.id);
                const price = componentTemplate?.price || 0;
                return sum + (price * comp.quantity);
              }, 0);
              
              if (totalComponentsCost > 0) {
                return (
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">Suma komponentów:</span>
                      <span className="text-lg font-bold text-green-600">{totalComponentsCost.toFixed(2)} zł</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Ceny przybliżone (netto)</div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="bg-orange-50 px-4 py-3 border-b border-orange-200 mb-4 rounded-t-lg">
            <h2 className="text-lg font-bold text-gray-900">Podsumowanie i Obliczenia</h2>
          </div>
          
          <div className="space-y-4">
            {/* Podsumowanie fazowe */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Podsumowanie fazowe</h3>
              
              <div 
                className={`flex justify-between items-center py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs ${
                  selectedPhase === 'L1' ? 'bg-blue-100 rounded px-2' : 'hover:bg-gray-50 rounded px-2'
                }`}
                onClick={() => {
                  setSelectedPhase(selectedPhase === 'L1' ? null : 'L1');
                  setHighlightTotalPower(false);
                  setHighlightMaxPower(false);
                }}
              >
                <span className={`font-medium ${selectedPhase === 'L1' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Suma L1 [kW]:
                </span>
                <span className={`font-bold ${selectedPhase === 'L1' ? 'text-blue-900' : 'text-gray-900'}`}>
                  {summary.sumL1.toFixed(1)}
                </span>
              </div>
              
              <div 
                className={`flex justify-between items-center py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs ${
                  selectedPhase === 'L2' ? 'bg-blue-100 rounded px-2' : 'hover:bg-gray-50 rounded px-2'
                }`}
                onClick={() => {
                  setSelectedPhase(selectedPhase === 'L2' ? null : 'L2');
                  setHighlightTotalPower(false);
                  setHighlightMaxPower(false);
                }}
              >
                <span className={`font-medium ${selectedPhase === 'L2' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Suma L2 [kW]:
                </span>
                <span className={`font-bold ${selectedPhase === 'L2' ? 'text-blue-900' : 'text-gray-900'}`}>
                  {summary.sumL2.toFixed(1)}
                </span>
              </div>
              
              <div 
                className={`flex justify-between items-center py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs ${
                  selectedPhase === 'L3' ? 'bg-blue-100 rounded px-2' : 'hover:bg-gray-50 rounded px-2'
                }`}
                onClick={() => {
                  setSelectedPhase(selectedPhase === 'L3' ? null : 'L3');
                  setHighlightTotalPower(false);
                  setHighlightMaxPower(false);
                }}
              >
                <span className={`font-medium ${selectedPhase === 'L3' ? 'text-blue-700' : 'text-gray-700'}`}>
                  Suma L3 [kW]:
                </span>
                <span className={`font-bold ${selectedPhase === 'L3' ? 'text-blue-900' : 'text-gray-900'}`}>
                  {summary.sumL3.toFixed(1)}
                </span>
              </div>
              
              <div 
                className={`flex justify-between items-center py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs ${
                  highlightTotalPower ? 'bg-green-100 rounded px-2' : 'hover:bg-gray-50 rounded px-2'
                }`}
                onClick={() => {
                  setHighlightTotalPower(!highlightTotalPower);
                  setHighlightMaxPower(false);
                  setSelectedPhase(null);
                }}
              >
                <span className={`font-medium ${highlightTotalPower ? 'text-green-700' : 'text-gray-700'}`}>
                  Moc całkowita [kW]:
                </span>
                <span className={`font-bold ${highlightTotalPower ? 'text-green-900' : 'text-gray-900'}`}>
                  {summary.totalPower.toFixed(1)}
                </span>
              </div>
              
              <div 
                className={`flex justify-between items-center py-1.5 border-b border-gray-200 cursor-pointer transition-colors text-xs ${
                  highlightMaxPower ? 'bg-yellow-100 rounded px-2' : 'hover:bg-gray-50 rounded px-2'
                }`}
                onClick={() => {
                  setHighlightMaxPower(!highlightMaxPower);
                  setHighlightTotalPower(false);
                  setSelectedPhase(null);
                }}
              >
                <span className={`font-medium ${highlightMaxPower ? 'text-yellow-700' : 'text-gray-700'}`}>
                  Maksymalna faza [kW]:
                </span>
                <span className={`font-bold ${highlightMaxPower ? 'text-yellow-900' : 'text-gray-900'}`}>
                  {summary.maxPhasePower.toFixed(1)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                <span className="font-medium text-gray-700">I_req (prąd fazowy) [A]:</span>
                <span className="font-bold text-gray-900">{summary.iReq.toFixed(9)}</span>
              </div>
            </div>

            {/* Obliczenia i Zabezpieczenia */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Obliczenia i Zabezpieczenia</h3>
              
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                <span className="font-medium text-gray-700">Moc przy psp 0.6 [kW]:</span>
                <span className="font-bold text-gray-900">{summary.calculatedPower.toFixed(1)}</span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                <span className="font-medium text-gray-700">Zabezpieczenie Przedlicznikowe:</span>
                <span className="font-bold text-gray-900">{summary.preMeterProtection} A</span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                <span className="font-medium text-gray-700">Zalecane zabezpieczenie [A]:</span>
                <span className="font-bold text-gray-900">{summary.recommendedProtection}</span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                <span className="font-medium text-gray-700">Sugerowane zabezpieczenie [A]:</span>
                <span className="font-bold text-gray-900">{summary.suggestedProtection}</span>
              </div>
              
              <div className="flex justify-between items-center py-1.5 border-b border-gray-200 text-xs">
                <span className="font-medium text-gray-700">Sugerowany kabel [mm²]:</span>
                <span className="font-bold text-gray-900">{summary.suggestedCable}</span>
              </div>
            </div>

            {/* Sumy Faz */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Sumy Faz</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded-lg text-xs">
                  <span className="font-medium text-gray-700">Suma 1 faz:</span>
                  <span className="font-bold text-gray-900">{summary.count1Phase}</span>
                </div>
                
                <div className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded-lg text-xs">
                  <span className="font-medium text-gray-700">Suma 3 faz:</span>
                  <span className="font-bold text-gray-900">{summary.count3Phase}</span>
                </div>
              </div>
            </div>

            {/* Suma Długości Przewodów */}
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Suma Długości Przewodów</h3>
              <div className="space-y-2">
                {(() => {
                  // Calculate total length for each cable type
                  const cableLengths: Record<string, number> = {};
                  circuits.forEach(circuit => {
                    const cable = circuit.cable;
                    const length = circuit.length || 0;
                    cableLengths[cable] = (cableLengths[cable] || 0) + length;
                  });
                  
                  return Object.entries(cableLengths).map(([cable, totalLength]) => (
                    <div key={cable} className="flex justify-between items-center py-1.5 px-3 bg-gray-50 rounded-lg text-xs">
                      <span className="font-medium text-gray-700">{cable}:</span>
                      <span className="font-bold text-gray-900">{totalLength.toFixed(1)} m</span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Generuj Ofertę Button */}
            <div className="pt-6 border-t border-gray-200 mt-6">
              {submitError && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
                  {submitError}
                </div>
              )}
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  setSubmitError(null);

                  try {
                    // Try to get offerId from URL or localStorage
                    const STORAGE_KEY = 'volt_offer_draft';
                    const offerId = offerIdFromUrl || (() => {
                      try {
                        const savedData = localStorage.getItem(STORAGE_KEY);
                        if (savedData) {
                          const parsed = JSON.parse(savedData);
                          return parsed.offerId;
                        }
                      } catch (e) {
                        // Ignore errors
                      }
                      return null;
                    })();

                    let clientData: any = null;
                    let propertyData: any = null;
                    let additionalItemsOnly = false;
                    let roomsData: any[] = [];

                    // If offerId exists, load data from server
                    if (offerId) {
                      try {
                        const offerResponse = await api.offers.getById(offerId);
                        if (offerResponse.success && offerResponse.data) {
                          const offer = offerResponse.data;
                          clientData = offer.clientData;
                          propertyData = offer.property;
                          additionalItemsOnly = offer.additionalItemsOnly || false;
                          roomsData = offer.rooms || [];
                        }
                      } catch (error) {
                        console.error('Error loading offer:', error);
                        // Fall back to localStorage if server load fails
                      }
                    }

                    // Fall back to localStorage if no offerId or server load failed
                    if (!clientData) {
                      const savedData = localStorage.getItem(STORAGE_KEY);
                      
                      if (!savedData) {
                        setSubmitError('Brak danych klienta. Wypełnij najpierw formularz oferty.');
                        setIsSubmitting(false);
                        return;
                      }

                      const parsed = JSON.parse(savedData);
                      clientData = {
                        investmentName: parsed.investmentName,
                        email: parsed.email,
                        phone: parsed.phone,
                      };
                      propertyData = {
                        info: parsed.propertyInfo,
                        area: parsed.area,
                      };
                      additionalItemsOnly = parsed.additionalItemsOnly || false;
                      roomsData = parsed.rooms || [];
                    }
                    
                    // Validate required fields
                    if (!clientData?.email?.trim() || !clientData?.investmentName?.trim()) {
                      setSubmitError('Wypełnij dane klienta (nazwa inwestycji i email).');
                      setIsSubmitting(false);
                      return;
                    }

                    if (!propertyData?.area || (typeof propertyData.area === 'string' && !propertyData.area.trim())) {
                      setSubmitError('Wypełnij informacje o nieruchomości (powierzchnia).');
                      setIsSubmitting(false);
                      return;
                    }

                    // Prepare circuits data from calculation page
                    const circuitsData = circuits.map(circuit => ({
                      circuitNumber: circuit.circuitNumber,
                      description: circuit.description,
                      socketSwitchCount: circuit.socketSwitchCount || 0,
                      zone: circuit.zone,
                      voltage: circuit.voltage,
                      cable: circuit.cable,
                      length: circuit.length || 0,
                      power: circuit.power,
                      fuseType: circuit.fuseType,
                      phase: circuit.phase,
                      type: circuit.type,
                    }));

                    // Prepare required components data
                    const componentsData = requiredComponents
                      .filter(comp => comp.quantity > 0)
                      .map(comp => {
                        const componentTemplate = REQUIRED_COMPONENTS.find(c => c.id === comp.id);
                        return {
                          id: comp.id,
                          name: comp.name,
                          fields: comp.fields,
                          quantity: comp.quantity,
                          price: componentTemplate?.price || 0,
                        };
                      });

                    // Prepare offer data
                    const offerData = {
                      additionalItemsOnly: additionalItemsOnly,
                      clientData: {
                        investmentName: clientData.investmentName.trim(),
                        email: clientData.email.trim(),
                        phone: clientData.phone?.trim() || '',
                      },
                      property: {
                        info: propertyData.info?.trim() || '',
                        area: typeof propertyData.area === 'string' ? parseFloat(propertyData.area) : (propertyData.area || 0),
                      },
                      rooms: roomsData,
                      circuits: circuitsData,
                      requiredComponents: componentsData,
                    };

                    // If offerId exists, update the offer; otherwise create a new one
                    const response = offerId 
                      ? await api.offers.update(offerId, offerData)
                      : await api.offers.create(offerData);
                    
                    if (response.success) {
                      const finalOfferId = offerId || response.data.id;
                      
                      // Update localStorage with offerId for future reference
                      try {
                        const currentData = localStorage.getItem(STORAGE_KEY);
                        const parsed = currentData ? JSON.parse(currentData) : {};
                        parsed.offerId = finalOfferId;
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
                      } catch (e) {
                        // Ignore localStorage errors
                      }
                      
                      // Redirect to summary page
                      router.push(`/offer/summary?id=${finalOfferId}`);
                    } else {
                      setSubmitError(response.error || 'Błąd podczas zapisywania oferty');
                      setIsSubmitting(false);
                    }
                  } catch (error) {
                    console.error('Error submitting offer:', error);
                    setSubmitError(error instanceof Error ? error.message : 'Błąd podczas zapisywania oferty');
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold text-lg flex items-center justify-center transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Zapisywanie...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Generuj Ofertę
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
