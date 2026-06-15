/* RugVision "Odamda Gor" embed widget.
 *
 * Kurulum (tek satir):
 *   <script src="https://BASE/widget.js" data-rug-id="RUG_ID" defer></script>
 *
 * Opsiyonel data-* nitelikleri:
 *   data-base          RugVision API/site adresi (varsayilan: script src origin)
 *   data-target        Butonun yanina eklenecegi elemanin CSS selector'u
 *   data-position      "after" | "before" | "append" (varsayilan: after)
 *   data-button-text   Buton metni override
 *   data-button-color  Buton rengi override
 *
 * Mobilde AR dogrudan tetiklenir (iOS Quick Look / Android Scene Viewer);
 * masaustunde 3D onizleme modal (iframe) acilir. iframe icinden mobil AR
 * tarayicilar tarafindan engellendigi icin mobilde iframe kullanilmaz.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) {
    var all = document.getElementsByTagName("script");
    for (var i = all.length - 1; i >= 0; i--) {
      if (all[i].src && all[i].src.indexOf("widget.js") !== -1) {
        script = all[i];
        break;
      }
    }
  }
  if (!script) return;

  var rugId = script.getAttribute("data-rug-id");
  if (!rugId) {
    console.warn("[RugVision] data-rug-id eksik, widget yuklenmedi.");
    return;
  }

  var base = script.getAttribute("data-base");
  if (!base) {
    try {
      base = new URL(script.src).origin;
    } catch (e) {
      base = "";
    }
  }
  base = base.replace(/\/$/, "");

  var targetSelector = script.getAttribute("data-target");
  var position = (script.getAttribute("data-position") || "after").toLowerCase();
  var overrideText = script.getAttribute("data-button-text");
  var overrideColor = script.getAttribute("data-button-color");

  // Modelden tureyen mutlak URL'ler (init icinde doldurulur).
  var glbUrl = null;
  var usdzUrl = null;

  var COMMON_TARGETS = [
    "[data-rugvision]",
    'form[action*="cart"] [type="submit"]',
    'button[name="add"]',
    ".product-form__submit",
    ".add-to-cart",
    ".add_to_cart_button",
    ".btn-addtocart",
    "#AddToCart",
    "#add-to-cart",
  ];

  function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }
  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  function findTarget() {
    if (targetSelector) {
      var el = document.querySelector(targetSelector);
      if (el) return el;
    }
    for (var i = 0; i < COMMON_TARGETS.length; i++) {
      var found = document.querySelector(COMMON_TARGETS[i]);
      if (found) return found;
    }
    return null;
  }

  function track(eventType, merchantId) {
    if (!merchantId) return;
    try {
      var payload = JSON.stringify({
        merchantId: merchantId,
        rugId: rugId,
        eventType: eventType,
      });
      var url = base + "/api/v1/analytics/events";
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      } else {
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {
      /* best-effort */
    }
  }

  function computeModelUrls(model3dUrl) {
    if (!model3dUrl) return;
    try {
      glbUrl = new URL(model3dUrl, base + "/").toString();
    } catch (e) {
      glbUrl = null;
    }
    var lower = model3dUrl.toLowerCase();
    if (model3dUrl.indexOf("/models/") === 0 && lower.indexOf(".glb") !== -1) {
      var file = model3dUrl.split("/").pop().replace(/\.glb$/i, ".usdz");
      usdzUrl = base + "/api/v1/ar/usdz/" + file;
    } else if (lower.indexOf(".glb") !== -1 && glbUrl) {
      usdzUrl = glbUrl.replace(/\.glb$/i, ".usdz");
    }
  }

  // iOS Quick Look: en guvenilir tetikleme rel="ar" anchor ile (ust sayfada).
  function openQuickLook() {
    if (!usdzUrl) return false;
    var a = document.createElement("a");
    a.setAttribute("rel", "ar");
    a.href = usdzUrl;
    var img = document.createElement("img");
    img.setAttribute("alt", "AR");
    a.appendChild(img);
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }

  // Android Scene Viewer intent (ARCore). Basarisizsa odamda-gor sayfasina duser.
  function openSceneViewer() {
    if (!glbUrl) return false;
    var fallback = base + "/odamda-gor/" + encodeURIComponent(rugId);
    var intentUrl =
      "intent://arvr.google.com/scene-viewer/1.0?file=" +
      encodeURIComponent(glbUrl) +
      "&mode=ar_preferred#Intent;scheme=https;package=com.google.android.googlequicksearchbox;" +
      "action=android.intent.action.VIEW;" +
      "S.browser_fallback_url=" +
      encodeURIComponent(fallback) +
      ";end;";
    window.location.href = intentUrl;
    return true;
  }

  function openModal() {
    var overlay = document.createElement("div");
    overlay.setAttribute("data-rugvision-overlay", "");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.6);" +
      "display:flex;align-items:center;justify-content:center;padding:16px;";

    var frameWrap = document.createElement("div");
    frameWrap.style.cssText =
      "position:relative;width:100%;max-width:520px;height:80vh;max-height:860px;" +
      "background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);";

    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Kapat");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText =
      "position:absolute;top:10px;right:10px;z-index:2;width:36px;height:36px;" +
      "border:none;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;" +
      "font-size:22px;line-height:36px;cursor:pointer;";

    var iframe = document.createElement("iframe");
    iframe.src = base + "/odamda-gor/" + encodeURIComponent(rugId) + "?embed=1";
    iframe.style.cssText = "width:100%;height:100%;border:0;display:block;";
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute(
      "allow",
      "camera; gyroscope; accelerometer; magnetometer; xr-spatial-tracking; fullscreen"
    );

    function close() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }

    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", onKey);

    frameWrap.appendChild(closeBtn);
    frameWrap.appendChild(iframe);
    overlay.appendChild(frameWrap);
    document.body.appendChild(overlay);
  }

  function handleClick(merchantId) {
    track("WIDGET_OPENED", merchantId);

    // Mobilde dogrudan AR (iframe AR'i mobil tarayicilar engelliyor).
    if (isIOS()) {
      track("AR_STARTED", merchantId);
      if (openQuickLook()) return;
    } else if (isAndroid()) {
      track("AR_STARTED", merchantId);
      if (openSceneViewer()) return;
    }

    // Masaustu (veya model URL'i yoksa): 3D onizleme modal.
    openModal();
  }

  function buildButton(settings, merchantId) {
    var text = overrideText || (settings && settings.buttonText) || "Odamda Gor";
    var color = overrideColor || (settings && settings.buttonColor) || "#111827";
    var radius =
      settings && typeof settings.borderRadius === "number"
        ? settings.borderRadius
        : 9999;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("data-rugvision-button", "");
    btn.textContent = text;
    btn.style.cssText =
      "display:inline-flex;align-items:center;justify-content:center;gap:8px;" +
      "margin-top:10px;padding:12px 20px;font-size:14px;font-weight:600;" +
      "color:#fff;background:" +
      color +
      ";border:none;border-radius:" +
      radius +
      "px;cursor:pointer;width:100%;";
    btn.addEventListener("click", function () {
      handleClick(merchantId);
    });
    return btn;
  }

  function insertButton(btn) {
    var target = findTarget();
    if (!target) {
      console.warn("[RugVision] hedef buton bulunamadi, body sonuna eklendi.");
      document.body.appendChild(btn);
      return;
    }
    if (target.hasAttribute("data-rugvision")) {
      target.appendChild(btn);
      return;
    }
    if (position === "before") {
      target.parentNode.insertBefore(btn, target);
    } else if (position === "append") {
      target.appendChild(btn);
    } else {
      target.parentNode.insertBefore(btn, target.nextSibling);
    }
  }

  function init() {
    fetch(base + "/api/v1/widget/rug/" + encodeURIComponent(rugId))
      .then(function (r) {
        if (!r.ok) throw new Error("rug fetch failed: " + r.status);
        return r.json();
      })
      .then(function (json) {
        var data = json && json.data ? json.data : {};
        var merchant = data.merchant || {};
        var settings = merchant.widgetSettings || null;
        var merchantId = merchant.id || null;
        computeModelUrls(data.model3dUrl);
        var btn = buildButton(settings, merchantId);
        insertButton(btn);
        track("PRODUCT_VIEWED", merchantId);
      })
      .catch(function (err) {
        console.warn("[RugVision] widget yuklenemedi:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
