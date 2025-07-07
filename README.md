# User Agent Parser

Aplikasi Node.js untuk parsing dan filtering user agent berdasarkan versi OS:
- Android 11 ke atas
- iOS 17 ke atas

## Fitur

- ✅ Parse multiple user agents sekaligus
- ✅ Filter otomatis untuk Android 11+ dan iOS 17+
- ✅ Interface web yang modern dan responsive
- ✅ Menampilkan informasi detail browser, OS, dan device
- ✅ Statistik hasil parsing
- ✅ Indikator visual untuk hasil valid/invalid

## Instalasi

1. Clone atau download project ini
2. Install dependencies:
```bash
npm install
```

3. Jalankan aplikasi:
```bash
npm start
```

Atau untuk development dengan auto-reload:
```bash
npm run dev
```

4. Buka browser dan akses: `http://localhost:3000`

## Cara Penggunaan

1. Masukkan daftar user agent di textarea (satu user agent per baris)
2. Klik tombol "Parse & Filter User Agents"
3. Lihat hasil parsing dengan informasi:
   - Browser dan versi
   - Operating System dan versi
   - Device model
   - Status valid/invalid berdasarkan kriteria

## Kriteria Filtering

- **Android**: Hanya versi 11 ke atas yang dianggap valid
- **iOS**: Hanya versi 17 ke atas yang dianggap valid
- **OS Lain**: Semua OS selain Android dan iOS akan difilter

## Dependencies

- Express.js - Web framework
- ua-parser-js - Library untuk parsing user agent
- Bootstrap 5 - UI framework
- Font Awesome - Icons

## Struktur Project

```
userAgentParser/
├── package.json
├── server.js
├── public/
│   └── index.html
└── README.md
```

## API Endpoint

### POST /parse
Endpoint untuk parsing user agents.

**Request Body:**
```json
{
  "userAgents": "string dengan user agents dipisah newline"
}
```

**Response:**
```json
{
  "success": true,
  "total": 4,
  "valid": 2,
  "invalid": 2,
  "results": [
    {
      "index": 1,
      "userAgent": "...",
      "browser": "Chrome 91.0.4472.124",
      "os": "Android 12",
      "device": "SM-G998B",
      "isValid": true,
      "reason": "Android 12 (Valid - Android 11+)"
    }
  ]
}
```
