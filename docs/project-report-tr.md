# FixMyBuilding - Proje Tanımı

> "Binanız, topluluğunuz, tek bir uygulama."

## 1. Proje tanımı

FixMyBuilding, apartman ve site yaşamındaki günlük işleri tek bir mobil uygulamada toplayan bir apartman yönetim uygulamasıdır. Bugün arıza bildirimleri, duyurular ve aidat takibi çoğunlukla WhatsApp grupları, telefon görüşmeleri ve kağıt listelerle yürütülmektedir. Bu yöntemlerde talepler kaybolur, kimin neyi ne zaman yaptığı izlenemez ve bilgi dağınık kalır. FixMyBuilding bu süreçleri şeffaf, kayıt altında ve takip edilebilir hale getirir.

## 2. Amaç

- Apartman sakinleri, yönetici ve teknisyenler arasındaki iletişimi tek kanalda toplamak.
- Arıza ve taleplerin bildirilmesini, atanmasını ve çözülmesini izlenebilir kılmak.
- Duyuru ve aidat süreçlerini dijitalleştirerek yöneticinin iş yükünü azaltmak.
- Sakinlere bina ile ilgili güncel bilgiye her an ulaşma imkanı vermek.

## 3. Hedef kitle

| Kullanıcı | Açıklama |
|---|---|
| Apartman sakini (`resident`) | Arıza bildiren, duyuruları okuyan, aidatını takip eden daire sahibi veya kiracı |
| Yönetici (`manager`) | Binayı yöneten; talepleri takip eden, teknisyen atayan, duyuru ve aidat yöneten kişi |
| Teknisyen (`technician`) | Kendisine atanan işleri yürüten ve durumunu güncelleyen kişi |

## 4. Özellikler

- **Arıza bildirimi:** Kategori (asansör, tesisat, elektrik, temizlik, ortak alan, ısıtma, diğer), öncelik, açıklama ve fotoğraf ile talep oluşturma.
- **Talep takibi:** Her talep Beklemede, İnceleniyor, İşlemde, Çözüldü durumlarından geçer; durum geçmişi zaman çizelgesinde görünür. Yönetici teknisyen atar, teknisyen durum ve not günceller.
- **Duyurular:** Yönetici duyuru yayınlar (sabitleme ve kategori ile); sakinler listeler ve okur.
- **Aidat takibi:** Dönemlik aidat oluşturma, ödeme kaydı, ödenmiş / ödenmemiş / gecikmiş durumları; sakin kendi dairesinin borç ve ödeme geçmişini görür.
- **Bildirimler:** Uygulama içi bildirimler ve anlık (push) bildirimler; durum değişikliği, atama ve yeni duyuruda tetiklenir.
- **Ortak alan rezervasyonu:** Toplantı salonu, bahçe gibi ortak alanlar için çakışmayan saat aralıklarında rezervasyon.
- **Raporlar:** Yönetici için talep ve aidat özetleri.
- **Çoklu dil ve tema:** Türkçe (varsayılan) ve İngilizce; açık / koyu mod.

## 5. Roller ve yetkiler

| Rol | Yetkiler |
|---|---|
| Sakin | Kendi taleplerini oluşturur ve izler; duyuruları okur; kendi dairesinin aidatını görür; rezervasyon yapar |
| Yönetici | Binadaki tüm talepleri görür, durumunu değiştirir, teknisyen atar; duyuru ekler / düzenler / siler; aidat oluşturur ve ödeme kaydeder; rapor görür |
| Teknisyen | Kendisine atanan talepleri görür; durum günceller ve not ekler; duyuruları okur |

Yetkiler yalnızca arayüzde gizlenmez; veritabanında satır düzeyinde güvenlik (RLS) ile zorunlu kılınır.

## 6. Ekranlar

- Giriş, kayıt ve binaya katılma (davet kodu ile)
- Ana sayfa (özet ve son duyurular)
- Talepler: liste ve filtre, detay ve durum zaman çizelgesi, yeni talep formu
- Duyurular: liste, detay, yönetici için oluşturma / düzenleme
- Aidat (sakin) ve Yönetim: aidat, raporlar (yönetici)
- Profil: bilgiler, dil seçimi, rezervasyonlar, bildirimler, çıkış

Sakin: Ana Sayfa, Taleplerim, Duyurular, Aidat, Profil. Yönetici: Ana Sayfa, Talepler, Duyurular, Yönetim, Profil. Teknisyen: Ana Sayfa, Atanan İşler, Duyurular, Profil.

## 7. Teknoloji

React Native ve Expo (TypeScript), Expo Router ile dosya tabanlı gezinme, iOS 26 Liquid Glass için yerel (native) bileşenler, Supabase (Auth, Postgres + RLS, Storage, Realtime, Edge Functions), TanStack Query, i18next. Ayrıntılar için [README](../README.md) ve [mimari belgesi](architecture.md).

## 8. Geliştirme aşamaları

| Aşama | İçerik |
|---|---|
| 1 | Proje tanımı ve gereksinimlerin belirlenmesi |
| 2 | Tasarım: roller, ekranlar, veri modeli, navigasyon |
| 3 | Altyapı: Expo iskeleti, Supabase şeması / RLS, kimlik doğrulama ve roller |
| 4 | Zorunlu özellikler: arıza bildirimi, talep takibi, duyurular |
| 5 | İkinci aşama: aidat takibi, bildirimler |
| 6 | Ekstra özellikler: ana sayfa, rezervasyon, raporlar; test ve düzeltmeler |
| 7 | Dokümantasyon, son kontroller ve teslim |

## 9. Öncelik sıralaması

| Öncelik | Özellikler |
|---|---|
| Zorunlu | Giriş ve roller, arıza bildirimi, talep takibi, duyuru |
| İkinci aşama | Aidat takibi, bildirimler |
| Ekstra | Ortak alan rezervasyonu, raporlar |

## 10. Beklenen sonuçlar

- Sakinlerin arızaları fotoğrafla, birkaç adımda bildirebilmesi.
- Her talebin sorumlusu ve durumu ile eksiksiz izlenebilmesi.
- Duyuruların tüm sakinlere anında ulaşması.
- Aidat durumunun şeffaf ve güncel tutulması.
- Yöneticinin zamandan ve iletişim yükünden tasarruf etmesi.
- Güvenli (rol bazlı yetkilendirme), iki dilli ve modern yerel arayüzlü, çalışan bir mobil uygulama prototipi.
