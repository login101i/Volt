'use client';

import Link from 'next/link';
import DevActivityGraph from '@/components/DevActivityGraph';
import { useGlobalStyle } from '@/components/GlobalStyleProvider';
import { APP_VERSION } from '@/lib/appVersion';

/** Publiczna strona główna `/` — wizja Projektu 2027 + wejście do aplikacji pod `/panel`. */
export default function LandingPageClient() {
  const { theme, toggleTheme } = useGlobalStyle();

  return (
    <div className="volt-page" data-page="landing">
      <div className="volt-landing-bg" aria-hidden>
        <div
          className="volt-landing-bg__photo"
          style={{ backgroundImage: 'url(/images/landing-electrical-hall.jpg)' }}
        />
        <div className="volt-landing-bg__veil" />
      </div>
      <header className="volt-wrap">
        <div className="volt-header">
          <div className="volt-brand">
            <span className="volt-brandmark" aria-hidden>
              ϟ
            </span>
            <span className="volt-brand-text">
              <strong>PROJEKT 2027</strong>
              <span>Elektryka · Automatyka · Software · AI</span>
            </span>
            <span className="volt-app-version" title="Wersja aplikacji">
              {APP_VERSION}
            </span>
          </div>
          <nav className="volt-header-meta" aria-label="Sekcje strony">
            <a href="#misja">Cel</a>
            <a href="#zasady">Zasady</a>
            <a href="#pomysly">Pomysły</a>
            <a href="#volt">Volt</a>
            <a href="#plan">Plan</a>
            <Link href="/panel" className="volt-btn volt-btn--secondary volt-btn--sm">
              Aplikacja
            </Link>
            <button
              type="button"
              className="volt-btn volt-btn--ghost volt-btn--sm"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? '☀ Jasny' : '☾ Ciemny'}
            </button>
          </nav>
        </div>
      </header>

      <main>
        <section className="volt-wrap volt-landing-hero" id="start">
          <p className="volt-eyebrow">W trakcie walidacji</p>
          <div className="volt-landing-hero-main">
            <div className="volt-landing-hero-copy">
              <h1>
                Projekt <span className="volt-gradient-text">2027</span>
              </h1>
              <p className="volt-muted volt-landing-lead">
                Od zapytania klienta przez projekt rozdzielnicy i ofertę Volt — po realizację
                i dokumentację. Centrum pracy zespołu elektryka i oprogramowania.
              </p>
            </div>
            <DevActivityGraph />
          </div>
          <div className="volt-landing-actions">
            <Link href="/panel" className="volt-btn">
              Otwórz aplikację Volt →
            </Link>
            <a href="#misja" className="volt-btn volt-btn--secondary">
              Nasz cel
            </a>
          </div>
          <nav className="volt-landing-toc" aria-label="Spis treści">
            <a href="#misja">
              <span>01</span>
              <strong>Nasz cel</strong>
              <small>Jedne drzwi dla klienta</small>
            </a>
            <a href="#zasady">
              <span>02</span>
              <strong>Zasady</strong>
              <small>4 warunki biznesu</small>
            </a>
            <a href="#pomysly">
              <span>03</span>
              <strong>Pomysły</strong>
              <small>Po walidacji usługi</small>
            </a>
            <a href="#volt">
              <span>04</span>
              <strong>Volt</strong>
              <small>Oferty i wycena</small>
            </a>
            <a href="#plan">
              <span>05</span>
              <strong>Plan</strong>
              <small>2026–2029</small>
            </a>
          </nav>
        </section>

        {/* ——— Misja ——— */}
        <section className="volt-wrap volt-landing-section" id="misja">
          <div className="volt-sectionhead">
            <div className="volt-eyebrow">Nasz cel · nowy kierunek</div>
            <h2>Jedne drzwi dla klienta. Sprawdzone narzędzia za kulisami.</h2>
            <p>
              Klient mówi, <strong>czego potrzebuje</strong> — my organizujemy analizę,
              przygotowujemy przejrzystą ofertę w <strong>Volt</strong> i koordynujemy drogę
              do wykonanej, udokumentowanej rozdzielnicy. <strong>Nie tworzymy własnego
              CAD-a.</strong>
            </p>
          </div>

          <div className="volt-direction-panel">
            <div className="volt-direction-topline">
              <span className="volt-direction-label">
                <span className="volt-direction-light" aria-hidden />
                Kierunek główny · model usługowy na start
              </span>
              <span className="volt-direction-status">
                Hipoteza do potwierdzenia u klientów
              </span>
            </div>
            <div className="volt-direction-value">
              <strong>Sprzedajemy rozwiązanie problemu</strong>
              <span>— nie dostęp do kolejnego programu.</span>
            </div>
            <div
              className="volt-direction-flow"
              aria-label="Droga klienta od zapytania do odbioru"
            >
              <div className="volt-direction-step">
                <span>01 / Klient</span>
                <strong>Zgłoszenie</strong>
                <small>Dom, modernizacja, nowe obwody, wymagania i termin.</small>
              </div>
              <div className="volt-direction-step">
                <span>02 / Analiza</span>
                <strong>Doprecyzowanie</strong>
                <small>Dane techniczne, zakres i ocena przez kompetentną osobę.</small>
              </div>
              <div className="volt-direction-step">
                <span>03 / Narzędzia</span>
                <strong>Projekt i dobór</strong>
                <small>Hagercad, WAGO lub inne właściwe narzędzia branżowe.</small>
              </div>
              <div className="volt-direction-step">
                <span>04 / Volt</span>
                <strong>Oferta dla klienta</strong>
                <small>Koszty materiałów, pracy, terminy, zakres i akceptacja.</small>
              </div>
              <div className="volt-direction-step">
                <span>05 / Realizacja</span>
                <strong>Wykonanie i odbiór</strong>
                <small>Uprawniony wykonawca, weryfikacja, pomiary i dokumentacja.</small>
              </div>
            </div>
            <p className="volt-direction-explain">
              Volt to nasze narzędzie <strong>ofertowania i obsługi zapytania</strong>. Projekt
              techniczny, dobór aparatury i dokumenty wykonawcze przygotowujemy w istniejących
              narzędziach. Szczegóły zakresu i odpowiedzialności ustalamy przed przyjęciem
              zlecenia.
            </p>
          </div>

          <div className="volt-direction-details">
            <article className="volt-direction-card">
              <div className="volt-direction-card-label">
                Korzystamy z istniejących rozwiązań
              </div>
              <h3>Nie dublujemy Hagercad</h3>
              <p>
                <strong>Hagercad</strong> — projekt, schemat, zestawienie i wsparcie wyceny
                (zakres zależy od wersji/licencji). <strong>WAGO Smart Designer</strong> —
                konfiguracja złączek, oznaczeń i dokumentacji.
              </p>
              <div className="volt-direction-links">
                <a
                  href="https://hager.com/pl/narzedzia-aplikacje-i-oprogramowanie/hagercad"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Hagercad ↗
                </a>
                <a
                  href="https://www.wago.com/pl/rozwiazania/tematy/cyfryzacja/smartdata/smartdesigner"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  WAGO Smart Designer ↗
                </a>
              </div>
            </article>
            <article className="volt-direction-card">
              <div className="volt-direction-card-label">Nasza przewaga</div>
              <h3>Prosty kontakt i pełna obsługa</h3>
              <p>
                Klient nie musi uczyć się CAD-a ani szukać kilku podwykonawców. Otrzymuje{' '}
                <strong>
                  jedną ścieżkę: zapytanie → wyjaśnienie → oferta → realizacja → dokumentacja
                </strong>
                .
              </p>
              <p className="volt-direction-small">
                Uwaga: Hagercad również potrafi przygotować wyceny — sam moduł kalkulacji nie
                stanowi jeszcze przewagi Volt.
              </p>
            </article>
            <article className="volt-direction-card">
              <div className="volt-direction-card-label">Nieprzekraczalne warunki</div>
              <h3>Bezpiecznie i odpowiedzialnie</h3>
              <p>
                Przed pierwszą realizacją ustalamy{' '}
                <strong>
                  kompetencje i uprawnienia, role projektanta/wykonawcy/producenta zestawu,
                  wymagane weryfikacje, pomiary oraz dokumentację
                </strong>{' '}
                — z uwzględnieniem właściwych części PN-EN IEC 61439.
              </p>
              <p className="volt-direction-small">
                Program pomaga, ale nie zastępuje oceny technicznej, zgodności ani
                odpowiedzialności zawodowej.
              </p>
            </article>
          </div>

          <div className="volt-direction-decision">
            <strong>Najpierw sprawdzamy popyt:</strong> wybieramy jedną grupę klientów,
            rozmawiamy z 10 potencjalnymi kupującymi i próbujemy zdobyć{' '}
            <strong>pierwsze płatne zlecenie/pilotaż</strong>. Dopiero wtedy decydujemy, co
            automatyzować w Volt.
          </div>
        </section>

        {/* ——— Zasady ——— */}
        <section className="volt-wrap volt-landing-section" id="zasady">
          <div className="volt-sectionhead">
            <div className="volt-eyebrow">Jak decydujemy</div>
            <h2>4 warunki dobrego biznesu</h2>
            <p>
              Najpierw płatna usługa i nauka procesu; własny software rozwijamy wyłącznie tam,
              gdzie daje klientowi realną przewagę.
            </p>
          </div>
          <div className="volt-gates">
            <article className="volt-gate">
              <span className="volt-gate-index">01 / Popyt</span>
              <h3>Kto zapłaci?</h3>
              <p>
                Wybieramy jedną grupę: np. inwestorzy budujący dom albo firmy zlecające
                rozdzielnice — nie obie naraz.
              </p>
              <div className="volt-criterion">
                <b>Warunek:</b> 10 rozmów z nabywcami, konkretne zapytania i próba zdobycia 1
                płatnego pilotażu.
              </div>
            </article>
            <article className="volt-gate">
              <span className="volt-gate-index">02 / Przewaga</span>
              <h3>Dlaczego my?</h3>
              <p>
                Paweł wnosi praktykę branżową, Maciej tworzy Volt; projekt techniczny opieramy
                na sprawdzonych narzędziach i kwalifikacjach.
              </p>
              <div className="volt-criterion">
                <b>Warunek:</b> klient rozumie, za co płaci: wygodę, sprawną wycenę,
                koordynację i rzetelną dokumentację.
              </div>
            </article>
            <article className="volt-gate">
              <span className="volt-gate-index">03 / Dotarcie</span>
              <h3>Jak zdobędziemy klienta?</h3>
              <p>
                Polecenia instalatorów, kontakty branżowe i prosta strona do składania zapytań.
                Na starcie obsługa może być ręczna.
              </p>
              <div className="volt-criterion">
                <b>Warunek:</b> jeden skuteczny kanał dotarcia i co najmniej 3 konkretne
                zapytania ofertowe.
              </div>
            </article>
            <article className="volt-gate">
              <span className="volt-gate-index">04 / Pętla nauki</span>
              <h3>Co poprawiamy?</h3>
              <p>
                Każde zapytanie i realizację mierzymy: czas do oferty, odsetek akceptacji,
                marżę i kompletność dokumentów.
              </p>
              <div className="volt-criterion">
                <b>Warunek:</b> po każdym pilotażu poprawiamy proces albo jedną funkcję Volt.
              </div>
            </article>
          </div>
          <div className="volt-gate-outcome">
            <strong>Decyzja GO / ZMIANA:</strong> rozwijamy model obsługi zamówień, gdy ktoś
            płaci, a jakość, odpowiedzialność i marża się spinają.{' '}
            <span className="volt-muted">
              10 rozmów i 1 pilotaż to nasze progi robocze, nie prognoza sukcesu.
            </span>
          </div>
        </section>

        {/* ——— Pomysły ——— */}
        <section className="volt-wrap volt-landing-section" id="pomysly">
          <div className="volt-sectionhead">
            <div className="volt-eyebrow">Pomysły na później · po walidacji usługi</div>
            <h2>Co warto automatyzować dopiero później?</h2>
            <p>
              Zbieramy pomysły z praktyki Pawła, ale nie konkurujemy dziś z gotowymi programami
              CAD i narzędziami producentów.
            </p>
          </div>
          <div className="volt-idea-lead">
            <div>
              <span className="volt-idea-tag">Backlog · nie aktywny projekt</span>
              <h3>ElectroFlow · opcja na przyszłość</h3>
              <p>
                Ewentualne moduły dla wykonawców — magazyn, brakujące części, czas
                prefabrykacji czy dokumentacja — rozwiniemy tylko wtedy, gdy klienci pokażą nam
                lukę w istniejących narzędziach.
              </p>
            </div>
            <div className="volt-idea-note">
              <b>Teraz:</b> klient → Volt → istniejący CAD → realizacja. <b>Później:</b>{' '}
              automatyzacja potwierdzonych wąskich problemów.
            </div>
          </div>
          <div className="volt-idea-grid">
            <article className="volt-idea-card">
              <span>01 · Magazyn</span>
              <h3>Dostawy i brakujące części</h3>
              <p>
                Skanowanie kodów, porównanie zamówienia z dostawą, alerty o brakach przed
                terminem wykonania szafy.
              </p>
              <small>Hipoteza MVP · wysoki priorytet rozmów</small>
            </article>
            <article className="volt-idea-card">
              <span>02 · Dokumentacja</span>
              <h3>Lista aparatury ze schematu</h3>
              <p>
                Lista materiałowa (BOM) i propozycje odpowiedników różnych producentów —
                zawsze z weryfikacją techniczną.
              </p>
              <small>Etap późniejszy · dane katalogowe</small>
            </article>
            <article className="volt-idea-card">
              <span>03 · Kosztorys</span>
              <h3>Porównanie kosztów</h3>
              <p>
                Porównanie cen i dostępności dopuszczalnych wariantów, bez automatycznej
                zamiany zabezpieczeń.
              </p>
              <small>Wymaga zatwierdzenia projektanta</small>
            </article>
            <article className="volt-idea-card">
              <span>04 · Prefabrykacja</span>
              <h3>Zadania i czas pracy</h3>
              <p>
                Przydział prac, rejestr czasu i prognoza terminu wykonania rozdzielnicy na
                podstawie historii.
              </p>
              <small>Dobry kandydat na prosty pilotaż</small>
            </article>
            <article className="volt-idea-card">
              <span>05 · Jakość</span>
              <h3>Pomiary i protokoły</h3>
              <p>
                Rejestr wyników, identyfikacja osoby wykonującej pomiar, wymagane podpisy i
                historia odbiorów.
              </p>
              <small>Uprawnienia, audyt i zgodność</small>
            </article>
            <article className="volt-idea-card">
              <span>06 · Organizacja</span>
              <h3>Role i odpowiedzialność</h3>
              <p>
                Oddzielne konta kierownika i pracownika, przypisane zadania, historia zmian i
                odbiorów.
              </p>
              <small>Podstawa uprawnień aplikacji</small>
            </article>
            <article className="volt-idea-card">
              <span>07 · Instalacje ppoż.</span>
              <h3>Trasy kablowe i usterki</h3>
              <p>
                Dokumentowanie połączeń od punktu do punktu, zdjęcia tras i szybsze
                lokalizowanie błędów montażu.
              </p>
              <small>Osobna nisza do zbadania</small>
            </article>
            <article className="volt-idea-card">
              <span>08 · Kierownik robót</span>
              <h3>Przegląd prac i odchyleń</h3>
              <p>
                Co jest gotowe, czego brakuje, kto odpowiada za poprawki i jakie są blokady
                wykonania.
              </p>
              <small>Wywiad z kierownikiem budowy</small>
            </article>
          </div>
          <p className="volt-ideas-foot">
            Nie budujemy ośmiu modułów ElectroFlow ani nowego CAD-a. Sprawdzamy najpierw, czy
            klienci zapłacą za kompleksową obsługę zamówienia.
          </p>
        </section>

        {/* ——— Volt ——— */}
        <section className="volt-wrap volt-landing-section" id="volt">
          <div className="volt-panel">
            <div>
              <div className="volt-eyebrow">Nasz projekt · w rozwoju</div>
              <h2>
                <span className="volt-bolt">ϟ</span> Volt
              </h2>
              <p>
                Nasze narzędzie do tworzenia czytelnych ofert na rozdzielnice i prace
                elektryczne. To centrum przygotowania wyceny i odpowiedzi klientowi — nie
                konkurent dla Hagercad ani zastępstwo projektu technicznego.
              </p>
              <div className="volt-steps">
                <span>Zapytanie</span>
                <span>→</span>
                <span>Dobór i kalkulacja</span>
                <span>→</span>
                <span>Oferta Volt</span>
                <span>→</span>
                <span>Akceptacja</span>
              </div>
            </div>
            <Link href="/panel" className="volt-btn volt-link">
              Wejdź do aplikacji ↗
            </Link>
          </div>
        </section>

        {/* ——— Plan ——— */}
        <section className="volt-wrap volt-landing-section" id="plan">
          <div className="volt-sectionhead">
            <div className="volt-eyebrow">Nasza droga · 2026–2029</div>
            <h2>Plan na 3 lata</h2>
            <p>
              Najpierw sprawdzamy usługę i kanał pozyskiwania klientów, później automatyzujemy
              powtarzalną pracę.
            </p>
          </div>
          <div className="volt-years">
            <article>
              <b>2026/2027 · Sprawdzenie</b>
              <h3>Pierwsze płatne zlecenia</h3>
              <p>
                Wywiady, zapytania, pierwsze oferty Volt i bezpieczny pilotaż z fachowcem.
              </p>
            </article>
            <article>
              <b>2027/2028 · Uporządkowanie</b>
              <h3>Powtarzalna obsługa klientów</h3>
              <p>
                Szablony ofert, partnerzy wykonawczy, rzetelne terminy, ceny i proces
                dokumentacji.
              </p>
            </article>
            <article>
              <b>2028/2029 · Rozwój</b>
              <h3>Skalowanie tego, co działa</h3>
              <p>
                Więcej zleceń oraz automatyzacja w Volt tylko tam, gdzie przynosi oszczędność.
              </p>
            </article>
          </div>
          <div className="volt-sectionhead volt-sectionhead--compact">
            <div className="volt-eyebrow">Najbliższy miesiąc</div>
            <h3>Co robimy przez 4 tygodnie?</h3>
          </div>
          <div className="volt-weeks">
            <article>
              <span>Tydzień 1</span>
              <h3>Wybrać klienta</h3>
              <p>Jedna nisza i krótki formularz danych do wyceny rozdzielnicy.</p>
            </article>
            <article>
              <span>Tydzień 2</span>
              <h3>10 rozmów</h3>
              <p>Ustalić potrzeby, budżety i problemy klientów oraz wykonawców.</p>
            </article>
            <article>
              <span>Tydzień 3</span>
              <h3>Sprawdzić narzędzia</h3>
              <p>
                Przećwiczyć przykład w Hagercad i WAGO; określić zakres Volt i
                role/uprawnienia.
              </p>
            </article>
            <article>
              <span>Tydzień 4</span>
              <h3>Pierwsza oferta / pilotaż</h3>
              <p>
                Przygotować realną kalkulację, ofertę Volt i sprawdzić gotowość klienta do
                zapłaty.
              </p>
            </article>
          </div>
        </section>

        <footer className="volt-wrap volt-landing-footer">
          <span>Projekt 2027 · model w trakcie walidacji</span>
          <Link href="/panel">Aplikacja Volt →</Link>
        </footer>
      </main>
    </div>
  );
}
