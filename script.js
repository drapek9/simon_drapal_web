const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const EMAILJS_PUBLIC_KEY = "53BraLtdA9dtrb9xA";
const EMAILJS_SERVICE_ID = "service_fyy1p0g";
const EMAILJS_TEMPLATE_ID = "template_pgil9a2";

let emailjsInitialized = false;

function initEmailjs() {
  if (emailjsInitialized || typeof emailjs === "undefined") {
    return Boolean(emailjsInitialized);
  }
  if (!EMAILJS_PUBLIC_KEY) {
    return false;
  }
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  emailjsInitialized = true;
  return true;
}

/** Hodnoty pro šablonu EmailJS (názvy polí musí odpovídat {{…}} v šabloně). */
function getEmailjsTemplateParams(form) {
  return {
    name: ($("#firstName", form)?.value || "").trim(),
    surname: ($("#lastName", form)?.value || "").trim(),
    email: ($("#email", form)?.value || "").trim(),
    phone: ($("#phone", form)?.value || "").trim(),
    web: ($("#website", form)?.value || "").trim(),
    message: ($("#about", form)?.value || "").trim(),
  };
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setupSmoothScroll() {
  const links = $$(".js-scroll[href^=\"#\"]");
  for (const a of links) {
    a.addEventListener("click", (e) => {
      const href = a.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });

      // Close mobile menu if open
      if (document.body.classList.contains("nav-open")) {
        document.body.classList.remove("nav-open");
        const btn = $(".navToggle");
        if (btn) btn.setAttribute("aria-expanded", "false");
      }

      requestAnimationFrame(() => {
        if (typeof updateNavCurrentSection === "function") updateNavCurrentSection();
      });
    });
  }
}

/** Pořadí sekcí = pořadí v dokumentu shora dolů (kotvy z navigace; sekce mimo nav se přiřadí k poslední „překročené“). */
const NAV_SECTION_IDS = ["top", "problemy", "proces", "priklad-projektu", "o-mne", "kontakt"];

let updateNavCurrentSection = () => {};

function setupNavCurrentSection() {
  const nav = $(".nav");
  if (!nav) return;

  const anchors = $$("a[href^=\"#\"]", nav).filter((a) => {
    const h = a.getAttribute("href");
    return h && h.length > 1;
  });

  updateNavCurrentSection = () => {
    const header = $(".header");
    const offset = header ? header.getBoundingClientRect().height + 12 : 72;
    let activeId = NAV_SECTION_IDS[0];

    for (const id of NAV_SECTION_IDS) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.getBoundingClientRect().top <= offset) {
        activeId = id;
      }
    }

    for (const a of anchors) {
      if (a.classList.contains("btn")) {
        a.classList.remove("nav--current");
        a.removeAttribute("aria-current");
        continue;
      }
      const id = (a.getAttribute("href") || "").slice(1);
      const on = id === activeId;
      a.classList.toggle("nav--current", on);
      if (on) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    }
  };

  let ticking = false;
  const schedule = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateNavCurrentSection();
    });
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  updateNavCurrentSection();
}

function setupReveal() {
  const items = $$(".reveal");
  if (items.length === 0) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    for (const el of items) el.classList.add("is-visible");
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.14, rootMargin: "0px 0px -10% 0px" }
  );

  for (const el of items) io.observe(el);
}

function setupMobileNav() {
  const btn = $(".navToggle");
  if (!btn) return;

  const close = () => {
    document.body.classList.remove("nav-open");
    btn.setAttribute("aria-expanded", "false");
  };

  btn.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  document.addEventListener("click", (e) => {
    if (!document.body.classList.contains("nav-open")) return;
    const nav = $(".nav");
    if (!nav) return;
    if (btn.contains(e.target)) return;
    if (!nav.contains(e.target)) close();
  });
}

/** Mobil: nápověda „Swipe“ u časové osy v sekci Příklad projektu — schová se po posunu nebo bez overflow. */
function setupShowcaseTimelineSwipeHint() {
  const rail = $(".showcase__timeline-rail");
  const ol = $(".showcase__timeline");
  const hint = $(".showcase__swipe-hint");
  if (!rail || !ol || !hint) return;

  const mq = window.matchMedia("(max-width: 980px)");
  let bound = false;

  const syncEndState = () => {
    const maxScroll = ol.scrollWidth - ol.clientWidth - 1;
    if (maxScroll <= 0) {
      rail.classList.add("showcase__timeline-rail--end");
      hint.classList.add("showcase__swipe-hint--done");
      return;
    }
    if (ol.scrollLeft >= maxScroll) {
      rail.classList.add("showcase__timeline-rail--end");
    } else {
      rail.classList.remove("showcase__timeline-rail--end");
    }
  };

  const onScroll = () => {
    if (ol.scrollLeft > 16) {
      hint.classList.add("showcase__swipe-hint--done");
    }
    syncEndState();
  };

  const bind = () => {
    if (!mq.matches || bound) return;
    bound = true;
    ol.addEventListener("scroll", onScroll, { passive: true });
    syncEndState();
  };

  const unbind = () => {
    if (!bound) return;
    bound = false;
    ol.removeEventListener("scroll", onScroll);
    rail.classList.remove("showcase__timeline-rail--end");
    hint.classList.remove("showcase__swipe-hint--done");
  };

  const sync = () => {
    if (mq.matches) {
      bind();
      requestAnimationFrame(() => {
        syncEndState();
      });
    } else {
      unbind();
    }
  };

  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", sync);
  } else {
    mq.addListener(sync);
  }
  window.addEventListener("resize", sync);
  sync();
}

function setFieldError(fieldEl, message) {
  const wrapper = fieldEl.closest(".field");
  if (!wrapper) return;
  const err = $(".field__error", wrapper);
  wrapper.classList.toggle("field--invalid", Boolean(message));
  if (err) err.textContent = message || "";
}

function validate(form) {
  let ok = true;

  const firstName = $("#firstName", form);
  const lastName = $("#lastName", form);
  const phone = $("#phone", form);
  const email = $("#email", form);
  const about = $("#about", form);
  const website = $("#website", form);

  const req = (el, label) => {
    const v = (el?.value || "").trim();
    if (!v) {
      setFieldError(el, `Vyplňte prosím ${label}.`);
      ok = false;
      return "";
    }
    setFieldError(el, "");
    return v;
  };

  const emailValue = req(email, "e‑mail");
  if (email && emailValue) {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
    if (!isValid) {
      setFieldError(email, "Zadejte prosím platný e‑mail.");
      ok = false;
    }
  }

  const phoneValue = req(phone, "telefon");
  if (phone && phoneValue) {
    const digits = phoneValue.replace(/[^\d+]/g, "");
    const looksOk = digits.length >= 9;
    if (!looksOk) {
      setFieldError(phone, "Telefon vypadá příliš krátký. Zkontrolujte prosím číslo.");
      ok = false;
    }
  }

  req(firstName, "jméno");
  req(lastName, "příjmení");
  req(about, "popis vaší realitní činnosti a očekávání od webu");

  if (website && website.value.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(website.value.trim());
      setFieldError(website, "");
    } catch {
      setFieldError(website, "Zadejte prosím platnou adresu (např. https://…).");
      ok = false;
    }
  } else if (website) {
    setFieldError(website, "");
  }

  return ok;
}

function setupForm() {
  const form = $("#contactForm");
  if (!form) return;
  const success = $(".form__success", form);
  const sendError = $(".form__send-error", form);
  let submitting = false;

  const clearOnInput = (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    setFieldError(el, "");
  };

  form.addEventListener("input", clearOnInput);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    if (success) success.hidden = true;
    if (sendError) {
      sendError.hidden = true;
      sendError.textContent = "";
    }

    if (!validate(form)) {
      const firstInvalid = $(".field--invalid input, .field--invalid textarea", form);
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
      if (sendError) {
        sendError.textContent =
          "Odeslání e‑mailu není nastavené. V souboru script.js doplňte EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID a EMAILJS_TEMPLATE_ID.";
        sendError.hidden = false;
      }
      return;
    }

    if (typeof emailjs === "undefined") {
      if (sendError) {
        sendError.textContent =
          "Knihovna EmailJS se nenačetla. Zkontrolujte připojení k internetu a obnovte stránku.";
        sendError.hidden = false;
      }
      return;
    }

    if (!initEmailjs()) {
      if (sendError) {
        sendError.textContent = "EmailJS se nepodařilo inicializovat. Zkontrolujte veřejný klíč.";
        sendError.hidden = false;
      }
      return;
    }

    submitting = true;

    const submitBtn = $("button[type=\"submit\"]", form);
    const old = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Odesílám…";
    }

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, getEmailjsTemplateParams(form));

      if (typeof window.trackSiteEvent === "function") {
        window.trackSiteEvent("contact_form_submit");
      }

      form.reset();
      if (success) {
        success.hidden = false;
        success.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
      }
    } catch (err) {
      console.error(err);
      if (sendError) {
        sendError.textContent =
          "Odeslání se nepovedlo. Zkuste to prosím znovu za chvíli, nebo napište přímo na e‑mail.";
        sendError.hidden = false;
      }
    } finally {
      submitting = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = old || "Domluvit konzultaci";
      }
    }
  });
}

setupNavCurrentSection();
setupSmoothScroll();
setupMobileNav();
setupReveal();
setupShowcaseTimelineSwipeHint();
setupForm();