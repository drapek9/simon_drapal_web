/**
 * Cookie lišta a podmíněné načtení Google Analytics.
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

  function createBanner() {
    const banner = document.createElement("aside");
    banner.className = "cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Nastavení cookies");
    banner.innerHTML = `
      <p class="cookie-banner__text">
        Tento web používá cookies a Google Analytics pro základní měření návštěvnosti.
      </p>
      <div class="cookie-banner__actions">
        <button type="button" class="cookie-banner__btn cookie-banner__btn--accept">Souhlasím</button>
        <button type="button" class="cookie-banner__btn cookie-banner__btn--reject">Odmítnout</button>
      </div>
    `;

    const acceptBtn = banner.querySelector(".cookie-banner__btn--accept");
    const rejectBtn = banner.querySelector(".cookie-banner__btn--reject");

    if (acceptBtn) {
      acceptBtn.addEventListener("click", () => {
        storeChoice("accepted");
        loadAnalytics();
        removeBanner();
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener("click", () => {
        storeChoice("rejected");
        removeBanner();
      });
    }

    document.body.appendChild(banner);
  }

  const storedChoice = getStoredChoice();
  if (storedChoice === "accepted") {
    loadAnalytics();
    return;
  }

  if (storedChoice === "rejected") {
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createBanner);
  } else {
    createBanner();
  }
})();
