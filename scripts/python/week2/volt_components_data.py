#!/usr/bin/env python3
"""
Volt Components Data Management
Skrypt do zarządzania danymi komponentów elektrycznych w bazie PostgreSQL
"""

import os
import json
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv

# Załadowanie zmiennych środowiskowych
load_dotenv()

# Konfiguracja bazy danych
DB_CONFIG = {
    'host': os.getenv('POSTGRES_HOST'),
    'port': os.getenv('POSTGRES_PORT', '5432'),
    'database': os.getenv('POSTGRES_DB'),
    'user': os.getenv('POSTGRES_USER'),
    'password': os.getenv('POSTGRES_PASSWORD')
}

# Dane typów bezpieczników
FUSE_TYPES_DATA = [
    # 1-fazowe bezpieczniki
    {'fuse_type': '6A', 'phase_type': '1φ'},
    {'fuse_type': '10A', 'phase_type': '1φ'},
    {'fuse_type': '13A', 'phase_type': '1φ'},
    {'fuse_type': '16A', 'phase_type': '1φ'},
    {'fuse_type': '20A', 'phase_type': '1φ'},
    {'fuse_type': '25A', 'phase_type': '1φ'},
    {'fuse_type': '32A', 'phase_type': '1φ'},
    {'fuse_type': '40A', 'phase_type': '1φ'},
    {'fuse_type': '50A', 'phase_type': '1φ'},
    {'fuse_type': '63A', 'phase_type': '1φ'},
    # 3-fazowe bezpieczniki
    {'fuse_type': '16A', 'phase_type': '3φ'},
    {'fuse_type': '20A', 'phase_type': '3φ'},
    {'fuse_type': '25A', 'phase_type': '3φ'},
    {'fuse_type': '32A', 'phase_type': '3φ'},
    {'fuse_type': '40A', 'phase_type': '3φ'},
    {'fuse_type': '50A', 'phase_type': '3φ'},
    {'fuse_type': '63A', 'phase_type': '3φ'},
    {'fuse_type': '80A', 'phase_type': '3φ'},
    {'fuse_type': '100A', 'phase_type': '3φ'},
    {'fuse_type': '125A', 'phase_type': '3φ'},
]

# Funkcja do określania kategorii komponentu na podstawie jego nazwy i opisu
def determine_component_category(component_id, name, description):
    """Określa kategorię komponentu na podstawie jego nazwy i opisu"""
    name_lower = name.lower()
    desc_lower = description.lower() if description else ""
    comp_id_lower = component_id.lower()

    # Zabezpieczenia podstawowe
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'rozłącznik', 'izolacyjny', 'pen', 'podział', 'półprzewodnik'
    ]) or comp_id_lower in ['isolator', 'pen_splitter']:
        return 'basic_protection', None

    # Zabezpieczenia nadprądowe (MCB, wyłączniki)
    if comp_id_lower.startswith('mcb_') or 'wyłącznik' in name_lower or 'nadprądowy' in desc_lower or 'mc b' in desc_lower:
        return 'overcurrent_protection', None

    # Zabezpieczenia przepięciowe
    if 'przepięć' in desc_lower or 'surge' in comp_id_lower or 'warystor' in desc_lower or 'spd' in comp_id_lower:
        return 'surge_protection_detailed', None

    # Sterowanie i automatyka
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'przekaźnik', 'stycznik', 'kontaktor', 'sterowanie', 'automatyka', 'bistabilny', 'timer', 'contactor'
    ]) or comp_id_lower in ['bistable_relay', 'contactor', 'timer_relay', 'smart_module']:
        return 'control_automation', None

    # Pomiary i kontrola
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'amperomierz', 'woltomierz', 'miernik', 'multimetr', 'pomiary', 'kontrola', 'licznik', 'energy_meter'
    ]) or comp_id_lower in ['ammeter', 'voltmeter', 'power_meter', 'phase_indicator', 'spd_indicator']:
        return 'measurement_control', None

    # Zasilanie awaryjne
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'awaryjne', 'zasilacz', 'backup', 'akumulator', 'bateria', 'ups'
    ]) or comp_id_lower in ['power_supply_24v', 'power_supply_12v', 'network_generator_switch', 'fire_switch', 'ups_module']:
        return 'emergency_special', None

    # PV, EV i nowoczesne instalacje
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'fotowolta', 'pv', 'ev', 'samochód elektryczny', 'ładowarka'
    ]) or comp_id_lower in ['pv_ac_protection', 'pv_dc_disconnect', 'ev_charger_protection', 'ev_energy_meter']:
        return 'pv_ev', None

    # Elementy łączeniowe i rozdział
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'blok', 'rozdzielczy', 'rozgałęźny', 'szyna', 'łączeniowe', 'rozdzielacz', 'mostek', 'bridge'
    ]) or comp_id_lower in ['distribution_block', 'branch_distribution_block', 'comb_bridge_1f', 'comb_bridge_3f', 'distribution_busbar']:
        return 'connection_elements', None

    # Organizacja i estetyka
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'pusty', 'moduł', 'organizacja', 'estetyka', 'pokrywa', 'ramka', 'etykieta', 'kanał', 'duct'
    ]) or comp_id_lower in ['n_pe_busbar', 'gsu', 'comb_busbar', 'cable_duct', 'module_labels']:
        return 'organization', None

    # Ochrona i bezpieczeństwo - dodatkowe
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'awaryjny', 'przeciwpożarowy', 'emergency', 'fire', 'voltage_relay', 'overvoltage_relay'
    ]) or comp_id_lower in ['emergency_switch', 'voltage_relay', 'overvoltage_relay']:
        return 'additional_protection', None

    # Automatyka i sterowanie - dodatkowe
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'io_module', 'blind_controller', 'heating_controller', 'current_relay'
    ]) or comp_id_lower in ['current_relay', 'io_module', 'blind_controller', 'heating_controller']:
        return 'additional_automation', None

    # Zasilanie pomocnicze - dodatkowe
    if any(keyword in name_lower or keyword in desc_lower for keyword in [
        'priorytet', 'priority'
    ]) or comp_id_lower in ['priority_relay']:
        return 'auxiliary_power', None

    # Kable instalacyjne
    if comp_id_lower.startswith('cable_') or 'kabel' in name_lower or 'przewód' in name_lower:
        return 'cables', None

    # Rzeczy obowiązkowe
    if comp_id_lower in ['din_rail', 'n_pe_rail', 'rcd_separator', 'blank_module', 'circuit_description', 'door_schematic']:
        return 'required', None

    # Domyślna kategoria
    return 'other', None

# Dane komponentów elektrycznych (z REQUIRED_COMPONENTS z page.tsx)
ELECTRIC_COMPONENTS = [
    {
        'id': 'bistable_relay',
        'name': 'Przekaźnik bistabilny modułowy',
        'fields': 2,
        'description': 'Przekaźnik bistabilny modułowy - przekaźnik elektryczny do sterowania oświetleniem z wielu przycisków bez podtrzymania zasilania',
        'price': 85,
        'image': '/pictures/electricComponents/bistable_relay.jpg',
        'category': 'control_automation',
        'subcategory': None
    },
    # Zabezpieczenia podstawowe
    {
        'id': 'isolator',
        'name': 'Rozłącznik izolacyjny modułowy',
        'fields': 3,
        'description': 'Rozłącznik izolacyjny modułowy 3-polowy - wyłącznik główny rozdzielnicy elektrycznej do bezpiecznego odłączenia zasilania',
        'price': 180,
        'image': '/pictures/electricComponents/isolator.jpg'
    },
    {
        'id': 'pen_splitter',
        'name': 'Złączka podziału przewodu PEN',
        'fields': 2,
        'description': 'Złączka podziału przewodu PEN na PE i N - element elektryczny do rozdzielenia przewodu ochronno-neutralnego w rozdzielnicy',
        'price': 15,
        'image': '/pictures/electricComponents/pen_splitter.jpg'
    },
    {
        'id': 'surge_protection',
        'name': 'Ogranicznik przepięć 4 + 0',
        'fields': 4,
        'description': 'Ogranicznik przepięć warystorowy Simtec ST30B+C/4 klasa B+C 30kA 275V | 85201010 Simet - zabezpieczenie elektryczne przed przepięciami i wyładowaniami atmosferycznymi',
        'price': 320,
        'image': '/pictures/electricComponents/surge_protection.jpg'
    },
    {
        'id': 'surge_protection_3plus1',
        'name': 'Ogranicznik przepięć 3 + 1',
        'fields': 4,
        'description': 'Ogranicznik przepięć warystorowy 3 + 1 klasa B+C - zabezpieczenie elektryczne przed przepięciami i wyładowaniami atmosferycznymi w układzie 3 fazy + neutralna',
        'price': 320,
        'image': '/pictures/electricComponents/surge_protection.jpg'
    },
    {
        'id': 'surge_protection_3plus0',
        'name': 'Ogranicznik przepięć 3 + 0',
        'fields': 3,
        'description': 'Ogranicznik przepięć warystorowy 3 + 0 klasa B+C - zabezpieczenie elektryczne przed przepięciami i wyładowaniami atmosferycznymi w układzie 3 fazy bez neutralnej',
        'price': 280,
        'image': '/pictures/electricComponents/surge_protection.jpg'
    },
    {
        'id': 'distribution_block',
        'name': 'Blok rozdzielczy modułowy',
        'fields': 4,
        'description': 'Blok rozdzielczy modułowy - element elektryczny do rozdziału obwodów w rozdzielnicy modułowej',
        'price': 85,
        'image': '/pictures/electricComponents/distribution_block.jpg'
    },
    {
        'id': 'branch_distribution_block',
        'name': 'Blok rozdzielczy rozgałęźny "ZUBI"',
        'fields': 4,
        'description': 'Blok rozdzielczy rozgałęźny modułowy - element elektryczny do rozgałęziania i rozdziału obwodów w rozdzielnicy modułowej',
        'price': 95,
        'image': '/pictures/electricComponents/branch_distribution_block.jpg'
    },
    {
        'id': 'branch_distribution_block_simblock',
        'name': 'Blok rozdzielczy odgałęźny  SIMBLOCK SCB 25-5X Al/Cu 80150',
        'fields': 4,
        'description': 'Blok rozdzielczy rozgałęźny modułowy - element elektryczny do rozgałęziania i rozdziału obwodów w rozdzielnicy modułowej',
        'price': 76,
        'image': '/pictures/electricComponents/branch_distribution_block.jpg'
    },
    {
        'id': 'rcd_1f',
        'name': 'Wyłącznik różnicowoprądowy jednofazowy',
        'fields': 2,
        'description': 'Wyłącznik różnicowoprądowy RCD jednofazowy 230V - zabezpieczenie przeciwporażeniowe modułowe',
        'price': 145,
        'image': '/pictures/electricComponents/rcd_1f.jpg'
    },
    {
        'id': 'rcd_3f',
        'name': 'Wyłącznik różnicowoprądowy trójfazowy',
        'fields': 4,
        'description': 'Wyłącznik różnicowoprądowy RCD trójfazowy 400V - zabezpieczenie przeciwporażeniowe modułowe',
        'price': 280,
        'image': '/pictures/electricComponents/rcd_3f.jpg'
    },
    # Zabezpieczenia nadprądowe
    {
        'id': 'mcb_b6',
        'name': 'B6A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B6 6A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 25,
        'image': '/pictures/electricComponents/mcb_b6.jpg'
    },
    {
        'id': 'mcb_b10',
        'name': 'B10A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B10 10A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 28,
        'image': '/pictures/electricComponents/mcb_b10.jpg'
    },
    {
        'id': 'mcb_b13',
        'name': 'B13A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B13 13A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 30,
        'image': '/pictures/electricComponents/mcb_b13.jpg'
    },
    {
        'id': 'mcb_b16',
        'name': 'B16A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B16 16A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 32,
        'image': '/pictures/electricComponents/mcb_b16.jpg'
    },
    {
        'id': 'mcb_b20',
        'name': 'B20A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B20 20A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 35,
        'image': '/pictures/electricComponents/mcb_b20.jpg'
    },
    {
        'id': 'mcb_b25',
        'name': 'B25A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B25 25A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 38,
        'image': '/pictures/electricComponents/mcb_b25.jpg'
    },
    {
        'id': 'mcb_b32',
        'name': 'B32A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B32 32A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 42,
        'image': '/pictures/electricComponents/mcb_b32.jpg'
    },
    {
        'id': 'mcb_b40',
        'name': 'B40A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B40 40A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 48,
        'image': '/pictures/electricComponents/mcb_b40.jpg'
    },
    {
        'id': 'mcb_b50',
        'name': 'B50A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B50 50A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 55,
        'image': '/pictures/electricComponents/mcb_b50.jpg'
    },
    {
        'id': 'mcb_b63',
        'name': 'B63A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B63 63A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 65,
        'image': '/pictures/electricComponents/mcb_b63.jpg'
    },
    {
        'id': 'mcb_b80',
        'name': 'B80A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B80 80A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 85,
        'image': '/pictures/electricComponents/mcb_b80.jpg'
    },
    {
        'id': 'mcb_b100',
        'name': 'B100A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B100 100A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 120,
        'image': '/pictures/electricComponents/mcb_b100.jpg'
    },
    {
        'id': 'mcb_b125',
        'name': 'B125A',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB B125 125A - zabezpieczenie nadprądowe charakterystyki B do rozdzielnicy elektrycznej',
        'price': 145,
        'image': '/pictures/electricComponents/mcb_b125.jpg'
    },
    {
        'id': 'mcb_c16',
        'name': 'Wyłącznik nadprądowy MCB C16',
        'fields': 1,
        'description': 'Wyłącznik nadprądowy modułowy MCB C16 16A - zabezpieczenie nadprądowe charakterystyki C do rozdzielnicy elektrycznej',
        'price': 35,
        'image': '/pictures/electricComponents/mcb_c16.jpg'
    },
    {
        'id': 'rcbo',
        'name': 'Wyłącznik różnicowo-nadprądowy RCBO',
        'fields': 2,
        'description': 'Wyłącznik różnicowo-nadprądowy RCBO modułowy - połączenie wyłącznika różnicowoprądowego i nadprądowego w jednym module elektrycznym',
        'price': 195,
        'image': '/pictures/electricComponents/rcbo.jpg'
    },
    # Zabezpieczenia przepięciowe - szczegółowe
    {
        'id': 'spd_t1',
        'name': 'Ogranicznik przepięć SPD Typ 1',
        'fields': 4,
        'description': 'Ogranicznik przepięć modułowy SPD Typ 1 - ochrona odgromowa przed bezpośrednimi wyładowaniami atmosferycznymi w instalacji elektrycznej',
        'price': 450,
        'image': '/pictures/electricComponents/spd_t1.jpg'
    },
    {
        'id': 'spd_t2',
        'name': 'Ogranicznik przepięć SPD Typ 2',
        'fields': 4,
        'description': 'Ogranicznik przepięć modułowy SPD Typ 2 - standardowa ochrona przed przepięciami w instalacji elektrycznej domowej',
        'price': 320,
        'image': '/pictures/electricComponents/spd_t2.jpg'
    },
    {
        'id': 'spd_t3',
        'name': 'Ogranicznik przepięć SPD Typ 3',
        'fields': 2,
        'description': 'Ogranicznik przepięć modułowy SPD Typ 3 - ochrona końcowa przed przepięciami w instalacji elektrycznej',
        'price': 180,
        'image': '/pictures/electricComponents/spd_t3.jpg'
    },
    {
        'id': 'spd_dc',
        'name': 'Ogranicznik przepięć DC dla instalacji PV',
        'fields': 4,
        'description': 'Ogranicznik przepięć modułowy SPD DC - ochrona przed przepięciami dla instalacji fotowoltaicznej prądu stałego',
        'price': 520,
        'image': '/pictures/electricComponents/spd_dc.jpg'
    },
    {
        'id': 'spd_data',
        'name': 'Ogranicznik przepięć dla linii danych',
        'fields': 2,
        'description': 'Ogranicznik przepięć modułowy SPD dla linii danych - ochrona przed przepięciami dla sieci LAN, anteny, bramy, domofonu',
        'price': 95,
        'image': '/pictures/electricComponents/spd_data.jpg'
    },
    # Sterowanie i automatyka
    {
        'id': 'contactor',
        'name': 'Stycznik modułowy elektryczny',
        'fields': 2,
        'description': 'Stycznik modułowy elektryczny - przekaźnik elektromagnetyczny do sterowania obwodami elektrycznymi bojlera, podłogówki, rekuperacji, gniazd nocnych',
        'price': 125,
        'image': '/pictures/electricComponents/contactor.jpg'
    },
    {
        'id': 'timer_relay',
        'name': 'Przekaźnik czasowy modułowy',
        'fields': 2,
        'description': 'Przekaźnik czasowy modułowy - przekaźnik elektryczny z funkcją opóźnienia czasowego do automatycznego wyłączania oświetlenia i wentylacji',
        'price': 95,
        'image': '/pictures/electricComponents/timer_relay.jpg'
    },
    {
        'id': 'smart_module',
        'name': 'Moduł automatyki budynkowej',
        'fields': 2,
        'description': 'Moduł automatyki budynkowej - sterownik elektryczny KNX, MODBUS, WiFi, ZigBee do systemu inteligentnego domu w rozdzielnicy',
        'price': 1660,
        'image': '/pictures/electricComponents/smart_module.jpg'
    },
    # Pomiary i kontrola
    {
        'id': 'energy_meter_1f',
        'name': 'Licznik energii elektrycznej jednofazowy',
        'fields': 4,
        'description': 'Licznik energii elektrycznej jednofazowy MID - licznik modułowy do pomiaru energii elektrycznej dla podliczników, PV, pompy ciepła',
        'price': 280,
        'image': '/pictures/electricComponents/energy_meter_1f.jpg'
    },
    {
        'id': 'energy_meter_3f',
        'name': 'Licznik energii elektrycznej trójfazowy',
        'fields': 6,
        'description': 'Licznik energii elektrycznej trójfazowy MID - licznik modułowy do pomiaru energii elektrycznej dla podliczników, PV, pompy ciepła',
        'price': 450,
        'image': '/pictures/electricComponents/energy_meter_3f.jpg'
    },
    {
        'id': 'voltmeter',
        'name': 'Woltomierz modułowy',
        'fields': 2,
        'description': 'Woltomierz modułowy - miernik napięcia elektrycznego do kontroli wartości napięcia w rozdzielnicy',
        'price': 120,
        'image': '/pictures/electricComponents/voltmeter.jpg'
    },
    {
        'id': 'ammeter',
        'name': 'Amperomierz modułowy',
        'fields': 2,
        'description': 'Amperomierz modułowy - miernik prądu elektrycznego do kontroli wartości prądu w obwodach rozdzielnicy',
        'price': 120,
        'image': '/pictures/electricComponents/ammeter.jpg'
    },
    {
        'id': 'power_meter',
        'name': 'Miernik mocy modułowy',
        'fields': 2,
        'description': 'Miernik mocy modułowy - miernik elektryczny do kontroli zużycia mocy i energii w instalacji elektrycznej',
        'price': 180,
        'image': '/pictures/electricComponents/power_meter.jpg'
    },
    {
        'id': 'phase_indicator',
        'name': 'Kontrolki obecności faz L1 L2 L3',
        'fields': 3,
        'description': 'Kontrolki obecności faz modułowe L1 L2 L3 - wskaźniki napięcia elektrycznego do kontroli obecności faz w rozdzielnicy trójfazowej',
        'price': 45,
        'image': '/pictures/electricComponents/phase_indicator.jpg'
    },
    {
        'id': 'phase_indicator_1f',
        'name': 'Kontrolka napięcia jednofazowa',
        'fields': 1,
        'description': 'Kontrolka napięcia jednofazowa modułowa 230V - wskaźnik obecności napięcia elektrycznego w obwodzie jednofazowym',
        'price': 18,
        'image': '/pictures/electricComponents/phase_indicator_1f.jpg'
    },
    {
        'id': 'spd_indicator',
        'name': 'Sygnalizator zadziałania ogranicznika przepięć',
        'fields': 1,
        'description': 'Sygnalizator zadziałania ogranicznika przepięć SPD - moduł elektryczny do sygnalizacji zadziałania zabezpieczenia przepięciowego',
        'price': 35,
        'image': '/pictures/electricComponents/spd_indicator.jpg'
    },
    # Zasilanie awaryjne i specjalne
    {
        'id': 'power_supply_24v',
        'name': 'Zasilacz modułowy 24V DC',
        'fields': 2,
        'description': 'Zasilacz modułowy 24V DC - zasilacz elektryczny do automatyki, przekaźników i systemów sterowania w rozdzielnicy',
        'price': 95,
        'image': '/pictures/electricComponents/power_supply_24v.jpg'
    },
    {
        'id': 'power_supply_12v',
        'name': 'Zasilacz modułowy 12V DC',
        'fields': 2,
        'description': 'Zasilacz modułowy 12V DC - zasilacz elektryczny do automatyki, przekaźników i systemów sterowania w rozdzielnicy',
        'price': 85,
        'image': '/pictures/electricComponents/power_supply_12v.jpg'
    },
    {
        'id': 'network_generator_switch',
        'name': 'Przełącznik sieć-agregat UPS',
        'fields': 4,
        'description': 'Przełącznik sieć-agregat UPS modułowy - przełącznik elektryczny do automatycznego przełączania między zasilaniem sieciowym a agregatem lub UPS',
        'price': 80,
        'image': '/pictures/electricComponents/network_generator_switch.jpg'
    },
    {
        'id': 'fire_switch',
        'name': 'Wyłącznik przeciwpożarowy modułowy',
        'fields': 2,
        'description': 'Wyłącznik przeciwpożarowy modułowy - wyłącznik elektryczny do szybkiego odłączenia zasilania w przypadku pożaru, wymagany przy instalacjach PV',
        'price': 195,
        'image': '/pictures/electricComponents/fire_switch.jpg'
    },
    # PV, EV i nowoczesne instalacje
    {
        'id': 'pv_ac_protection',
        'name': 'Zabezpieczenia strony AC falownika fotowoltaicznego',
        'fields': 4,
        'description': 'Zabezpieczenia elektryczne strony AC falownika fotowoltaicznego - wyłączniki i ograniczniki przepięć dla instalacji PV',
        'price': 280,
        'image': '/pictures/electricComponents/pv_ac_protection.jpg'
    },
    {
        'id': 'pv_dc_disconnect',
        'name': 'Rozłącznik DC dla instalacji fotowoltaicznej',
        'fields': 4,
        'description': 'Rozłącznik DC modułowy dla instalacji fotowoltaicznej - rozłącznik prądu stałego do bezpiecznego odłączenia modułów PV',
        'price': 320,
        'image': '/pictures/electricComponents/pv_dc_disconnect.jpg'
    },
    {
        'id': 'ev_charger_protection',
        'name': 'Zabezpieczenie elektryczne ładowarki EV',
        'fields': 4,
        'description': 'Zabezpieczenie elektryczne ładowarki samochodu elektrycznego EV - wyłączniki różnicowoprądowe i nadprądowe dla stacji ładowania',
        'price': 350,
        'image': '/pictures/electricComponents/ev_charger_protection.jpg'
    },
    {
        'id': 'ev_energy_meter',
        'name': 'Licznik energii dla ładowarki EV',
        'fields': 4,
        'description': 'Licznik energii elektrycznej dla ładowarki samochodu elektrycznego EV - miernik energii do rozliczeń ładowania pojazdu',
        'price': 320,
        'image': '/pictures/electricComponents/ev_energy_meter.jpg'
    },
    # Organizacja i estetyka
    {
        'id': 'n_pe_busbar',
        'name': 'Listwy szyn N i PE',
        'fields': 1,
        'description': 'Listwy szyn N i PE modułowe - szyny elektryczne do organizacji przewodów neutralnych i ochronnych w rozdzielnicy',
        'price': 35,
        'image': '/pictures/electricComponents/n_pe_busbar.jpg'
    },
    {
        'id': 'gsu',
        'name': 'Główna Szyna Uziemiająca (GSU)',
        'fields': 1,
        'description': 'Główna Szyna Uziemiająca GSU - szyna elektryczna do połączenia wszystkich przewodów ochronnych PE i przewodów uziemiających w rozdzielnicy elektrycznej',
        'price': 45,
        'image': '/pictures/electricComponents/pe_connector.jpg'
    },
    {
        'id': 'comb_busbar',
        'name': 'Szyny grzebieniowe modułowe',
        'fields': 1,
        'description': 'Szyny grzebieniowe modułowe - szyny elektryczne grzebieniowe jednofazowe i trójfazowe do rozdziału zasilania w rozdzielnicy',
        'price': 25,
        'image': '/pictures/electricComponents/comb_busbar.jpg'
    },
    {
        'id': 'cable_duct',
        'name': 'Kanały kablowe do rozdzielnicy',
        'fields': 1,
        'description': 'Kanały kablowe modułowe - kanały elektryczne do organizacji i prowadzenia przewodów w rozdzielnicy modułowej',
        'price': 15,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'module_labels',
        'name': 'Etykiety opisowe modułów elektrycznych',
        'fields': 0,
        'description': 'Etykiety opisowe modułów elektrycznych - oznaczenia i opisy modułów w rozdzielnicy do dokumentacji i identyfikacji obwodów',
        'price': 25,
        'image': '/pictures/electricComponents/module_labels.jpg'
    },
    # Elementy łączeniowe i rozdział
    {
        'id': 'n_connector',
        'name': 'Złączki przewodów neutralnych N',
        'fields': 1,
        'description': 'Złączki przewodów neutralnych N modułowe - złączki elektryczne do łączenia przewodów neutralnych w rozdzielnicy',
        'price': 8,
        'image': '/pictures/electricComponents/n_connector.jpg'
    },
    {
        'id': 'pe_connector',
        'name': 'Złączki przewodów ochronnych PE',
        'fields': 1,
        'description': 'Złączki przewodów ochronnych PE modułowe - złączki elektryczne do łączenia przewodów ochronnych w rozdzielnicy',
        'price': 8,
        'image': '/pictures/electricComponents/pe_connector.jpg'
    },
    {
        'id': 'phase_connector',
        'name': 'Złączki przewodów fazowych L',
        'fields': 1,
        'description': 'Złączki przewodów fazowych L modułowe - złączki elektryczne do łączenia przewodów fazowych w rozdzielnicy',
        'price': 8,
        'image': '/pictures/electricComponents/phase_connector.jpg'
    },
    {
        'id': 'distribution_busbar',
        'name': 'Listwy rozdzielcze modułowe',
        'fields': 1,
        'description': 'Listwy rozdzielcze modułowe - szyny elektryczne rozdzielcze do rozdziału zasilania między moduły w rozdzielnicy',
        'price': 45,
        'image': '/pictures/electricComponents/distribution_busbar.jpg'
    },
    {
        'id': 'comb_bridge_1f',
        'name': 'Mostki grzebieniowe jednofazowe',
        'fields': 1,
        'description': 'Mostki grzebieniowe jednofazowe modułowe - mostki elektryczne do łączenia wyłączników nadprądowych jednofazowych',
        'price': 18,
        'image': '/pictures/electricComponents/comb_bridge_1f.jpg'
    },
    {
        'id': 'comb_bridge_3f',
        'name': 'Mostki grzebieniowe trójfazowe',
        'fields': 1,
        'description': 'Mostki grzebieniowe trójfazowe modułowe - mostki elektryczne do łączenia wyłączników nadprądowych trójfazowych',
        'price': 28,
        'image': '/pictures/electricComponents/comb_bridge_3f.jpg'
    },
    {
        'id': 'supply_terminals',
        'name': 'Zaciski przyłączeniowe zasilania',
        'fields': 2,
        'description': 'Zaciski przyłączeniowe zasilania modułowe - zaciski elektryczne do przyłączenia głównego zasilania do rozdzielnicy',
        'price': 55,
        'image': '/pictures/electricComponents/supply_terminals.jpg'
    },
    {
        'id': 'rod_connecting_busbar',
        'name': 'Szyna łączeniowa sztyftowa',
        'fields': 1,
        'description': 'Szyna łączeniowa sztyftowa modułowa - szyna elektryczna sztyftowa do łączenia i rozdziału obwodów w rozdzielnicy modułowej',
        'price': 42,
        'image': '/pictures/electricComponents/rod_connecting_busbar.jpg'
    },
    # Ochrona i bezpieczeństwo - dodatkowe
    {
        'id': 'emergency_switch',
        'name': 'Wyłącznik awaryjny modułowy',
        'fields': 2,
        'description': 'Wyłącznik awaryjny modułowy - wyłącznik elektryczny awaryjny do szybkiego odłączenia zasilania w sytuacji awaryjnej',
        'price': 125,
        'image': '/pictures/electricComponents/emergency_switch.jpg'
    },
    {
        'id': 'voltage_relay',
        'name': 'Przekaźnik kontroli napięcia',
        'fields': 2,
        'description': 'Przekaźnik kontroli napięcia modułowy - przekaźnik elektryczny do kontroli zaniku fazy, asymetrii i kolejności faz',
        'price': 145,
        'image': '/pictures/electricComponents/voltage_relay.jpg'
    },
    {
        'id': 'overvoltage_relay',
        'name': 'Przekaźnik nad- i podnapięciowy',
        'fields': 2,
        'description': 'Przekaźnik nad- i podnapięciowy modułowy - przekaźnik elektryczny do ochrony przed nadnapięciem i podnapięciem w instalacji',
        'price': 145,
        'image': '/pictures/electricComponents/overvoltage_relay.jpg'
    },
    # Automatyka i sterowanie - dodatkowe
    {
        'id': 'current_relay',
        'name': 'Przekaźnik kontroli prądu',
        'fields': 2,
        'description': 'Przekaźnik kontroli prądu modułowy - przekaźnik elektryczny do kontroli wartości prądu w obwodach elektrycznych',
        'price': 125,
        'image': '/pictures/electricComponents/current_relay.jpg'
    },
    {
        'id': 'io_module',
        'name': 'Moduł wejść i wyjść cyfrowych',
        'fields': 2,
        'description': 'Moduł wejść i wyjść cyfrowych - moduł elektryczny do sterowania i monitorowania sygnałów cyfrowych w automatyce',
        'price': 180,
        'image': '/pictures/electricComponents/io_module.jpg'
    },
    {
        'id': 'blind_controller',
        'name': 'Sterownik rolet i żaluzji',
        'fields': 2,
        'description': 'Sterownik rolet i żaluzji modułowy - moduł elektryczny do automatyzacji sterowania roletami i żaluzjami',
        'price': 195,
        'image': '/pictures/electricComponents/blind_controller.jpg'
    },
    {
        'id': 'heating_controller',
        'name': 'Sterownik ogrzewania elektrycznego',
        'fields': 2,
        'description': 'Sterownik ogrzewania elektrycznego modułowy - moduł elektryczny do kontroli i sterowania systemem grzewczym',
        'price': 220,
        'image': '/pictures/electricComponents/heating_controller.jpg'
    },
    # Zasilanie pomocnicze - dodatkowe
    {
        'id': 'ups_module',
        'name': 'Moduł UPS zasilania awaryjnego',
        'fields': 4,
        'description': 'Moduł UPS zasilania awaryjnego - modułowy zasilacz awaryjny UPS do zapewnienia ciągłości zasilania w rozdzielnicy',
        'price': 450,
        'image': '/pictures/electricComponents/ups_module.jpg'
    },
    {
        'id': 'priority_relay',
        'name': 'Przekaźnik priorytetowy obciążenia',
        'fields': 2,
        'description': 'Przekaźnik priorytetowy obciążenia modułowy - przekaźnik elektryczny do kontroli priorytetów obciążenia load shedding',
        'price': 195,
        'image': '/pictures/electricComponents/priority_relay.jpg'
    },
    # Rzeczy obowiązkowe
    {
        'id': 'din_rail',
        'name': 'Szyna montażowa DIN',
        'fields': 0,
        'description': 'Szyna montażowa DIN - szyna elektryczna do montażu elementów modułowych w rozdzielnicy elektrycznej',
        'price': 12,
        'image': '/pictures/electricComponents/din_rail.jpg'
    },
    {
        'id': 'n_pe_rail',
        'name': 'Szyny N i PE',
        'fields': 0,
        'description': 'Szyny N i PE modułowe - szyny elektryczne do organizacji i łączenia przewodów neutralnych i ochronnych',
        'price': 25,
        'image': '/pictures/electricComponents/n_pe_rail.jpg'
    },
    {
        'id': 'rcd_separator',
        'name': 'Separator między wyłącznikami RCD',
        'fields': 1,
        'description': 'Separator między wyłącznikami RCD modułowy - separator elektryczny do izolacji między różnicówkami w rozdzielnicy',
        'price': 15,
        'image': '/pictures/electricComponents/rcd_separator.jpg'
    },
    {
        'id': 'blank_module',
        'name': 'Zaślepki modułowe pól',
        'fields': 1,
        'description': 'Zaślepki modułowe pól - zaślepki elektryczne do estetycznego zamykania wolnych miejsc w rozdzielnicy modułowej',
        'price': 5,
        'image': '/pictures/electricComponents/blank_module.jpg'
    },
    {
        'id': 'circuit_description',
        'name': 'Opis obwodów elektrycznych',
        'fields': 0,
        'description': 'Opis obwodów elektrycznych - etykiety i oznaczenia do dokumentacji obwodów w rozdzielnicy elektrycznej',
        'price': 25,
        'image': '/pictures/electricComponents/circuit_description.jpg'
    },
    {
        'id': 'door_schematic',
        'name': 'Drzwiczki rozdzielnicy z miejscem na schemat',
        'fields': 0,
        'description': 'Drzwiczki rozdzielnicy z miejscem na schemat - drzwiczki elektryczne z przezroczystą kieszenią na schemat instalacji',
        'price': 85,
        'image': '/pictures/electricComponents/door_schematic.jpg'
    },
    # Kable instalacyjne - najczęściej używane
    {
        'id': 'cable_ydypzo_5x4',
        'name': 'Kabel YDYpżo 5x4',
        'fields': 0,
        'description': 'Kabel płaski YDYpżo 5x4 mm² - kabel instalacyjny do obwodów trójfazowych i urządzeń o większej mocy',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_ydyp_3x15',
        'name': 'Kabel YDYp 3x1,5',
        'fields': 0,
        'description': 'Kabel płaski YDYp 3x1,5 mm² - kabel instalacyjny płaski do oświetlenia i obwodów małej mocy',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_ydyp_3x25',
        'name': 'Kabel YDYp 3x2,5',
        'fields': 0,
        'description': 'Kabel płaski YDYp 3x2,5 mm² - kabel instalacyjny płaski do gniazd wtyczkowych i obwodów standardowych',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_yky_3x15',
        'name': 'Kabel YKY 3x1,5',
        'fields': 0,
        'description': 'Kabel YKY 3x1,5 mm² - kabel instalacyjny okrągły w osłonie PVC do oświetlenia i obwodów małej mocy',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_yky_3x25',
        'name': 'Kabel YKY 3x2,5',
        'fields': 0,
        'description': 'Kabel YKY 3x2,5 mm² - kabel instalacyjny okrągły w osłonie PVC do gniazd wtyczkowych i obwodów standardowych',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_yky_3x4',
        'name': 'Kabel YKY 3x4',
        'fields': 0,
        'description': 'Kabel YKY 3x4 mm² - kabel instalacyjny okrągły w osłonie PVC do obwodów o większej mocy',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_yky_5x4',
        'name': 'Kabel YKY 5x4',
        'fields': 0,
        'description': 'Kabel YKY 5x4 mm² - kabel instalacyjny okrągły w osłonie PVC do obwodów trójfazowych',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_yky_5x6',
        'name': 'Kabel YKY 5x6',
        'fields': 0,
        'description': 'Kabel YKY 5x6 mm² - kabel instalacyjny okrągły w osłonie PVC do obwodów trójfazowych o dużej mocy',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_lgy_4',
        'name': 'Kabel LGY 3x4 4 żółto-zielony (H07V-K) 450/750V',
        'fields': 0,
        'description': 'Przewód LgY to jednożyłowy przewód elektryczny, który charakteryzuje się elastyczną budową i jest powszechnie stosowany w instalacjach niskonapięciowych. Przewody LgY przeznaczone są do połączenia urządzeń i aparatów elektrycznych w systemach automatyki oraz instalacji w rozdzielnicach i tablicach elektrycznych.',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_lgy_3x4',
        'name': 'Przewód LGY 4 niebieski (H07V-K) 450/750V',
        'fields': 0,
        'description': 'Przewód LgY to jednożyłowy przewód elektryczny, który charakteryzuje się elastyczną budową i jest powszechnie stosowany w instalacjach niskonapięciowych. Przewody LgY przeznaczone są do połączenia urządzeń i aparatów elektrycznych w systemach automatyki oraz instalacji w rozdzielnicach i tablicach elektrycznych.',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_ykxs_3x15',
        'name': 'Kabel YKXS 3x1,5',
        'fields': 0,
        'description': 'Kabel YKXS 3x1,5 mm² - kabel instalacyjny w osłonie z PVC do oświetlenia i obwodów małej mocy',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_ykxs_3x25',
        'name': 'Kabel YKXS 3x2,5',
        'fields': 0,
        'description': 'Kabel YKXS 3x2,5 mm² - kabel instalacyjny w osłonie z PVC do gniazd wtyczkowych i obwodów standardowych',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    # Przewody PEN (ochronno-neutralne)
    {
        'id': 'cable_pen_4x10_cu',
        'name': 'Przewód PEN 4x10 mm² (miedź)',
        'fields': 0,
        'description': 'Przewód PEN 4x10 mm² miedziany - przewód ochronno-neutralny do przyłączenia głównego zasilania w instalacji elektrycznej',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    },
    {
        'id': 'cable_pen_4x16_al',
        'name': 'Przewód PEN 4x16 mm² (aluminium)',
        'fields': 0,
        'description': 'Przewód PEN 4x16 mm² aluminiowy - przewód ochronno-neutralny do przyłączenia głównego zasilania w instalacji elektrycznej',
        'price': 0,
        'image': '/pictures/electricComponents/cable_duct.jpg'
    }
]


class VoltComponentsManager:
    """Zarządzanie komponentami elektrycznymi w bazie danych PostgreSQL"""

    def __init__(self):
        self.connection = None
        self.cursor = None

    def connect_to_database(self):
        """Nawiązanie połączenia z bazą danych"""
        try:
            self.connection = psycopg2.connect(**DB_CONFIG)
            self.cursor = self.connection.cursor()

            # Pobierz nazwę aktualnego schematu
            self.cursor.execute("SELECT current_schema()")
            current_schema = self.cursor.fetchone()[0]

            print("[SUCCESS] Polaczono z baza danych PostgreSQL")
            print(f"[SCHEMA] Aktualny schemat: {current_schema}")
            print(f"[DB] Baza danych: {DB_CONFIG['database']}")
            print(f"[HOST] {DB_CONFIG['host']}:{DB_CONFIG['port']}")

            # Jeśli to nie schemat public, ostrzeżenie
            if current_schema != 'public':
                print(f"[WARNING] UZYWASZ SCHEMATU '{current_schema}', ale rekomendowany jest 'public'")
                print("   Mozesz zmienic schemat komenda: SET search_path TO public;")

            return True
        except psycopg2.Error as e:
            print(f"[ERROR] Blad polaczenia z baza danych: {e}")
            return False

    def disconnect_from_database(self):
        """Zamknięcie połączenia z bazą danych"""
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.close()
            print("[SUCCESS] Polaczenie z baza danych zostalo zamkniete")

    def create_components_table(self):
        """Tworzenie tabeli komponentów elektrycznych"""
        # Sprawdź czy tabela istnieje
        self.cursor.execute("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'electric_components'
            )
        """)
        table_exists = self.cursor.fetchone()[0]

        if not table_exists:
            # Utwórz tabelę jeśli nie istnieje
            self.cursor.execute("""
                CREATE TABLE electric_components (
                    id VARCHAR(100) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    fields INTEGER NOT NULL DEFAULT 0,
                    description TEXT,
                    price DECIMAL(10,2) NOT NULL DEFAULT 0,
                    image VARCHAR(500),
                    category VARCHAR(100),
                    subcategory VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            print("[SUCCESS] Tabela electric_components zostala utworzona")
        else:
            print("[INFO] Tabela electric_components juz istnieje")

        # Dodanie kolumn category i subcategory jeśli nie istnieją (dla kompatybilności wstecznej)
        try:
            # Sprawdź czy kolumny już istnieją
            self.cursor.execute("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'electric_components' AND column_name IN ('category', 'subcategory')
            """)
            existing_columns = [row[0] for row in self.cursor.fetchall()]

            columns_added = False
            if 'category' not in existing_columns:
                self.cursor.execute("ALTER TABLE electric_components ADD COLUMN category VARCHAR(100)")
                print("[SUCCESS] Dodano kolumnę category")
                columns_added = True

            if 'subcategory' not in existing_columns:
                self.cursor.execute("ALTER TABLE electric_components ADD COLUMN subcategory VARCHAR(100)")
                print("[SUCCESS] Dodano kolumnę subcategory")
                columns_added = True

            if columns_added:
                self.connection.commit()
                print("[SUCCESS] Kolumny category i subcategory zostaly dodane do tabeli")
            else:
                print("[INFO] Kolumny category i subcategory juz istnieja")

        except psycopg2.Error as e:
            print(f"[WARNING] Nie udalo sie dodac kolumn category/subcategory: {e}")
            # Kontynuuj mimo błędu

        # Dodanie indeksów dla optymalizacji zapytań (zawsze, po dodaniu kolumn)
        try:
            self.cursor.execute("CREATE INDEX IF NOT EXISTS idx_components_name ON electric_components(name)")
            self.cursor.execute("CREATE INDEX IF NOT EXISTS idx_components_price ON electric_components(price)")
            self.cursor.execute("CREATE INDEX IF NOT EXISTS idx_components_fields ON electric_components(fields)")
            self.cursor.execute("CREATE INDEX IF NOT EXISTS idx_components_category ON electric_components(category)")
            self.cursor.execute("CREATE INDEX IF NOT EXISTS idx_components_subcategory ON electric_components(subcategory)")
            print("[SUCCESS] Indeksy zostaly utworzone/zaktualizowane")
        except psycopg2.Error as e:
            print(f"[WARNING] Problem z indeksami: {e}")

        self.connection.commit()
        return True

    def insert_components_batch(self, components_data):
        """Wsadowe wstawianie komponentów do bazy danych"""
        insert_query = """
        INSERT INTO electric_components (id, name, fields, description, price, image, category, subcategory)
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            fields = EXCLUDED.fields,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            image = EXCLUDED.image,
            category = EXCLUDED.category,
            subcategory = EXCLUDED.subcategory,
            updated_at = CURRENT_TIMESTAMP
        """

        try:
            # Przygotowanie danych do wsadowego wstawiania z automatycznym przypisywaniem kategorii
            values = []
            for comp in components_data:
                # Automatyczne przypisanie kategorii jeśli nie jest zdefiniowana
                category = comp.get('category')
                subcategory = comp.get('subcategory')

                if category is None:
                    category, subcategory = determine_component_category(
                        comp['id'], comp['name'], comp['description']
                    )

                values.append((
                    comp['id'],
                    comp['name'],
                    comp['fields'],
                    comp['description'],
                    comp['price'],
                    comp['image'],
                    category,
                    subcategory
                ))

            # Wsadowe wstawianie danych
            execute_values(self.cursor, insert_query, values)
            self.connection.commit()

            print(f"[SUCCESS] Wsadowo wstawiono/zaktualizowano {len(components_data)} komponentow")
            return True

        except psycopg2.Error as e:
            print(f"[ERROR] Blad wsadowego wstawiania danych: {e}")
            return False

    def insert_fuse_types_batch(self, fuse_types_data):
        """Wsadowe wstawianie typów bezpieczników do bazy danych"""
        try:
            values = [(fuse['fuse_type'], fuse['phase_type']) for fuse in fuse_types_data]

            insert_query = """
            INSERT INTO fuse_types (fuse_type, phase_type)
            VALUES %s
            ON CONFLICT DO NOTHING
            """

            execute_values(self.cursor, insert_query, values)
            self.connection.commit()

            print(f"[SUCCESS] Wsadowo wstawiono/zaktualizowano {len(fuse_types_data)} typów bezpieczników")
            return True

        except psycopg2.Error as e:
            print(f"[ERROR] Błąd wsadowego wstawiania typów bezpieczników: {e}")
            return False

    def get_fuse_types(self, phase_type=None):
        """Pobieranie typów bezpieczników z opcjonalnym filtrowaniem po typie fazy"""
        try:
            if phase_type:
                self.cursor.execute("""
                    SELECT fuse_type, phase_type
                    FROM fuse_types
                    WHERE phase_type = %s
                    ORDER BY CAST(REPLACE(fuse_type, 'A', '') AS INTEGER)
                """, (phase_type,))
            else:
                self.cursor.execute("""
                    SELECT fuse_type, phase_type
                    FROM fuse_types
                    ORDER BY phase_type, CAST(REPLACE(fuse_type, 'A', '') AS INTEGER)
                """)

            fuse_types = self.cursor.fetchall()
            return [{'fuse_type': row[0], 'phase_type': row[1]} for row in fuse_types]

        except psycopg2.Error as e:
            print(f"[ERROR] Błąd pobierania typów bezpieczników: {e}")
            return []

    def get_component_count(self):
        """Pobranie liczby komponentów w bazie danych"""
        try:
            self.cursor.execute("SELECT COUNT(*) FROM electric_components")
            count = self.cursor.fetchone()[0]
            return count
        except psycopg2.Error as e:
            print(f"[ERROR] Blad pobierania liczby komponentow: {e}")
            return 0

    def get_components_by_category(self, fields_range=None):
        """Pobieranie komponentów z opcjonalnym filtrowaniem po liczbie pól"""
        try:
            if fields_range:
                self.cursor.execute("""
                    SELECT id, name, fields, price
                    FROM electric_components
                    WHERE fields BETWEEN %s AND %s
                    ORDER BY fields, price
                """, fields_range)
            else:
                self.cursor.execute("""
                    SELECT id, name, fields, price
                    FROM electric_components
                    ORDER BY fields, price
                """)

            components = self.cursor.fetchall()
            return components

        except psycopg2.Error as e:
            print(f"[ERROR] Blad pobierania komponentow: {e}")
            return []

    def export_components_to_json(self, filename="electric_components_export.json"):
        """Eksport wszystkich komponentów do pliku JSON"""
        try:
            self.cursor.execute("""
                SELECT id, name, fields, description, price, image, category, subcategory, created_at, updated_at
                FROM electric_components
                ORDER BY name
            """)

            components = self.cursor.fetchall()

            # Konwersja do formatu JSON
            components_json = []
            for comp in components:
                components_json.append({
                    'id': comp[0],
                    'name': comp[1],
                    'fields': comp[2],
                    'description': comp[3],
                    'price': float(comp[4]) if comp[4] else 0,
                    'image': comp[5],
                    'category': comp[6],
                    'subcategory': comp[7],
                    'created_at': comp[8].isoformat() if comp[8] else None,
                    'updated_at': comp[9].isoformat() if comp[9] else None
                })

            # Zapis do pliku
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(components_json, f, indent=2, ensure_ascii=False)

            print(f"[SUCCESS] Wyeksportowano {len(components_json)} komponentow do pliku {filename}")
            return True

        except (psycopg2.Error, IOError) as e:
            print(f"[ERROR] Blad eksportu danych: {e}")
            return False


def main():
    """Główna funkcja zarządzania komponentami elektrycznymi"""

    print("=" * 60)
    print("[VOLT] Components Data Management")
    print("Zarządzanie komponentami elektrycznymi w PostgreSQL")
    print("=" * 60)

    # Inicjalizacja managera
    manager = VoltComponentsManager()

    # Połączenie z bazą danych
    if not manager.connect_to_database():
        print("[ERROR] Nie mozna polaczyc sie z baza danych. Sprawdz konfiguracje w pliku .env")
        return

    try:
        # Tworzenie tabeli
        print("\n1. Tworzenie struktury bazy danych...")
        if not manager.create_components_table():
            return

        # Wstawianie danych komponentów
        print("\n2. Wstawianie danych komponentów elektrycznych...")
        if not manager.insert_components_batch(ELECTRIC_COMPONENTS):
            return

        # Statystyki
        component_count = manager.get_component_count()
        print(f"\n[STATS] Statystyki:")
        print(f"   • Łączna liczba komponentów: {component_count}")

        # Przykładowe zapytania
        print("3. Przykladowe zapytania:")
        components_2_fields = manager.get_components_by_category((2, 2))
        print(f"   - Komponenty 2-polowe: {len(components_2_fields)} szt.")

        components_4_fields = manager.get_components_by_category((4, 4))
        print(f"   - Komponenty 4-polowe: {len(components_4_fields)} szt.")

        # Wstawianie danych bezpieczników
        print("\n3. Wstawianie danych bezpieczników...")
        if not manager.insert_fuse_types_batch(FUSE_TYPES_DATA):
            return

        # Statystyki bezpieczników
        fuse_types_1phase = manager.get_fuse_types('1φ')
        fuse_types_3phase = manager.get_fuse_types('3φ')
        print(f"   • Bezpieczniki 1-fazowe: {len(fuse_types_1phase)} typów")
        print(f"   • Bezpieczniki 3-fazowe: {len(fuse_types_3phase)} typów")

        # Eksport danych
        print("4. Eksport danych...")
        if manager.export_components_to_json():
            print("   [SUCCESS] Dane zostaly wyeksportowane do pliku electric_components_export.json")

        print("\n[SUCCESS] Wszystkie operacje zostaly wykonane pomyslnie!")
        print("\n[TIP] Nastepne kroki:")
        print("   - Mozesz teraz uzywac danych komponentow w aplikacji Next.js")
        print("   - Dane sa dostepne w tabeli 'electric_components'")
        print("   - Wyeksportowane dane JSON mozna wykorzystac w aplikacji")

    except Exception as e:
        print(f"[ERROR] Wystapil blad podczas przetwarzania: {e}")

    finally:
        # Zamknięcie połączenia
        manager.disconnect_from_database()

    print("=" * 60)


if __name__ == "__main__":
    main()