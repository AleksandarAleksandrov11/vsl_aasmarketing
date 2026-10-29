// Punto de entrada (módulo diferido: se ejecuta cuando el HTML ya está pintado).

import { loadDeferredCss, initHeader, initSticky } from './ui.js';
import { captureAttribution } from './attribution.js';
import { initConsent } from './consent.js';
import { initAnalytics } from './analytics.js';
import { track, initTracking } from './track.js';
import { initForm } from './form.js';
import { initCarousels, initVideos, initTestimonials } from './media.js';

loadDeferredCss();
captureAttribution();
initTracking();
// PageView: por servidor siempre y por navegador si hay consentimiento.
track('PageView', { replay: true });
initConsent();
initAnalytics();
initHeader();
initSticky();
initForm();
initCarousels();
initVideos();
initTestimonials();
