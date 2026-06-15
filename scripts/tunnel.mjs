// Sabit localtunnel adresi + KENDI KENDINI IYILESTIREN baglanti.
// Adres: https://rugvision-demo.loca.lt
//
// Calistirma:  npm run tunnel
// Birlikte:    npm run dev:all   (next dev + tunnel ayni anda)
//
// Onceki surum, baglandiktan sonra event loop bosalinca Node surecinin
// kendiliginden cikmasi (exit code 0) yuzunden tunnel oluyordu. Bu surum:
//   1) Asla kapanmayan bir keepalive/health timer'i ile sureci ayakta tutar.
//   2) Tunnel URL'sini periyodik kontrol eder; ust uste basarisiz olursa
//      otomatik yeniden baglanir.
//   3) loca.lt cokse bile sonsuz tekrar dener; URL hic degismez.

import localtunnel from "localtunnel";

const PORT = Number(process.env.TUNNEL_PORT || 3000);
const SUBDOMAIN = process.env.TUNNEL_SUBDOMAIN || "rugvision-demo";
const RETRY_MS = 3000; // hata sonrasi yeniden baglanma bekleme suresi
const RECLAIM_MS = 20000; // gecici adresteyken istenen subdomain'i sakince geri alma araligi
const HEALTH_EVERY_MS = 30000; // saglik kontrolu araligi (loca.lt'yi yormamak icin seyrek)
const HEALTH_PATH = "/api/v1/health"; // 200 donen hafif endpoint
const HEALTH_TIMEOUT_MS = 15000; // loca.lt yavas olabilir; comert timeout
const MAX_HEALTH_FAILS = 4; // ~2 dk surekli GERCEK hata olmadan reconnect yok

let tunnel = null;
let stopping = false;
let connecting = false;
let onDesiredSubdomain = false;
let healthFails = 0;
let reconnectTimer = null;
let reclaimTimer = null;

function log(msg) {
  const t = new Date().toLocaleTimeString();
  console.log(`[tunnel ${t}] ${msg}`);
}

async function connect() {
  if (stopping || connecting) return;
  connecting = true;
  try {
    if (tunnel) {
      try {
        tunnel.close();
      } catch {}
      tunnel = null;
    }

    tunnel = await localtunnel({ port: PORT, subdomain: SUBDOMAIN });
    healthFails = 0;
    if (reclaimTimer) {
      clearTimeout(reclaimTimer);
      reclaimTimer = null;
    }

    if (tunnel.url.includes(SUBDOMAIN)) {
      onDesiredSubdomain = true;
      log(`BAGLANDI -> ${tunnel.url}`);
    } else {
      onDesiredSubdomain = false;
      // Gecici adresi CANLI tut (hizmet dusmesin); sadece belli araliklarla
      // istenen subdomain'i sakince geri almayi dene. Boylece churn olmaz.
      log(`UYARI: '${SUBDOMAIN}' su an dolu, gecici aktif: ${tunnel.url} | ${RECLAIM_MS / 1000}s sonra geri alma denenecek`);
      scheduleReclaim();
    }

    const thisTunnel = tunnel;
    thisTunnel.on("close", () => {
      // Bilerek (reclaim/reconnect) kapatilan eski baglantilari yok say.
      if (stopping || connecting || tunnel !== thisTunnel) return;
      log("Baglanti kapandi, yeniden baglaniliyor...");
      scheduleReconnect();
    });

    thisTunnel.on("error", (err) => {
      if (stopping || tunnel !== thisTunnel) return;
      log(`Hata: ${err?.message || err}`);
      scheduleReconnect();
    });
  } catch (err) {
    log(`Baglanti kurulamadi: ${err?.message || err}`);
    scheduleReconnect();
  } finally {
    connecting = false;
  }
}

function scheduleReconnect() {
  if (stopping || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RETRY_MS);
}

// Gecici adresteyken: hizmeti dusurmeden, araliklarla istenen subdomain'i dene.
function scheduleReclaim() {
  if (stopping || reclaimTimer || onDesiredSubdomain) return;
  reclaimTimer = setTimeout(() => {
    reclaimTimer = null;
    if (stopping || onDesiredSubdomain) return;
    log(`'${SUBDOMAIN}' geri alma deneniyor...`);
    connect(); // mevcut gecici baglantiyi kapatip istenen subdomain'i ister
  }, RECLAIM_MS);
}

// Aktif saglik kontrolu: tunnel URL'si gercekten cevap veriyor mu?
// localtunnel bazen 'close'/'error' tetiklemeden olu kalir; bunu yakalar.
async function healthCheck() {
  if (stopping || connecting || !tunnel?.url) return;
  try {
    const res = await fetch(`${tunnel.url}${HEALTH_PATH}`, {
      method: "GET",
      headers: { "bypass-tunnel-reminder": "1" },
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    // Onemli: 429 (rate-limit) veya herhangi bir 4xx, tunnel'in CANLI oldugunu
    // gosterir (istek loca.lt edge'ine ulasti). Sadece gateway hatalari
    // (502/503/504) tunnel'in olu oldugunu gosterir.
    const gatewayDown = res.status === 502 || res.status === 503 || res.status === 504;
    if (!gatewayDown) {
      if (healthFails > 0) log("Saglik OK, baglanti canli.");
      healthFails = 0;
    } else {
      healthFails++;
      log(`Saglik basarisiz (gateway ${res.status}) ${healthFails}/${MAX_HEALTH_FAILS}`);
    }
  } catch (err) {
    // Timeout/ag hatasi: loca.lt yavasligi olabilir; tek seferde panik yok.
    healthFails++;
    log(`Saglik basarisiz (${err?.name || "hata"}) ${healthFails}/${MAX_HEALTH_FAILS}`);
  }
  if (healthFails >= MAX_HEALTH_FAILS) {
    healthFails = 0;
    log("Tunnel surekli yanit vermiyor, yeniden baglaniliyor...");
    scheduleReconnect();
  }
}

function shutdown() {
  stopping = true;
  log("Kapaniyor...");
  try {
    tunnel?.close();
  } catch {}
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
// Beklenmeyen hatada cikma; logla ve devam et.
process.on("uncaughtException", (err) => log(`uncaughtException: ${err?.message || err}`));
process.on("unhandledRejection", (err) => log(`unhandledRejection: ${err?.message || err}`));

// Bu interval event loop'u canli tutar -> surec kendiliginden ASLA cikmaz.
setInterval(healthCheck, HEALTH_EVERY_MS);

log(`Baslatiliyor: port=${PORT} subdomain=${SUBDOMAIN}`);
connect();
