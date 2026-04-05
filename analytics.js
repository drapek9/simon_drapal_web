/**
 * Google Analytics 4 (gtag.js)
 * Measurement ID najdeš v GA: Admin → Data streams → tvůj web → Measurement ID (G-XXXXXXXXXX).
 * https://analytics.google.com/
 *
 * Měřené události (stejné jako dřív u Firebase):
 * - contact_form_submit … úspěšné odeslání kontaktního formuláře
 * - cta_consult_click … parametr cta_placement: nav | hero | showcase
 * - phone_click … link_area: footer | other
 * - email_click … link_area: footer | other
 * - case_study_realtor_click … link_variant: lead_inline | open_new_tab | other
 * - nav_link_click … nav_area: header | footer, nav_target: uvod | o_mne | …
 */
const GA_MEASUREMENT_ID = "G-74TL5J8T6V";

window.dataLayer = window.dataLayer || [];
function gtag() {
  window.dataLayer.push(arguments);
}

function initGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return;
  }
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);

  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(GA_MEASUREMENT_ID);
  document.head.appendChild(s);
}

/**
 * Vlastní události GA4 (název: a–z, 0–9, podtržítko, max 40 znaků).
 * @param {string} name
 * @param {Record<string, string|number|boolean>} [params]
 */
function trackSiteEvent(name, params) {
  if (!GA_MEASUREMENT_ID) {
    return;
  }
  try {
    gtag("event", name, params || {});
  } catch (e) {
    console.warn("[Analytics] gtag event:", e);
  }
}

window.trackSiteEvent = trackSiteEvent;

function hrefToNavTarget(href) {
  const map = {
    "#top": "uvod",
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

      if (/martinkaresreality\.cz/i.test(href)) {
        let link_variant = "other";
        if (a.classList.contains("showcase__open-tab")) {
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

initGoogleAnalytics();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupClickAnalytics);
} else {
  setupClickAnalytics();
}
