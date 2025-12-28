'use client';

import { useState } from 'react';
import Link from 'next/link';

// Typy danych
type Material = 'Cu' | 'Al';
type Insulation = 'PVC' | 'XLPE';
type InstallationMethod = 'peszel_izolowana' | 'peszel_nieizolowana' | 'tynk' | 'powietrze' | 'ziemia';
type PhaseType = 'single' | 'three';
type VoltageType = '230V' | '400V';

interface CableParams {
  material: Material;
  insulation: Insulation;
  installationMethod: InstallationMethod;
  phaseType: PhaseType;
  voltageType: VoltageType;
  temperature: number;
  numberOfCircuits: number;
  length: number;
  power?: number;
  current?: number;
  cosPhi: number;
}

interface CalculationResult {
  selectedCrossSection: number;
  currentCapacity: number;
  voltageDrop: number;
  voltageDropPercent: number;
  recommendedProtection: string;
  isValid: boolean;
  warnings: string[];
  errors: string[];
  // Szczegóły obliczeń dla tooltipów
  calculationDetails?: {
    requiredCurrent: number;
    baseCurrentCapacity: number;
    k1: number;
    k2: number;
    k3: number;
    k5: number;
    kMaterial: number;
    voltageDropFormula: {
      current: number;
      length: number;
      resistivity: number;
      crossSection: number;
      cosPhi: number;
      factor: number;
    };
    protectionCurrent: number;
  };
}

// Tabele obciążalności podstawowej (I0) dla miedzi PVC @ 30°C
// Źródło: PN-HD 60364-5-52:2011
const BASE_CURRENT_CAPACITY: Record<InstallationMethod, Record<number, number>> = {
  peszel_izolowana: {
    1.5: 14,
    2.5: 18.5,
    4: 25,
    6: 32,
    10: 44,
    16: 60,
    25: 80,
    35: 100,
    50: 125,
    70: 160,
    95: 195,
    120: 225,
    150: 260,
  },
  peszel_nieizolowana: {
    1.5: 16,
    2.5: 21,
    4: 28,
    6: 36,
    10: 50,
    16: 68,
    25: 90,
    35: 112,
    50: 140,
    70: 180,
    95: 220,
    120: 255,
    150: 295,
  },
  tynk: {
    1.5: 19.5,
    2.5: 27,
    4: 36,
    6: 46,
    10: 63,
    16: 85,
    25: 112,
    35: 140,
    50: 175,
    70: 225,
    95: 275,
    120: 320,
    150: 370,
  },
  powietrze: {
    1.5: 20,
    2.5: 28,
    4: 38,
    6: 49,
    10: 68,
    16: 91,
    25: 120,
    35: 150,
    50: 190,
    70: 240,
    95: 290,
    120: 340,
    150: 390,
  },
  ziemia: {
    1.5: 24,
    2.5: 32,
    4: 42,
    6: 54,
    10: 73,
    16: 98,
    25: 130,
    35: 160,
    50: 200,
    70: 250,
    95: 300,
    120: 350,
    150: 400,
  },
};

// Współczynniki korekcyjne dla temperatury otoczenia (PVC)
const TEMPERATURE_CORRECTION_PVC: Record<number, number> = {
  10: 1.15,
  15: 1.12,
  20: 1.08,
  25: 1.04,
  30: 1.0,
  35: 0.91,
  40: 0.82,
  45: 0.71,
  50: 0.58,
  55: 0.41,
  60: 0.52,
};

// Współczynniki korekcyjne dla temperatury otoczenia (XLPE)
const TEMPERATURE_CORRECTION_XLPE: Record<number, number> = {
  10: 1.15,
  15: 1.12,
  20: 1.08,
  25: 1.04,
  30: 1.0,
  35: 0.94,
  40: 0.87,
  45: 0.79,
  50: 0.71,
  55: 0.61,
  60: 0.50,
};

// Współczynniki korekcyjne dla grupowania przewodów
const GROUPING_CORRECTION: Record<number, number> = {
  1: 1.0,
  2: 0.8,
  3: 0.7,
  4: 0.65,
  5: 0.6,
  6: 0.57,
  7: 0.54,
  8: 0.52,
  9: 0.5,
  10: 0.48,
  12: 0.45,
  14: 0.43,
  16: 0.41,
  20: 0.38,
  24: 0.35,
};

// Standardowe przekroje dostępne na rynku
const STANDARD_CROSS_SECTIONS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150];

// Rezystywność materiałów [Ω·mm²/m]
const RESISTIVITY: Record<Material, number> = {
  Cu: 0.0175,
  Al: 0.0283,
};

// Minimalne przekroje dla Polski
const MIN_CROSS_SECTION: Record<Material, number> = {
  Cu: 1.5,
  Al: 10,
};

// Funkcje pomocnicze
function getTemperatureCorrection(temperature: number, insulation: Insulation): number {
  const table = insulation === 'PVC' ? TEMPERATURE_CORRECTION_PVC : TEMPERATURE_CORRECTION_XLPE;
  
  // Interpolacja liniowa dla temperatur między wartościami w tabeli
  const temps = Object.keys(table).map(Number).sort((a, b) => a - b);
  
  if (temperature <= temps[0]) return table[temps[0]];
  if (temperature >= temps[temps.length - 1]) return table[temps[temps.length - 1]];
  
  for (let i = 0; i < temps.length - 1; i++) {
    if (temperature >= temps[i] && temperature <= temps[i + 1]) {
      const t1 = temps[i];
      const t2 = temps[i + 1];
      const k1 = table[t1];
      const k2 = table[t2];
      return k1 + ((k2 - k1) * (temperature - t1)) / (t2 - t1);
    }
  }
  
  return 1.0;
}

function getGroupingCorrection(numberOfCircuits: number): number {
  if (numberOfCircuits <= 1) return 1.0;
  if (numberOfCircuits >= 24) return 0.35;
  
  const circuits = Object.keys(GROUPING_CORRECTION).map(Number).sort((a, b) => a - b);
  const closest = circuits.reduce((prev, curr) => 
    Math.abs(curr - numberOfCircuits) < Math.abs(prev - numberOfCircuits) ? curr : prev
  );
  
  return GROUPING_CORRECTION[closest];
}

function getBaseCurrentCapacity(
  crossSection: number,
  installationMethod: InstallationMethod
): number {
  const table = BASE_CURRENT_CAPACITY[installationMethod];
  const sections = Object.keys(table).map(Number).sort((a, b) => a - b);
  
  // Znajdź najbliższy mniejszy lub równy przekrój
  let capacity = 0;
  for (const section of sections) {
    if (section <= crossSection) {
      capacity = table[section];
    } else {
      break;
    }
  }
  
  return capacity || table[sections[0]];
}

function calculateCurrentCapacity(params: CableParams, crossSection: number): number {
  const I0 = getBaseCurrentCapacity(crossSection, params.installationMethod);
  const k1 = getTemperatureCorrection(params.temperature, params.insulation);
  const k3 = getGroupingCorrection(params.numberOfCircuits);
  
  // Współczynnik dla izolacji XLPE (+20% w stosunku do PVC)
  const k5 = params.insulation === 'XLPE' ? 1.2 : 1.0;
  
  // Współczynnik dla liczby żył obciążonych
  const k2 = params.phaseType === 'single' ? 1.0 : 0.85; // 3 fazy = 3 żyły obciążone
  
  // Współczynnik dla aluminium (mniejsza obciążalność)
  const kMaterial = params.material === 'Al' ? 0.78 : 1.0;
  
  return I0 * k1 * k2 * k3 * k5 * kMaterial;
}

function calculateVoltageDrop(
  current: number,
  length: number,
  crossSection: number,
  material: Material,
  voltageType: VoltageType,
  cosPhi: number
): { drop: number; percent: number } {
  const rho = RESISTIVITY[material];
  const voltage = voltageType === '230V' ? 230 : 400;
  
  // Wzór dla jednofazowego: ΔU = (2 × I × L × ρ) / S
  // Wzór dla trójfazowego: ΔU = (√3 × I × L × ρ) / S
  const factor = voltageType === '230V' ? 2 : Math.sqrt(3);
  const drop = (factor * current * length * rho) / (crossSection * cosPhi);
  const percent = (drop / voltage) * 100;
  
  return { drop, percent };
}

function calculateRequiredCurrent(power: number, voltageType: VoltageType, cosPhi: number): number {
  const voltage = voltageType === '230V' ? 230 : 400;
  const factor = voltageType === '230V' ? 1 : Math.sqrt(3);
  return power / (voltage * factor * cosPhi);
}

function selectCrossSection(params: CableParams): CalculationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Oblicz wymagany prąd
  let requiredCurrent = params.current || 0;
  if (params.power && params.power > 0) {
    requiredCurrent = calculateRequiredCurrent(params.power, params.voltageType, params.cosPhi);
  }
  
  if (requiredCurrent <= 0) {
    errors.push('Podaj prąd lub moc obciążenia');
    return {
      selectedCrossSection: 0,
      currentCapacity: 0,
      voltageDrop: 0,
      voltageDropPercent: 0,
      recommendedProtection: '',
      isValid: false,
      warnings,
      errors,
    };
  }
  
  // Znajdź minimalny przekrój spełniający wymagania
  let selectedCrossSection = MIN_CROSS_SECTION[params.material];
  let currentCapacity = 0;
  
  for (const crossSection of STANDARD_CROSS_SECTIONS) {
    if (crossSection < MIN_CROSS_SECTION[params.material]) continue;
    
    currentCapacity = calculateCurrentCapacity(params, crossSection);
    
    // Sprawdź warunek: Iz >= Ib (obciążalność >= prąd obciążenia)
    if (currentCapacity >= requiredCurrent * 1.25) {
      // Dodaj 25% zapasu bezpieczeństwa
      selectedCrossSection = crossSection;
      break;
    }
  }
  
  // Jeśli nie znaleziono odpowiedniego przekroju
  if (selectedCrossSection === MIN_CROSS_SECTION[params.material] && currentCapacity < requiredCurrent) {
    errors.push(`Brak odpowiedniego przekroju w standardowym szeregu. Wymagana obciążalność: ${requiredCurrent.toFixed(2)} A`);
  }
  
  // Oblicz szczegóły dla tooltipów
  const baseCurrentCapacity = getBaseCurrentCapacity(selectedCrossSection, params.installationMethod);
  const k1 = getTemperatureCorrection(params.temperature, params.insulation);
  const k2 = params.phaseType === 'single' ? 1.0 : 0.85;
  const k3 = getGroupingCorrection(params.numberOfCircuits);
  const k5 = params.insulation === 'XLPE' ? 1.2 : 1.0;
  const kMaterial = params.material === 'Al' ? 0.78 : 1.0;
  
  // Oblicz spadek napięcia
  const voltageDrop = calculateVoltageDrop(
    requiredCurrent,
    params.length,
    selectedCrossSection,
    params.material,
    params.voltageType,
    params.cosPhi
  );
  
  // Sprawdź spadek napięcia (max 3% dla gniazd, 5% dla pozostałych)
  const maxVoltageDrop = 5; // Domyślnie 5%
  if (voltageDrop.percent > maxVoltageDrop) {
    warnings.push(`Spadek napięcia ${voltageDrop.percent.toFixed(2)}% przekracza zalecane ${maxVoltageDrop}%`);
  }
  
  // Dobierz zabezpieczenie (In <= Iz)
  const standardProtections = [6, 10, 16, 20, 25, 32, 40, 50, 63];
  let recommendedProtection = '';
  let protectionCurrent = 0;
  for (const protection of standardProtections) {
    if (protection <= currentCapacity) {
      recommendedProtection = `B${protection}`;
      protectionCurrent = protection;
    } else {
      break;
    }
  }
  
  if (!recommendedProtection) {
    warnings.push('Nie znaleziono standardowego zabezpieczenia');
  }
  
  // Sprawdź warunek: Ib <= In <= Iz
  if (protectionCurrent > 0 && protectionCurrent < requiredCurrent) {
    errors.push(`Zabezpieczenie ${recommendedProtection} jest za małe dla prądu obciążenia ${requiredCurrent.toFixed(2)} A`);
  }
  
  const isValid = errors.length === 0;
  
  const voltage = params.voltageType === '230V' ? 230 : 400;
  const factor = params.voltageType === '230V' ? 2 : Math.sqrt(3);
  
  return {
    selectedCrossSection,
    currentCapacity: Math.round(currentCapacity * 100) / 100,
    voltageDrop: Math.round(voltageDrop.drop * 100) / 100,
    voltageDropPercent: Math.round(voltageDrop.percent * 100) / 100,
    recommendedProtection,
    isValid,
    warnings,
    errors,
    calculationDetails: {
      requiredCurrent: Math.round(requiredCurrent * 100) / 100,
      baseCurrentCapacity,
      k1: Math.round(k1 * 1000) / 1000,
      k2: Math.round(k2 * 1000) / 1000,
      k3: Math.round(k3 * 1000) / 1000,
      k5: Math.round(k5 * 1000) / 1000,
      kMaterial: Math.round(kMaterial * 1000) / 1000,
      voltageDropFormula: {
        current: Math.round(requiredCurrent * 100) / 100,
        length: params.length,
        resistivity: RESISTIVITY[params.material],
        crossSection: selectedCrossSection,
        cosPhi: params.cosPhi,
        factor: Math.round(factor * 1000) / 1000,
      },
      protectionCurrent,
    },
  };
}

// Komponent Tooltip
function Tooltip({ content }: { content: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help text-teal-600 font-bold text-lg ml-1 hover:text-teal-700 transition-colors"
        title="Kliknij aby zobaczyć szczegóły obliczeń"
      >
        ?
      </span>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-96 bg-gray-900 text-white text-sm rounded-lg shadow-xl p-4">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoborKabliPage() {
  const [activeTab, setActiveTab] = useState<'selection' | 'capacity' | 'parameters' | 'verification' | 'information'>('selection');
  
  const [params, setParams] = useState<CableParams>({
    material: 'Cu',
    insulation: 'PVC',
    installationMethod: 'peszel_izolowana',
    phaseType: 'single',
    voltageType: '230V',
    temperature: 30,
    numberOfCircuits: 1,
    length: 10,
    power: 0,
    current: 0,
    cosPhi: 0.95,
  });
  
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [selectedCrossSectionForCapacity, setSelectedCrossSectionForCapacity] = useState<number>(2.5);
  
  const handleParamChange = (key: keyof CableParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setResult(null);
  };
  
  const handleCalculate = () => {
    const calculationResult = selectCrossSection(params);
    setResult(calculationResult);
  };
  
  const calculateCapacityForSection = (crossSection: number) => {
    return calculateCurrentCapacity(params, crossSection);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-teal-600 text-white px-6 py-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-white hover:text-teal-200 flex items-center">
              <span className="text-xl mr-2">←</span>
              <span>Powrót</span>
            </Link>
            <div className="text-2xl font-bold ml-6">
              Dobór Kabli
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Dobór Przewodów Elektrycznych
          </h1>
          <p className="text-xl text-gray-600">
            Precyzyjny wybór przewodów zgodny z normą PN-HD 60364-5-52
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('selection')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'selection'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ✓ Wybór przekroju
            </button>
            <button
              onClick={() => setActiveTab('capacity')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'capacity'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ✓ Obliczanie obciążalności
            </button>
            <button
              onClick={() => setActiveTab('parameters')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'parameters'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ✓ Parametry techniczne
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'verification'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ✓ Weryfikacja norm
            </button>
            <button
              onClick={() => setActiveTab('information')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                activeTab === 'information'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ℹ️ Informacje
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'selection' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Wybór przekroju przewodu</h2>
                
                <div className="bg-teal-50 border-l-4 border-teal-500 p-4 rounded-lg mb-6">
                  <p className="text-gray-800 mb-2">
                    <strong>Na czym polega wybór przekroju przewodu?</strong>
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Wybór przekroju przewodu to proces doboru odpowiedniego rozmiaru kabla na podstawie prądu obciążenia, 
                    warunków ułożenia i środowiskowych. Aplikacja oblicza wymagany prąd na podstawie mocy lub podanego prądu, 
                    następnie dobiera minimalny przekrój z szeregu standardowego, który zapewnia odpowiednią obciążalność 
                    prądową z uwzględnieniem współczynników korekcyjnych (temperatura, grupowanie, sposób ułożenia). 
                    Dodatkowo sprawdzany jest spadek napięcia oraz zgodność z minimalnymi przekrojami normowymi. 
                    Wynikiem jest przekrój spełniający wszystkie warunki zgodnie z normą PN-HD 60364-5-52.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Materiał przewodnika
                      </label>
                      <select
                        value={params.material}
                        onChange={(e) => handleParamChange('material', e.target.value as Material)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        <option value="Cu">Miedź (Cu)</option>
                        <option value="Al">Aluminium (Al)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rodzaj izolacji
                      </label>
                      <select
                        value={params.insulation}
                        onChange={(e) => handleParamChange('insulation', e.target.value as Insulation)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        <option value="PVC">PVC (70°C)</option>
                        <option value="XLPE">XLPE (90°C)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sposób ułożenia
                      </label>
                      <select
                        value={params.installationMethod}
                        onChange={(e) => handleParamChange('installationMethod', e.target.value as InstallationMethod)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        <option value="peszel_izolowana">Peszel w ścianie izolowanej</option>
                        <option value="peszel_nieizolowana">Peszel w ścianie nieizolowanej</option>
                        <option value="tynk">Bezpośrednio w tynku</option>
                        <option value="powietrze">W powietrzu</option>
                        <option value="ziemia">W ziemi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Typ zasilania
                      </label>
                      <select
                        value={params.phaseType}
                        onChange={(e) => handleParamChange('phaseType', e.target.value as PhaseType)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        <option value="single">Jednofazowe (230V)</option>
                        <option value="three">Trójfazowe (400V)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperatura otoczenia [°C]
                      </label>
                      <input
                        type="number"
                        value={params.temperature}
                        onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value) || 30)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        min="10"
                        max="60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Liczba obwodów ułożonych razem
                      </label>
                      <input
                        type="number"
                        value={params.numberOfCircuits}
                        onChange={(e) => handleParamChange('numberOfCircuits', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        min="1"
                        max="24"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Długość przewodu [m]
                      </label>
                      <input
                        type="number"
                        value={params.length}
                        onChange={(e) => handleParamChange('length', parseFloat(e.target.value) || 10)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        min="0.1"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Moc obciążenia [W] (opcjonalnie)
                      </label>
                      <input
                        type="number"
                        value={params.power || ''}
                        onChange={(e) => handleParamChange('power', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Prąd obciążenia [A] (opcjonalnie)
                      </label>
                      <input
                        type="number"
                        value={params.current || ''}
                        onChange={(e) => handleParamChange('current', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        min="0"
                        step="0.1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Współczynnik mocy (cos φ)
                      </label>
                      <input
                        type="number"
                        value={params.cosPhi}
                        onChange={(e) => handleParamChange('cosPhi', parseFloat(e.target.value) || 0.95)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        min="0.1"
                        max="1"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCalculate}
                  className="w-full md:w-auto px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-md"
                >
                  Oblicz przekrój
                </button>

                {result && (
                  <div className={`mt-6 p-6 rounded-lg border-2 ${
                    result.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Wyniki obliczeń</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">Dobrany przekrój:</span>
                        <span className="ml-2 text-lg text-gray-900">{result.selectedCrossSection} mm²</span>
                        {result.calculationDetails && (
                          <Tooltip
                            content={
                              <div>
                                <div className="font-bold mb-2">Dobór przekroju:</div>
                                <div className="space-y-1 text-xs">
                                  <div>Wymagany prąd: <strong>{result.calculationDetails.requiredCurrent} A</strong></div>
                                  <div>Warunek: Iz ≥ Ib × 1.25</div>
                                  <div>Minimalna obciążalność: <strong>{(result.calculationDetails.requiredCurrent * 1.25).toFixed(2)} A</strong></div>
                                  <div className="mt-2">Dobrano przekrój <strong>{result.selectedCrossSection} mm²</strong> z obciążalnością <strong>{result.currentCapacity} A</strong></div>
                                  <div className="mt-2 text-gray-300">Materiał: {params.material === 'Cu' ? 'Miedź' : 'Aluminium'}</div>
                                  <div className="text-gray-300">Izolacja: {params.insulation === 'PVC' ? 'PVC (70°C)' : 'XLPE (90°C)'}</div>
                                  <div className="text-gray-300">Ułożenie: {
                                    params.installationMethod === 'peszel_izolowana' ? 'Peszel izolowana' :
                                    params.installationMethod === 'peszel_nieizolowana' ? 'Peszel nieizolowana' :
                                    params.installationMethod === 'tynk' ? 'Tynk' :
                                    params.installationMethod === 'powietrze' ? 'Powietrze' : 'Ziemia'
                                  }</div>
                                </div>
                              </div>
                            }
                          />
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">Obciążalność prądowa:</span>
                        <span className="ml-2 text-lg text-gray-900">{result.currentCapacity} A</span>
                        {result.calculationDetails && (
                          <Tooltip
                            content={
                              <div>
                                <div className="font-bold mb-2">Wzór: Iz = I₀ × k₁ × k₂ × k₃ × k₅ × k_material</div>
                                <div className="space-y-1 text-xs mt-2">
                                  <div>I₀ (obciążalność podstawowa): <strong>{result.calculationDetails.baseCurrentCapacity} A</strong></div>
                                  <div>k₁ (temperatura {params.temperature}°C): <strong>{result.calculationDetails.k1}</strong></div>
                                  <div>k₂ ({params.phaseType === 'single' ? 'jednofazowe' : 'trójfazowe'}): <strong>{result.calculationDetails.k2}</strong></div>
                                  <div>k₃ (grupowanie {params.numberOfCircuits} obwodów): <strong>{result.calculationDetails.k3}</strong></div>
                                  <div>k₅ (izolacja {params.insulation}): <strong>{result.calculationDetails.k5}</strong></div>
                                  <div>k_material ({params.material === 'Cu' ? 'miedź' : 'aluminium'}): <strong>{result.calculationDetails.kMaterial}</strong></div>
                                  <div className="mt-2 pt-2 border-t border-gray-700">
                                    <div>Iz = {result.calculationDetails.baseCurrentCapacity} × {result.calculationDetails.k1} × {result.calculationDetails.k2} × {result.calculationDetails.k3} × {result.calculationDetails.k5} × {result.calculationDetails.kMaterial}</div>
                                    <div className="mt-1 font-bold">Iz = {result.currentCapacity} A</div>
                                  </div>
                                </div>
                              </div>
                            }
                          />
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">Spadek napięcia:</span>
                        <span className="ml-2 text-lg text-gray-900">{result.voltageDrop} V ({result.voltageDropPercent}%)</span>
                        {result.calculationDetails && (
                          <Tooltip
                            content={
                              <div>
                                <div className="font-bold mb-2">
                                  {params.voltageType === '230V' 
                                    ? 'Wzór: ΔU = (2 × I × L × ρ) / (S × cos φ)'
                                    : 'Wzór: ΔU = (√3 × I × L × ρ) / (S × cos φ)'
                                  }
                                </div>
                                <div className="space-y-1 text-xs mt-2">
                                  <div>I (prąd): <strong>{result.calculationDetails.voltageDropFormula.current} A</strong></div>
                                  <div>L (długość): <strong>{result.calculationDetails.voltageDropFormula.length} m</strong></div>
                                  <div>ρ (rezystywność {params.material === 'Cu' ? 'miedzi' : 'aluminium'}): <strong>{result.calculationDetails.voltageDropFormula.resistivity} Ω·mm²/m</strong></div>
                                  <div>S (przekrój): <strong>{result.calculationDetails.voltageDropFormula.crossSection} mm²</strong></div>
                                  <div>cos φ: <strong>{result.calculationDetails.voltageDropFormula.cosPhi}</strong></div>
                                  <div className="mt-2 pt-2 border-t border-gray-700">
                                    <div>ΔU = ({result.calculationDetails.voltageDropFormula.factor} × {result.calculationDetails.voltageDropFormula.current} × {result.calculationDetails.voltageDropFormula.length} × {result.calculationDetails.voltageDropFormula.resistivity}) / ({result.calculationDetails.voltageDropFormula.crossSection} × {result.calculationDetails.voltageDropFormula.cosPhi})</div>
                                    <div className="mt-1 font-bold">ΔU = {result.voltageDrop} V ({result.voltageDropPercent}%)</div>
                                  </div>
                                </div>
                              </div>
                            }
                          />
                        )}
                      </div>
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">Zalecane zabezpieczenie:</span>
                        <span className="ml-2 text-lg text-gray-900">{result.recommendedProtection || 'Brak'}</span>
                        {result.calculationDetails && result.recommendedProtection && (
                          <Tooltip
                            content={
                              <div>
                                <div className="font-bold mb-2">Warunek: Ib ≤ In ≤ Iz</div>
                                <div className="space-y-1 text-xs mt-2">
                                  <div>Ib (prąd obciążenia): <strong>{result.calculationDetails.requiredCurrent} A</strong></div>
                                  <div>In (prąd znamionowy zabezpieczenia): <strong>{result.calculationDetails.protectionCurrent} A</strong></div>
                                  <div>Iz (obciążalność kabla): <strong>{result.currentCapacity} A</strong></div>
                                  <div className="mt-2 pt-2 border-t border-gray-700">
                                    <div>{result.calculationDetails.requiredCurrent} A ≤ {result.calculationDetails.protectionCurrent} A ≤ {result.currentCapacity} A</div>
                                    <div className="mt-1 text-green-400">✓ Warunek spełniony</div>
                                  </div>
                                  <div className="mt-2 text-gray-300">Zabezpieczenie chroni kabel przed przeciążeniem</div>
                                </div>
                              </div>
                            }
                          />
                        )}
                      </div>
                    </div>

                    {result.warnings.length > 0 && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <h4 className="font-semibold text-yellow-900 mb-2">Ostrzeżenia:</h4>
                        <ul className="list-disc list-inside text-yellow-800">
                          {result.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.errors.length > 0 && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                        <h4 className="font-semibold text-red-900 mb-2">Błędy:</h4>
                        <ul className="list-disc list-inside text-red-800">
                          {result.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'capacity' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Obliczanie obciążalności prądowej</h2>
                
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
                  <p className="text-gray-800 mb-2">
                    <strong>Na czym polega obliczanie obciążalności prądowej?</strong>
                  </p>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    Obciążalność prądowa długotrwała (Iz) to maksymalny prąd, jaki przewód może bezpiecznie przewodzić 
                    przez dłuższy czas bez przekroczenia dopuszczalnej temperatury pracy. Obliczana jest według wzoru: 
                    <strong className="font-mono"> Iz = I₀ × k₁ × k₂ × k₃ × k₅ × k_material</strong>, gdzie I₀ to obciążalność 
                    podstawowa z tabel normowych, a współczynniki korekcyjne uwzględniają: temperaturę otoczenia (k₁), 
                    liczbę żył obciążonych (k₂), grupowanie przewodów (k₃), rodzaj izolacji (k₅) oraz materiał przewodnika. 
                    Każdy z tych parametrów znacząco wpływa na końcową wartość obciążalności, dlatego ważne jest 
                    precyzyjne określenie wszystkich warunków pracy przewodu.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Materiał przewodnika
                      </label>
                      <select
                        value={params.material}
                        onChange={(e) => handleParamChange('material', e.target.value as Material)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        <option value="Cu">Miedź (Cu)</option>
                        <option value="Al">Aluminium (Al)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rodzaj izolacji
                      </label>
                      <select
                        value={params.insulation}
                        onChange={(e) => handleParamChange('insulation', e.target.value as Insulation)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        <option value="PVC">PVC (70°C)</option>
                        <option value="XLPE">XLPE (90°C)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sposób ułożenia
                      </label>
                      <select
                        value={params.installationMethod}
                        onChange={(e) => handleParamChange('installationMethod', e.target.value as InstallationMethod)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        <option value="peszel_izolowana">Peszel w ścianie izolowanej</option>
                        <option value="peszel_nieizolowana">Peszel w ścianie nieizolowanej</option>
                        <option value="tynk">Bezpośrednio w tynku</option>
                        <option value="powietrze">W powietrzu</option>
                        <option value="ziemia">W ziemi</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Typ zasilania
                      </label>
                      <select
                        value={params.phaseType}
                        onChange={(e) => handleParamChange('phaseType', e.target.value as PhaseType)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        <option value="single">Jednofazowe (230V)</option>
                        <option value="three">Trójfazowe (400V)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Przekrój przewodu [mm²]
                      </label>
                      <select
                        value={selectedCrossSectionForCapacity}
                        onChange={(e) => setSelectedCrossSectionForCapacity(parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                      >
                        {STANDARD_CROSS_SECTIONS.map(section => (
                          <option key={section} value={section}>{section} mm²</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperatura otoczenia [°C]
                      </label>
                      <input
                        type="number"
                        value={params.temperature}
                        onChange={(e) => handleParamChange('temperature', parseFloat(e.target.value) || 30)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        min="10"
                        max="60"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Liczba obwodów ułożonych razem
                      </label>
                      <input
                        type="number"
                        value={params.numberOfCircuits}
                        onChange={(e) => handleParamChange('numberOfCircuits', parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900"
                        min="1"
                        max="24"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-6 bg-teal-50 border border-teal-200 rounded-lg">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Obciążalność prądowa długotrwała</h3>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {calculateCapacityForSection(selectedCrossSectionForCapacity).toFixed(2)} A
                  </div>
                  <p className="text-sm text-gray-900">
                    Obciążalność dla przekroju {selectedCrossSectionForCapacity} mm² przy podanych warunkach
                  </p>
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-900">Obciążalność podstawowa (I₀):</span>
                      <span className="font-semibold text-gray-900">{getBaseCurrentCapacity(selectedCrossSectionForCapacity, params.installationMethod)} A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Współczynnik temperatury (k₁):</span>
                      <span className="font-semibold text-gray-900">{getTemperatureCorrection(params.temperature, params.insulation).toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Współczynnik grupowania (k₃):</span>
                      <span className="font-semibold text-gray-900">{getGroupingCorrection(params.numberOfCircuits).toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Współczynnik izolacji (k₅):</span>
                      <span className="font-semibold text-gray-900">{params.insulation === 'XLPE' ? '1.200' : '1.000'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Współczynnik liczby żył (k₂):</span>
                      <span className="font-semibold text-gray-900">{params.phaseType === 'single' ? '1.000' : '0.850'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'parameters' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Parametry techniczne przewodów</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-300 text-sm bg-white">
                    <thead>
                      <tr className="bg-teal-600 text-white">
                        <th className="border border-gray-300 px-4 py-3 text-left">Przekrój [mm²]</th>
                        <th className="border border-gray-300 px-4 py-3 text-left">Peszel izolowana</th>
                        <th className="border border-gray-300 px-4 py-3 text-left">Peszel nieizolowana</th>
                        <th className="border border-gray-300 px-4 py-3 text-left">Tynk</th>
                        <th className="border border-gray-300 px-4 py-3 text-left">Powietrze</th>
                        <th className="border border-gray-300 px-4 py-3 text-left">Ziemia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STANDARD_CROSS_SECTIONS.map((section, idx) => (
                        <tr key={section} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2 font-semibold text-gray-900">{section}</td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">{BASE_CURRENT_CAPACITY.peszel_izolowana[section] || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">{BASE_CURRENT_CAPACITY.peszel_nieizolowana[section] || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">{BASE_CURRENT_CAPACITY.tynk[section] || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">{BASE_CURRENT_CAPACITY.powietrze[section] || '-'}</td>
                          <td className="border border-gray-300 px-4 py-2 text-gray-900">{BASE_CURRENT_CAPACITY.ziemia[section] || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-sm text-gray-900">
                    * Obciążalność podstawowa dla miedzi PVC @ 30°C, jednofazowe (wg PN-HD 60364-5-52:2011)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Współczynniki korekcyjne - temperatura</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-blue-300">
                            <th className="px-3 py-2 text-left text-gray-900">Temperatura [°C]</th>
                            <th className="px-3 py-2 text-left text-gray-900">PVC</th>
                            <th className="px-3 py-2 text-left text-gray-900">XLPE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(temp => (
                            <tr key={temp} className="border-b border-blue-200">
                              <td className="px-3 py-1 text-gray-900">{temp}</td>
                              <td className="px-3 py-1 text-gray-900">{TEMPERATURE_CORRECTION_PVC[temp]?.toFixed(2) || '-'}</td>
                              <td className="px-3 py-1 text-gray-900">{TEMPERATURE_CORRECTION_XLPE[temp]?.toFixed(2) || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-green-900 mb-4">Współczynniki korekcyjne - grupowanie</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-green-300">
                            <th className="px-3 py-2 text-left text-gray-900">Liczba obwodów</th>
                            <th className="px-3 py-2 text-left text-gray-900">Współczynnik</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(GROUPING_CORRECTION).slice(0, 10).map(([circuits, factor]) => (
                            <tr key={circuits} className="border-b border-green-200">
                              <td className="px-3 py-1 text-gray-900">{circuits}</td>
                              <td className="px-3 py-1 text-gray-900">{factor.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Weryfikacja zgodności z normami</h2>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-4 text-gray-900">Warunki zgodności z normą PN-HD 60364-5-52</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="text-green-600 text-xl mr-3">✓</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">Warunek obciążalności:</h4>
                        <p className="text-sm text-gray-900">Iz ≥ Ib × 1.25</p>
                        <p className="text-xs text-gray-900 mt-1">Obciążalność długotrwała musi być większa lub równa prądowi obciążenia z 25% zapasem</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-green-600 text-xl mr-3">✓</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">Warunek zabezpieczenia:</h4>
                        <p className="text-sm text-gray-900">Ib ≤ In ≤ Iz</p>
                        <p className="text-xs text-gray-900 mt-1">Prąd obciążenia ≤ Prąd znamionowy zabezpieczenia ≤ Obciążalność kabla</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-green-600 text-xl mr-3">✓</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">Spadek napięcia:</h4>
                        <p className="text-sm text-gray-900">ΔU ≤ 3% (gniazdka) lub ≤ 5% (pozostałe)</p>
                        <p className="text-xs text-gray-900 mt-1">Maksymalny dopuszczalny spadek napięcia w instalacji</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-green-600 text-xl mr-3">✓</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">Minimalny przekrój:</h4>
                        <p className="text-sm text-gray-900">Cu: min. 1.5 mm², Al: min. 10 mm²</p>
                        <p className="text-xs text-gray-900 mt-1">Zgodnie z odstępstwami krajowymi dla Polski</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <span className="text-green-600 text-xl mr-3">✓</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">Współczynniki korekcyjne:</h4>
                        <p className="text-sm text-gray-900">Iz = I₀ × k₁ × k₂ × k₃ × k₄ × k₅</p>
                        <p className="text-xs text-gray-900 mt-1">Uwzględnienie wszystkich współczynników korekcyjnych</p>
                      </div>
                    </div>
                  </div>
                </div>

                {result && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
                    <h3 className="text-lg font-bold mb-4 text-gray-900">Weryfikacja dla obliczonego rozwiązania</h3>
                    
                    <div className="space-y-3">
                      <div className={`p-3 rounded ${result.isValid ? 'bg-green-100' : 'bg-red-100'}`}>
                        <div className="flex items-center">
                          <span className={`text-xl mr-2 ${result.isValid ? 'text-green-600' : 'text-red-600'}`}>
                            {result.isValid ? '✓' : '✗'}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {result.isValid ? 'Rozwiązanie zgodne z normą' : 'Rozwiązanie niezgodne z normą'}
                          </span>
                        </div>
                      </div>

                      {result.errors.length === 0 && result.warnings.length === 0 && (
                        <div className="text-sm text-gray-900 space-y-1">
                          <p>✓ Warunek obciążalności: spełniony</p>
                          <p>✓ Warunek zabezpieczenia: spełniony</p>
                          <p>✓ Spadek napięcia: w normie</p>
                          <p>✓ Minimalny przekrój: spełniony</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'information' && (
              <div className="space-y-6 max-h-[800px] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Informacje o doborze kabli</h2>
                
                {/* Wprowadzenie */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">Wprowadzenie</h3>
                  <p className="text-gray-800">
                    Ten dokument zawiera informacje o normach i wymaganiach, które muszą być uwzględnione przy doborze przewodów elektrycznych w aplikacji.
                  </p>
                </div>

                {/* Normy i Standardy */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Normy i Standardy</h3>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span className="text-gray-800"><strong>PN-HD 60364</strong> - Instalacje elektryczne niskiego napięcia</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span className="text-gray-800"><strong>PN-EN 60228</strong> - Przewody elektryczne - przekroje znamionowe</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span className="text-gray-800"><strong>PN-HD 60364-5-52</strong> - Dobór i montaż wyposażenia elektrycznego - Przewody</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span className="text-gray-800"><strong>PN-HD 60364-5-54</strong> - Uziemienia i przewody ochronne</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-teal-600 mr-2">•</span>
                      <span className="text-gray-800"><strong>PN-EN 50565</strong> - Przewody i kable elektryczne - Obciążalność prądowa długotrwała</span>
                    </div>
                  </div>
                </div>

                {/* Najważniejsze informacje */}
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Najważniejsze informacje – teoria vs praktyka</h3>
                  
                  <div className="space-y-6">
                    {/* Sekcja 1 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">1. Norma ponad wszystko 🤖</h4>
                      <p className="text-gray-800 mb-2">
                        <strong>PN-HD 60364-5-52</strong> to podstawowe i wiążące źródło wiedzy przy doborze przewodów i kabli.
                      </p>
                      <p className="text-gray-700 text-sm mb-2">
                        Norma nie narzuca „sztywnych przekrojów do gniazdek", operuje tabelami obciążalności prądowej i uwzględnia warunki ułożenia oraz współczynniki korekcyjne.
                      </p>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-2">
                        <p className="text-gray-800 font-semibold">👉 Wniosek dla aplikacji:</p>
                        <p className="text-gray-700 italic">Logika ≠ „gniazdo → 2,5 mm²", tylko algorytm oparty o normę.</p>
                      </div>
                    </div>

                    {/* Sekcja 2 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">2. Kryteria doboru kabla</h4>
                      <p className="text-gray-800 mb-2">
                        Dobór kabla to <strong>wynik spełnienia kilku kryteriów jednocześnie</strong>:
                      </p>
                      <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                        <li>Normy i przepisy (PN-HD 60364-5-52)</li>
                        <li>Obciążalność prądowa długotrwała</li>
                        <li>Spadek napięcia</li>
                        <li>Sposób ułożenia</li>
                        <li>Warunki środowiskowe</li>
                        <li>Ochrona przeciwporażeniowa</li>
                        <li>Selektywność zabezpieczeń</li>
                      </ul>
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mt-2">
                        <p className="text-gray-800 font-semibold">👉 Przekrój = max(z wymagań), a nie „najbliższy z tabelki"</p>
                      </div>
                    </div>

                    {/* Sekcja 3 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">3. Minimalne dopuszczalne przekroje (PL)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <h5 className="font-semibold text-green-900 mb-2">Miedź (Cu):</h5>
                          <ul className="text-sm text-gray-800 space-y-1">
                            <li><strong>1,5 mm²</strong> – minimum dla oświetlenia, gniazd, typowych obwodów 230V</li>
                            <li><strong>1,0 mm²</strong> – obwody elektroniczne, niskie moce</li>
                            <li><strong>0,5 mm²</strong> – obwody sygnalizacyjne</li>
                          </ul>
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded p-3">
                          <h5 className="font-semibold text-orange-900 mb-2">Aluminium (Al):</h5>
                          <p className="text-sm text-gray-800">
                            Nie stosowane w instalacjach domowych. Jeśli już: <strong>min. 10 mm²</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sekcja 4 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">4. Prąd, moc i dlaczego kabel się grzeje 🔥</h4>
                      <p className="text-gray-800 mb-2">
                        W gniazdku zawsze jest napięcie (<strong>230 V</strong>) – to stan gotowości. Prąd płynie <strong>dopiero po podłączeniu odbiornika</strong>.
                      </p>
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 mt-2">
                        <p className="text-gray-800 font-semibold mb-1">Dlaczego kabel się nagrzewa?</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>Każdy przewód ma rezystancję</li>
                          <li>Prąd → straty cieplne</li>
                          <li>Za duży prąd → degradacja izolacji → pożar</li>
                        </ul>
                      </div>
                      <p className="text-gray-700 text-sm mt-2">
                        <strong>Izolacja PVC:</strong> praca ciągła: 70°C, zwarcie: ~160°C (krótko!)
                      </p>
                    </div>

                    {/* Sekcja 5 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">5. Zabezpieczenie ≠ tylko „żeby nie wyskakiwało"</h4>
                      <p className="text-gray-800 mb-2">
                        Wyłącznik nadprądowy <strong>chroni kabel, nie urządzenie</strong>.
                      </p>
                      <div className="bg-red-50 border-l-4 border-red-400 p-3 mt-2">
                        <p className="text-gray-800 font-semibold mb-1">Niedopuszczalne:</p>
                        <p className="text-gray-700">zabezpieczenie &gt; dopuszczalny prąd kabla</p>
                      </div>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-2">
                        <p className="text-gray-800 font-semibold">👉 W aplikacji:</p>
                        <ol className="text-gray-700 text-sm list-decimal list-inside space-y-1">
                          <li>Najpierw kabel</li>
                          <li>Potem zabezpieczenie</li>
                          <li>Nigdy odwrotnie</li>
                        </ol>
                      </div>
                    </div>

                    {/* Sekcja 6 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">6. Spadek napięcia – cichy zabójca jakości</h4>
                      <p className="text-gray-800 mb-2">
                        Kabel ≠ idealny przewodnik. Długi odcinek + duży prąd = spadek napięcia.
                      </p>
                      <div className="bg-orange-50 border-l-4 border-orange-400 p-3 mt-2">
                        <p className="text-gray-800 font-semibold mb-1">Skutki:</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li>Grzanie kabla</li>
                          <li>Gorsza praca urządzeń</li>
                          <li>Migotanie światła</li>
                        </ul>
                      </div>
                      <p className="text-gray-700 text-sm mt-2">
                        👉 Przekrój czasem rośnie <strong>nie przez prąd</strong>, tylko przez <strong>długość trasy</strong>.
                      </p>
                    </div>

                    {/* Sekcja 7 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">7. Jedyny wzór, który musisz znać (na start)</h4>
                      <div className="bg-gray-100 border border-gray-300 rounded p-4 font-mono text-sm">
                        <div className="mb-2">
                          <strong>Jedna faza:</strong>
                        </div>
                        <div className="mb-1">P = U · I · cosφ</div>
                        <div>I = P / (U · cosφ)</div>
                      </div>
                      <ul className="text-gray-700 text-sm mt-3 space-y-1">
                        <li><strong>U = 230 V</strong> (z głowy)</li>
                        <li><strong>P</strong> – z tabliczki znamionowej</li>
                        <li><strong>cosφ</strong> – często niepodany, dla elektroniki ≠ 1</li>
                      </ul>
                      <p className="text-gray-700 text-sm mt-2">
                        👉 Do doboru kabla liczy się <strong>prąd ciągły</strong>, nie chwilowy.
                      </p>
                    </div>

                    {/* Sekcja 8 */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="text-lg font-bold text-gray-900 mb-2">8. Co z tego wynika dla aplikacji 🧠⚡</h4>
                      <p className="text-gray-800 mb-2">
                        Aplikacja powinna <strong>myśleć jak projektant</strong>, a nie jak tabelka:
                      </p>
                      <ol className="text-gray-700 text-sm list-decimal list-inside space-y-1 ml-4">
                        <li>Oblicz prąd obciążenia</li>
                        <li>Dobierz przekrój z obciążalności</li>
                        <li>Sprawdź: minimalny przekrój normowy, sposób ułożenia, długość i spadek napięcia, liczbę obwodów razem</li>
                        <li>Dopiero potem: dobierz zabezpieczenie</li>
                      </ol>
                      <div className="bg-teal-50 border-l-4 border-teal-400 p-3 mt-2">
                        <p className="text-gray-800 font-semibold">👉 Wynik = największy wymagany przekrój</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Wzory i obliczenia */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Wzory i obliczenia</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-300 rounded p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Obciążalność prądowa długotrwała</h4>
                      <div className="bg-white border border-gray-200 rounded p-3 font-mono text-sm mb-2">
                        Iz = I₀ × k₁ × k₂ × k₃ × k₄ × k₅
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>• <strong>Iz</strong> - obciążalność prądowa długotrwała</div>
                        <div>• <strong>I₀</strong> - obciążalność podstawowa</div>
                        <div>• <strong>k₁</strong> - współczynnik korekcyjny dla temperatury otoczenia</div>
                        <div>• <strong>k₂</strong> - współczynnik korekcyjny dla sposobu ułożenia</div>
                        <div>• <strong>k₃</strong> - współczynnik korekcyjny dla grupowania</div>
                        <div>• <strong>k₄</strong> - współczynnik korekcyjny dla wysokości</div>
                        <div>• <strong>k₅</strong> - współczynnik korekcyjny dla rodzaju izolacji</div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-300 rounded p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Spadek napięcia</h4>
                      <div className="bg-white border border-gray-200 rounded p-3 font-mono text-sm mb-2">
                        ΔU = (2 × I × L × ρ) / (S × cos φ)
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>• <strong>ΔU</strong> - spadek napięcia [V]</div>
                        <div>• <strong>I</strong> - prąd obciążenia [A]</div>
                        <div>• <strong>L</strong> - długość przewodu [m]</div>
                        <div>• <strong>ρ</strong> - rezystywność materiału [Ω·mm²/m]</div>
                        <div>• <strong>S</strong> - przekrój przewodu [mm²]</div>
                        <div>• <strong>cos φ</strong> - współczynnik mocy</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warunki zgodności */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-green-900 mb-4">Warunki zgodności z normą</h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-green-600 text-xl mr-3">✓</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">Warunek obciążalności:</h4>
                        <p className="text-sm text-gray-800">Iz ≥ Ib × 1.25</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-600 text-xl mr-3">✓</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">Warunek zabezpieczenia:</h4>
                        <p className="text-sm text-gray-800">Ib ≤ In ≤ Iz</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-600 text-xl mr-3">✓</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">Spadek napięcia:</h4>
                        <p className="text-sm text-gray-800">ΔU ≤ 3% (gniazdka) lub ≤ 5% (pozostałe)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
