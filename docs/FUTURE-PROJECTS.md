# RugVision — Gelecek Yol Haritası ve Yeni Proje Eklentileri

Bu doküman, RugVision platformunu daha da güçlendirecek, bütçe dostu veya eski telefonlarda (Redmi, Huawei vb.) AR/3D deneyimini %100 kapsama alacak yeni nesil modüllerin yol haritasını içermektedir.

---

## 🚀 Mevcut Durum (Sürüm 1.8)
- [x] WebXR (Android Chrome) & AR Quick Look (iOS Safari) entegrasyonu tamamlandı.
- [x] iOS pencerelerine benzeyen yarı saydam, koyu onay modali (`ARConfirmationModal`) entegre edildi.
- [x] Cihaz yeteneklerini (ARCore / Quick Look) dinamik olarak algılayan ve hata durumunda 3B önizlemeye düşen altyapı kuruldu.
- [x] Next.js üretim (Production) modunda optimize derleme yapıldı ve GitHub'a pushlandı.

---

## 🛠️ Planlanan Yeni Proje Eklentileri (Faz 4+)

### 📂 PROJE 1: Fotoğraf Üzerine Halı Yerleştirici (2D Perspective Canvas)
> **Amaç:** ARCore/derinlik sensörü desteği olmayan (tüm Redmi, Huawei, eski iPhone) cihazlarda kullanıcının odasının fotoğrafını yükleyerek halıyı perspektif olarak yerleştirebilmesini sağlamak.

- [ ] **1.1 Arayüz Tasarımı:** Kullanıcıya "Oda Fotoğrafı Yükle" butonu sunulması.
- [ ] **1.2 Canvas Entegrasyonu:** Yüklenen fotoğrafın arkada, halı görselinin ise önde dikey/yatay kontrol noktalarıyla (`fabric.js` veya HTML5 Canvas) render edilmesi.
- [ ] **1.3 Perspektif Algoritması (Homografi):** Kullanıcının 4 köşesinden tutarak sürüklediği noktaları matematiksel olarak CSS `matrix3d` transformuna dönüştürerek halıyı zemine yatırma.
- [ ] **1.4 Kaydetme & Paylaşma:** Yerleşimi yapılmış oda görselinin PNG formatında indirilebilmesi.

---

### 📂 PROJE 2: AI ile Fotoğraftan 3D Model Üretici (Image-to-3D Extruder)
> **Amaç:** Satıcıların elinde 3D model olmasa bile halının sadece kuşbakışı çekilmiş normal fotoğrafından (.glb/.usdz) modelleri otomatik üretmek.

- [ ] **2.1 Backend Pipeline Kurulumu:** Node.js (Three.js headless) veya Python (Blender API) tabanlı 3D mesh üreteci kurulması.
- [ ] **2.2 Doku Sıkıştırma (UV Mapping):** 2B halı görselini 8mm yüksekliğinde ince bir 3D kutu üzerine hatasız giydirme.
- [ ] **2.3 Otomatik Normal/Bump Map:** Halı görselinin renk dağılımından yararlanarak dokuma iplikleri ve püsküller için derinlik haritası üretimi.
- [ ] **2.4 R2 Entegrasyonu:** Üretilen modelin otomatik olarak Cloudflare R2 bulut depolama alanına yüklenmesi ve veritabanı kaydı.

---

### 📂 PROJE 3: Yapay Zeka Oda & Mobilya Segmentasyonu (AI Room Segmenter)
> **Amaç:** Odanın fotoğrafı yüklendiğinde yapay zekanın zemini, koltukları ve sehpaları otomatik algılayıp halıyı mobilyaların altına maskelemesi.

- [ ] **3.1 Model Entegrasyonu:** TensorFlow.js veya hafif bir WebAssembly segmentasyon modelinin (örn. MobileNet/SegFormer) istemciye yüklenmesi.
- [ ] **3.2 Otomatik Zemin Maskeleme:** Fotoğraftaki zemin piksellerini otomatik bulup halıyı el ile yerleştirmeye gerek kalmadan ortalama.
- [ ] **3.3 Mobilya Katmanı (Layering):** Koltuk bacakları ve masaların piksellerini halının üzerinde (üst katman olarak) tutarak gerçekçi yerleşim sağlama.

---

### 📂 PROJE 4: AR İçinden Dinamik Boyut Seçimi & Satın Alma (In-AR Sizing & Checkout)
> **Amaç:** Kullanıcı AR veya 3D modundayken ekran üzerinden halının farklı boyutlarını (varyantlarını) seçebilmesi ve halının odada gerçek boyutlarıyla büyüyüp küçülebilmesi.

- [ ] **4.1 Boyut Değiştirici Menü:** Arayüze boyut varyantı seçici dropdown/button tasarımı.
- [ ] **4.2 Dinamik Ölçeklendirme:** Model-viewer `scale` niteliğinin seçilen boyuta göre (örn: 1.6 1.0 2.3) dinamik olarak güncellenmesi.
- [ ] **4.3 Fiyat Entegrasyonu:** Seçilen boyuta göre fiyat bilgisinin güncellenmesi.
- [ ] **4.4 AR'dan Sepete Ekleme:** AR ekranı kapatılmadan doğrudan sepet işleminin tetiklenebilmesi.

---

### 📂 PROJE 5: "Nasıl Durdu?" Sosyal Paylaşım Modülü (Collaborative AR Shopping)
> **Amaç:** Kullanıcı halıyı odasına yerleştirdikten sonra odanın halıyla birlikte fotoğrafını tek tuşla çekip paylaşabilmesini sağlamak.

- [ ] **5.1 Ekran Görüntüsü Alıcı (Snapshot):** Model-viewer'ın `toDataURL()` yeteneğini kullanarak yerleştirilen halının ve oda arka planının fotoğrafını çekme.
- [ ] **5.2 Görsel Birleştirme:** Kullanıcının oda görüntüsü ile 3D model frame'ini hatasız birleştiren canvas aracı.
- [ ] **5.3 Paylaşım Butonu:** Web Share API kullanarak fotoğrafın WhatsApp, Instagram veya SMS üzerinden tek tuşla paylaşılabilmesi.

---

### 📂 PROJE 6: Yapay Zekalı Renk Uyum Öneri Motoru (AI Color Matcher)
> **Amaç:** Kullanıcının odasının renk paletini analiz edip odaya renk uyumu açısından en uygun halı modellerini önermek.

- [ ] **6.1 Renk Paleti Analizi (K-Means):** Yüklenen fotoğrafın piksellerinden odanın dominant renk kodlarının (HEX) yapay zeka ile çıkarılması.
- [ ] **6.2 Katalog Eşleştirme:** Çıkarılan renk paleti ile veritabanındaki halı renklerinin benzerlik algoritmasıyla (color similarity) karşılaştırılması.
- [ ] **6.3 Akıllı Öneri Arayüzü:** Uyumlu olan ilk 3 halının kullanıcıya öneri olarak kartlar halinde gösterilmesi.

---

### 📂 PROJE 7: Gelişmiş Işık ve Gölge Tahmini (Dynamic Light & Shadow Estimation)
> **Amaç:** Halının odada yapay durmasını engelleyerek odadaki ışık kaynaklarına göre gölgesini gerçekçi şekilde zemine düşürmek.

- [ ] **7.1 Doğal Işık Algılama (AR Light Estimation):** WebXR API kullanarak odadaki pencere veya avize ışığının yönünü ve şiddetini algılama.
- [ ] **7.2 Dinamik Gölge Düşürme:** Model-viewer `shadow-intensity` ve `ar-lighting` özelliklerini aktif ederek halının altına yumuşak, gerçekçi gölge ekleme.
- [ ] **7.3 Malzeme Gerçekçiliği (PBR Mapping):** Halıların bambu, yün veya ipek dokusuna uygun yansıma (roughness/metalness) haritalarının modele işlenmesi.

