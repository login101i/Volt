# Tydzień 4: Python + S3 Podstawy (Integracja z aplikacją Volt)

## Cel
Integracja Python + S3 z istniejącą aplikacją TypeScript Volt. Przesyłanie danych komponentów elektrycznych i zdjęć z PostgreSQL/lokalnego storage do S3.

## Wymagania wstępne

### 1. AWS Konto i IAM
```bash
# Zainstaluj AWS CLI
pip install awscli

# Skonfiguruj credentials
aws configure
```

### 2. Uprawnienia IAM dla S3
Utwórz IAM policy z następującymi uprawnieniami:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketLocation"
      ],
      "Resource": [
        "arn:aws:s3:::twoj-bucket-volt/*",
        "arn:aws:s3:::twoj-bucket-volt"
      ]
    }
  ]
}
```

### 3. Zmienne środowiskowe
Utwórz plik `.env` w głównym katalogu projektu:
```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_DEFAULT_REGION=eu-central-1
S3_BUCKET_NAME=volt-data-lake

# PostgreSQL (z tygodnia 2)
POSTGRES_HOST=your-rds-endpoint.rds.amazonaws.com
POSTGRES_PORT=5432
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
```

### 4. Instalacja zależności
```bash
cd scripts/python
pip install -r requirements.txt
```

## Struktura plików

```
week4/
├── README.md                    # Ten plik
├── s3_config.py                # Konfiguracja połączenia S3
├── volt_data_to_s3.py          # Migracja danych z PostgreSQL do S3
├── volt_images_to_s3.py        # Migracja zdjęć do S3
├── presigned_urls.py           # Generator presigned URLs
└── requirements.txt            # Dodatkowe zależności
```

## Zadania do wykonania

### ✅ Zadanie 1: Migracja danych komponentów do S3

**Cel:** Przesłać dane komponentów elektrycznych z PostgreSQL do S3 w formatach JSON i CSV.

```bash
# Uruchom migrację danych
python volt_data_to_s3.py
```

**Co robi skrypt:**
- Łączy się z PostgreSQL
- Pobiera wszystkie komponenty elektryczne
- Przesyła dane jako JSON do `raw/components/`
- Przesyła dane jako CSV do `raw/components/dt=YYYY-MM-DD/`
- Dodaje metadane i znaczniki czasowe

**Struktura w S3 po migracji:**
```
volt-data-lake/
├── raw/
│   └── components/
│       ├── components_20241220_143022.json
│       └── dt=2024-12-20/
│           └── components.csv
```

### ✅ Zadanie 2: Migracja zdjęć komponentów do S3

**Cel:** Przesłać zdjęcia komponentów z lokalnego storage do S3.

```bash
# Uruchom migrację zdjęć
python volt_images_to_s3.py
```

**Co robi skrypt:**
- Skanuje katalog `frontend/public/pictures/electricComponents/`
- Przesyła zdjęcia do S3 z zachowaniem struktury
- Dodaje metadane (component_id, rozmiar, data modyfikacji)
- Generuje raport migracji

**Struktura w S3 po migracji:**
```
volt-data-lake/
├── images/
│   └── components/
│       ├── 1/
│       │   └── 1.jpg
│       ├── 2/
│       │   └── 2.jpg
│       └── ...
```

### ✅ Zadanie 3: Presigned URLs dla bezpiecznego dostępu

**Cel:** Wygenerować bezpieczne linki do zdjęć bez publicznego dostępu do bucketu.

```bash
# Test presigned URLs
python presigned_urls.py
```

**Możliwości:**
- Generowanie pojedynczych URLs
- Batch processing dla wszystkich komponentów
- Integracja z API Volt (kompatybilny format JSON)
- Konfigurowalny czas wygaśnięcia

**Przykład użycia w kodzie:**
```python
from presigned_urls import create_presigned_url_api_response

# Odpowiedź kompatybilna z API Volt
response = create_presigned_url_api_response("123", expiration_hours=24)
# {
#   "success": true,
#   "data": {
#     "componentId": "123",
#     "imageUrl": "https://volt-data-lake.s3.amazonaws.com/...",
#     "expiresAt": "2024-12-21T14:30:22",
#     "expiresInHours": 24
#   }
# }
```

## Integracja z aplikacją Volt

### Modyfikacja uploadController.js
Dodaj endpoint do generowania presigned URLs:

```javascript
// W server/routes/upload.ts
uploadRouter.get('/component-image-url/:componentId', async (req, res) => {
  const { componentId } = req.params;
  const { expirationHours = 24 } = req.query;

  try {
    // Wywołaj Python script do generowania URL
    const { spawn } = require('child_process');
    const pythonProcess = spawn('python', [
      'scripts/python/week4/presigned_urls.py',
      '--component-id', componentId,
      '--expiration', expirationHours
    ]);

    let result = '';
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        const urlData = JSON.parse(result);
        res.json(urlData);
      } else {
        res.status(500).json({ error: 'Failed to generate presigned URL' });
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Przykład użycia w frontend
```typescript
// W komponencie React
const getImageUrl = async (componentId: string) => {
  const response = await fetch(`/api/upload/component-image-url/${componentId}`);
  const data = await response.json();

  if (data.success) {
    return data.data.imageUrl; // Presigned URL
  }
  return null;
};
```

## Testowanie

### 1. Test konfiguracji S3
```bash
python -c "from s3_config import s3_config; s3_config.test_connection()"
```

### 2. Test migracji danych
```bash
python volt_data_to_s3.py
```

### 3. Test migracji zdjęć
```bash
python volt_images_to_s3.py
```

### 4. Test presigned URLs
```bash
python presigned_urls.py
```

## Bezpieczeństwo

- ✅ Używa presigned URLs zamiast publicznego dostępu
- ✅ IAM roles z least privilege
- ✅ Szyfrowanie danych w S3 (SSE-S3)
- ✅ Audit logs dla wszystkich operacji
- ✅ `.env` nie commitowany do git

## Monitoring i logowanie

Wszystkie skrypty zawierają:
- Szczegółowe logi operacji
- Raporty błędów
- Metryki sukcesu/porażki
- Czas wykonania operacji

## Następne kroki

Po ukończeniu tygodnia 4, przejdź do **tygodnia 5**:
- Event-driven processing z Lambda
- Konwersja CSV→Parquet
- AWS Glue ETL jobs
- Airflow DAGs

## Troubleshooting

### Błąd połączenia z S3
```
❌ Błąd połączenia z S3: Unable to locate credentials
```
**Rozwiązanie:** Sprawdź konfigurację AWS CLI i zmienne środowiskowe.

### Brak zdjęć w lokalnym katalogu
```
⚠️ Nie znaleziono zdjęć w katalogu
```
**Rozwiązanie:** Sprawdź ścieżkę `frontend/public/pictures/electricComponents/`

### Błąd PostgreSQL
```
❌ Błąd połączenia z PostgreSQL
```
**Rozwiązanie:** Sprawdź zmienne środowiskowe i połączenie z bazą danych.