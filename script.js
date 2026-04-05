const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

/** Pořadí sekcí odpovídá kotvám v navigaci (sekce mimo nav se přiřadí k poslední „překročené“). */
const NAV_SECTION_IDS = ["top", "o-mne", "proces", "priklad-projektu", "kontakt"];

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
  req(about, "informace o podnikání");

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

  const clearOnInput = (e) => {
    const el = e.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    setFieldError(el, "");
  };

  form.addEventListener("input", clearOnInput);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (success) success.hidden = true;

    const ok = validate(form);
    if (!ok) {
      const firstInvalid = $(".field--invalid input, .field--invalid textarea", form);
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Simulace odeslání (bez backendu)
    const submitBtn = $("button[type=\"submit\"]", form);
    const old = submitBtn?.textContent;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Odesílám…";
    }

    await new Promise((r) => setTimeout(r, prefersReducedMotion() ? 0 : 650));

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = old || "Domluvit konzultaci";
    }

    form.reset();
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
    }
  });
}

setupNavCurrentSection();
setupSmoothScroll();
setupMobileNav();
setupReveal();
setupForm();

