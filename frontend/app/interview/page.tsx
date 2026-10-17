'use client';

import React, { useState } from 'react';
import { questions } from './interviewQuestions';
import { questionsPL } from './interviewQuestionsPL';
import { roadmapData, dataEngineerQuestions, dataEngineerConcepts } from './dataEngineerRoadmap';

// --- ADDITION: Certificate tab type ---
type TabType = 'english' | 'polish' | 'roadmap' | 'dataEngineer' | 'fastCutProject' | 'certificates';

const InterviewPractice = () => {
  const [activeTab, setActiveTab] = useState<TabType>('english');
  const [activeQuestion, setActiveQuestion] = useState<number | null>(null);
  const [showAnswers, setShowAnswers] = useState<number | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<string, string>>({});
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState<Record<string, number>>({});
  const [showQuizResult, setShowQuizResult] = useState<Record<string, boolean>>({});
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set(['week4', 'week5']));

  const renderEnglishQuestions = () => (
    <div className="space-y-6 w-full">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">English Version</h2>
      {questions.map((question) => (
        <div key={question.id} className="bg-gray-800 rounded-xl border border-gray-600">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-3">{question.title}</h3>
            <p className="text-gray-300 mb-4">{question.description}</p>

            <div className="flex space-x-4">
              <button
                onClick={() => setActiveQuestion(activeQuestion === question.id ? null : question.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                {activeQuestion === question.id ? 'Hide Example' : 'Show Example'}
              </button>
              <button
                onClick={() => setShowAnswers(showAnswers === question.id ? null : question.id)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                {showAnswers === question.id ? 'Hide Answer' : 'Show Answer'}
              </button>
            </div>

            {activeQuestion === question.id && (
              <div className="mt-6">
                <div className="code-dark" dangerouslySetInnerHTML={{ __html: question.example }} />
                <div className="bg-gray-700 mt-4 p-4 rounded">
                  <h4 className="font-semibold mb-2 text-white">Follow-up Questions:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-300">
                    {question.followUp.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {showAnswers === question.id && (
              <div className="mt-6 bg-gray-700 p-4 rounded">
                <h4 className="font-semibold mb-2 text-white">Sample Answer:</h4>
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-300">{question.sampleAnswer}</pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPolishQuestions = () => (
    <div className="space-y-6 w-full">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Wersja Polska</h2>
      {questionsPL.map((question) => (
        <div key={question.id} className="bg-gray-800 rounded-xl border border-gray-600">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-3">{question.title}</h3>
            <p className="text-gray-300 mb-4">{question.description}</p>

            <div className="flex space-x-4">
              <button
                onClick={() => setActiveQuestion(activeQuestion === question.id ? null : question.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                {activeQuestion === question.id ? 'Ukryj Przykład' : 'Pokaż Przykład'}
              </button>
              <button
                onClick={() => setShowAnswers(showAnswers === question.id ? null : question.id)}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                {showAnswers === question.id ? 'Ukryj Odpowiedź' : 'Pokaż Odpowiedź'}
              </button>
            </div>

            {activeQuestion === question.id && (
              <div className="mt-6">
                <div className="code-dark" dangerouslySetInnerHTML={{ __html: question.example }} />
                <div className="bg-gray-700 mt-4 p-4 rounded">
                  <h4 className="font-semibold mb-2 text-white">Pytania dodatkowe:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-300">
                    {question.followUp.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {showAnswers === question.id && (
              <div className="mt-6 bg-gray-700 p-4 rounded">
                <h4 className="font-semibold mb-2 text-white">Przykładowa odpowiedź:</h4>
                <pre className="whitespace-pre-wrap text-sm font-mono text-gray-300">{question.sampleAnswer}</pre>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderDataEngineerQuestions = () => {
    // Grupuj pytania według kategorii
    const groupedQuestions = dataEngineerQuestions.reduce((acc, q) => {
      if (!acc[q.category]) {
        acc[q.category] = [];
      }
      acc[q.category].push(q);
      return acc;
    }, {} as Record<string, typeof dataEngineerQuestions>);

    return (
      <div className="w-full space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Pytania rekrutacyjne - Data Engineer</h2>
          <p className="text-gray-300">Przygotuj się do rozmowy o pracę jako Data Engineer</p>
        </div>

        {Object.entries(groupedQuestions).map(([category, questions]) => (
          <div key={category} className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4 border-b border-gray-600 pb-2">
              {category}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((q) => (
                <div key={q.id} className="bg-gray-800 rounded-lg border border-gray-600 p-5 hover:border-blue-500 transition-colors">
                  <h4 className="text-lg font-semibold text-white mb-3">{q.question}</h4>
                  <p className="text-sm text-gray-300 mb-2">{q.answer}</p>
                  {q.note && (
                    <p className="text-xs text-yellow-400 mt-3 p-2 bg-yellow-900/20 rounded border border-yellow-600/30">
                      {q.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFastCutProject = () => {
    const projectSections = [
      {
        id: 'requirements',
        title: 'Definicja wymagań funkcjonalnych',
        items: [
          {
            title: 'Zbieranie wymagań od interesariuszy',
            description: 'Przeprowadzenie warsztatów z kluczowymi działami: dział produkcji, dział magazynowy, dział IT, dział sprzedaży. Identyfikacja potrzeb biznesowych związanych z optymalizacją procesu cięcia materiałów, zarządzaniem zamówieniami i kontrolą jakości.',
            details: [
              'Warsztaty z działem produkcji: analiza procesu cięcia materiałów, identyfikacja problemów z optymalizacją, wymagania dotyczące automatyzacji',
              'Warsztaty z działem magazynowym: potrzeby związane z zarządzaniem stanami magazynowymi, śledzeniem materiałów, integracją z systemem ERP',
              'Warsztaty z działem IT: wymagania techniczne, integracja z istniejącymi systemami, bezpieczeństwo danych',
              'Warsztaty z działem sprzedaży: potrzeby klientów dotyczące szybkości realizacji zamówień, śledzenia statusu, personalizacji'
            ]
          },
          {
            title: 'Tworzenie szczegółowych specyfikacji funkcjonalnych',
            description: 'Dokumentacja wymagań dla kluczowych modułów systemu Fast Cut:',
            details: [
              'Moduł zarządzania zamówieniami: proces tworzenia, edycji, śledzenia i realizacji zamówień',
              'Moduł optymalizacji cięcia: algorytmy optymalizacji wykorzystania materiałów, minimalizacja odpadów, wizualizacja planów cięcia',
              'Moduł zarządzania materiałami: katalog materiałów, stany magazynowe, integracja z dostawcami, reguły oklejania i cięcia',
              'Moduł kontroli jakości: walidacja wymiarów detali, reguły biznesowe (min. 50mm dla cięcia, min. 100x100mm dla oklejania), automatyczne blokowanie nieprawidłowych operacji',
              'Moduł integracji CNC: generowanie plików dla maszyn CNC, komunikacja z urządzeniami produkcyjnymi'
            ]
          },
          {
            title: 'Dokumentacja wymagań w formie User Stories i Use Cases',
            description: 'Przygotowanie dokumentacji zgodnie z metodyką Agile:',
            details: [
              'User Stories dla każdego modułu z kryteriami akceptacji',
              'Diagramy przypadków użycia (Use Case) pokazujące interakcje użytkowników z systemem',
              'Scenariusze testowe oparte na User Stories',
              'Definicja wymagań niefunkcjonalnych: wydajność, bezpieczeństwo, skalowalność'
            ]
          }
        ]
      },
      {
        id: 'modeling',
        title: 'Modelowanie procesów (UML / BPMN)',
        items: [
          {
            title: 'Tworzenie diagramów aktywności BPMN',
            description: 'Modelowanie przepływów procesów biznesowych:',
            details: [
              'Diagram przepływu zamówienia: od złożenia przez klienta → walidacja → optymalizacja cięcia → produkcja → kontrola jakości → wysyłka',
              'Diagram procesu optymalizacji cięcia: wprowadzenie wymiarów → walidacja reguł biznesowych → obliczenie optymalnego układu → generowanie planu cięcia → eksport do CNC',
              'Diagram procesu zarządzania materiałami: import z ERP → aktualizacja stanów → powiadomienia o niskich stanach → zamówienia u dostawców',
              'Diagram procesu kontroli jakości: walidacja wymiarów detali → sprawdzenie reguł oklejania/cięcia → wizualna informacja zwrotna → blokowanie nieprawidłowych operacji'
            ]
          },
          {
            title: 'Diagramy klas UML',
            description: 'Modelowanie struktury systemu i relacji między modułami:',
            details: [
              'Diagram klas dla modułu zamówień: Order, OrderItem, Customer, Status z relacjami i atrybutami',
              'Diagram klas dla modułu materiałów: Material, MaterialStock, Supplier, MaterialJoin z relacjami',
              'Diagram klas dla modułu optymalizacji: CuttingPlan, Detail, Board, OptimizationAlgorithm',
              'Diagram klas integracyjnych: ERPIntegration, CNCIntegration, NotificationService',
              'Mapowanie relacji między modułami i zależności logiczne'
            ]
          },
          {
            title: 'Mapowanie procesów biznesowych',
            description: 'Dokumentacja zależności między modułami i przepływów danych:',
            details: [
              'Mapowanie integracji z systemem ERP: synchronizacja produktów, stanów magazynowych, cen',
              'Mapowanie integracji z systemem płatności: obsługa płatności online, statusy płatności, powiadomienia',
              'Mapowanie integracji z maszynami CNC: formaty plików, protokoły komunikacji, obsługa błędów',
              'Dokumentacja przepływów danych między modułami: API endpoints, formaty wymiany danych, kolejki zdarzeń'
            ]
          }
        ]
      },
      {
        id: 'documentation',
        title: 'Przygotowanie dokumentacji biznesowej i technicznej',
        items: [
          {
            title: 'Dokumentacja logiki biznesowej',
            description: 'Szczegółowy opis reguł biznesowych i procesów:',
            details: [
              'Reguły walidacji wymiarów: minimum 50mm dla operacji cięcia, minimum 100x100mm dla oklejania',
              'Reguły optymalizacji: algorytmy minimalizacji odpadów, maksymalizacja wykorzystania materiałów',
              'Reguły kontroli jakości: automatyczne blokowanie nieprawidłowych operacji, wizualna informacja zwrotna (czerwony kolor dla błędów)',
              'Reguły integracji: synchronizacja danych z ERP, obsługa błędów komunikacji, retry logic'
            ]
          },
          {
            title: 'Dokumentacja wymagań funkcjonalnych i niefunkcjonalnych',
            description: 'Kompleksowa dokumentacja wymagań systemu:',
            details: [
              'Wymagania funkcjonalne: szczegółowy opis wszystkich funkcji modułów',
              'Wymagania niefunkcjonalne: wydajność (obsługa dużych zamówień), bezpieczeństwo (autoryzacja, szyfrowanie), skalowalność, dostępność',
              'Wymagania integracyjne: formaty API, protokoły komunikacji, standardy danych',
              'Wymagania użytkowe: responsywny interfejs, intuicyjna nawigacja, wsparcie wielu języków (PL/ENG/ESP)'
            ]
          },
          {
            title: 'Instrukcje dla zespołu developerskiego i QA',
            description: 'Dokumentacja techniczna wspierająca rozwój i testowanie:',
            details: [
              'Instrukcje dla deweloperów: architektura systemu, standardy kodowania, wzorce projektowe, API documentation',
              'Instrukcje dla QA: scenariusze testowe, przypadki testowe, wymagania dotyczące testów automatycznych i manualnych',
              'Dokumentacja integracji: przykłady użycia API, formaty danych, obsługa błędów',
              'Dokumentacja wdrożenia: wymagania środowiskowe, procedury instalacji, konfiguracja systemu'
            ]
          },
          {
            title: 'Raporty integracyjne dla zespołu testów i wdrożenia',
            description: 'Dokumentacja wspierająca proces testowania i wdrożenia:',
            details: [
              'Raporty integracyjne: mapowanie endpointów API, formaty wymiany danych (JSON/XML), schematy walidacji',
              'Dokumentacja testów integracyjnych: scenariusze testowe dla integracji z ERP, CNC, systemem płatności',
              'Raporty wdrożeniowe: checklisty wdrożenia, procedury rollback, plan migracji danych',
              'Dokumentacja monitoringu: metryki wydajności, logi systemowe, alerty'
            ]
          }
        ]
      },
      {
        id: 'collaboration',
        title: 'Współpraca z różnymi zespołami',
        items: [
          {
            title: 'Koordynacja pracy z programistami, testerami, architektami',
            description: 'Zarządzanie współpracą między zespołami technicznymi:',
            details: [
              'Regularne spotkania z zespołem developerskim: wyjaśnianie wymagań, rozwiązywanie wątpliwości technicznych, weryfikacja implementacji',
              'Współpraca z testerami: przygotowanie scenariuszy testowych, weryfikacja zgodności z wymaganiami, analiza raportów błędów',
              'Współpraca z architektami systemów: projektowanie integracji, definiowanie standardów, optymalizacja architektury',
              'Koordynacja między zespołami: synchronizacja prac, zarządzanie zależnościami, komunikacja zmian'
            ]
          },
          {
            title: 'Organizowanie warsztatów i spotkań z klientem',
            description: 'Walidacja wymagań i zbieranie feedbacku:',
            details: [
              'Warsztaty walidacyjne: prezentacja prototypów, zbieranie feedbacku od użytkowników końcowych',
              'Spotkania z klientem (firma SAS): prezentacja postępów, weryfikacja zgodności z wymaganiami biznesowymi, akceptacja funkcjonalności',
              'Sesje testowe z użytkownikami: obserwacja użycia systemu, identyfikacja problemów UX, zbieranie sugestii ulepszeń',
              'Dokumentacja feedbacku: rejestrowanie uwag, priorytetyzacja zmian, planowanie iteracji'
            ]
          },
          {
            title: 'Udział w sprintach SCRUM jako Product Owner proxy',
            description: 'Zarządzanie produktem w metodyce Agile:',
            details: [
              'Przygotowanie backlogu produktowego: definicja User Stories, priorytetyzacja zadań, szacowanie story points',
              'Udział w Daily Standups: monitorowanie postępów, identyfikacja blokad, koordynacja działań',
              'Udział w Sprint Planning: planowanie sprintów, definicja Definition of Done, alokacja zasobów',
              'Udział w Sprint Review: prezentacja ukończonych funkcjonalności, zbieranie feedbacku, planowanie kolejnych iteracji',
              'Udział w Retrospective: analiza procesu, identyfikacja obszarów do poprawy, implementacja zmian',
              'Rozwiązywanie wątpliwości technicznych: szybka odpowiedź na pytania zespołu, podejmowanie decyzji biznesowych'
            ]
          }
        ]
      },
      {
        id: 'results',
        title: 'Efekty wdrożenia',
        items: [
          {
            title: 'System wdrożony w terminie, zgodnie z wymaganiami biznesowymi',
            description: 'Sukces wdrożenia systemu Fast Cut w firmie SAS:',
            details: [
              'Terminowe wdrożenie wszystkich zaplanowanych modułów zgodnie z harmonogramem projektu',
              'Pełna zgodność z wymaganiami biznesowymi zdefiniowanymi na początku projektu',
              'Wszystkie funkcjonalności przetestowane i zaakceptowane przez klienta',
              'Kompletna dokumentacja techniczna i biznesowa dostarczona wraz z systemem'
            ]
          },
          {
            title: 'Skrócenie czasu realizacji zamówienia o 30% dzięki automatyzacji',
            description: 'Wymierne korzyści biznesowe z wdrożenia:',
            details: [
              'Automatyzacja procesu optymalizacji cięcia: redukcja czasu planowania z kilku godzin do kilku minut',
              'Automatyczna walidacja wymiarów i reguł biznesowych: eliminacja błędów na etapie projektowania',
              'Integracja z maszynami CNC: bezpośrednie przekazywanie planów cięcia, eliminacja ręcznego wprowadzania danych',
              'Automatyzacja zarządzania stanami magazynowymi: redukcja czasu na aktualizację danych',
              'Wynik: średni czas realizacji zamówienia skrócony z 5 dni do 3.5 dnia (redukcja o 30%)'
            ]
          },
          {
            title: 'Zminimalizowanie błędów produkcyjnych o 40% dzięki walidacji i kontroli jakości',
            description: 'Poprawa jakości procesów produkcyjnych:',
            details: [
              'Automatyczna walidacja wymiarów detali przed rozpoczęciem produkcji: eliminacja błędów związanych z nieprawidłowymi wymiarami',
              'Reguły biznesowe zaimplementowane w systemie: automatyczne blokowanie operacji cięcia dla detali < 50mm i oklejania dla detali < 100x100mm',
              'Wizualna informacja zwrotna: czerwony kolor dla nieprawidłowych operacji, natychmiastowe ostrzeżenia dla użytkowników',
              'Kontrola jakości na każdym etapie: od projektowania przez optymalizację do produkcji',
              'Wynik: redukcja błędów produkcyjnych z 15% do 9% (redukcja o 40%), co przekłada się na mniejsze straty materiałów i czasu'
            ]
          },
          {
            title: 'Optymalizacja wykorzystania materiałów - redukcja odpadów o 25%',
            description: 'Efektywność wykorzystania zasobów:',
            details: [
              'Zaawansowane algorytmy optymalizacji cięcia: maksymalizacja wykorzystania powierzchni materiałów',
              'Automatyczne obliczanie optymalnego układu detali na płytach: minimalizacja odpadów',
              'Wizualizacja planów cięcia: możliwość ręcznej korekty i optymalizacji',
              'Śledzenie wykorzystania materiałów: raporty i analityka',
              'Wynik: redukcja odpadów produkcyjnych z 20% do 15% (redukcja o 25%), co przekłada się na oszczędności materiałowe'
            ]
          },
          {
            title: 'Pełna dokumentacja XML/XSD i diagramy UML zapewniające łatwą integrację',
            description: 'Dokumentacja wspierająca utrzymanie i rozwój systemu:',
            details: [
              'Kompletna dokumentacja XML/XSD dla integracji z systemami zewnętrznymi: standardowe formaty wymiany danych',
              'Diagramy UML (Use Case, Class Diagrams, Activity Diagrams): pełna dokumentacja architektury i procesów',
              'Dokumentacja API: OpenAPI/Swagger dla wszystkich endpointów REST',
              'Dokumentacja biznesowa: User Stories, reguły biznesowe, procedury operacyjne',
              'Wynik: łatwa integracja z nowymi systemami, szybkie onboardowanie nowych deweloperów, minimalizacja czasu na zrozumienie systemu'
            ]
          }
        ]
      }
    ];

    return (
      <div className="w-full space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Projekt: Wdrożenie systemu Fast Cut w firmie SAS</h2>
          <p className="text-gray-300 text-lg">System optymalizacji cięcia materiałów i zarządzania zamówieniami</p>
          <p className="text-gray-400 text-sm mt-2">Rola: Business Analyst / Product Owner Proxy</p>
        </div>

        {projectSections.map((section) => (
          <div key={section.id} className="bg-gray-800 rounded-xl border border-gray-600 p-6">
            <h3 className="text-2xl font-bold text-white mb-6 border-b border-gray-600 pb-3">
              {section.title}
            </h3>
            <div className="space-y-6">
              {section.items.map((item, idx) => (
                <div key={idx} className="bg-gray-700 rounded-lg p-5 border border-gray-600">
                  <h4 className="text-xl font-semibold text-white mb-3">{item.title}</h4>
                  <p className="text-gray-300 mb-4">{item.description}</p>
                  {item.details && item.details.length > 0 && (
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      {item.details.map((detail, detailIdx) => (
                        <li key={detailIdx} className="text-gray-300 text-sm">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Podsumowanie projektu */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl border border-blue-600 p-6 mt-8">
          <h3 className="text-2xl font-bold text-white mb-4">Podsumowanie projektu</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">Czas trwania</h4>
              <p className="text-gray-300">6 miesięcy</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">Zespół</h4>
              <p className="text-gray-300">8 osób (developers, QA, architekci)</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">Metodologia</h4>
              <p className="text-gray-300">SCRUM (2-tygodniowe sprinty)</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">Technologie</h4>
              <p className="text-gray-300">React/Next.js, Node.js, MySQL, REST API</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  
  const formatDescription = (text: string) => {
    // Format markdown-like syntax to HTML
    const lines = text.split('\n');
    const formatted: JSX.Element[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let inList = false;
    let listItems: JSX.Element[] = [];
    
    lines.forEach((line, index) => {
      // Handle code blocks
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          formatted.push(
            <pre key={`code-${index}`} className="bg-gray-900 p-3 rounded mt-2 mb-2 overflow-x-auto">
              <code className="text-gray-300 text-xs font-mono">{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          // Start code block
          inCodeBlock = true;
        }
        return;
      }
      
      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }
      
      // Handle lists
      if (line.trim().startsWith('- ')) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const content = line.trim().slice(2);
        // Process bold text in list items
        const parts = content.split('**');
        const elements: JSX.Element[] = [];
        parts.forEach((part, i) => {
          if (i % 2 === 0) {
            elements.push(<span key={i}>{part}</span>);
          } else {
            elements.push(<strong key={i} className="text-white font-semibold">{part}</strong>);
          }
        });
        listItems.push(<li key={index} className="ml-4 mb-1 text-gray-300">{elements}</li>);
        return;
      } else {
        // End list if we were in one
        if (inList && listItems.length > 0) {
          formatted.push(<ul key={`list-${index}`} className="list-disc ml-6 mb-2 space-y-1">{listItems}</ul>);
          listItems = [];
          inList = false;
        }
      }
      
      // Handle empty lines
      if (line.trim() === '') {
        formatted.push(<br key={index} />);
        return;
      }
      
      // Handle bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        const elements: JSX.Element[] = [];
        parts.forEach((part, i) => {
          if (i % 2 === 0) {
            elements.push(<span key={i}>{part}</span>);
          } else {
            elements.push(<strong key={i} className="text-white font-semibold">{part}</strong>);
          }
        });
        formatted.push(<p key={index} className="text-gray-300 mb-2">{elements}</p>);
      } else {
        formatted.push(<p key={index} className="text-gray-300 mb-2">{line}</p>);
      }
    });
    
    // Close any remaining list
    if (inList && listItems.length > 0) {
      formatted.push(<ul key="list-final" className="list-disc ml-6 mb-2 space-y-1">{listItems}</ul>);
    }
    
    return formatted;
  };

  const renderRoadmap = () => (
    <div className="w-full space-y-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Data Engineer Roadmap</h2>
          <p className="text-gray-300">16-tygodniowy plan nauki Data Engineering</p>
          <p className="text-gray-400 text-sm mt-2">Tygodnie 4-12: 14-dniowy program Python + S3</p>

        {/* Quick Navigation */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-600">
          <h3 className="text-lg font-semibold text-white mb-3">Szybka nawigacja do tygodnia:</h3>
          <p className="text-gray-400 text-xs mb-3">Tygodnie 4-12: 14-dniowy program Python + S3 z aplikacją Volt</p>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {roadmapData.map((week) => (
              <button
                key={week.id}
                onClick={() => {
                  // Expand the week
                  setExpandedWeeks(prev => new Set([...prev, week.id]));
                  // Scroll to the week after a short delay
                  setTimeout(() => {
                    const element = document.getElementById(week.id);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  week.isBreak
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {week.week.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

      {/* Roadmap Weeks */}
      <div className="space-y-6">
        {roadmapData.map((week) => {
          const isExpanded = expandedWeeks.has(week.id);

          return (
            <div key={week.id} id={week.id} className="bg-gray-800 rounded-xl border border-gray-600 overflow-hidden">
              {/* Clickable Header */}
              <div
                className="flex items-start justify-between p-6 cursor-pointer hover:bg-gray-700 transition-colors border-b border-gray-600"
                onClick={() => {
                  const newExpandedWeeks = new Set(expandedWeeks);
                  if (isExpanded) {
                    newExpandedWeeks.delete(week.id);
                  } else {
                    newExpandedWeeks.add(week.id);
                  }
                  setExpandedWeeks(newExpandedWeeks);
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-white">{week.week}: {week.title}</h3>
                    <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                      ▼
                    </span>
                  </div>
                  <p className="text-gray-300 mt-2">{week.description}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(week.startDate).toLocaleDateString('pl-PL')} - {new Date(week.endDate).toLocaleDateString('pl-PL')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {week.isBreak && (
                    <span className="px-3 py-1 bg-yellow-600 text-white rounded text-sm">Przerwa</span>
                  )}
                </div>
              </div>

              {/* Collapsible Content */}
              <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="px-6 pb-6">

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">Zadania:</h4>
              <div className="space-y-2">
                {week.tasks.map((task) => {
                  const taskKey = `${week.id}-${task.id}`;
                  const isExpanded = expandedTask === taskKey;
                  const isTechnical = ['aws', 'sql', 'python', 'airflow', 'dbt', 'monitoring', 'cicd'].includes(task.category);
                  
                  return (
                    <div key={task.id} className="w-full">
                      <button
                        onClick={() => setExpandedTask(isExpanded ? null : taskKey)}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm text-white transition-all hover:opacity-90 ${
                          isTechnical ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'
                        } ${isExpanded ? 'rounded-b-none' : ''}`}
                      >
                        <span className="flex items-center justify-between">
                          <span className="font-medium">{task.text}</span>
                          <span className="text-xs ml-2">{isExpanded ? '▼' : '▶'}</span>
                        </span>
                      </button>
                      {isExpanded && task.description && (
                        <div className="bg-gray-700 rounded-b-lg p-5 border-t-2 border-gray-600">
                          <div className="text-sm space-y-2">
                            {formatDescription(task.description)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {week.output && (
              <div className="mt-4 p-3 bg-gray-700 rounded">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Output:</span> {week.output}
                </p>
              </div>
            )}

            {/* Detailed Description */}
            {week.detailedDescription && (
              <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                <h4 className="text-lg font-semibold text-white mb-3">Szczegółowy opis tygodnia</h4>
                <div className="text-sm space-y-2">
                  {formatDescription(week.detailedDescription)}
                </div>
              </div>
            )}

            {/* Exercises */}
            {week.exercises && week.exercises.length > 0 && (
              <div className="mt-6 p-4 bg-blue-900/20 rounded-lg border border-blue-600">
                <h4 className="text-lg font-semibold text-white mb-3">Ćwiczenia praktyczne</h4>
                <div className="space-y-4">
                  {week.exercises.map((exercise, idx) => (
                    <div key={idx} className="bg-gray-800 rounded p-4 border border-gray-600">
                      <h5 className="text-md font-semibold text-white mb-2">{exercise.title}</h5>
                      <p className="text-gray-300 text-sm mb-3">{exercise.description}</p>
                      {exercise.code && (
                        <div className="bg-gray-900 p-3 rounded text-xs font-mono text-gray-300 overflow-x-auto">
                          <pre>{exercise.code}</pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mini Quiz Section */}
            {week.quiz && (() => {
              const quizKey = week.quiz.id;
              const currentQuestionIndex = currentQuizQuestion[quizKey] || 0;
              const questions = week.quiz.questions;
              const currentQuestion = questions[currentQuestionIndex];
              const isLastQuestion = currentQuestionIndex === questions.length - 1;
              const selectedAnswer = selectedQuizAnswers[`${quizKey}-${currentQuestion.id}`];
              const showResult = showQuizResult[`${quizKey}-${currentQuestion.id}`] || false;

              const handleAnswerSelect = (optionId: string) => {
                if (showResult) return;
                
                const answerKey = `${quizKey}-${currentQuestion.id}`;
                setSelectedQuizAnswers(prev => ({ ...prev, [answerKey]: optionId }));
                setShowQuizResult(prev => ({ ...prev, [answerKey]: true }));

                // Przejdź do następnego pytania po 3 sekundach (jeśli nie jest ostatnie)
                if (!isLastQuestion) {
                  setTimeout(() => {
                    setCurrentQuizQuestion(prev => ({ ...prev, [quizKey]: currentQuestionIndex + 1 }));
                    // Resetuj stan dla następnego pytania
                    setShowQuizResult(prev => ({ ...prev, [`${quizKey}-${questions[currentQuestionIndex + 1].id}`]: false }));
                  }, 3000);
                }
              };

              return (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-white">Mini Quiz</h4>
                    <span className="text-sm text-gray-400">
                      Pytanie {currentQuestionIndex + 1} z {questions.length}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-4 font-medium">{currentQuestion.question}</p>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = selectedAnswer === option.id;
                      const isCorrect = option.isCorrect;
                      const showCorrect = showResult && isCorrect;
                      const showIncorrect = showResult && isSelected && !isCorrect;

                      return (
                        <div key={option.id}>
                          <button
                            onClick={() => handleAnswerSelect(option.id)}
                            disabled={showResult}
                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                              showCorrect
                                ? 'bg-green-900 border-green-600'
                                : showIncorrect
                                ? 'bg-red-900 border-red-600'
                                : isSelected
                                ? 'bg-gray-600 border-blue-500'
                                : 'bg-gray-800 border-gray-600 hover:border-blue-500'
                            } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="text-white flex-1">{option.text}</span>
                              {showCorrect && (
                                <span className="ml-3 text-green-400 font-bold text-xl">✓</span>
                              )}
                              {showIncorrect && (
                                <span className="ml-3 text-red-400 font-bold text-xl">✗</span>
                              )}
                            </div>
                          </button>
                          {showResult && isSelected && (
                            <div className={`mt-2 p-3 rounded ${
                              isCorrect ? 'bg-green-800 border border-green-600' : 'bg-red-800 border border-red-600'
                            }`}>
                              <p className={`text-sm ${isCorrect ? 'text-green-200' : 'text-red-200'}`}>
                                {option.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {showResult && !isLastQuestion && (
                    <div className="mt-4 p-3 bg-gray-600 rounded border border-gray-500">
                      <p className="text-gray-200 text-sm font-semibold text-center">
                        ⏱️ Następne pytanie za 3 sekundy...
                      </p>
                    </div>
                  )}
                  {isLastQuestion && showResult && (
                    <div className="mt-4 p-3 bg-blue-900 rounded border border-blue-600">
                      <p className="text-blue-200 text-sm font-semibold text-center">
                        🎉 Quiz zakończony! Gratulacje!
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Concepts Section */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">Pojęcia i koncepcje</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataEngineerConcepts.map((category) => (
            <div key={category.id} className="bg-gray-800 rounded-lg border border-gray-600 p-4">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>{category.icon}</span>
                {category.name}
              </h4>
              <div className="space-y-2">
                {category.concepts.map((concept, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-semibold text-blue-500">{concept.term}:</span>
                    <span className="text-gray-300 ml-2">{concept.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );


  // --- ADDITION: Certificate Roadmap Render ---
  const renderCertificatesRoadmap = () => (
    <div className="w-full max-w-2xl mx-auto mt-8 space-y-8 text-gray-300">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3">AWS Data Engineer & Solutions Architect Certyfikaty</h2>
        <p className="italic text-gray-400 mb-5">6–9 miesięcy • nauka ~8–12h/tydz • ścieżka certyfikacyjna + praktyka</p>
        <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-6">
          <p className="text-blue-200 font-semibold mb-2">🎥 Rekomendowany kurs wideo:</p>
          <a
            href="https://www.youtube.com/watch?v=c3Cn4xYfxJY&t=52s"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline font-medium"
          >
            AWS Solutions Architect Associate Certification (SAA-C03) – Full Course to PASS the Exam
          </a>
          <p className="text-xs text-gray-400 mt-2">Pełny kurs przygotowujący do egzaminu SAA-C03</p>
        </div>
      </div>
      <div className="space-y-6">
        {/* CEL KOŃCOWY */}
        <div className="bg-blue-800/80 border border-blue-500 rounded-xl p-4 shadow">
          <div className="text-white text-lg font-semibold mb-2">🎯 Cel końcowy</div>
          <ul className="list-disc ml-6 space-y-1">
            <li>AWS Certified Data Engineer – Associate (DEA-C01)</li>
            <li>→ AWS Certified Solutions Architect – Associate</li>
            <li>→ AWS Certified Solutions Architect – Professional</li>
          </ul>
        </div>

        {/* ETAP 0 */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="font-bold text-blue-300 mb-2">🔹 ETAP 0 – Fundamenty AWS (2–3 tygodnie)</div>
          <div>Jeśli masz już doświadczenie z VPC, subnetami, EC2 – możesz ten etap zrobić szybciej.</div>
          <strong className="block mt-3 mb-1">Co musisz rozumieć:</strong>
          <ul className="ml-5 list-disc text-sm">
            <li>IAM (role, policies, trust relationships)</li>
            <li>VPC, CIDR, subnety public/private, IGW/NAT Gateway, Security Groups vs NACL</li>
            <li>EC2, EBS, ALB/NLB</li>
            <li>S3 buckets, lifecycle, encryption</li>
          </ul>
          <div className="mt-2"><b>Kursy:</b></div>
          <ul className="ml-5 list-decimal text-sm">
            <li>Udemy – AWS Cloud Practitioner / AWS Fundamentals (Andrew Brown / Stephane Maarek)</li>
            <li>AWS Skill Builder – AWS Cloud Essentials (free!)</li>
          </ul>
          <div className="mt-2 text-sm">🎯 Outcome: <em>Rozumiesz AWS jako platformę (nie tylko pojedyncze usługi)</em></div>
        </div>

        {/* ETAP 1 */}
        <div className="bg-gray-800 border border-blue-700 rounded-xl p-4">
          <div className="font-bold text-blue-400 mb-2">🔹 ETAP 1 – AWS Certified Data Engineer – Associate (8–10 tygodni)</div>
          <ul className="ml-5 list-disc text-sm">
            <li><strong>Storage & Data Lake</strong>: S3 (partitioning, Parquet, ORC, Lake Formation, Glue Data Catalog)</li>
            <li><strong>ETL / ELT</strong>: Glue jobs, Glue vs Lambda/EMR, batch</li>
            <li><strong>Analytics</strong>: Athena, Redshift, RDS vs DynamoDB</li>
            <li><strong>Streaming</strong>: Kinesis Data Streams, Firehose</li>
            <li><strong>Security & Monitoring</strong>: IAM for data services, KMS, CloudWatch/CloudTrail</li>
          </ul>
          <div className="mt-2"><b>Kursy:</b></div>
          <ul className="ml-5 list-decimal text-sm">
            <li>Udemy – AWS Certified Data Engineer Associate (Maarek/Kane) <b>MUST HAVE!</b></li>
            <li>Coursera – Data Engineering on AWS (świetne laby, prawdziwe pipeline&apos;y)</li>
            <li>Udemy practice exams</li>
          </ul>
          <div className="mt-2"><b>Projekty do samodzielnego zrobienia (minimum 2):</b></div>
          <ul className="ml-5 list-disc text-sm">
            <li><b>Projekt 1 – Batch:</b> S3 → Glue → Redshift → Athena</li>
            <li><b>Projekt 2 – Streaming:</b> Kinesis → Firehose → S3 → Athena</li>
          </ul>
          <div className="mt-2">🎯 Egzamin #1: <b>AWS Certified Data Engineer – Associate</b></div>
        </div>

        {/* ETAP 2 */}
        <div className="bg-gray-800 border border-yellow-700 rounded-xl p-4">
          <div className="font-bold text-yellow-300 mb-2">🔹 ETAP 2 – AWS Solutions Architect – Associate (6–8 tygodni)</div>
          <ul className="ml-5 list-disc text-sm">
            <li>High Availability & Fault Tolerance (Multi-AZ, auto scaling, load balancer)</li>
            <li>Backup & Disaster Recovery</li>
            <li>Koszty i Well-Architected Framework</li>
            <li>Security design (IAM, VPC endpoints)</li>
          </ul>
          <div className="mt-2"><b>Kursy:</b></div>
          <ul className="ml-5 list-decimal text-sm">
            <li><b>AWS Solutions Architect Associate Certification (SAA-C03) – Full Course to PASS the Exam</b><br/>
                <span className="text-xs text-gray-400">Polecany dla Data Engineer - solidne podstawy architektury AWS, praktyczne labs, przygotowanie do egzaminu SAA-C03</span></li>
            <li>Udemy – AWS Solutions Architect Associate (Maarek)<br/>
                <span className="text-xs text-gray-400">Najlepszy wybór - praktyczne labs i case studies</span></li>
            <li>Tutorials Dojo practice exams<br/>
                <span className="text-xs text-gray-400">Świetne do przygotowania do egzaminu</span></li>
          </ul>
          <div className="mt-2"><b>Projekt:</b></div>
          <ul className="ml-5 list-disc text-sm">
            <li>ALB → EC2 (private subnets, 2 AZ) → RDS Multi-AZ → NAT Gateway → S3 backup</li>
          </ul>
          <div className="mt-2">🎯 Egzamin #2 (mocno polecany!): <b>AWS Solutions Architect – Associate</b></div>
        </div>

        {/* ETAP 3 */}
        <div className="bg-gray-800 border border-red-700 rounded-xl p-4">
          <div className="font-bold text-red-300 mb-2">🔹 ETAP 3 – AWS Solutions Architect – Professional (10–12 tygodni)</div>
          <ul className="ml-5 list-disc text-sm">
            <li>Multi-account / Multi-region</li>
            <li>Hybrid (VPN, Direct Connect)</li>
            <li>Event-driven, migracje, wybory architektoniczne</li>
          </ul>
          <div className="mt-2"><b>Kursy:</b></div>
          <ul className="ml-5 list-decimal text-sm">
            <li>Udemy – AWS Solutions Architect Professional (Maarek/Kane)</li>
            <li>Tutorials Dojo SAP-PRO</li>
          </ul>
          <div className="mt-2 text-sm">
            <b>Jak się uczyć:</b> Diagrams (draw.io), pytania slow-think, eliminacja złych odpowiedzi, czytanie wyjaśnień.
          </div>
          <div className="mt-2">🎯 Egzamin #3: <b>AWS Certified Solutions Architect – Professional</b></div>
        </div>
        <div className="bg-gray-900 border border-gray-600 rounded-xl p-4 mt-8">
          <div className="font-bold text-sm text-gray-300 mb-1">⏱️ PODSUMOWANIE CZASOWE</div>
          <table className="text-sm w-full border-collapse mt-2">
            <thead>
              <tr className="border-b border-gray-500">
                <th className="text-left p-1">Etap</th>
                <th className="text-left p-1">Czas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1">Fundamenty AWS</td>
                <td className="p-1">2–3 tyg</td>
              </tr>
              <tr>
                <td className="p-1">Data Engineer Associate</td>
                <td className="p-1">2–2.5 mies</td>
              </tr>
              <tr>
                <td className="p-1">SA Associate</td>
                <td className="p-1">1.5–2 mies</td>
              </tr>
              <tr>
                <td className="p-1">SA Professional</td>
                <td className="p-1">2.5–3 mies</td>
              </tr>
              <tr className="border-t border-gray-600">
                <td className="p-1 font-bold">Całość</td>
                <td className="p-1 font-bold">6–9 mies</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ...render functions up to return

  return (
    <div className="min-h-screen text-white h-full">
      <div className="w-[80%] max-w-[80vw] mx-auto px-4 py-8">
        <div className="mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2 text-center">Interview Practice & Learning</h1>
          <p className="text-lg text-gray-300 mb-8 text-center">Practice interview questions and explore learning roadmaps</p>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-800 rounded-lg p-1 border border-gray-600">
              <button
                onClick={() => setActiveTab('english')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'english' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >English Questions</button>
              <button
                onClick={() => setActiveTab('polish')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'polish' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >Polish Questions</button>
              <button
                onClick={() => setActiveTab('roadmap')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'roadmap' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >Data Engineer Roadmap</button>
              <button
                onClick={() => setActiveTab('dataEngineer')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'dataEngineer' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >Data Engineer Q&A</button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'certificates' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >AWS Certyfikaty</button>
              <button
                onClick={() => setActiveTab('fastCutProject')}
                className={`px-6 py-3 rounded-md font-medium transition-all ${activeTab === 'fastCutProject' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
              >Fast Cut Project</button>
            </div>
          </div>

          {/* Content based on active tab */}
          <div className="mt-8">
            {activeTab === 'english' && renderEnglishQuestions()}
            {activeTab === 'polish' && renderPolishQuestions()}
            {activeTab === 'roadmap' && renderRoadmap()}
            {activeTab === 'dataEngineer' && renderDataEngineerQuestions()}
            {activeTab === 'certificates' && renderCertificatesRoadmap()}
            {activeTab === 'fastCutProject' && renderFastCutProject()}
          </div>
        </div>
      </div>
      <div className="h-screen bg-white"></div>
    </div>
  );
};

export default InterviewPractice;
