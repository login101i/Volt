export const questionsPL = [
  {
    id: 1,
    title: 'Obsługa niezapisanych zmian w aplikacjach React',
    description: 'Jak zaimplementowałbyś system ostrzeżeń dla niezapisanych zmian w aplikacji React? Rozważ zarówno nawigację przeglądarki, jak i nawigację w aplikacji.',
    example: `<span class="text-[#569CD6]">const</span> <span class="text-[#4FC1FF]">UnsavedChangesHandler</span> = () => {
  <span class="text-[#569CD6]">const</span> [<span class="text-[#9CDCFE]">hasUnsavedChanges</span>, <span class="text-[#9CDCFE]">setHasUnsavedChanges</span>] = <span class="text-[#DCDCAA]">useState</span>(<span class="text-[#569CD6]">false</span>);

  <span class="text-[#DCDCAA]">useEffect</span>(() => {
    <span class="text-[#569CD6]">const</span> <span class="text-[#DCDCAA]">handleBeforeUnload</span> = (<span class="text-[#9CDCFE]">e</span>: <span class="text-[#4EC9B0]">BeforeUnloadEvent</span>) => {
      <span class="text-[#569CD6]">if</span> (hasUnsavedChanges) {
        e.<span class="text-[#DCDCAA]">preventDefault</span>();
        e.<span class="text-[#9CDCFE]">returnValue</span> = <span class="text-[#CE9178]">'Czy na pewno chcesz wyjść bez zapisania zmian?'</span>;
        <span class="text-[#569CD6]">return</span> e.<span class="text-[#9CDCFE]">returnValue</span>;
      }
    };

    window.<span class="text-[#DCDCAA]">addEventListener</span>(<span class="text-[#CE9178]">'beforeunload'</span>, handleBeforeUnload);
    <span class="text-[#569CD6]">return</span> () => window.<span class="text-[#DCDCAA]">removeEventListener</span>(<span class="text-[#CE9178]">'beforeunload'</span>, handleBeforeUnload);
  }, [hasUnsavedChanges]);

  <span class="text-[#569CD6]">return</span> (
    <span class="text-[#808080]">&lt;form onChange={() => setHasUnsavedChanges(true)}&gt;</span>
      <span class="text-[#808080]">{/* zawartość formularza */}</span>
    <span class="text-[#808080]">&lt;/form&gt;</span>
  );
};`,
    followUp: [
      'Jak obsłużyć to w aplikacji Next.js z nawigacją po stronie klienta?',
      'Jakie są zalety i wady używania zdarzenia beforeunload?',
      'Jak przetestować tę funkcjonalność?',
      'Jak obsłużyć wiele formularzy na tej samej stronie?',
      'A co z obsługą niezapisanych zmian w SPA z React Router?',
      'Jak zaimplementować funkcjonalność auto-zapisu?'
    ],
    sampleAnswer: `Implementacja obejmuje kilka kluczowych aspektów:

1. Zarządzanie stanem:
   - Śledzenie zmian formularza za pomocą stanu boolean
   - Aktualizacja stanu przy każdej zmianie w formularzu
   - Resetowanie stanu po pomyślnym zapisie

2. Nawigacja przeglądarki:
   - Użycie zdarzenia beforeunload do wyświetlenia ostrzeżenia
   - Zapobieganie przypadkowej nawigacji
   - Prawidłowe czyszczenie w useEffect

3. Nawigacja w aplikacji:
   - Użycie zdarzeń routera Next.js
   - Wyświetlenie niestandardowego okna potwierdzenia
   - Obsługa przypadków pozwolenia i anulowania

4. Strategia testowania:
   - Testy jednostkowe zarządzania stanem
   - Testy integracyjne obsługi nawigacji
   - Testy E2E przepływów użytkownika`
  },
  {
    id: 2,
    title: 'Optymalizacja wydajności React',
    description: 'Jak zoptymalizowałbyś wydajność aplikacji React? Omów różne techniki i kiedy ich używać.',
    example: `<span class="text-[#569CD6]">const</span> <span class="text-[#4FC1FF]">OptimizedComponent</span> = <span class="text-[#DCDCAA]">React.memo</span>(({ <span class="text-[#9CDCFE]">data</span>, <span class="text-[#9CDCFE]">onClick</span> }) => {
  <span class="text-[#569CD6]">const</span> <span class="text-[#DCDCAA]">memoizedCallback</span> = <span class="text-[#DCDCAA]">useCallback</span>(() => {
    <span class="text-[#DCDCAA]">onClick</span>(data);
  }, [data, onClick]);

  <span class="text-[#569CD6]">const</span> <span class="text-[#DCDCAA]">memoizedValue</span> = <span class="text-[#DCDCAA]">useMemo</span>(() => {
    <span class="text-[#569CD6]">return</span> <span class="text-[#DCDCAA]">expensiveCalculation</span>(data);
  }, [data]);

  <span class="text-[#569CD6]">return</span> (
    <span class="text-[#808080]">&lt;div onClick={memoizedCallback}&gt;</span>
      {memoizedValue}
    <span class="text-[#808080]">&lt;/div&gt;</span>
  );
});`,
    followUp: [
      'Kiedy używać React.memo vs useMemo?',
      'Jak identyfikować wąskie gardła wydajności?',
      'Jakich narzędzi używasz do profilowania wydajności?',
      'Jak zoptymalizować dużą listę elementów?',
      'Jakie są najlepsze praktyki dla podziału kodu?',
      'Jak obsłużyć wycieki pamięci w React?'
    ],
    sampleAnswer: `Optymalizacja wydajności React obejmuje wiele strategii:

1. Optymalizacja komponentów:
   - Użycie React.memo dla komponentów czystych
   - Implementacja shouldComponentUpdate
   - Unikanie niepotrzebnych re-renderów
   - Użycie odpowiednich kluczy props

2. Optymalizacja hooków:
   - useMemo dla kosztownych obliczeń
   - useCallback dla stabilności funkcji
   - useRef dla wartości mutowalnych
   - Prawidłowe tablice zależności

3. Podział kodu:
   - Dynamiczne importy
   - Podział oparty na trasach
   - Leniwe ładowanie komponentów
   - Analiza pakietów

4. Zarządzanie stanem:
   - Optymalizacja stanu lokalnego
   - Optymalizacja kontekstu
   - Selektory Redux
   - Normalizacja stanu

5. Najlepsze praktyki:
   - Utrzymuj hooki skupione
   - Prawidłowa obsługa błędów
   - Optymalizacja wydajności
   - Strategie testowania`
  },
  {
    id: 3,
    title: 'React Hooks - głęboka analiza',
    description: 'Wyjaśnij różne typy React Hooks i ich przypadki użycia. Jak działają pod maską?',
    example: `<span class="text-[#569CD6]">const</span> <span class="text-[#4FC1FF]">CustomHookExample</span> = () => {
  <span class="text-[#569CD6]">const</span> [<span class="text-[#9CDCFE]">state</span>, <span class="text-[#9CDCFE]">setState</span>] = <span class="text-[#DCDCAA]">useState</span>(<span class="text-[#569CD6]">null</span>);
  <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">ref</span> = <span class="text-[#DCDCAA]">useRef</span>(<span class="text-[#569CD6]">null</span>);

  <span class="text-[#DCDCAA]">useEffect</span>(() => {
    <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">subscription</span> = <span class="text-[#DCDCAA]">subscribe</span>();
    <span class="text-[#569CD6]">return</span> () => <span class="text-[#DCDCAA]">subscription</span>.<span class="text-[#DCDCAA]">unsubscribe</span>();
  }, []);

  <span class="text-[#569CD6]">const</span> <span class="text-[#DCDCAA]">memoizedValue</span> = <span class="text-[#DCDCAA]">useMemo</span>(() => 
    <span class="text-[#DCDCAA]">computeExpensiveValue</span>(state), [state]
  );

  <span class="text-[#569CD6]">return</span> <span class="text-[#808080]">&lt;div ref={ref}&gt;{memoizedValue}&lt;/div&gt;</span>;
};`,
    followUp: [
      'Jakie są zasady Hooks?',
      'Jak działają niestandardowe Hooks?',
      'Jakie są typowe pułapki z Hooks?',
      'Jak stworzyć niestandardowy hook dla wywołań API?',
      'Jaka jest różnica między useEffect a useLayoutEffect?',
      'Jak obsłużyć czyszczenie w useEffect?'
    ],
    sampleAnswer: `React Hooks to potężna funkcja wymagająca głębokiego zrozumienia:

1. Podstawowe Hooks:
   - useState: Zarządzanie stanem
   - useEffect: Efekty uboczne
   - useContext: Konsumpcja kontekstu
   - useReducer: Złożona logika stanu
   - useRef: Referencje mutowalne

2. Dodatkowe Hooks:
   - useMemo: Wartości zapamiętane
   - useCallback: Funkcje zapamiętane
   - useLayoutEffect: Efekty synchroniczne
   - useImperativeHandle: Niestandardowe refy
   - useDebugValue: Informacje debugowania

3. Niestandardowe Hooks:
   - Enkapsulacja wielokrotnie używalnej logiki
   - Przestrzeganie konwencji nazewnictwa
   - Możliwość używania innych hooków
   - Udostępnianie logiki stanowej

4. Zasady Hooków:
   - Wywołuj tylko na najwyższym poziomie
   - Wywołuj tylko w funkcjach React
   - Przestrzegaj zasad tablic zależności
   - Prawidłowo obsługuj czyszczenie

5. Najlepsze praktyki:
   - Utrzymuj hooki skupione
   - Prawidłowa obsługa błędów
   - Optymalizacja wydajności
   - Strategie testowania`
  },
  {
    id: 4,
    title: 'Komponenty serwerowe Next.js',
    description: 'Wyjaśnij koncepcję komponentów serwerowych w Next.js. Jak różnią się od komponentów klienckich?',
    example: `<span class="text-[#808080]">// Komponent serwerowy</span>
<span class="text-[#569CD6]">async</span> <span class="text-[#569CD6]">function</span> <span class="text-[#4FC1FF]">ServerComponent</span>() {
  <span class="text-[#569CD6]">try</span> {
    <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">data</span> = <span class="text-[#569CD6]">await</span> <span class="text-[#DCDCAA]">fetchData</span>();
    
    <span class="text-[#569CD6]">return</span> (
      <span class="text-[#808080]">&lt;Suspense fallback={&lt;LoadingSpinner /&gt;}&gt;</span>
        <span class="text-[#808080]">&lt;div&gt;</span>
          <span class="text-[#808080]">&lt;h1&gt;{data.title}&lt;/h1&gt;</span>
          <span class="text-[#808080]">&lt;ClientComponent data={data} /&gt;</span>
        <span class="text-[#808080]">&lt;/div&gt;</span>
      <span class="text-[#808080]">&lt;/Suspense&gt;</span>
    );
  } <span class="text-[#569CD6]">catch</span> (error) {
    <span class="text-[#569CD6]">return</span> <span class="text-[#808080]">&lt;ErrorFallback error={error} /&gt;</span>;
  }
}

<span class="text-[#808080]">// Komponent kliencki</span>
<span class="text-[#CE9178]">'use client'</span>;

<span class="text-[#569CD6]">const</span> <span class="text-[#4FC1FF]">ClientComponent</span> = ({ <span class="text-[#9CDCFE]">data</span> }) => {
  <span class="text-[#569CD6]">const</span> [<span class="text-[#9CDCFE]">state</span>, <span class="text-[#9CDCFE]">setState</span>] = <span class="text-[#DCDCAA]">useState</span>(<span class="text-[#569CD6]">null</span>);

  <span class="text-[#569CD6]">return</span> (
    <span class="text-[#808080]">&lt;div onClick={() => setState(data)}&gt;</span>
      {state?.content}
    <span class="text-[#808080]">&lt;/div&gt;</span>
  );
};`,
    followUp: [
      'Kiedy używać komponentów serwerowych?',
      'Jak obsłużyć interaktywność po stronie klienta?',
      'Jakie są korzyści wydajnościowe?',
      'Jak obsłużyć błędy w komponentach serwerowych?',
      'Jakie są najlepsze praktyki dla stanów ładowania?',
      'Jak zaimplementować uwierzytelnianie w komponentach serwerowych?',
      'A co z obsługą dynamicznych danych w komponentach serwerowych?',
      'Jak zoptymalizować wydajność komponentów serwerowych?'
    ],
    sampleAnswer: `Komponenty serwerowe to potężna funkcja Next.js:

1. Komponenty serwerowe:
   - Działają na serwerze
   - Zmniejszają rozmiar pakietu klienta
   - Bezpośredni dostęp do bazy danych
   - Zachowują wrażliwe dane po stronie serwera
   - Lepsza wydajność

2. Komponenty klienckie:
   - Działają w przeglądarce
   - Obsługują interaktywność
   - Używają API przeglądarki
   - Zarządzają stanem klienta
   - Obsługują zdarzenia użytkownika

3. Obsługa błędów:
   - Bloki try-catch w komponentach serwerowych
   - Granice błędów na poziomie strony i globalnym
   - Graceful fallbacki błędów
   - Przyjazne dla użytkownika komunikaty błędów
   - Prawidłowe logowanie i śledzenie błędów

4. Stany ładowania:
   - Granice Suspense dla lepszego UX
   - Stany ładowania dla początkowego ładowania strony
   - Stany ładowania dla pobierania danych
   - Strategie progresywnego ładowania
   - Ekrany szkieletowe dla lepszego UX

5. Optymalizacja wydajności:
   - Równoległe pobieranie danych
   - Prawidłowe strategie cachowania
   - Monitorowanie zasobów
   - Optymalizacja połączeń z bazą danych
   - Zarządzanie zmiennymi środowiskowymi

6. Najlepsze praktyki:
   - Używaj komponentów serwerowych domyślnie
   - Dodaj 'use client' gdy potrzebne
   - Implementuj prawidłową obsługę błędów
   - Używaj Suspense dla stanów ładowania
   - Monitoruj i optymalizuj wydajność`
  },
  {
    id: 5,
    title: 'Strategie testowania React',
    description: 'Jak podejść do testowania aplikacji React? Omów różne typy testów i narzędzia testowe.',
    example: `<span class="text-[#569CD6]">import</span> { <span class="text-[#9CDCFE]">render</span>, <span class="text-[#9CDCFE]">screen</span>, <span class="text-[#9CDCFE]">fireEvent</span> } <span class="text-[#569CD6]">from</span> <span class="text-[#CE9178]">'@testing-library/react'</span>;
<span class="text-[#569CD6]">import</span> <span class="text-[#9CDCFE]">userEvent</span> <span class="text-[#569CD6]">from</span> <span class="text-[#CE9178]">'@testing-library/user-event'</span>;

<span class="text-[#569CD6]">describe</span>(<span class="text-[#CE9178]">'FormComponent'</span>, () => {
  <span class="text-[#569CD6]">it</span>(<span class="text-[#CE9178]">'handles form submission'</span>, <span class="text-[#569CD6]">async</span> () => {
    <span class="text-[#DCDCAA]">render</span>(<span class="text-[#808080]">&lt;FormComponent /&gt;</span>);
    
    <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">input</span> = <span class="text-[#DCDCAA]">screen</span>.<span class="text-[#DCDCAA]">getByRole</span>(<span class="text-[#CE9178]">'textbox'</span>);
    <span class="text-[#569CD6]">await</span> <span class="text-[#DCDCAA]">userEvent</span>.<span class="text-[#DCDCAA]">type</span>(input, <span class="text-[#CE9178]">'test'</span>);
    
    <span class="text-[#569CD6]">const</span> <span class="text-[#9CDCFE]">button</span> = <span class="text-[#DCDCAA]">screen</span>.<span class="text-[#DCDCAA]">getByRole</span>(<span class="text-[#CE9178]">'button'</span>);
    <span class="text-[#569CD6]">await</span> <span class="text-[#DCDCAA]">userEvent</span>.<span class="text-[#9CDCFE]">click</span>(button);
    
    <span class="text-[#569CD6]">expect</span>(<span class="text-[#DCDCAA]">screen</span>.<span class="text-[#DCDCAA]">getByText</span>(<span class="text-[#CE9178]">'Success'</span>)).<span class="text-[#DCDCAA]">toBeInTheDocument</span>();
  });
});`,
    followUp: [
      'Jakich bibliotek testowych używasz?',
      'Jak testować kod asynchroniczny?',
      'Jakie jest Twoje podejście do mockowania?',
      'Jak testować niestandardowe hooki?',
      'A co z testowaniem granic błędów?',
      'Jak skonfigurować środowisko testowe?',
      'Jakich narzędzi używasz do testów E2E?'
    ],
    sampleAnswer: `Testowanie React wymaga kompleksowego podejścia:

1. Typy testów:
   - Testy jednostkowe dla komponentów
   - Testy integracyjne dla funkcji
   - Testy end-to-end dla przepływów
   - Testy wydajnościowe
   - Testy dostępności

2. Biblioteki testowe:
   - Jest jako runner testów
   - React Testing Library
   - Cypress dla E2E
   - MSW dla mockowania API
   - Playwright dla testowania przeglądarki

3. Strategie testowania:
   - Testowanie interakcji użytkownika
   - Testowanie renderowania komponentów
   - Testowanie zmian stanu
   - Testowanie obsługi błędów
   - Testowanie dostępności

4. Najlepsze praktyki:
   - Pisanie znaczących testów
   - Przestrzeganie piramidy testowania
   - Używanie odpowiednich asercji
   - Implementacja prawidłowego mockowania
   - Utrzymywanie pokrycia testami

5. Narzędzia testowe:
   - Jest dla testów jednostkowych
   - React Testing Library dla testowania komponentów
   - Cypress dla testów E2E
   - MSW dla mockowania API
   - Playwright dla testowania przeglądarki`
  }
]; 