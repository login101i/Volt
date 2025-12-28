# 🚀 ngrok Quick Start Guide

Ten przewodnik pomoże Ci udostępnić aplikację Volt przez internet, aby Twój kolega mógł z niej korzystać zdalnie.

## ⚡ **Szybkie podsumowanie:**

1. **Uruchom serwery:** `npm run dev:frontend` i `npm run dev:server`
2. **Uruchom ngrok:** `npm run ngrok` (lub `ngrok http 3000`)
3. **Skopiuj URL** z terminala
4. **Udostępnij URL** koledze
5. **Gotowe!** 🎉

**Lub uruchom wszystko razem:** `npm run ngrok:all`

---

## 📥 **Krok 0: Instalacja ngrok (jeśli jeszcze nie masz)**

### **1. Pobierz ngrok**
- Pobierz z: https://ngrok.com/download
- Wybierz wersję dla Windows
- Rozpakuj `ngrok.exe`

### **2. Dodaj ngrok do PATH**

**Opcja A: Dodaj do istniejącego folderu**
- Skopiuj `ngrok.exe` do `C:\Windows\System32`
- Lub do folderu, który jest już w PATH

**Opcja B: Utwórz nowy folder**
- Utwórz folder np. `C:\ngrok`
- Skopiuj tam `ngrok.exe`
- Dodaj `C:\ngrok` do PATH:
  1. Otwórz "Zmienne środowiskowe" w Windows
  2. Znajdź "Path" w zmiennych systemowych
  3. Dodaj `C:\ngrok`
  4. Zrestartuj PowerShell

**Opcja C: Chocolatey (jeśli masz)**
```powershell
choco install ngrok
```

### **3. Skonfiguruj authtoken**
- Zarejestruj się na: https://dashboard.ngrok.com/signup
- Pobierz authtoken z: https://dashboard.ngrok.com/get-started/your-authtoken
- Skonfiguruj:
  ```powershell
  ngrok config add-authtoken YOUR_AUTH_TOKEN
  ```

### **4. Sprawdź instalację**
```powershell
ngrok version
```

Jeśli widzisz wersję ngrok, wszystko działa! ✅

---

## ✅ **Krok 1: Upewnij się, że serwery działają**

Sprawdź czy serwery są uruchomione:

```powershell
# Terminal 1 - Frontend
npm run dev:frontend

# Terminal 2 - Backend  
npm run dev:server
```

**Lub uruchom wszystko razem:**

```powershell
npm run ngrok:all
```

To uruchomi frontend, backend i ngrok automatycznie!

---

## 🌐 **Krok 2: Wystaw aplikację przez ngrok**

### **Opcja A: Automatyczna (Rekomendowana)** ⭐

Jeśli serwery już działają, otwórz **nowe okno PowerShell** i uruchom:

```powershell
npm run ngrok
```

### **Opcja B: Prosta metoda** ⚡

Jeśli wolisz prostą metodę (jak w przykładzie):

```powershell
ngrok http 3000
```

---

## 📋 **Co zobaczysz:**

### **Z automatyczną metodą (`npm run ngrok`):**

```
✅ ngrok tunnel is active!

🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗

📤 LINK DO UDOSTĘPNIENIA Z KOLEGĄ:

──────────────────────────────────────────────────────────────────────

   https://abc123.ngrok-free.app

──────────────────────────────────────────────────────────────────────

💾 URL zapisany również w pliku: ngrok-url.txt
```

### **Z prostą metodą (`ngrok http 3000`):**

```
ngrok

Session Status                online
Account                       Your Email (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       45ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Ważne:** 
- Linia `Forwarding` pokazuje Twój publiczny URL
- Skopiuj URL `https://abc123.ngrok-free.app`
- **Nie zamykaj tego okna PowerShell** (tunel musi być aktywny!)

---

## 🔗 **Krok 3: Udostępnij URL**

Udostępnij URL ngrok koledze:

```
https://abc123.ngrok-free.app
```

**Jak udostępnić:**
1. **Skopiuj link** z terminala (lub z pliku `ngrok-url.txt`)
2. **Wyślij go koledze** (email, Teams, Slack, WhatsApp, etc.)
3. **Kolega otwiera link** w przeglądarce
4. **Gotowe!** 🎉

**Pro Tip:** Link jest też zapisany w pliku `ngrok-url.txt` w głównym folderze projektu - możesz go łatwo skopiować stamtąd!

---

## 🎯 **Szybkie komendy:**

```powershell
# Wystaw frontend (port 3000) - automatyczna metoda
npm run ngrok

# Wystaw frontend (port 3000) - prosta metoda
ngrok http 3000

# Uruchom wszystko razem (frontend + backend + ngrok)
npm run ngrok:all

# Sprawdź aktualny URL (jeśli zapomniałeś)
npm run ngrok:url

# Otwórz dashboard ngrok (zobacz wszystkie requesty)
# Otwórz w przeglądarce: http://127.0.0.1:4040
```

---

## ⚠️ **Ważne uwagi:**

1. **Nie zamykaj okna ngrok** - Tunel zamknie się, jeśli zamkniesz okno PowerShell
2. **Ograniczenia darmowego planu:**
   - URL zmienia się przy każdym restarcie ngrok
   - Losowa subdomena (np. `abc123.ngrok-free.app`)
   - Ograniczenia przepustowości
3. **Bezpieczeństwo:**
   - Każdy z URL może uzyskać dostęp do Twojej aplikacji
   - Nie udostępniaj URL publicznie
   - Rozważ użycie ochrony hasłem w ngrok dla wrażliwych aplikacji

---

## 🆘 **Rozwiązywanie problemów:**

### **"ngrok is not installed" / "ngrok: command not found"**
- Upewnij się, że ngrok.exe jest w PATH
- Sprawdź instalację: `ngrok version`
- Pobierz z: https://ngrok.com/download
- Lub zainstaluj przez Chocolatey: `choco install ngrok`

### **"Port 3000 is not in use"**
- Upewnij się, że frontend działa: `npm run dev:frontend`
- Sprawdź czy port jest używany: `netstat -ano | findstr :3000`
- Sprawdź czy backend działa: `npm run dev:server`

### **"No tunnel found for port X"**
- Poczekaj kilka sekund po uruchomieniu ngrok
- Sprawdź dashboard ngrok: http://localhost:4040
- Upewnij się, że serwery działają na portach 3000 i 5000

### **"Port already in use"**
- Upewnij się, że żadna inna aplikacja nie używa portów 3000 lub 5000
- Zatrzymaj istniejące serwery przed uruchomieniem

### **"Tunnel session failed"**
- Sprawdź połączenie internetowe
- Upewnij się, że ngrok jest aktualny: `ngrok update`
- Skonfiguruj authtoken: `ngrok config add-authtoken YOUR_TOKEN`
- Spróbuj ponownie

### **Błędy CORS**
- Serwer jest skonfigurowany do automatycznego akceptowania URL-i ngrok
- Jeśli nadal widzisz błędy CORS, sprawdź konsolę serwera dla dozwolonych originów

### **Kolega nie może uzyskać dostępu**
- Sprawdź czy tunel ngrok jest aktywny (dashboard: http://localhost:4040)
- Upewnij się, że firewall pozwala na połączenia
- Sprawdź czy oba serwery (frontend i backend) działają
- Upewnij się, że kolega używa poprawnego URL Frontend (nie Backend)

---

## ✅ **Checklista sukcesu:**

- [ ] Serwery działają (`npm run dev:frontend` i `npm run dev:server`)
- [ ] ngrok uruchomiony (`npm run ngrok` lub `ngrok http 3000`)
- [ ] Otrzymałeś publiczny URL z outputu ngrok
- [ ] URL zapisany w pliku `ngrok-url.txt`
- [ ] Udostępniłeś URL koledze
- [ ] Przetestowałeś URL w przeglądarce (działa!)

---

## 🔍 **Monitorowanie:**

### **Dashboard ngrok**

Otwórz http://localhost:4040 w przeglądarce, aby zobaczyć:
- Logi requestów
- Czasy odpowiedzi
- Status tunelu
- Publiczne URL-e
- Wszystkie przychodzące requesty (świetne do debugowania!)

💡 **Pro Tip**: Dashboard jest bardzo przydatny do:
- Widzenia jakie requesty przychodzą
- Debugowania problemów z webhookami
- Sprawdzania czasów odpowiedzi
- Przeglądania nagłówków request/response

### **Sprawdź aktualny URL**

Jeśli zapomniałeś URL lub chcesz go zobaczyć ponownie:

```powershell
npm run ngrok:url
```

To pokaże aktualny URL ngrok i zapisze go do `ngrok-url.txt`.

---

## 💡 **Jak to działa (proste wyjaśnienie):**

Ngrok przekształca Twoją lokalną aplikację w publiczną:

```
Twoja lokalna aplikacja (localhost:3000)
         ↓
    tunel ngrok
         ↓
Publiczny URL (https://abcd.ngrok-free.app)
         ↓
    Internet 🌍
```

**W Twoim przypadku:**
- Frontend działa na `localhost:3000` (Next.js)
- Backend działa na `localhost:5000` (Express)
- ngrok wystawia frontend jako publiczny URL
- Next.js proxy automatycznie przekierowuje wywołania API do backendu
- **Rezultat**: Tylko frontend musi być publiczny! 🎉

---

## 🔄 **Porównanie metod:**

| Funkcja | Prosta (`ngrok http 3000`) | Automatyczna (`npm run ngrok`) |
|---------|---------------------------|-------------------------------|
| Setup | ✅ Super prosta | ✅ Zautomatyzowana |
| Wykrywanie URL | ❌ Ręczne kopiowanie | ✅ Automatyczne |
| Wiele tuneli | ❌ Jeden na raz | ✅ Frontend + backend |
| Konfiguracja | ❌ Tylko linia poleceń | ✅ Plik konfiguracyjny (`ngrok.yml`) |
| Najlepsze dla | Szybki test | Gotowa do produkcji |

---

## ⚙️ **Zaawansowana konfiguracja:**

### **Plik konfiguracyjny ngrok**

Plik `ngrok.yml` zawiera konfigurację tunelu. Możesz go modyfikować w razie potrzeby:

```yaml
tunnels:
  frontend:
    addr: 3000
    proto: http
    schemes: [https]  # Wymusza HTTPS
    
  backend:
    addr: 5000
    proto: http
    schemes: [https]  # Wymusza HTTPS
```

### **Zmienne środowiskowe**

Możesz ustawić zmienne środowiskowe do konfiguracji serwerów:

- `FRONTEND_URL` - URL frontendu (domyślnie: `http://localhost:3000`)
- `NGROK_FRONTEND_URL` - URL ngrok frontendu (automatycznie wykrywany)
- `PORT` - Port backendu (domyślnie: `5000`)
- `HOST` - Host backendu (domyślnie: `0.0.0.0` dla dostępu przez ngrok)

---

## 📚 **Dodatkowe zasoby:**

- Dokumentacja ngrok: https://ngrok.com/docs
- Dashboard ngrok: https://dashboard.ngrok.com
- Interfejs web ngrok: http://localhost:4040 (gdy działa)

---

**To wszystko! Twoja aplikacja jest teraz dostępna z internetu! 🌐**
