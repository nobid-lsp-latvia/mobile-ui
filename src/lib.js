// SPDX-License-Identifier: EUPL-1.2

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import VueClickAway from 'vue3-click-away';
import App from '@/App.vue';
import router from '@/router';
import lv from '@/locales/lv.json';
import en from '@/locales/en.json';
import events from '@/router/events';
import { createLx } from '@wntr/lx-ui';
import { APP_CONFIG } from '@/constants';

import '@wntr/lx-ui/dist/bundles/lx-bt-digimaks.css';

import '@/assets/styles.css';

const mobileApp = createApp(App);
mobileApp.use(createPinia());
events(router);
mobileApp.use(router);

mobileApp.use(
  createI18n({
    legacy: false,
    locale: 'lv',
    messages: {
      lv,
      en,
    },
  })
);
mobileApp.use(VueClickAway);
mobileApp.use(createLx, {
  systemId: 'webapp',
  environment: APP_CONFIG.environment,
  iconSet: 'phosphor',
});

export { mobileApp };
