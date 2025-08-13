// SPDX-License-Identifier: EUPL-1.2

import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import routes from '@/router/routes';
import { APP_CONFIG } from '@/constants';

const router = createRouter({
  history: !APP_CONFIG.embed
    ? createWebHistory(
        APP_CONFIG.publicUrl.indexOf('://') !== -1
          ? new URL(APP_CONFIG.publicUrl).pathname
          : APP_CONFIG.publicUrl
      )
    : createWebHashHistory(
        APP_CONFIG.publicUrl.indexOf('://') !== -1
          ? new URL(APP_CONFIG.publicUrl).pathname
          : APP_CONFIG.publicUrl
      ),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    // document.getElementById('app').scrollIntoView();
    // TODO: somehow does not seem to work :/
    return { left: 0, top: 0 };
  },
  routes,
});

export default router;
