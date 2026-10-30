// Punto de entrada (módulo diferido: se ejecuta cuando el HTML ya está pintado).

import { loadDeferredCss, initHeader, initSticky } from './ui.js';
import { captureAttribution, initAttribution } from './attribution.js';
import { initConsent } from './consent.js';
import { initAnalytics } from './analytics.js';
import { track, initTracking } from './track.js';
import { initForm } from './form.js';
import { initCarousels, initMarquee, initTestimonials } from './media.js';

loadDeferredCss();
captureAttribution();
initAttribution(); // antes que initTracking: al aceptar, primero se guardan fbp y fbc
initTracking();
// PageView: por servidor salvo oposición y por navegador si hay consentimiento.
track('PageView', { replay: true });
initConsent();
initAnalytics();
initHeader();
initSticky();
initForm();
initCarousels();
initMarquee();
initTestimonials();
