'use client';

import Link from 'next/link';
import { useState } from 'react';
import html2pdf from 'html2pdf.js';

export default function ProtocolOdbioruPage() {
  const [currentDate] = useState(new Date().toLocaleDateString('pl-PL'));

  // State for section 2 checkboxes and custom points
  const [section2Items, setSection2Items] = useState([
    { id: 1, text: 'montaż nowego przewodu zasilającego od zabezpieczenia przedlicznikowego do licznika energii elektrycznej, zgodnie z wytycznymi administracji / spółdzielni / ADM', checked: false, customText: '' },
    { id: 2, text: 'doprowadzenie zasilania z licznika do rozdzielnicy mieszkaniowej', checked: false, customText: '' },
    { id: 3, text: 'montaż i uruchomienie rozdzielnicy elektrycznej, w tym:', checked: false, customText: '' },
    { id: 4, text: 'rozłącznika głównego', checked: false, customText: '' },
    { id: 5, text: 'wyłączników różnicowoprądowych', checked: false, customText: '' },
    { id: 6, text: 'zabezpieczeń nadprądowych', checked: false, customText: '' },
    { id: 7, text: 'wykonanie nowej instalacji elektrycznej w lokalu (obwody gniazdowe, oświetleniowe oraz dedykowane zgodnie z ustaleniami)', checked: false, customText: '' },
    { id: 8, text: 'podłączenie gniazd i łączników bez trwałego montażu do ścian (z uwagi na dalsze prace wykończeniowe)', checked: false, customText: '' },
    { id: 9, text: 'wykonanie instalacji teletechnicznej (np. skrętka LAN) – jeśli dotyczy', checked: false, customText: '' },
    { id: 10, text: 'wstępne zaszpachlowanie bruzd instalacyjnych', checked: false, customText: '' },
    { id: 11, text: 'uporządkowanie miejsca pracy oraz wywóz gruzu', checked: false, customText: '' },
  ]);

  // State for section 3 checkboxes and custom points
  const [section3Items, setSection3Items] = useState([
    { id: 1, text: 'działaniu rozłącznika głównego', checked: false, customText: '' },
    { id: 2, text: 'zasadzie działania i testowania wyłączników różnicowoprądowych', checked: false, customText: '' },
    { id: 3, text: 'podstawowej obsłudze rozdzielnicy', checked: false, customText: '' },
  ]);

  // State for section 4 checkboxes and custom points
  const [section4Items, setSection4Items] = useState([
    { id: 1, text: 'Pomiary elektryczne zostały wykonane i przekazane Inwestorowi', checked: false, customText: '' },
    { id: 2, text: 'Pomiary elektryczne zostaną wykonane w terminie: ..............................', checked: false, customText: '' },
    { id: 3, text: 'ciągłość przewodów ochronnych', checked: false, customText: '' },
    { id: 4, text: 'rezystancję izolacji', checked: false, customText: '' },
    { id: 5, text: 'impedancję pętli zwarcia', checked: false, customText: '' },
    { id: 6, text: 'skuteczność ochrony przez wyłączniki różnicowoprądowe', checked: false, customText: '' },
  ]);

  // State for section 5 checkboxes and custom points
  const [section5Items, setSection5Items] = useState([
    { id: 1, text: 'zerwanie i ponowne założenie plomb licznikowych oraz przedlicznikowych może wiązać się z dodatkowymi kosztami,', checked: false, customText: '' },
    { id: 2, text: 'koszty te są rozliczane bezpośrednio przez operatora energetycznego.', checked: false, customText: '' },
  ]);

  // State for section 6 checkboxes and custom points
  const [section6Items, setSection6Items] = useState([
    { id: 1, text: 'Na wykonane prace obowiązuje rękojmia, liczona od dnia podpisania niniejszego protokołu, zgodnie z obowiązującymi przepisami prawa.', checked: false, customText: '' },
    { id: 2, text: 'Prace zostały wykonane przez osobę posiadającą ważne świadectwo kwalifikacyjne SEP:', checked: false, customText: '' },
  ]);

  // State for checklist section checkboxes and custom points
  const [checklistItems, setChecklistItems] = useState([
    // 1. Instalacja fizycznie gotowa
    { id: 1, section: 'instalacja-gotowa', text: 'Przewody ułożone zgodnie z ustaleniami', checked: false, customText: '' },
    { id: 2, section: 'instalacja-gotowa', text: 'Wszystkie gniazda i łączniki podłączone', checked: false, customText: '' },
    { id: 3, section: 'instalacja-gotowa', text: 'Nie przykręcone do ściany (będą gładzie, szlifowanie, malowanie)', checked: false, customText: '' },
    { id: 4, section: 'instalacja-gotowa', text: 'Ochrona: woreczki, folia', checked: false, customText: '' },
    { id: 5, section: 'instalacja-gotowa', text: 'Ramki NIE montowane – klient robi to po remoncie', checked: false, customText: '' },

    // 2. Rozdzielnica - Zasilanie
    { id: 6, section: 'rozdzielnica-zasilanie', text: 'Nowy przewód od zabezpieczenia przedlicznikowego', checked: false, customText: '' },
    { id: 7, section: 'rozdzielnica-zasilanie', text: 'Licznik → rozdzielnica', checked: false, customText: '' },
    { id: 8, section: 'rozdzielnica-zasilanie', text: 'Rozłącznik główny (hebel – wyłączasz wszystko jednym ruchem)', checked: false, customText: '' },

    // 2. Rozdzielnica - Różnicówki
    { id: 9, section: 'rozdzielnica-rcd', text: 'Osobne sekcje (np. gniazda / reszta)', checked: false, customText: '' },
    { id: 10, section: 'rozdzielnica-rcd', text: 'Wyraźny opis KAŻDEGO obwodu', checked: false, customText: '' },
    { id: 11, section: 'rozdzielnica-rcd', text: 'Lodówka osobno ✔', checked: false, customText: '' },
    { id: 12, section: 'rozdzielnica-rcd', text: 'Kuchnia ✔', checked: false, customText: '' },
    { id: 13, section: 'rozdzielnica-rcd', text: 'Pokoje ✔', checked: false, customText: '' },

    // 3. Instalacje dodatkowe
    { id: 14, section: 'instalacje-dodatkowe', text: 'Skrętki LAN (topologia gwiazdy – pod smart home)', checked: false, customText: '' },
    { id: 15, section: 'instalacje-dodatkowe', text: 'Osobna rozdzielnica multimedialna + zasilanie', checked: false, customText: '' },
    { id: 16, section: 'instalacje-dodatkowe', text: 'Zapasy kabli (lampy, sufity podwieszane)', checked: false, customText: '' },

    // 4. Porządek po robocie
    { id: 17, section: 'porzadek', text: 'Wstępne zaszpachlowanie bruzd', checked: false, customText: '' },
    { id: 18, section: 'porzadek', text: 'Sprzątnięcie', checked: false, customText: '' },
    { id: 19, section: 'porzadek', text: 'Wywóz gruzu', checked: false, customText: '' },
    { id: 20, section: 'porzadek', text: 'Zabezpieczenia podłogi (zostają albo nie – wg ustaleń z klientem)', checked: false, customText: '' },

    // 5. Dokumenty
    { id: 21, section: 'dokumenty', text: 'Datę i adres', checked: false, customText: '' },
    { id: 22, section: 'dokumenty', text: 'Zakres prac (konkretnie!)', checked: false, customText: '' },
    { id: 23, section: 'dokumenty', text: 'Informację o: nowym zasilaniu, rozdzielnicy, wykonaniu instalacji', checked: false, customText: '' },
    { id: 24, section: 'dokumenty', text: 'Okres rękojmi / gwarancji', checked: false, customText: '' },
    { id: 25, section: 'dokumenty', text: 'Dane wykonawcy + uprawnienia SEP', checked: false, customText: '' },
    { id: 26, section: 'dokumenty', text: 'Pieczątka + podpis', checked: false, customText: '' },

    // 6. Podpis klienta
    { id: 27, section: 'podpis-klienta', text: 'Kluczowa formuła: "Prace wykonane zgodnie z umową i bez zastrzeżeń"', checked: false, customText: '' },

    // 7. Opisy rozdzielnicy
    { id: 28, section: 'opisy-rozdzielnicy', text: 'Naklejki / tabliczki', checked: false, customText: '' },
    { id: 29, section: 'opisy-rozdzielnicy', text: 'Trwałe', checked: false, customText: '' },
    { id: 30, section: 'opisy-rozdzielnicy', text: 'Czytelne', checked: false, customText: '' },

    // 8. Pomiary elektryczne
    { id: 31, section: 'pomiary-elektryczne', text: 'Ciągłość przewodów ochronnych', checked: false, customText: '' },
    { id: 32, section: 'pomiary-elektryczne', text: 'Impedancja pętli zwarcia', checked: false, customText: '' },
    { id: 33, section: 'pomiary-elektryczne', text: 'Rezystancja izolacji', checked: false, customText: '' },
    { id: 34, section: 'pomiary-elektryczne', text: 'Test RCD', checked: false, customText: '' },

    // 9. Plomby i zgłoszenia
    { id: 35, section: 'plomby', text: 'Zerwanie plomby = koszt', checked: false, customText: '' },
    { id: 36, section: 'plomby', text: 'Zgłoszenie ponownego zaplombowania', checked: false, customText: '' },
    { id: 37, section: 'plomby', text: 'Osobna faktura od zakładu energetycznego', checked: false, customText: '' },

    // 10. Rozliczenie materiałów
    { id: 38, section: 'rozliczenie', text: 'Nowe zestawienie', checked: false, customText: '' },
    { id: 39, section: 'rozliczenie', text: 'Liczysz co do sztuki', checked: false, customText: '' },
    { id: 40, section: 'rozliczenie', text: 'Robota zwykle bez zmian, materiał – aktualizacja', checked: false, customText: '' },

    // Bonus - Dokumentacja powykonawcza
    { id: 41, section: 'bonus-dokumentacja', text: 'Schemat rozdzielnicy', checked: false, customText: '' },
    { id: 42, section: 'bonus-dokumentacja', text: 'Opis obwodów', checked: false, customText: '' },
    { id: 43, section: 'bonus-dokumentacja', text: 'Lokalizacja puszek (zdjęcia PRZED tynkiem – złoto 🔥)', checked: false, customText: '' },

    // Bonus - Zdjęcia instalacji
    { id: 44, section: 'bonus-zdjecia', text: 'Do archiwum klienta', checked: false, customText: '' },
    { id: 45, section: 'bonus-zdjecia', text: 'Ratuje życie przy wierceniu', checked: false, customText: '' },

    // Bonus - Instrukcja użytkowania
    { id: 46, section: 'bonus-instrukcja', text: 'Jak testować RCD (np. raz w miesiącu)', checked: false, customText: '' },
    { id: 47, section: 'bonus-instrukcja', text: 'Co zrobić przy zaniku napięcia', checked: false, customText: '' },
    { id: 48, section: 'bonus-instrukcja', text: 'Gdzie dzwonić w razie awarii', checked: false, customText: '' },

    // TL;DR section
    { id: 49, section: 'tldr', text: 'Instalacja podłączona, ale nie przykręcona', checked: false, customText: '' },
    { id: 50, section: 'tldr', text: 'Rozdzielnica kompletna + opisana', checked: false, customText: '' },
    { id: 51, section: 'tldr', text: 'Klient przeszkolony z obsługi', checked: false, customText: '' },
    { id: 52, section: 'tldr', text: 'Protokół odbioru', checked: false, customText: '' },
    { id: 53, section: 'tldr', text: 'Podpis pod umową', checked: false, customText: '' },
    { id: 54, section: 'tldr', text: 'Pomiary elektryczne + protokół', checked: false, customText: '' },
    { id: 55, section: 'tldr', text: 'Plomby zgłoszone', checked: false, customText: '' },
    { id: 56, section: 'tldr', text: 'Rozliczenie materiałów', checked: false, customText: '' },
    { id: 57, section: 'tldr', text: '(Bonus) Zdjęcia i schematy', checked: false, customText: '' },
  ]);

  // State for custom points in other sections
  const [customPoints, setCustomPoints] = useState({
    section1: '',
    section3: '',
    section4: '',
    section5: '',
    section6: '',
    section7: '',
    section8: ''
  });

  // Handle checkbox changes for section 2
  const handleCheckboxChange = (id: number) => {
    setSection2Items(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Handle custom text changes for section 2
  const handleCustomTextChange = (id: number, text: string) => {
    setSection2Items(prev => prev.map(item =>
      item.id === id ? { ...item, customText: text } : item
    ));
  };

  // Handle checkbox changes for section 3
  const handleCheckboxChange3 = (id: number) => {
    setSection3Items(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Handle custom text changes for section 3
  const handleCustomTextChange3 = (id: number, text: string) => {
    setSection3Items(prev => prev.map(item =>
      item.id === id ? { ...item, customText: text } : item
    ));
  };

  // Handle checkbox changes for section 4
  const handleCheckboxChange4 = (id: number) => {
    setSection4Items(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Handle custom text changes for section 4
  const handleCustomTextChange4 = (id: number, text: string) => {
    setSection4Items(prev => prev.map(item =>
      item.id === id ? { ...item, customText: text } : item
    ));
  };

  // Handle checkbox changes for section 5
  const handleCheckboxChange5 = (id: number) => {
    setSection5Items(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Handle custom text changes for section 5
  const handleCustomTextChange5 = (id: number, text: string) => {
    setSection5Items(prev => prev.map(item =>
      item.id === id ? { ...item, customText: text } : item
    ));
  };

  // Handle checkbox changes for section 6
  const handleCheckboxChange6 = (id: number) => {
    setSection6Items(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Handle custom text changes for section 6
  const handleCustomTextChange6 = (id: number, text: string) => {
    setSection6Items(prev => prev.map(item =>
      item.id === id ? { ...item, customText: text } : item
    ));
  };

  // Handle checkbox changes for checklist
  const handleChecklistChange = (id: number) => {
    setChecklistItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // Handle custom text changes for checklist
  const handleChecklistTextChange = (id: number, text: string) => {
    setChecklistItems(prev => prev.map(item =>
      item.id === id ? { ...item, customText: text } : item
    ));
  };

  // Handle custom points changes
  const handleCustomPointsChange = (section: string, text: string) => {
    setCustomPoints(prev => ({ ...prev, [section]: text }));
  };

  // Generate PDF function
  const generatePDF = () => {
    const element = document.getElementById('protocol-content');
    if (!element) return;

    // Temporarily hide unchecked items and input fields for PDF generation
    const elementsToHide: HTMLElement[] = [];

    // Hide all input fields and textareas (editing controls)
    const inputs = element.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      (input as HTMLElement).style.display = 'none';
      elementsToHide.push(input as HTMLElement);
    });

    // Hide unchecked items (gray text spans that are not checked) in both protocol and checklist sections
    const graySpans = element.querySelectorAll('span.text-gray-400');
    graySpans.forEach(span => {
      const container = span.closest('.flex.items-start.space-x-3') as HTMLElement;
      if (container && !container.querySelector('input[type="checkbox"]:checked')) {
        container.style.display = 'none';
        elementsToHide.push(container);
      }
    });

    // Also hide unchecked items in the TL;DR grid layout
    const tldrLabels = element.querySelectorAll('section:last-child label');
    tldrLabels.forEach(label => {
      const checkbox = label.querySelector('input[type="checkbox"]') as HTMLInputElement;
      const span = label.querySelector('span.text-gray-400');
      if (checkbox && !checkbox.checked && span) {
        (label as HTMLElement).style.display = 'none';
        elementsToHide.push(label as HTMLElement);
      }
    });

    // Hide empty custom text blocks
    const customTextBlocks = element.querySelectorAll('.bg-gray-50.rounded.text-black');
    customTextBlocks.forEach(block => {
      if (block.textContent?.trim() === '') {
        (block as HTMLElement).style.display = 'none';
        elementsToHide.push(block as HTMLElement);
      }
    });

    // Hide action buttons section (only for PDF generation)
    const actionButtons = element.querySelector('.mt-8.pt-6.border-t.border-gray-300') as HTMLElement;
    if (actionButtons) {
      actionButtons.style.display = 'none';
      elementsToHide.push(actionButtons);
    }

    const opt = {
      margin: 0.3, // wąskie marginesy
      filename: `protokol-odbioru-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 1.0 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        letterRendering: true,
        allowTaint: false
      },
      jsPDF: {
        unit: 'in',
        format: 'a4',
        orientation: 'portrait' as const,
        compress: true,
        precision: 16
      }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Restore visibility after PDF generation
      elementsToHide.forEach(element => {
        element.style.display = '';
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white shadow-sm min-h-screen">
        {/* Header with Back Button */}
        <div className="px-6 py-4 border-b border-gray-200 bg-purple-600 text-white">
          <Link href="/" className="text-white hover:text-purple-200 flex items-center">
            <span className="text-xl mr-2">←</span>
            <span>Powrót</span>
          </Link>
          <h1 className="text-2xl font-bold mt-2">Protokół Odbioru Instalacji Elektrycznej</h1>
        </div>

        {/* Protocol Content */}
        <div id="protocol-content" className="px-6 py-8 md:px-12 md:py-12">
        <div className="prose prose-neutral max-w-none text-black">
        {/* Title */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">PROTOKÓŁ ODBIORU INSTALACJI ELEKTRYCZNEJ</h2>
            </div>

            {/* Section 1: Dane podstawowe */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">1. Dane podstawowe</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="mb-2"><strong>Data sporządzenia protokołu:</strong> {currentDate}</p>
                  {customPoints.section1 && (
                    <div className="mb-2 p-2 bg-gray-50 rounded text-black">
                      {customPoints.section1.split('\n').map((line, index) => (
                        <p key={index} className="mb-1">{line}</p>
                      ))}
                    </div>
                  )}
                  <textarea
                    value={customPoints.section1}
                    onChange={(e) => handleCustomPointsChange('section1', e.target.value)}
                    placeholder="Dodaj własne punkty do sekcji 1..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                  />
                </div>

                <div>
                  <p className="mb-2"><strong>Miejsce wykonania instalacji:</strong></p>
                  <p className="mb-1">Adres: .............................................................................</p>
                </div>

                <div>
                  <p className="mb-2"><strong>Inwestor (Klient):</strong></p>
                  <p className="mb-1">Imię i nazwisko / Firma: ........................................................</p>
                  <p className="mb-1">Adres: .............................................................................</p>
                </div>

                <div>
                  <p className="mb-2"><strong>Wykonawca instalacji:</strong></p>
                  <p className="mb-1">Nazwa firmy: .....................................................................</p>
                  <p className="mb-1">Adres: .............................................................................</p>
                  <p className="mb-1">Telefon / e-mail: .................................................................</p>
                </div>
              </div>
            </section>

            {/* Section 2: Zakres wykonanych prac */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">2. Zakres wykonanych prac</h3>

              <p className="mb-4">
                Niniejszym potwierdza się, że w dniu <span className="underline">................................</span> wykonano nową instalację elektryczną w lokalu mieszkalnym zgodnie z wcześniejszymi ustaleniami z Inwestorem.
              </p>

              <p className="mb-3"><strong>Zakres prac obejmował w szczególności:</strong></p>

              <div className="space-y-2 ml-4 mb-4">
                {section2Items.slice(0, 2).map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange(item.id)}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                        {item.text}
                      </span>
                      {item.customText && (
                        <span className="text-black font-medium block mt-1">
                          {item.customText}
                        </span>
                      )}
                      <input
                        type="text"
                        value={item.customText}
                        onChange={(e) => handleCustomTextChange(item.id, e.target.value)}
                        placeholder="Dodaj własny punkt..."
                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={section2Items[2].checked}
                    onChange={() => handleCheckboxChange(3)}
                    className="mt-1 w-5 h-5 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <span className={section2Items[2].checked ? 'text-black font-medium' : 'text-gray-400'}>
                      montaż i uruchomienie rozdzielnicy elektrycznej, w tym:
                    </span>
                    {section2Items[2].customText && (
                      <span className="text-black font-medium block mt-1">
                        {section2Items[2].customText}
                      </span>
                    )}
                    <input
                      type="text"
                      value={section2Items[2].customText}
                      onChange={(e) => handleCustomTextChange(3, e.target.value)}
                      placeholder="Dodaj własny punkt..."
                      className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="ml-6 mt-2 space-y-1">
                      {section2Items.slice(3, 6).map(item => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleCheckboxChange(item.id)}
                            className="mt-1 w-4 h-4 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                              {item.text}
                            </span>
                            {item.customText && (
                              <span className="text-black font-medium block mt-1">
                                {item.customText}
                              </span>
                            )}
                            <input
                              type="text"
                              value={item.customText}
                              onChange={(e) => handleCustomTextChange(item.id, e.target.value)}
                              placeholder="Dodaj własny punkt..."
                              className="w-full mt-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {section2Items.slice(6).map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange(item.id)}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                        {item.text}
                      </span>
                      {item.customText && (
                        <span className="text-black font-medium block mt-1">
                          {item.customText}
                        </span>
                      )}
                      <input
                        type="text"
                        value={item.customText}
                        onChange={(e) => handleCustomTextChange(item.id, e.target.value)}
                        placeholder="Dodaj własny punkt..."
                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: Rozdzielnica elektryczna */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">3. Rozdzielnica elektryczna</h3>

              <p className="mb-3">
                Rozdzielnica została wyposażona w czytelny i trwały opis obwodów, umożliwiający jednoznaczną identyfikację poszczególnych zabezpieczeń.
              </p>

              <p className="mb-3"><strong>Inwestor został poinformowany o:</strong></p>

              <div className="space-y-2 ml-4 mb-4">
                {section3Items.map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange3(item.id)}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                        {item.text}
                      </span>
                      {item.customText && (
                        <span className="text-black font-medium block mt-1">
                          {item.customText}
                        </span>
                      )}
                      <input
                        type="text"
                        value={item.customText}
                        onChange={(e) => handleCustomTextChange3(item.id, e.target.value)}
                        placeholder="Dodaj własny punkt..."
                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {customPoints.section3 && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-black">
                  {customPoints.section3.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              )}
              <textarea
                value={customPoints.section3}
                onChange={(e) => handleCustomPointsChange('section3', e.target.value)}
                placeholder="Dodaj własne punkty do sekcji 3..."
                className="w-full mt-4 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </section>

            {/* Section 4: Pomiary elektryczne */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">4. Pomiary elektryczne</h3>

              <div className="space-y-2 mb-4">
                {section4Items.slice(0, 2).map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange4(item.id)}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                        {item.text}
                      </span>
                      {item.customText && (
                        <span className="text-black font-medium block mt-1">
                          {item.customText}
                        </span>
                      )}
                      <input
                        type="text"
                        value={item.customText}
                        onChange={(e) => handleCustomTextChange4(item.id, e.target.value)}
                        placeholder="Dodaj własny punkt..."
                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mb-3"><strong>Zakres pomiarów obejmuje w szczególności:</strong></p>

              <div className="space-y-2 ml-4 mb-4">
                {section4Items.slice(2).map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange4(item.id)}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                        {item.text}
                      </span>
                      {item.customText && (
                        <span className="text-black font-medium block mt-1">
                          {item.customText}
                        </span>
                      )}
                      <input
                        type="text"
                        value={item.customText}
                        onChange={(e) => handleCustomTextChange4(item.id, e.target.value)}
                        placeholder="Dodaj własny punkt..."
                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-2 text-sm text-gray-600">(właściwe zaznaczyć)</p>

              {customPoints.section4 && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-black">
                  {customPoints.section4.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              )}
              <textarea
                value={customPoints.section4}
                onChange={(e) => handleCustomPointsChange('section4', e.target.value)}
                placeholder="Dodaj własne punkty do sekcji 4..."
                className="w-full mt-4 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </section>

            {/* Section 5: Plomby i zgłoszenia */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">5. Plomby i zgłoszenia</h3>

              <p className="mb-3"><strong>Inwestor został poinformowany, że:</strong></p>

              <div className="space-y-2 ml-4 mb-4">
                {section5Items.map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange5(item.id)}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                        {item.text}
                      </span>
                      {item.customText && (
                        <span className="text-black font-medium block mt-1">
                          {item.customText}
                        </span>
                      )}
                      <input
                        type="text"
                        value={item.customText}
                        onChange={(e) => handleCustomTextChange5(item.id, e.target.value)}
                        placeholder="Dodaj własny punkt..."
                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {customPoints.section5 && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-black">
                  {customPoints.section5.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              )}
              <textarea
                value={customPoints.section5}
                onChange={(e) => handleCustomPointsChange('section5', e.target.value)}
                placeholder="Dodaj własne punkty do sekcji 5..."
                className="w-full mt-4 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </section>

            {/* Section 6: Rękojmia i odpowiedzialność */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">6. Rękojmia i odpowiedzialność</h3>

              <div className="space-y-4 mb-4">
                {section6Items.map(item => (
                  <div key={item.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => handleCheckboxChange6(item.id)}
                      className="mt-1 w-5 h-5 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                        {item.text}
                      </span>
                      {item.customText && (
                        <span className="text-black font-medium block mt-1">
                          {item.customText}
                        </span>
                      )}
                      <input
                        type="text"
                        value={item.customText}
                        onChange={(e) => handleCustomTextChange6(item.id, e.target.value)}
                        placeholder="Dodaj własny punkt..."
                        className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                ))}

                <div className="ml-8">
                  <p className="text-gray-600">Numer uprawnień: .................................................................</p>
                </div>
              </div>

              {customPoints.section6 && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-black">
                  {customPoints.section6.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              )}
              <textarea
                value={customPoints.section6}
                onChange={(e) => handleCustomPointsChange('section6', e.target.value)}
                placeholder="Dodaj własne punkty do sekcji 6..."
                className="w-full mt-4 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </section>

            {/* Section 7: Oświadczenie Inwestora */}
            <section className="mb-8 bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-yellow-400 pb-2">
                7. Oświadczenie Inwestora <span className="text-yellow-600">(NAJWAŻNIEJSZE 😎)</span>
              </h3>
              
              <p className="mb-3">
                Ja, niżej podpisany/a, oświadczam, że:
              </p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>dokonałem/am odbioru prac elektrycznych i potwierdzam, że zostały one wykonane zgodnie z warunkami umowy, w sposób niebudzący moich zastrzeżeń.</li>
                <li>Jednocześnie potwierdzam zapoznanie się z zasadami użytkowania instalacji elektrycznej oraz rozdzielnicy.</li>
              </ul>
              {customPoints.section7 && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-black">
                  {customPoints.section7.split('\n').map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              )}
              <textarea
                value={customPoints.section7}
                onChange={(e) => handleCustomPointsChange('section7', e.target.value)}
                placeholder="Dodaj własne punkty do sekcji 7..."
                className="w-full mt-4 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </section>

            {/* Section 8: Podpisy */}
            <section className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">8. Podpisy</h3>
              
              <div className="space-y-6">
                <div>
                  <p className="mb-2 font-semibold">Inwestor (Klient):</p>
                  <p className="mb-1">Imię i nazwisko: .................................................................</p>
                  <p className="mb-1">Podpis: .................................................. Data: ................</p>
                </div>

                <div>
                  <p className="mb-2 font-semibold">Wykonawca:</p>
                  <p className="mb-1">Imię i nazwisko: .................................................................</p>
                  <p className="mb-1">Podpis i pieczęć firmowa: ........................................................</p>
                </div>
              </div>
              <textarea
                value={customPoints.section8}
                onChange={(e) => handleCustomPointsChange('section8', e.target.value)}
                placeholder="Dodaj własne punkty do sekcji 8..."
                className="w-full mt-4 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
            </section>

          </div>
        </div>

        {/* Checklist Section */}
        <div className="px-6 py-8 md:px-12 md:py-12 border-t-4 border-blue-500 bg-blue-50">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-#0f0f0fmb-2">CHECKLISTA PRZYJĘCIA ROBOTY</h2>
              <p className="text-gray-600">Co musi być zrobione po ułożeniu kabli (ODBIÓR INSTALACJI)</p>
            </div>

            {/* Main Checklist Items */}
            <div className="space-y-6">
              {/* 1. Instalacja fizycznie gotowa */}
              <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">1. Instalacja fizycznie gotowa do użytkowania</h3>
                <div className="space-y-2">
                  {checklistItems.filter(item => item.section === 'instalacja-gotowa').map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 2. Rozdzielnica */}
              <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">2. Rozdzielnica – kompletna i opisana</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold mb-2">Zasilanie:</p>
                    <div className="space-y-2 ml-4">
                      {checklistItems.filter(item => item.section === 'rozdzielnica-zasilanie').map(item => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleChecklistChange(item.id)}
                            className="mt-1 w-5 h-5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                              {item.text}
                            </span>
                            {item.customText && (
                              <span className="text-black font-medium block mt-1">
                                {item.customText}
                              </span>
                            )}
                            <input
                              type="text"
                              value={item.customText}
                              onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                              placeholder="Dodaj własny punkt..."
                              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Różnicówki (RCD) – minimum:</p>
                    <div className="space-y-2 ml-4">
                      {checklistItems.filter(item => item.section === 'rozdzielnica-rcd').map(item => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleChecklistChange(item.id)}
                            className="mt-1 w-5 h-5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                              {item.text}
                            </span>
                            {item.customText && (
                              <span className="text-black font-medium block mt-1">
                                {item.customText}
                              </span>
                            )}
                            <input
                              type="text"
                              value={item.customText}
                              onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                              placeholder="Dodaj własny punkt..."
                              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                    <p className="font-semibold mb-1">👉 Klient MUSI wiedzieć:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Co wyłącza który bezpiecznik</li>
                      <li>Jak działa test RCD</li>
                      <li>Gdzie jest główne odcięcie prądu</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 3. Instalacje dodatkowe */}
              <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">3. Instalacje dodatkowe (jeśli były w umowie)</h3>
                <div className="space-y-2">
                  {checklistItems.filter(item => item.section === 'instalacje-dodatkowe').map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4. Porządek po robocie */}
              <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">4. Porządek po robocie</h3>
                <div className="space-y-2">
                  {checklistItems.filter(item => item.section === 'porzadek').map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 5. Dokumenty - NAJWAŻNIEJSZA CZĘŚĆ */}
              <section className="bg-yellow-50 p-6 rounded-lg shadow-md border-2 border-yellow-400">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📄 5. DOKUMENTY – NAJWAŻNIEJSZA CZĘŚĆ (TU SIĘ WYGRYWA REKLAMACJE)
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold mb-2">Protokół odbioru instalacji (MUST HAVE) powinien zawierać:</p>
                    <div className="space-y-2 ml-4">
                      {checklistItems.filter(item => item.section === 'dokumenty').map(item => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleChecklistChange(item.id)}
                            className="mt-1 w-5 h-5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                              {item.text}
                            </span>
                            {item.customText && (
                              <span className="text-black font-medium block mt-1">
                                {item.customText}
                              </span>
                            )}
                            <input
                              type="text"
                              value={item.customText}
                              onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                              placeholder="Dodaj własny punkt..."
                              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded border-l-4 border-yellow-500">
                    <p className="text-sm">👉 To jest: "podpis artysty pod obrazem" – zabezpieczenie klienta i wykonawcy</p>
                  </div>
                </div>
              </section>

              {/* 6. Podpis klienta */}
              <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">6. Podpis klienta pod umową</h3>
                <div className="space-y-2">
                  {checklistItems.filter(item => item.section === 'podpis-klienta').map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="bg-red-50 p-3 rounded border-l-4 border-red-400 mt-3">
                    <p className="text-sm font-semibold">⚠️ Bez tego: "było fajnie" → po tygodniu → "jednak nie"</p>
                  </div>
                </div>
              </section>

              {/* 7. Opisy rozdzielnicy */}
              <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">7. Opisy rozdzielnicy (fizyczne etykiety)</h3>
                <div className="space-y-2">
                  {checklistItems.filter(item => item.section === 'opisy-rozdzielnicy').map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="bg-yellow-50 p-2 rounded mt-2">
                    <p className="text-sm">🙃 Nie "długopis + taśma"</p>
                  </div>
                </div>
              </section>

              {/* 8. Pomiary elektryczne */}
              <section className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-400">
                <h3 className="text-xl font-bold text-gray-800 mb-4">📌 8. POMIARY ELEKTRYCZNE (MEGA WAŻNE)</h3>
                <div className="space-y-2">
                  {checklistItems.filter(item => item.section === 'pomiary-elektryczne').map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500 mt-3">
                    <p className="text-sm font-semibold mb-1">📌 Fakty z życia:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-sm">
                      <li>Klienci często mówią, że nie potrzebują</li>
                      <li>Ubezpieczyciel ZAWSZE potrzebuje</li>
                      <li>"Data wsteczna" = 🚨 nielegalne i ryzykowne</li>
                    </ul>
                    <p className="text-sm mt-2 font-semibold">👉 Dobra praktyka: pomiary robione + protokół przekazany klientowi</p>
                  </div>
                </div>
              </section>

              {/* 9. Plomby i zgłoszenia */}
              <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">9. Plomby i zgłoszenia do energetyki</h3>
                <div className="space-y-2">
                  {checklistItems.filter(item => item.section === 'plomby').map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-sm text-gray-600 mt-2">Często pomijany "ukryty koszt".</p>
                </div>
              </section>

              {/* 10. Rozliczenie materiałów */}
              <section className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-gray-800 mb-4">10. Końcowe rozliczenie materiałów</h3>
                <div className="space-y-2">
                  <p className="text-sm mb-2">Jeśli coś się zmieniło (więcej punktów, inna rozdzielnica, więcej osprzętu):</p>
                  {checklistItems.filter(item => item.section === 'rozliczenie').map(item => (
                    <div key={item.id} className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mt-1 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Bonus: Dodatkowe elementy */}
              <section className="bg-green-50 p-6 rounded-lg shadow-md border-2 border-green-400">
                <h3 className="text-xl font-bold text-gray-800 mb-4">🧠 CO DODAŁBYM Z "WIEDZY Z INTERNETU / DOBREJ PRAKTYKI"</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2">🔹 Dokumentacja powykonawcza (choćby uproszczona):</p>
                    <div className="space-y-2 ml-4">
                      {checklistItems.filter(item => item.section === 'bonus-dokumentacja').map(item => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleChecklistChange(item.id)}
                            className="mt-1 w-5 h-5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                              {item.text}
                            </span>
                            {item.customText && (
                              <span className="text-black font-medium block mt-1">
                                {item.customText}
                              </span>
                            )}
                            <input
                              type="text"
                              value={item.customText}
                              onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                              placeholder="Dodaj własny punkt..."
                              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">🔹 Zdjęcia instalacji przed zakryciem:</p>
                    <div className="space-y-2 ml-4">
                      {checklistItems.filter(item => item.section === 'bonus-zdjecia').map(item => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleChecklistChange(item.id)}
                            className="mt-1 w-5 h-5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                              {item.text}
                            </span>
                            {item.customText && (
                              <span className="text-black font-medium block mt-1">
                                {item.customText}
                              </span>
                            )}
                            <input
                              type="text"
                              value={item.customText}
                              onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                              placeholder="Dodaj własny punkt..."
                              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">🔹 Instrukcja użytkowania (krótka):</p>
                    <div className="space-y-2 ml-4">
                      {checklistItems.filter(item => item.section === 'bonus-instrukcja').map(item => (
                        <div key={item.id} className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleChecklistChange(item.id)}
                            className="mt-1 w-5 h-5 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                              {item.text}
                            </span>
                            {item.customText && (
                              <span className="text-black font-medium block mt-1">
                                {item.customText}
                              </span>
                            )}
                            <input
                              type="text"
                              value={item.customText}
                              onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                              placeholder="Dodaj własny punkt..."
                              className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* TL;DR - Quick Checklist */}
              <section className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-4">📋 TL;DR – CHECKLISTA W JEDNYM BLOKU</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {checklistItems.filter(item => item.section === 'tldr').map(item => (
                    <label key={item.id} className={`flex items-center bg-white/20 p-2 rounded ${item.id === 57 ? 'md:col-span-2' : ''}`}>
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleChecklistChange(item.id)}
                        className="mr-3 w-5 h-5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <span className={item.checked ? 'text-black font-medium' : 'text-gray-400'}>
                          {item.text}
                        </span>
                        {item.customText && (
                          <span className="text-black font-medium block mt-1">
                            {item.customText}
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.customText}
                          onChange={(e) => handleChecklistTextChange(item.id, e.target.value)}
                          placeholder="Dodaj własny punkt..."
                          className="w-full mt-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Action Buttons - widoczne tylko na stronie, ukryte w PDF */}
        <div className="mt-8 pt-6 border-t border-gray-300">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.print()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors flex-1 sm:flex-none"
            >
              🖨️ Drukuj Protokół
            </button>
            <button
              onClick={generatePDF}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors flex-1 sm:flex-none"
            >
              📄 Generuj PDF
            </button>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          header, .no-print {
            display: none;
          }
          body {
            background: white;
          }
          .max-w-4xl {
            max-width: 100%;
          }
          .shadow-sm {
            box-shadow: none;
          }
          button {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
