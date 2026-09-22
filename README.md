# 🚀 SauceDemo WebdriverIO (TypeScript) & k6 (JavaScript) Test Automation Project

Bu proje, [SauceDemo](https://www.saucedemo.com/) e-ticaret platformu için geliştirilmiş; **WebdriverIO (TypeScript)** ile UI uçtan uca (E2E) web otomasyonunu ve **Grafana k6 (JavaScript)** ile yük/performans testlerini bir araya getiren, modern, sürdürülebilir, modüler ve kurumsal standartlarda bir test otomasyon projesidir.

---

## 📑 İçindekiler
- [🛠️ Teknoloji Yığını (Tech Stack)](#️-teknoloji-yığını-tech-stack)
- [📂 Proje Mimarisi](#-proje-mimarisi)
- [🧪 Test Senaryoları](#-test-senaryoları)
- [📊 Performans Eşik Değerleri (Thresholds)](#-performans-eşik-değerleri-thresholds)
- [⚙️ Kurulum ve Ön Koşullar](#️-kurulum-ve-ön-koşullar)
- [🚀 Testleri Çalıştırma](#-testleri-çalıştırma)
- [📈 Raporlama Çıktıları](#-raporlama-çıktıları)
- [🔄 CI/CD Pipeline Entegrasyonu](#-cicd-pipeline-entegrasyonu)
- [🎯 Tasarım Prensipleri](#-tasarım-prensipleri)

---

## 🛠️ Teknoloji Yığını (Tech Stack)

| Kategori | Teknoloji / Kütüphane | Açıklama |
| :--- | :--- | :--- |
| **Web Test Runner** | [WebdriverIO v9](https://webdriver.io/) | Modern W3C WebDriver ve Bidi protokol destekli E2E test framework'ü |
| **Dil (E2E)** | [TypeScript 5](https://www.typescriptlang.org/) | Tip güvenli (Type-safe), sürdürülebilir nesne yönelimli kodlama |
| **Test Framework** | [Mocha](https://mochajs.org/) + BDD Expect | BDD tarzı `describe`, `it` ve `expect` assertion kütüphanesi |
| **Performans Testi** | [Grafana k6](https://k6.io/) | Yüksek performanslı Go tabanlı, JavaScript ile yazılan yük testi aracı |
| **Tasarım Deseni** | [Page Object Model (POM)](https://martinfowler.com/bliki/PageObjectModel.html) | UI elemanları ile test adımlarını kesin hatlarla ayrıştıran mimari |
| **CI/CD** | GitHub Actions | Otomatik derleme, test çalıştırma ve rapor arşivleme pipeline'ı |

---

## 📂 Proje Mimarisi

```text
WebdriverIO-k6-SauceDemoAutomationProject/
├── .github/
│   └── workflows/
│       └── test-pipeline.yml         # GitHub Actions CI/CD Pipeline
├── reports/                          # Otomatik üretilen test çıktıları
│   └── performance/
│       ├── k6-report.html            # k6 HTML Dashboard raporu
│       └── k6-summary.json           # k6 metrikleri ve JSON özeti
├── scripts/
│   └── run-k6.js                     # Çapraz platform k6 yürütücü betiği
├── src/
│   ├── config/
│   │   └── wdio.conf.ts              # WebdriverIO TypeScript konfigürasyonu (Chrome, timeouts, spec)
│   ├── constants/
│   │   ├── routes.ts                 # Sayfa URL ve endpoint sabitleri
│   │   └── messages.ts               # UI başlıkları, validasyon ve başarı mesajları
│   ├── data/
│   │   └── testData.ts               # Kullanıcı kimlikleri, müşteri bilgileri ve ürün modelleri
│   ├── pages/                        # Page Object Model (POM) sınıfları
│   │   ├── base/
│   │   │   └── BasePage.ts           # Merkezi ortak metotlar (click, setValue, isDisplayed, waitForDisplayed)
│   │   ├── components/
│   │   │   ├── HeaderComponent.ts    # Başlık, sepet rozeti ve hamburger menü tetikleyicisi
│   │   │   └── MenuComponent.ts      # Yan menü ve güvenli Logout aksiyonu
│   │   ├── LoginPage.ts              # Giriş formu ve kimlik doğrulama metotları
│   │   ├── InventoryPage.ts          # Ürün listesi, sıralama ve sepete ekleme/çıkarma
│   │   ├── CartPage.ts               # Sepet ürün kontrolü ve Checkout'a ilerleme
│   │   ├── CheckoutStepOnePage.ts    # Ad, Soyad, Posta kodu teslimat formu
│   │   ├── CheckoutStepTwoPage.ts    # Sipariş özeti, ara toplam, vergi ve genel toplam kontrolleri
│   │   └── CheckoutCompletePage.ts   # "Thank you for your order!" doğrulama ve ana sayfaya dönüş
│   └── utils/
│       └── logger.ts                 # Renkli/emojili, zaman damgalı terminal adım loglayıcı
├── tests/
│   ├── e2e/
│   │   └── sauceDemoOrderFlow.e2e.ts # WebdriverIO TypeScript E2E Satın Alma Senaryosu
│   └── performance/
│       ├── config/
│       │   └── k6.config.js          # k6 eşik değerleri (thresholds), aşamalar (stages) ve başlıklar
│       └── sauceDemoLoad.test.js     # k6 JavaScript Kullanıcı Akışı Yük/Performans Senaryosu
├── package.json                      # NPM bağımlılıkları ve çalıştırma scriptleri
├── tsconfig.json                     # TypeScript derleyici yapılandırması
├── .gitignore                        # Git sürüm kontrolü dışlama listesi
└── README.md                         # Proje dokümantasyonu
```

---

## 🧪 Test Senaryoları

### 1. 🌐 WebdriverIO E2E Senaryosu (`sauceDemoOrderFlow.e2e.ts`)
* **Adım 1:** SauceDemo giriş sayfasına erişim ve formun hazır olduğunu doğrulama.
* **Adım 2:** `standard_user` kimlik bilgileriyle başarılı oturum açma.
* **Adım 3:** Ürünler sayfasına (`/inventory.html`) yönlenildiğini ve `"Products"` başlığını doğrulama.
* **Adım 4:** Seçilen ürünleri (`Sauce Labs Backpack`, `Sauce Labs Bike Light`) sepete ekleme.
* **Adım 5:** Sepet ikonundaki rozet sayısının `2` olduğunu doğrulama.
* **Adım 6:** Sepet sayfasına gidip eklenen tüm ürün isimlerini doğrulama.
* **Adım 7:** Checkout adımına ilerleme ve `"Checkout: Your Information"` ekranını doğrulama.
* **Adım 8:** Müşteri teslimat bilgilerini (Ad, Soyad, Posta Kodu) doldurarak devam etme.
* **Adım 9:** Sipariş özeti ekranında ürün listesini, ara toplamı, vergi tutarını ve genel toplamı doğrulama.
* **Adım 10:** Siparişi tamamlama ve `"Thank you for your order!"` teyit mesajını alma.
* **Adım 11:** Hamburger menüyü açarak Logout bağlantısına tıklama.
* **Adım 12:** Giriş sayfasına güvenli bir şekilde dönüldüğünü doğrulama.

### 2. ⚡ k6 Performans Senaryosu (`sauceDemoLoad.test.js`)
* **01_LandingPage_HTML:** Giriş sayfası ana dokümanının HTTP 200 yanıtı ve `p95 < 1000ms` sürede döndüğünün kontrolü.
* **02_Stylesheet_Bundle:** Uygulamanın CSS stil dosyasının hızlı ve hatasız indirildiğinin doğrulanması.
* **03_JavaScript_Bundle:** Ana React uygulama bundle'ının HTTP 200 ile teslim edildiğinin kontrolü.
* **04_Web_Manifest:** Web manifest dosyasının canlılık kontrolü.
* **05_Favicon_Asset:** Statik ikon varlığının performans doğrulaması.
* **Özel Metrikler:** `saucedemo_page_response_time` (Trend), `saucedemo_successful_requests` (Counter), `saucedemo_error_rate` (Rate).

---

## 📊 Performans Eşik Değerleri (Thresholds)

k6 test senaryosunda tanımlanan SLA / Kalite kapıları:
* **Yanıt Süresi:** İsteklerin en az %95'i 1000 ms'nin altında tamamlanmalıdır ($p_{95} < 1000\text{ ms}$).
* **Hata Oranı:** Başarısız istek oranı %5'in altında olmalıdır (`rate < 0.05`).
* **Doğrulama Oranı:** Yapılan `check()` kontrollerinin en az %95'i başarılı olmalıdır (`checks rate > 0.95`).

---

## ⚙️ Kurulum ve Ön Koşullar

### Ön Koşullar:
1. **Node.js:** `>= 18.x` (Önerilen: LTS veya v20+)
2. **Google Chrome:** Güncel sürüm
3. **k6:** Grafana k6 CLI aracı (`winget install GrafanaLabs.k6` veya paket yöneticiniz ile)

### Bağımlılıkları Yükleme:
```bash
npm install
```

---

## 🚀 Testleri Çalıştırma

| Komut | Açıklama |
| :--- | :--- |
| `npm run test:e2e` | WebdriverIO UI E2E testini headless Chrome üzerinde koşturur |
| `npm run test:perf` | k6 performans testini çalıştırır ve konsol/HTML raporu üretir |
| `npm run test:perf:smoke` | 1 sanal kullanıcıyla (1 VU, 5s) hızlı k6 canlılık testi koşturur |
| `npm run test:all` | **Hem WebdriverIO E2E hem de k6 Performans testlerini ardışık olarak koşturur** |
| `npm test` | Varsayılan olarak `npm run test:e2e` komutunu tetikler |

---

## 📈 Raporlama Çıktıları

Test koşumlarının ardından aşağıdaki raporlar otomatik olarak güncellenir:
* **k6 HTML Dashboard:** `reports/performance/k6-report.html` (Tarayıcınızda açarak ortalama süreleri ve başarı kartlarını inceleyebilirsiniz).
* **k6 JSON Metrikleri:** `reports/performance/k6-summary.json` (Detaylı sayaçlar, yüzdelik dilimler ve trendler).
* **WebdriverIO Spec Reporter:** Terminalde her adım için renkli ikonlar, süreler ve doğrulama sonuçları.

---

## 🔄 CI/CD Pipeline Entegrasyonu

Proje, GitHub Actions üzerinde otomatik olarak çalışacak şekilde `.github/workflows/test-pipeline.yml` dosyası ile yapılandırılmıştır:
1. Kod push veya pull request yapıldığında tetiklenir.
2. Ubuntu ortamında Node.js ve k6 CLI araçlarını kurar.
3. E2E ve performans testlerini çalıştırır.
4. Raporları test artefaktı (`test-reports`) olarak GitHub üzerinden indirilebilir şekilde saklar.

---

## 🎯 Tasarım Prensipleri

1. **Zero Redundancy & YAGNI:** İhtiyaç duyulmayan hiçbir harici kütüphane veya soyutlama katmanı eklenmemiştir.
2. **Page Object Model (POM):** UI lokatörleri ve sayfa işlevleri ilgili sayfa nesnesi içerisinde kapsüllenmiştir (`src/pages/`).
3. **Merkezi Konfigürasyon ve Test Datası:** URL'ler (`routes.ts`), metinler (`messages.ts`) ve kullanıcı verileri (`testData.ts`) ayrıştırılmıştır.
4. **Dayanıklı Doğrulama (Resilient Waiting):** Sayfa geçişlerinde yarış durumlarını (race condition) önlemek amacıyla dinamik timeout mekanizması kullanılmıştır.
