/**
 * Cookie lišta a podmíněné zapnutí Google Analytics (Consent Mode).
 * Rozhodnutí ukládáme do localStorage, aby se banner zobrazil jen jednou.
 */
(function initCookieConsent() {
  const CONSENT_KEY = "cookieConsentChoice";

  function getStoredChoice() {
    try {
      return localStorage.getItem(CONSENT_KEY);
    } catch {
      return null;
    }
  }

  function storeChoice(choice) {
    try {
      localStorage.setItem(CONSENT_KEY, choice);
    } catch {
      // localStorage nemusí být dostupné (např. privacy mode).
    }
  }

  function removeBanner() {
    const banner = document.querySelector(".cookie-banner");
    if (banner) {
      banner.remove();
    }
  }

  function loadAnalytics() {
    if (typeof window.loadGoogleAnalytics === "function") {
      window.loadGoogleAnalytics();
    }
  }

  function denyAnalytics() {
    const gtag = typeof window.gtag === "function" ? window.gtag : null;
    if (gtag) {
      gtag("consent", "update", {
        analytics_storage: "denied",
      });
    }
  }

  function acceptCookies() {
    storeChoice("accepted");
    loadAnalytics();
    removeBanner();
    document.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: { choice: "accepted" } }));
  }

  function rejectCookies() {
    storeChoice("rejected");
    denyAnalytics();
    removeBanner();
    document.dispatchEvent(new CustomEvent("cookieConsentChanged", { detail: { choice: "rejected" } }));
  }

  function createBanner() {
    const banner = document.createElement("aside");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Nastavení cookies");
    banner.innerHTML = `
      <p class="cookie-banner__text">
        Cookies nám pomáhají web vylepšovat a přizpůsobovat vašim potřebám. Volitelné cookies zapneme až po vašem souhlasu.
        <a class="cookie-banner__link" href="cookies.html">Více v zásadách cookies</a>.
      </p>
      <div class="cookie-banner__actions">
        <button type="button" class="cookie-banner__btn cookie-banner__btn--accept">Souhlasím</button>
        <button type="button" class="cookie-banner__btn cookie-banner__btn--reject">Odmítnout</button>
      </div>
    `;

    const acceptBtn = banner.querySelector(".cookie-banner__btn--accept");
    const rejectBtn = banner.querySelector(".cookie-banner__btn--reject");

    if (acceptBtn) {
      acceptBtn.addEventListener("click", acceptCookies);
    }

    if (rejectBtn) {
      rejectBtn.addEventListener("click", rejectCookies);
    }

    document.body.appendChild(banner);
  }

  window.cookieConsent = {
    getChoice: getStoredChoice,
    accept: acceptCookies,
    reject: rejectCookies,
    reset() {
      try {
        localStorage.removeItem(CONSENT_KEY);
      } catch {
        // ignore
      }
      window.location.reload();
    },
  };

  const storedChoice = getStoredChoice();

  if (storedChoice === "accepted") {
    loadAnalytics();
  } else if (storedChoice === "rejected") {
    denyAnalytics();
  }

  if (storedChoice === "accepted" || storedChoice === "rejected") {
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createBanner);
  } else {
    createBanner();
  }
})();
