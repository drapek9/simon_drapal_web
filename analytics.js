/**
 * Google Analytics 4 (gtag.js) – tag je v <head>, měření se zapíná po souhlasu.
 * Measurement ID: Admin → Data streams → web → Measurement ID.
 *
 * Měřené události:
 * - contact_form_submit … úspěšné odeslání kontaktního formuláře
 * - cta_consult_click … parametr cta_placement: nav | hero | problems | showcase
 * - phone_click … link_area: footer | other
 * - email_click … link_area: footer | other
 * - case_study_realtor_click … link_variant: lead_inline | open_new_tab | other
 * - nav_link_click … nav_area: header | footer, nav_target: uvod | o_mne | …
 */
const GA_MEASUREMENT_ID = "G-74TL5J8T6V";
let gaInitialized = false;

function gtagSafe() {
  return typeof window.gtag === "function" ? window.gtag : null;
}

function initGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || gaInitialized) {
    return;
  }
  const gtag = gtagSafe();
  if (!gtag) {
    return;
  }
  gaInitialized = true;
  gtag("consent", "update", {
    analytics_storage: "granted",
  });
}

/**
 * Vlastní události GA4 (název: a–z, 0–9, podtržítko, max 40 znaků).
 * @param {string} name
 * @param {Record<string, string|number|boolean>} [params]
 */
function trackSiteEvent(name, params) {
  if (!GA_MEASUREMENT_ID || !gaInitialized) {
    return;
  }
  const gtag = gtagSafe();
  if (!gtag) {
    return;
  }
  try {
    gtag("event", name, params || {});
  } catch (e) {
    console.warn("[Analytics] gtag event:", e);
  }
}

window.trackSiteEvent = trackSiteEvent;
window.loadGoogleAnalytics = initGoogleAnalytics;

function hrefToNavTarget(href) {
  const map = {
    "#top": "uvod",
    "#problemy": "problemy",
    "#o-mne": "o_mne",
    "#proces": "jak_funguje",
    "#priklad-projektu": "priklad_reseni",
    "#kontakt": "kontakt",
  };
  return map[href] || "other";
}

function setupClickAnalytics() {
  document.body.addEventListener(
    "click",
    (e) => {
      const a = e.target.closest && e.target.closest("a[href]");
      if (!(a instanceof HTMLAnchorElement)) {
        return;
      }

      const href = (a.getAttribute("href") || "").trim();
      if (!href) {
        return;
      }

      if (href.startsWith("tel:")) {
        trackSiteEvent("phone_click", {
          link_area: a.closest("footer") ? "footer" : "other",
        });
        return;
      }

      if (href.startsWith("mailto:")) {
        trackSiteEvent("email_click", {
          link_area: a.closest("footer") ? "footer" : "other",
        });
        return;
      }

      if (/martinkaresreality\.cz|monikazelena\.cz|michaljanousek\.cz/i.test(href)) {
        let link_variant = "other";
        if (a.classList.contains("showcase__detail-btn") || a.classList.contains("showcase__open-tab")) {
          link_variant = "open_new_tab";
        } else if (a.closest(".showcase__lead")) {
          link_variant = "lead_inline";
        }
        trackSiteEvent("case_study_realtor_click", { link_variant });
        return;
      }

      if (href === "#kontakt") {
        if (a.matches(".header .nav .btn")) {
          trackSiteEvent("cta_consult_click", { cta_placement: "nav" });
          return;
        }
        if (a.closest(".hero__cta")) {
          trackSiteEvent("cta_consult_click", { cta_placement: "hero" });
          return;
        }
        if (a.closest(".problems-band")) {
          trackSiteEvent("cta_consult_click", { cta_placement: "problems" });
          return;
        }
        if (a.classList.contains("showcase__cta")) {
          trackSiteEvent("cta_consult_click", { cta_placement: "showcase" });
          return;
        }
      }

      if (a.matches(".header .nav .nav__link")) {
        trackSiteEvent("nav_link_click", {
          nav_area: "header",
          nav_target: hrefToNavTarget(href),
        });
        return;
      }

      if (a.matches(".footer .footer__nav-link")) {
        trackSiteEvent("nav_link_click", {
          nav_area: "footer",
          nav_target: hrefToNavTarget(href),
        });
      }
    },
    true
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupClickAnalytics);
} else {
  setupClickAnalytics();
}
