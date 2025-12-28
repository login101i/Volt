# Dobór Kabli - Dokumentacja Norm i Wymagań

## Wprowadzenie

Ten dokument zawiera informacje o normach i wymaganiach, które muszą być uwzględnione przy doborze przewodów elektrycznych w aplikacji.

## Normy i Standardy

### Główne normy do uwzględnienia:

- [ ] **PN-HD 60364** - Instalacje elektryczne niskiego napięcia
- [ ] **PN-EN 60228** - Przewody elektryczne - przekroje znamionowe
- [ ] **PN-HD 60364-5-52** - Dobór i montaż wyposażenia elektrycznego - Przewody
- [ ] **PN-HD 60364-5-54** - Uziemienia i przewody ochronne
- [ ] **PN-EN 50565** - Przewody i kable elektryczne - Obciążalność prądowa długotrwała

## Parametry do uwzględnienia przy doborze

### 1. Przekrój przewodu
- [ ] Minimalne przekroje zgodne z normą
- [ ] Standardowe przekroje dostępne na rynku
- [ ] Przekroje dla różnych zastosowań

### 2. Obciążalność prądowa
- [ ] Obciążalność długotrwała
- [ ] Współczynniki korekcyjne:
  - [ ] Temperatura otoczenia
  - [ ] Sposób ułożenia (w powietrzu, w ziemi, w rurach)
  - [ ] Grupowanie przewodów
  - [ ] Wysokość nad poziomem morza

### 3. Typ przewodu
- [ ] YDYp (przewód płaski)
- [ ] YKY (przewód jednożyłowy)
- [ ] YKYp (przewód płaski wielożyłowy)
- [ ] YDYpzo (przewód płaski z przewodem ochronnym)
- [ ] LGY (przewód aluminiowy)
- [ ] Inne typy...

### 4. Napięcie znamionowe
- [ ] 230V (jednofazowe)
- [ ] 400V (trójfazowe)
- [ ] Inne napięcia...

### 5. Materiał przewodnika
- [ ] Miedź (Cu)
- [ ] Aluminium (Al)
- [ ] Różnice w obciążalności

### 6. Sposób ułożenia
- [ ] W powietrzu (na ścianie, w korytkach)
- [ ] W ziemi (bezpośrednio, w rurach)
- [ ] W rurach instalacyjnych
- [ ] W kanałach kablowych
- [ ] Na drabinkach kablowych

### 7. Warunki środowiskowe
- [ ] Temperatura otoczenia (standardowo 30°C)
- [ ] Współczynniki korekcyjne dla różnych temperatur
- [ ] Wysokość nad poziomem morza

### 8. Zabezpieczenia
- [ ] Dobór zabezpieczenia nadprądowego
- [ ] Zgodność z charakterystyką wyłącznika (B, C, D)
- [ ] Sprawdzenie warunku: Ib ≤ In ≤ Iz

## Wzory i obliczenia

### Obciążalność prądowa długotrwała
```
Iz = I0 × k1 × k2 × k3 × k4 × k5

gdzie:
- Iz - obciążalność prądowa długotrwała
- I0 - obciążalność podstawowa
- k1 - współczynnik korekcyjny dla temperatury otoczenia
- k2 - współczynnik korekcyjny dla sposobu ułożenia
- k3 - współczynnik korekcyjny dla grupowania
- k4 - współczynnik korekcyjny dla wysokości
- k5 - współczynnik korekcyjny dla rodzaju izolacji
```

### Spadek napięcia
```
ΔU = (2 × I × L × ρ) / (S × cos φ)

gdzie:
- ΔU - spadek napięcia [V]
- I - prąd obciążenia [A]
- L - długość przewodu [m]
- ρ - rezystywność materiału [Ω·mm²/m]
- S - przekrój przewodu [mm²]
- cos φ - współczynnik mocy
```

## Tabele referencyjne

### Przekroje standardowe
- [ ] Tabela przekrojów znamionowych
- [ ] Odpowiednie obciążalności dla każdego przekroju

### Współczynniki korekcyjne
- [ ] Tabela współczynników dla temperatury
- [ ] Tabela współczynników dla sposobu ułożenia
- [ ] Tabela współczynników dla grupowania

## Uwagi implementacyjne

### Funkcjonalności do zaimplementowania:
1. [ ] Kalkulator doboru przekroju na podstawie prądu
2. [ ] Kalkulator obciążalności z uwzględnieniem współczynników
3. [ ] Sprawdzanie zgodności z normami
4. [ ] Wybór typu przewodu
5. [ ] Obliczanie spadku napięcia
6. [ ] Dobór zabezpieczenia nadprądowego
7. [ ] Weryfikacja warunków: Ib ≤ In ≤ Iz

## Źródła danych

### Bazy danych do wykorzystania:
- [ ] Katalogi producentów przewodów
- [ ] Tabele normatywne
- [ ] Współczynniki korekcyjne z norm

## Szczegółowa dokumentacja praktyczna

# Dobór kabli wg PN-HD 60364-5-52

## Najważniejsze informacje – teoria vs praktyka

---

## 1. Norma ponad wszystko (serio, ponad AI 🤖)

* **PN-HD 60364-5-52** to podstawowe i wiążące źródło wiedzy przy doborze przewodów i kabli.
* Fora, blogi, a nawet AI → często podają uproszczenia lub błędy.

**Norma:**

* nie narzuca „sztywnych przekrojów do gniazdek",
* operuje tabelami obciążalności prądowej,
* uwzględnia warunki ułożenia i współczynniki korekcyjne.

**HD = norma harmonizowana:**

* wspólna dla Europy,
* z dopuszczonymi odstępstwami krajowymi

  * np. min. przekrój **1,5 mm² w PL**, **1 mm² w UK**.

👉 **Wniosek dla aplikacji:**

> Logika ≠ „gniazdo → 2,5 mm²", tylko algorytm oparty o normę.

---

## 2. Kryteria doboru kabla (to nie jest jedno `if`)

Dobór kabla to **wynik spełnienia kilku kryteriów jednocześnie**:

* **Normy i przepisy**

  * PN-HD 60364-5-52
  * Warunki techniczne budynków
* **Wymagania OSD** (przyłącza, WLZ)
* **Obciążalność prądowa długotrwała**
* **Spadek napięcia**
* **Sposób ułożenia**

  * w ścianie
  * w rurze
  * w powietrzu
  * liczba obwodów ułożonych razem
* **Warunki środowiskowe**

  * temperatura
  * wilgoć
* **Ochrona przeciwporażeniowa**

  * impedancja pętli zwarcia
* **Selektywność zabezpieczeń**

👉 **Przekrój = max(z wymagań)**, a nie „najbliższy z tabelki".

---

## 3. Minimalne dopuszczalne przekroje (PL)

### Z normy – odstępstwa krajowe

**Miedź (Cu):**

* **1,5 mm²** – minimum dla:

  * oświetlenia
  * gniazd
  * typowych obwodów 230 V
* **1,0 mm²**:

  * obwody elektroniczne
  * niskie moce
  * sterowanie, zasilacze
* **0,5 mm²**:

  * obwody sygnalizacyjne
  * przyciski, sterowanie przekaźników

**Aluminium (Al):**

* nie stosowane w instalacjach domowych,
* jeśli już:

  * **min. 10 mm²**.

👉 **Powód minimum 1,5 mm²:**

* nie tylko prąd,
* **wytrzymałość mechaniczna** (gięcie, zaciski, montaż).

---

## 4. Prąd, moc i dlaczego kabel się grzeje 🔥

* W gniazdku zawsze jest napięcie (**230 V**) – to stan gotowości.
* Prąd płynie **dopiero po podłączeniu odbiornika**.
* Im większa moc odbiornika, tym:

  * większy prąd,
  * większe nagrzewanie przewodu.

**Dlaczego kabel się nagrzewa?**

* każdy przewód ma rezystancję,
* prąd → straty cieplne,
* za duży prąd → degradacja izolacji → pożar.

**Izolacja PVC:**

* praca ciągła: **70°C**,
* zwarcie: **~160°C** (krótko!).

👉 Kabel musi wytrzymać prąd, a zabezpieczenie musi go chronić.

---

## 5. Zabezpieczenie ≠ tylko „żeby nie wyskakiwało"

* Wyłącznik nadprądowy:

  * **chroni kabel**, nie urządzenie.

**Niedopuszczalne:**

* zabezpieczenie > dopuszczalny prąd kabla.

Gwóźdź zamiast bezpiecznika →

* 🔥 tynk czarny
* 🔥 izolacja stopiona
* 🔥 YouTube Shorts… i pożar

👉 **W aplikacji:**

1. najpierw kabel,
2. potem zabezpieczenie,
3. nigdy odwrotnie.

---

## 6. Spadek napięcia – cichy zabójca jakości

* Kabel ≠ idealny przewodnik.
* Długi odcinek + duży prąd = spadek napięcia.

**Skutki:**

* grzanie kabla,
* gorsza praca urządzeń,
* migotanie światła.

👉 Przekrój czasem rośnie **nie przez prąd**, tylko przez **długość trasy**.

---

## 7. Jedyny wzór, który musisz znać (na start)

**Jedna faza:**

```
P = U · I · cosφ
I = P / (U · cosφ)
```

* **U = 230 V** (z głowy),
* **P** – z tabliczki znamionowej,
* **cosφ**:

  * często niepodany,
  * dla elektroniki ≠ 1,
  * producenci powinni go poprawiać (PFC).

👉 Do doboru kabla liczy się **prąd ciągły**, nie chwilowy.

---

## 8. Teoria vs praktyka (czyli dlaczego WLZ wygląda „za grubo")

* Przyłącza i WLZ:

  * duże przekroje,
  * wpływ:

    * OSD,
    * selektywność,
    * pętla zwarcia.

👉 Norma to podstawa,
👉 praktyka = jeszcze kilka warstw bezpieczeństwa.

---

## 9. Co z tego wynika dla Twojej aplikacji 🧠⚡

Aplikacja powinna **myśleć jak projektant**, a nie jak tabelka:

1. Oblicz prąd obciążenia
2. Dobierz przekrój z obciążalności
3. Sprawdź:

   * minimalny przekrój normowy,
   * sposób ułożenia,
   * długość i spadek napięcia,
   * liczbę obwodów razem
4. Dopiero potem:

   * dobierz zabezpieczenie

👉 **Wynik = największy wymagany przekrój**

---

# Dobór kabli wg PN-HD 60364-5-52 – PART 2

Cosφ, silniki, płyty indukcyjne, tabele, temperatura, praktyka

## 1. Cosφ (współczynnik mocy) – jak go traktować w praktyce

Jeśli producent nie podał cosφ na urządzeniu:

* przyjmujemy **0,92–0,95**
* (bezpiecznie, realistycznie, normowo)

**Typowe przypadki:**

* **Odbiorniki rezystancyjne**
  (grzałki, czajniki)
  → cosφ = 1
* **LED, elektronika, zasilacze impulsowe**
  → cosφ ≈ 0,95
* **Silniki pracujące „na luzie"**
  → cosφ nawet 0,4

📌 Mały cosφ ≠ mały prąd
→ często oznacza dużą moc bierną i nadal duży prąd w przewodach

👉 **Zasada do aplikacji**
Jeśli brak danych → nie optymalizuj, przyjmuj cosφ = 0,95
(lepiej przewymiarować kabel niż stopić peszel)

---

## 2. Szybkie liczenie prądu – „tryb elektryk w sklepie"

**Jednofazowo:**
```
I = P / (U · cosφ)
```

* U = 230 V (zawsze, z głowy)
* np. 2300 W → ~10 A
* (to powinno się liczyć „w pamięci mięśniowej")

👉 **W aplikacji**

* pokaż prąd obliczony
* pokaż prąd zaokrąglony w górę (praktyka, nie matematyka)

---

## 3. Sieć trójfazowa – silniki

**Wzór:**
```
P = √3 · U_LL · I · cosφ
```

* U_LL = 400 V (międzyfazowe)
* dotyczy:

  * silników
  * dużych odbiorników przemysłowych

**Kluczowa pułapka ⚠️**

Moc na tabliczce silnika (np. 7,5 kW)
= moc mechaniczna na wale

Moc pobierana z sieci jest większa

**Przykład:**

* silnik 7,5 kW
* pobór z sieci ≈ 9 kW
* straty:

  * ciepło
  * wentylator
  * łożyska
  * uzwojenia

👉 **Wniosek krytyczny**

* 2 × 7,5 kW ≠ 15 kW
* realnie ≈ 18 kW z sieci

👉 **Aplikacja musi rozróżniać:**

* moc znamionową urządzenia
* moc pobieraną z sieci

---

## 4. Jeśli producent podał prąd → NIE licz

Prąd z tabliczki znamionowej:

* dotyczy obciążenia znamionowego
* uwzględnia cosφ
* jest najlepszą daną wejściową

👉 **Logika aplikacji**

```javascript
if (pradPodany) {
  uzyjPradu();
} else {
  liczZMocy();
}
```

---

## 5. Płyta indukcyjna – teoria kontra życie

**Jednofazowo:**

* moc: 7360 W
* prąd ≈ 32 A
* 2 żyły obciążone ekstremalnie

**Dwufazowo:**

* moc dzieli się na 2 fazy
* ~16 A na fazę
* obciążenie bardziej równomierne
* bezpieczniejsze termicznie

📌 **Producent:**

* często liczy z cosφ = 1
* norma + praktyka → 0,95

👉 **Wniosek**

* większy prąd obliczeniowy = większy margines bezpieczeństwa
* teoria mówi: „OK"
* praktyka mówi: „nie na styk"

---

## 6. Połączenia – diabeł siedzi w detalu (i w izolacji 😈)

**Przykład: kostka WAGO**

* np. 32 A max
* teoria: „wystarczy"
* praktyka:

  * słabe odizolowanie
  * nacięte żyły
  * izolacja w zacisku
  * większe grzanie

👉 **Zasada**
Nie projektujemy na 100% obciążalności złącza

👉 **Aplikacja**

* jeśli I ≈ granicy → ostrzeżenie
* sugeruj:

  * wyższy typ złącza
  * połączenie śrubowe

---

## 7. Typowe przekroje – nie ma „8 mm²"

**Produkowane przekroje:**

* 1,5
* 2,5
* 4
* 6
* 10
* 16 …

👉 Jeśli obliczenia dają 8 mm²
→ bierzesz 10 mm²

👉 **Aplikacja**

```javascript
dobranyPrzekroj = najblizszyWiekszyZTypowegoSzeregu
```

---

## 8. Temperatura otoczenia – killer obciążalności ☀️

Tabele normowe są dla:

* 30°C otoczenia
* izolacja PVC: 70°C max

**Przykład:**

* 2,5 mm² → 26 A @ 30°C
* 56–60°C:

  * współczynnik ≈ 0,5
  * realnie tylko 13 A

📌 **Dlaczego?**

* kabel już „ciepły"
* gorzej oddaje ciepło
* rośnie rezystancja
* spirala śmierci 🔥

👉 **Aplikacja MUSI**

* uwzględniać współczynniki temperaturowe
* inaczej w piekarni wyjdzie „dom jednorodzinny" 😉

---

## 9. Sposób ułożenia kabla – różnice rzędu amperów

Ta sama żyła 2,5 mm²:

* w peszlu w ścianie → ~21 A
* na ścianie → ~25 A
* w tynku / murze → ~29 A
* w powietrzu → jeszcze więcej

📌 **Norma:**

* 73 sposoby ułożenia kabli

👉 **Wniosek**
Przekrój bez sposobu ułożenia = wróżenie z fusów

---

## 10. Jedno- vs trójfazowe obciążenie żył

**1-fazowe**

* 2 żyły czynne

**3-fazowe**

* 3 żyły fazowe
* neutralny:

  * przy symetrii → ~0 A
  * norma pomija go w obciążalności

👉 **Aplikacja**

* licz liczbę żył obciążonych
* to zmienia wartość z tabeli

---

## 11. Praktyczna reguła zabezpieczeń (MEGA ważne)

**Zabezpieczenie ≤ obciążalność kabla**

**Przykład:**

* 2,5 mm² w peszlu w ścianie
* obciążalność ≈ 21 A
* max zabezpieczenie: 20 A
* ⚠️ 25 A = błąd projektowy

👉 To jest reguła, którą aplikacja ma wymuszać, a nie tylko sugerować.

---

## 12. Co z tego MUSI znaleźć się w Twojej aplikacji

**Minimalny silnik decyzyjny:**

* źródło danych:

  * prąd z tabliczki lub
  * moc + cosφ
* liczba faz
* sposób ułożenia
* temperatura otoczenia
* liczba żył obciążonych
* typ kabla (PVC / inna izolacja)
* typowy szereg przekrojów
* zabezpieczenie ≤ kabel

---

# Dobór kabli wg PN-HD 60364-5-52 – PART 3

Kabel, zabezpieczenie i zdrowy rozsądek (czyli dlaczego w realu zawsze wychodzi „grubszy")

## 1. Kabel ≠ zabezpieczenie (najczęstszy i najgroźniejszy błąd)

**Złota zasada:**

> Zabezpieczenie chroni kabel, a nie odwrotnie

**Przykład:**

* kabel: 2,5 mm²
* ułożenie: peszel w ścianie
* obciążalność: ≈ 21 A
* maksymalne zabezpieczenie: B20
* ❌ B25 = błąd projektowy

**Dlaczego?**

* kabel się nagrzewa
* rezystancja rośnie
* izolacja traci właściwości
* 🔥 witamy w świecie pożarów

👉 **Aplikacja MUSI wymuszać warunek:**

```
In ≤ Iz_kabla
```

Bez „czy na pewno?", bez trybu eksperta.

---

## 2. Ten sam kabel – różne światy (sposób ułożenia)

Ten sam przekrój: 2,5 mm²

* peszel / ściana izolowana → ~21 A
* bezpośrednio w tynku → ~29 A
* na ścianie / w powietrzu → jeszcze więcej

**Teoretycznie:**

* w tynku można dać B25

**Praktycznie:**

* i tak dajemy B20, bo:

  * temperatura
  * sąsiednie kable
  * brak idealnych warunków
  * zapas bezpieczeństwa

👉 **Wniosek**
Zdrowy rozsądek > tabelka
(aplikacja nie powinna projektować „laboratorium", tylko realny świat)

---

## 3. Jedna faza vs trzy fazy – to NIE jest to samo

Ten sam kabel: 2,5 mm²

**Jednofazowo:**

* 2 żyły obciążone
* B20 – OK

**Trójfazowo:**

* 3 żyły obciążone
* żyły grzeją się nawzajem
* obciążalność spada do ~19 A
* max zabezpieczenie: B16

❗ **Charakterystyka B / C**

* NIE wpływa na obciążalność długotrwałą
* dotyczy tylko prądów chwilowych (rozruch, zwarcie)

👉 **Aplikacja**

* niech NIE „podkręca" zabezpieczenia tylko dlatego, że to C-ka

---

## 4. Przykład prosty: naświetlacz LED 500 W

* prąd: bardzo mały
* ale:

  * minimalny przekrój normowy: 1,5 mm²
  * względy mechaniczne > elektryczne

**Wnioski:**

* kabel wtyczkowy: 1,5 mm²
* instalacja gniazda:

  * 2,5 mm² (SEP, dobre praktyki)

👉 **To:**

* ❌ nie wynika wprost z PN-HD
* ✅ wynika z norm branżowych i doświadczenia

Aplikacja powinna to komunikować, nie „udowadniać tabelką".

---

## 5. Silnik 7,5 kW – klasyczna pułapka

**Dane:**

* prąd znamionowy: ~15,7 A

**Teoretycznie:**

* kabel: 2,5 mm²
* zabezpieczenie: B16

**Praktycznie:**

* ❌ na granicy
* ❌ wyzwalanie po czasie
* ❌ nagrzewanie bimetalu
* ❌ brak zapasu

**Dlaczego?**

* rozruch silnika
* asymetria faz
* temperatura rozdzielnicy
* inne aparaty grzejące się obok

**Poprawne rozwiązanie:**

* kabel: 4 mm²
* zabezpieczenie: B25
* dodatkowo:

  * wyłącznik silnikowy (ochrona silnika)
  * MCB → chroni kabel + wtyczkę

👉 **Doświadczony elektryk:**

> „7,5 kW? Daj 4 mm²."

Bez liczenia. I ma rację.

---

## 6. Wtyczki i gniazda – nigdy na styk

**Standardy:**

* 16 A
* 32 A

❌ **Niedozwolone:**

* dobór wtyczki na granicy prądu znamionowego

**Dlaczego?**

* brak zapasu na:

  * rozruch
  * przeciążenia chwilowe
  * asymetrię napięć

👉 **Reguły praktyczne:**

* silnik ~16 A → wtyczka 32 A
* wtyczka 32 A →
  kabel + zabezpieczenie też wyżej

Aplikacja powinna blokować konfiguracje „na styk".

---

## 7. Warunek selektywności (MEGA ważny)

**Kolejność „kto musi być najsilniejszy":**

1. kabel
2. zabezpieczenie
3. odbiornik

**Przy zwarciu:**

* kabel MUSI:

  * wytrzymać prąd zwarcia
  * zanim zabezpieczenie zadziała
* zabezpieczenie:

  * wyłącza po czasie
  * powstaje łuk elektryczny

👉 **Warunek projektowy:**

```
Iz_kabla > In_zabezpieczenia > Ib_obciążenia
```

To nie jest teoria akademicka, tylko fizyka + pożary.

---

## 8. Płyta indukcyjna – ekstremum jednofazowe

**Jedna faza:**

* moc: 7–7,5 kW
* prąd: ~32 A

**Opcje techniczne:**

* 6 mm² w ścianie izolowanej → OK
* 4 mm² w tynku / na ścianie → OK

**Problemy praktyczne:**

* brak MCB B35
* zaciski płyty:

  * nie przyjmą 10 mm²
  * ciasno, gorąco, bez zapasu

**Sensowne rozwiązanie:**

* ograniczenie mocy do ~4 kW
* prąd: ~18 A
* 4 mm² + B20 / B25

👉 Teoria mówi: „da się"
👉 Praktyka mówi: „po co się męczyć?"

---

## 9. Dwufazowa płyta indukcyjna

* prąd na fazę: ~16 A

**Teoretycznie:**

* 2,5 mm²

**W praktyce:**

* w ścianie izolowanej:

  * B16 = styk
  * brak zapasu
  * brak komfortu

👉 **Wniosek praktyczny:**

* 4 mm²
* B25
* spokój psychiczny + termiczny 😌

---

## 10. Warunki środowiskowe – kabel to nie makaron 🍝

**Trudne warunki:**

* UV
* woda
* chemia
* zgniatanie

👉 **H07RN-F**

* guma
* 90°C
* wysoka odporność
* odbiorniki ruchome

**Odbiorniki stacjonarne:**

* H07R / H07RN
* trwalsze niż PVC

**Instalacje w ścianie:**

* YDY

**od puszki do urządzenia:**

* OMY / linka
* bo urządzenie się rusza

❗ **PVC**

* 70°C
* brak odporności UV
* słońce → żółknie, kruszeje, traci izolację

---

## 11. Izolacja ma znaczenie

**PVC**

* 70°C (praca)
* ~160°C (zwarcie)

**XLPE**

* 90°C
* obciążalność nawet +20%

👉 Dlatego „lepsze" kable:

* większa obciążalność
* mniejsze ryzyko
* wyższa cena (niestety)

Aplikacja powinna różnicować obciążalność po izolacji, nie tylko po mm².

---

## 12. Ostateczne przesłanie (najważniejsze)

> Norma = minimum
> Doświadczenie = bezpieczeństwo

**Zawsze lepiej:**

* grubszy kabel
* mniejsze zabezpieczenie

**niż:**

* kabel na styk
* aparat gotujący się w rozdzielnicy

**Jeśli:**

* teoria mówi 2,5 mm²
* elektryk mówi 4 mm²

👉 **Słuchaj elektryka.**

---

## Notatki

<!-- Tutaj możesz dodać dodatkowe informacje, uwagi, przykłady itp. -->
{"type":"cart","language":"pl","link":"https://checkout.profitroom.com/pl/booking/step3/material/rezydencjamerwede/CDONKKI/3166e2b9c4e9bba7ad5ca1c4de62f00c?Currency=PLN&Source=v7&accepted-cookie-policies=necessary%2Canalytics%2Cmarketing&cart_id=db9353ef-83f6-4a39-a4c0-803b9a1158ff&firstStepOccupancy%5Br1_adults%5D=1","offerName":"Oferta bezzwrotna","originalPrice":{"amount":121,"currency":"PLN"},"finalPrice":{"amount":121,"currency":"PLN"},"loyalty":null,"checkIn":"2025-12-24","checkOut":"2025-12-26","offerId":560606,"rooms":[{"id":323280,"occupancy":{"adults":1,"children":0}}],"imageUrl":"https://r.profitroom.pl/rezydencjamerwede/images/rooms/95f12f96-4861-4552-960d-6700faf96a1b.jpeg","taxesPresentationMode":"net","siteCountry":"PL"}