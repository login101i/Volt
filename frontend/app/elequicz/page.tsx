'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Question {
  id: number;
  question: string;
  answer: string;
  category?: string;
}

// Component to render formatted answer with markdown-like formatting
function AnswerRenderer({ answer }: { answer: string }) {
  const lines = answer.split('\n');
  const elements: JSX.Element[] = [];
  let key = 0;
  let tableRows: string[] = [];
  let inTable = false;

  const renderText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();
    
    // Check if this is a table row
    if (trimmedLine.includes('|') && trimmedLine.startsWith('|')) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(trimmedLine);
    } else {
      // If we were in a table, render it first
      if (inTable && tableRows.length > 0) {
        const tableData = tableRows.map(row => row.split('|').filter(cell => cell.trim()));
        if (tableData.length > 0 && tableData[0].length > 0) {
          elements.push(
            <div key={`table-${key++}`} className="mt-4 mb-4 overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm bg-white">
                <thead>
                  <tr className="bg-gray-100">
                    {tableData[0].map((cell, cellIndex) => (
                      <th key={cellIndex} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">
                        {cell.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-3 py-2">
                          {cell.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        tableRows = [];
        inTable = false;
      }
      
      // Render regular line
      if (trimmedLine) {
        elements.push(
          <div key={`line-${key++}`} className="mb-2">
            {renderText(trimmedLine)}
          </div>
        );
      } else if (lineIndex < lines.length - 1) {
        // Empty line for spacing
        elements.push(<div key={`empty-${key++}`} className="h-2" />);
      }
    }
  });

  // Render any remaining table
  if (inTable && tableRows.length > 0) {
    const tableData = tableRows.map(row => row.split('|').filter(cell => cell.trim()));
    if (tableData.length > 0 && tableData[0].length > 0) {
      elements.push(
        <div key={`table-${key++}`} className="mt-4 mb-4 overflow-x-auto">
          <table className="min-w-full border border-gray-300 text-sm bg-white">
            <thead>
              <tr className="bg-gray-100">
                {tableData[0].map((cell, cellIndex) => (
                  <th key={cellIndex} className="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-800">
                    {cell.trim()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 px-3 py-2">
                      {cell.trim()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }

  return <div className="space-y-1">{elements}</div>;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'Czy w instalacji elektrycznej gdy dążymy podzielić PEN, jeśli ten przewód jest mniejszy niż 10mm² dla miedzi, czy możemy go podzielić na PE i N?',
    answer: 'Nie, nie można podzielić przewodu PEN na PE i N, jeśli przekrój przewodu jest mniejszy niż 10mm² dla miedzi (lub 16mm² dla aluminium). Zgodnie z normą PN-HD 60364-5-54, podział przewodu PEN na przewody PE i N jest dozwolony tylko wtedy, gdy przekrój przewodu PEN wynosi co najmniej 10mm² dla miedzi lub 16mm² dla aluminium. W przypadku mniejszych przekrojów przewód PEN musi pozostać jako jeden przewód ochronno-neutralny.',
    category: 'Instalacje elektryczne'
  },
  {
    id: 2,
    question: 'Jaki przewód odprowadzający do uziomu dla ogranicznika przepięć typu 1 i 2?',
    answer: `**Przewód odprowadzający do ogranicznika przepięć (SPD)**

**Typ 1:** Cu min. 16 mm² → do GSU / uziomu

**Typ 2:** Cu min. 6 mm² → do PE / GSU

Zawsze jak najkrótszy, bez pętli

**Przewody przyłączeniowe do SPD (L, N, PE)**

**Typ 1:** Cu min. 16 mm²

**Typ 2:** Cu min. 6 mm²

Suma długości przewodów L + PE ≤ 0,5 m

**Zasada końcowa:** Ma być grubo, krótko i prosto — SPD tego nie zapomina`,
    category: 'Ograniczniki przepięć'
  },
  {
    id: 3,
    question: 'Jaki jest minimalny dopuszczalny przekrój przewodu miedzianego w instalacjach elektrycznych w Polsce?',
    answer: `**Minimalne przekroje dla miedzi (Cu) w Polsce:**

**1,5 mm²** – minimum dla:
- oświetlenia
- gniazd
- typowych obwodów 230 V

**1,0 mm²:**
- obwody elektroniczne
- niskie moce
- sterowanie, zasilacze

**0,5 mm²:**
- obwody sygnalizacyjne
- przyciski, sterowanie przekaźników

**Dlaczego minimum 1,5 mm²?**
- nie tylko prąd
- **wytrzymałość mechaniczna** (gięcie, zaciski, montaż)

Zgodnie z normą PN-HD 60364-5-52 i odstępstwami krajowymi dla Polski.`,
    category: 'Dobór kabli'
  },
  {
    id: 4,
    question: 'Jakie są główne kryteria doboru kabla elektrycznego?',
    answer: `Dobór kabla to **wynik spełnienia kilku kryteriów jednocześnie**:

**1. Normy i przepisy**
- PN-HD 60364-5-52
- Warunki techniczne budynków

**2. Wymagania OSD** (przyłącza, WLZ)

**3. Obciążalność prądowa długotrwała**
- Iz = I0 × k1 × k2 × k3 × k4 × k5
- gdzie k1-k5 to współczynniki korekcyjne

**4. Spadek napięcia**
- ΔU = (2 × I × L × ρ) / (S × cos φ)
- maksymalnie 3% dla obwodów gniazdowych
- maksymalnie 5% dla pozostałych

**5. Sposób ułożenia**
- w ścianie, w rurze, w powietrzu
- liczba obwodów ułożonych razem

**6. Warunki środowiskowe**
- temperatura otoczenia
- wilgoć

**7. Ochrona przeciwporażeniowa**
- impedancja pętli zwarcia

**8. Selektywność zabezpieczeń**

👉 **Przekrój = max(z wymagań)**, a nie „najbliższy z tabelki".`,
    category: 'Dobór kabli'
  },
  {
    id: 5,
    question: 'Jak temperatura otoczenia wpływa na obciążalność prądową kabla?',
    answer: `**Temperatura otoczenia – killer obciążalności**

Tabele normowe są dla:
- **30°C otoczenia**
- izolacja PVC: **70°C max**

**Przykład:**
- 2,5 mm² → 26 A @ 30°C
- przy 56–60°C:
  - współczynnik korekcyjny ≈ 0,5
  - realnie tylko **13 A**

**Dlaczego?**
- kabel już „ciepły"
- gorzej oddaje ciepło
- rośnie rezystancja
- spirala śmierci 🔥

**Współczynniki korekcyjne dla temperatury:**
- 30°C → 1,0
- 40°C → 0,87
- 50°C → 0,71
- 60°C → 0,52

👉 **Aplikacja MUSI uwzględniać współczynniki temperaturowe**, inaczej w piekarni wyjdzie „dom jednorodzinny" 😉`,
    category: 'Dobór kabli'
  },
  {
    id: 6,
    question: 'Jak sposób ułożenia kabla wpływa na jego obciążalność prądową?',
    answer: `**Sposób ułożenia – różnice rzędu amperów**

Ta sama żyła 2,5 mm²:
- w peszlu w ścianie → ~21 A
- na ścianie → ~25 A
- w tynku / murze → ~29 A
- w powietrzu → jeszcze więcej

**Norma PN-HD 60364-5-52:**
- **73 sposoby ułożenia kabli**
- każdy ma inną obciążalność

**Przykład praktyczny:**
- 2,5 mm² w peszlu w ścianie → obciążalność ≈ 21 A
- maksymalne zabezpieczenie: **B20**
- ⚠️ B25 = błąd projektowy

**Jednofazowo vs trójfazowo:**
- Jednofazowo: 2 żyły obciążone → wyższa obciążalność
- Trójfazowo: 3 żyły obciążone → żyły grzeją się nawzajem → obciążalność spada

👉 **Przekrój bez sposobu ułożenia = wróżenie z fusów**`,
    category: 'Dobór kabli'
  },
  {
    id: 7,
    question: 'Jaki jest związek między zabezpieczeniem nadprądowym a obciążalnością kabla?',
    answer: `**Złota zasada:**

> Zabezpieczenie chroni kabel, a nie odwrotnie

**Warunek projektowy:**

Iz_kabla >= In_zabezpieczenia >= Ib_obciazenia

gdzie:
- **Iz** – obciążalność prądowa długotrwała kabla
- **In** – prąd znamionowy zabezpieczenia
- **Ib** – prąd obciążenia

**Przykład:**
- kabel: 2,5 mm² w peszlu w ścianie
- obciążalność: ≈ 21 A
- maksymalne zabezpieczenie: **B20**
- ❌ B25 = błąd projektowy

**Dlaczego to ważne?**
- kabel się nagrzewa
- rezystancja rośnie
- izolacja traci właściwości
- 🔥 ryzyko pożaru

**Charakterystyka B / C:**
- NIE wpływa na obciążalność długotrwałą
- dotyczy tylko prądów chwilowych (rozruch, zwarcie)

👉 **Aplikacja MUSI wymuszać warunek:** In <= Iz_kabla`,
    category: 'Dobór kabli'
  },
  {
    id: 8,
    question: 'Jak obliczyć prąd obciążenia dla jednofazowego i trójfazowego odbiornika?',
    answer: `**Jednofazowe obciążenie:**

I = P / (U * cosφ)

gdzie:
- **U = 230 V** (napięcie znamionowe)
- **P** – moc z tabliczki znamionowej [W]
- **cosφ** – współczynnik mocy

**Przykład:**
- P = 2300 W
- cosφ = 0,95
- I = 2300 / (230 × 0,95) ≈ **10,5 A**

**Trójfazowe obciążenie:**

I = P / (√3 * U_LL * cosφ)

gdzie:
- **U_LL = 400 V** (napięcie międzyfazowe)
- **P** – moc [W]

**Przykład silnika:**
- moc znamionowa: 7,5 kW (na wale)
- moc pobierana z sieci: ≈ 9 kW (straty)
- cosφ = 0,85
- I = 9000 / (√3 * 400 * 0,85) ≈ **15,3 A**

**Ważne:**
- Jeśli producent podał prąd → **NIE licz**, użyj wartości z tabliczki
- Prąd z tabliczki uwzględnia już cosφ i straty
- Do doboru kabla liczy się **prąd ciągły**, nie chwilowy

**Typowe wartości cosφ:**
- Odbiorniki rezystancyjne (grzałki) → cosφ = 1
- LED, elektronika → cosφ ≈ 0,95
- Silniki → cosφ ≈ 0,85-0,9
- Jeśli brak danych → przyjmij **cosφ = 0,95**`,
    category: 'Dobór kabli'
  },
  {
    id: 9,
    question: 'Jakie są typowe przekroje kabli dostępne na rynku i jak wybrać właściwy?',
    answer: `**Typowe przekroje produkowane:**

1,5 | 2,5 | 4 | 6 | 10 | 16 | 25 | 35 | 50 | 70 | 95 | 120 | 150...

**Zasada:**
- Jeśli obliczenia dają np. 8 mm² → bierzesz **10 mm²**
- Zawsze wybieramy **najbliższy większy** z typowego szeregu

**Przykłady praktyczne:**

**Silnik 7,5 kW:**
- prąd: ~15,7 A
- teoretycznie: 2,5 mm² + B16
- praktycznie: **4 mm² + B25** (zapas bezpieczeństwa)

**Płyta indukcyjna jednofazowa:**
- moc: 7–7,5 kW
- prąd: ~32 A
- opcje: 6 mm² w ścianie izolowanej lub 4 mm² w tynku
- problem: brak MCB B35, ciasne zaciski
- sensowne: ograniczenie mocy do ~4 kW → 4 mm² + B20/B25

**Dwufazowa płyta indukcyjna:**
- prąd na fazę: ~16 A
- teoretycznie: 2,5 mm²
- praktycznie: **4 mm² + B25** (spokój psychiczny + termiczny)

**Naświetlacz LED 500 W:**
- prąd: bardzo mały
- ale: minimalny przekrój normowy **1,5 mm²** (wytrzymałość mechaniczna)

👉 **Zawsze lepiej grubszy kabel + mniejsze zabezpieczenie niż kabel na styk**`,
    category: 'Dobór kabli'
  },
  {
    id: 10,
    question: 'Jakie są różnice między izolacją PVC a XLPE i jak wpływają na dobór kabla?',
    answer: `**Izolacja PVC (polichlorek winylu):**

- temperatura pracy: **70°C**
- temperatura zwarcia: ~**160°C** (krótko!)
- standardowa izolacja w instalacjach domowych
- brak odporności na UV
- słońce → żółknie, kruszeje, traci izolację

**Izolacja XLPE (polietylen sieciowany):**

- temperatura pracy: **90°C**
- obciążalność nawet **+20%** w porównaniu do PVC
- większa odporność termiczna
- wyższa cena

**Przykład:**
- Ten sam przekrój 2,5 mm²
- PVC @ 30°C: ~26 A
- XLPE @ 30°C: ~31 A

**Inne typy kabli:**

**H07RN-F** (guma):
- 90°C
- wysoka odporność na UV, wodę, chemię
- odbiorniki ruchome

**H07R / H07RN:**
- trwalsze niż PVC
- odbiorniki stacjonarne

**YDY:**
- instalacje w ścianie

**OMY / linka:**
- od puszki do urządzenia
- bo urządzenie się rusza

👉 **Aplikacja powinna różnicować obciążalność po izolacji, nie tylko po mm²**`,
    category: 'Dobór kabli'
  }
];

export default function EleQuiczPage() {
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestionId(expandedQuestionId === questionId ? null : questionId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 text-white px-6 py-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-white hover:text-indigo-200 flex items-center">
              <span className="text-xl mr-2">←</span>
              <span>Powrót</span>
            </Link>
            <div className="text-2xl font-bold ml-6">
              EleQuicz
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Pytania i Odpowiedzi
          </h1>
          <p className="text-xl text-gray-600">
            Instalacje Elektryczne
          </p>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {QUESTIONS.map((question) => {
            const isExpanded = expandedQuestionId === question.id;
            return (
              <div
                key={question.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Question Header */}
                <button
                  onClick={() => toggleQuestion(question.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-indigo-600 font-semibold text-sm">
                        Pytanie {question.id}
                      </span>
                      {question.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {question.category}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 font-medium text-lg">
                      {question.question}
                    </p>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-500 ml-4 flex-shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Answer Content */}
                {isExpanded && (
                  <div className="px-6 py-4 bg-indigo-50 border-t border-indigo-100">
                    <div className="flex items-start gap-3">
                      <div className="text-indigo-600 font-semibold text-sm mt-1">Odpowiedź:</div>
                      <div className="flex-1 text-gray-700 leading-relaxed">
                        <AnswerRenderer answer={question.answer} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Informacja</h3>
              <p className="text-blue-800 text-sm">
                Ta sekcja zawiera pytania i odpowiedzi dotyczące instalacji elektrycznych. 
                Kliknij na pytanie, aby zobaczyć odpowiedź.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}










