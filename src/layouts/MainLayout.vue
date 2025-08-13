<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { LxShell } from '@wntr/lx-ui';
import { invoke, until, useIdle, useIntervalFn } from '@vueuse/core';

import LoginView from '@/views/Login.vue';
import useErrors from '@/hooks/useErrors';
import useAuthStore from '@/stores/useAuthStore';
import useAppStore from '@/stores/useAppStore';
import useNotifyStore from '@/stores/useNotifyStore';
import useConfirmStore from '@/stores/useConfirmStore';
import useViewStore from '@/stores/useViewStore';
import { getState } from '@/services/appService';
import { setLanguage } from '@/services/settingsService';
import { useUserStore } from '@/stores/useUserStore';

const authStore = useAuthStore();
const notify = useNotifyStore();
const viewStore = useViewStore();
const errors = useErrors();
const router = useRouter();
const confirmStore = useConfirmStore();
const appStore = useAppStore();
const userStore = useUserStore();

const secondsToIdle = 10;
const secondsCheckApiInterval = 30;

const { idle } = useIdle(secondsToIdle * 1000);

const idleModalOpened = ref(false);

// ToDo: develop login & get session
// eslint-disable-next-line no-unused-vars

const translate = useI18n();
const route = useRoute();
const shellMode = computed(() => 'digimaks');

const nav = computed(() => [
  {
    label: translate.t('pages.dashboard.title'),
    icon: 'dashboard',
    to: { name: 'dashboard' },
  },
  {
    label: translate.t('pages.sign.title'),
    icon: 'sign',
    to: { name: 'sign', params: { filePath: 'null', type: 'null' } },
  },
  {
    label: translate.t('pages.usageHistory.title'),
    icon: 'history',
    to: { name: 'usageHistory' },
    type: 'secondary',
  },
  {
    label: translate.t('pages.settings.title'),
    icon: 'config',
    to: { name: 'settings' },
    type: 'secondary',
  },
]);

const systemName = computed(() => translate.t('title.shortName'));
const pageTitle = computed(() => {
  if (typeof router.currentRoute.value.meta.title === 'function') {
    return router.currentRoute.value.meta.title(translate);
  }
  return translate.t(String(router.currentRoute.value.meta.title));
});

const breadcrumbs = computed(() => {
  const ret = [];

  if (route.meta.breadcrumbs) {
    // @ts-ignore
    route.meta.breadcrumbs.forEach((item) => {
      ret.push({
        label: translate.t(item.text),
        to: item.to,
      });
    });
  }
  return ret;
});

const showBackButton = computed(() => breadcrumbs.value.length > 0);

const selectedNavItems = computed(() => {
  const ret = {};
  ret[router.currentRoute.value.name] = true;
  if (route.meta?.breadcrumbs) {
    // @ts-ignore
    route.meta?.breadcrumbs.forEach((item) => {
      ret[item.to?.name] = true;
    });
  }
  return ret;
});

function goBack(path) {
  if (path !== -1) {
    router.push(path);
  } else {
    router.back();
  }
}
function goHome(path) {
  router.push(path);
}

onMounted(async () => {
  if (route.name === 'home') {
    router.replace({ name: 'dashboard' });
  }
  try {
    const res = await getState();
    if (res?.language !== 'lv') userStore.language = { id: res?.language };
    if (res?.fullName)
      userStore.user = {
        firstName: res?.fullName?.split(' ')[0],
        lastName: res?.fullName?.split(' ')[1],
      };

    if (res.system) viewStore.system = res.system;
  } catch (e) {
    console.error(e);
  }
});
const systemIcon = ref('zz-lx');

const theme = ref('auto');

const closeModal = () => {
  idleModalOpened.value = false;
};

const openModal = () => {
  idleModalOpened.value = true;
};

async function logout() {
  try {
    const resp = await authStore.logout();
    if (resp.status === 200 && resp.data) {
      window.location.href = resp.data;
    } else {
      notify.pushSuccess(translate.t('shell.notifications.logOut'));
    }
  } catch (err) {
    const error = errors.get(err);
    if (error.status !== 401 && error.data) {
      notify.pushError(error.data);
    }
  } finally {
    closeModal();
    router.push({ name: 'sessionEnded' });
  }
}

function primary() {
  logout();
  confirmStore.$state.isOpen = false;
}
function secondary() {
  confirmStore.$state.isOpen = false;
}

function openConfirmModal() {
  confirmStore.push(
    translate.t('shell.logOutModal.title'),
    translate.t('shell.logOutModal.description'),
    translate.t('shell.logOutModal.yes'),
    translate.t('shell.logOutModal.no'),
    primary,
    secondary
  );
}

function confirmModalClosed() {
  confirmStore.$state.isOpen = false;
}

async function getSession() {
  try {
    await authStore.fetchSession();
  } catch (err) {
    const error = errors.get(err);
    if (error.status === 401) {
      logout();
    } else if (error.data) {
      notify.pushError(error.data);
    }
  }
}

async function callKeepAlive() {
  try {
    await authStore.keepAlive();
  } catch (err) {
    const error = errors.get(err);
    if (error.status === 401) {
      logout();
    } else if (error.data) {
      notify.pushError(error.data);
    }
  }
}

const checkApiSession = () => {
  if (idle.value || idleModalOpened.value) {
    getSession();
  } else {
    callKeepAlive();
  }
};

useIntervalFn(() => {
  if (!authStore.session.active) {
    if (idleModalOpened.value) {
      closeModal();
      router.push({ name: 'sessionEnded' });
    }
    return;
  }
  if (authStore.session.secondsToLive < 1) {
    logout();
    closeModal();
    return;
  }
  if (authStore.session.secondsToLive < authStore.session.secondsToCountdown) {
    if (!idleModalOpened.value) {
      openModal();
    }
  } else if (idleModalOpened.value) {
    closeModal();
    return;
  }
  const refreshIntervals = authStore.session.secondsToLive % secondsCheckApiInterval === 0;
  const refreshBeforeWarn =
    authStore.session.secondsToLive - 3 < authStore.session.secondsToCountdown && !idle.value;
  const refreshBeforeLogout = authStore.session.secondsToLive === 3;
  if (refreshIntervals || refreshBeforeWarn || refreshBeforeLogout) {
    checkApiSession();
  }
  authStore.session.secondsToLive -= 1;
}, 1000);

async function continueSession() {
  try {
    await authStore.keepAlive();
    notify.pushSuccess(translate.t('shell.notifications.sessionContinued'));
  } catch (err) {
    notify.pushError(translate.t('shell.notifications.sessionContinuedFailed'));
    if (err.response.status === 401) {
      logout();
    }
  } finally {
    closeModal();
  }
}

invoke(async () => {
  // @ts-ignore
  await until(() => authStore.showSessionEndCountdown).toBe(true);
  notify.pushWarning(translate.t('shell.notifications.sessionEndingSoon'));
});

function idleModalPrimary() {
  continueSession();
}
function idleModalSecondary() {
  logout();
}

function changeLanguage(value) {
  translate.locale.value = value?.id;
}

let isReverting = false;

watch(
  () => userStore.language,
  async (newValue, oldValue) => {
    if (isReverting) {
      isReverting = false;
      return;
    }
    if (newValue?.id !== oldValue?.id) {
      try {
        await setLanguage(newValue.id);
        changeLanguage(newValue);
      } catch (e) {
        console.error(e);
        isReverting = true;
        userStore.language = oldValue;
      }
    }
  }
);

const shellTexts = computed(() => ({
  languagesTitle: translate.t('shell.languages'),
  userTitle: translate.t('shell.user'),
  openNavbar: translate.t('shell.openNavbar'),
  close: translate.t('shell.close'),
  themeTitle: translate.t('shell.themeTitle'),
  animations: translate.t('shell.animations'),
  fonts: translate.t('shell.fonts'),
  themeAuto: translate.t('shell.themeAuto'),
  themeLight: translate.t('shell.themeLight'),
  themeDark: translate.t('shell.themeDark'),
  logOut: translate.t('shell.logOut'),
}));

const languages = [
  {
    id: 'lv',
    name: 'Latviešu',
  },
  {
    id: 'en',
    name: 'Angļu (English)',
  },
];

const navBarSwitch = ref(true);
</script>
<template>
  <div>
    <div :class="[{ 'hide-user-nav': !userStore.user }]">
      <LxShell
        :system-name="translate.t('title.fullName')"
        :system-subheader="translate.t('title.subheader')"
        :system-name-short="systemName"
        :user-info="userStore.user"
        :nav-items="nav"
        :nav-items-selected="selectedNavItems"
        :mode="shellMode"
        :page-label="pageTitle"
        :page-back-button-visible="showBackButton"
        :page-breadcrumbs="breadcrumbs"
        :page-index-path="{ name: 'dashboard' }"
        :system-icon="systemIcon"
        :has-cover-logo="false"
        :cover-image="null"
        :cover-image-dark="null"
        :cover-logo="null"
        :languages="languages"
        :has-language-picker="false"
        v-model:selectedLanguage="userStore.language"
        :navigating="appStore.$state.isNavigating || viewStore.blockNav"
        :showIdleModal="idleModalOpened"
        :secondsToLive="authStore.session.secondsToLive"
        :confirmDialogData="confirmStore"
        :confirmPrimaryButtonBusy="false"
        :confirmPrimaryButtonDestructive="true"
        v-model:notifications="notify.notifications"
        :hideNavBar="!viewStore.navBar"
        v-model:navBarSwitch="navBarSwitch"
        :texts="shellTexts"
        :page-header-visible="viewStore.header"
        :available-themes="[]"
        v-model:theme="theme"
        :has-theme-picker="true"
        @confirmModalClosed="confirmModalClosed"
        @go-home="goHome"
        @go-back="goBack"
        @log-out="openConfirmModal"
        @idleModalPrimary="idleModalPrimary"
        @idleModalSecondary="idleModalSecondary"
      >
        <template #coverArea>
          <div class="lx-button-set">
            <LoginView></LoginView>
          </div>
        </template>

        <template #logo>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 50 50"
          >
            <path
              d="M25,1.7C12.1,1.7,1.7,12.1,1.7,25c0,8.4,4.5,15.8,11.2,19.9L25,32.8l0,0l0,0l9.1,9.1c0,0,0,0,0,0l3,3
	c6.7-4.1,11.2-11.5,11.2-20C48.3,12.1,37.9,1.7,25,1.7z M12.6,39.6C8.4,36.1,5.8,30.8,5.8,25c0-3.3,0.8-6.3,2.3-9L22.1,30L12.6,39.6
	z M10.4,12.6c3.5-4.1,8.8-6.8,14.6-6.8c5.8,0,11.1,2.6,14.6,6.8L25,27.2L10.4,12.6z M37.4,39.6L27.8,30l14.1-14.1
	c1.5,2.7,2.3,5.8,2.3,9.1C44.2,30.9,41.5,36.1,37.4,39.6z"
            />
          </svg>
        </template>

        <template #logoSmall>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            xmlns:xlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 50 50"
          >
            <path
              d="M25,1.7C12.1,1.7,1.7,12.1,1.7,25c0,8.4,4.5,15.8,11.2,19.9L25,32.8l0,0l0,0l9.1,9.1c0,0,0,0,0,0l3,3
	c6.7-4.1,11.2-11.5,11.2-20C48.3,12.1,37.9,1.7,25,1.7z M12.6,39.6C8.4,36.1,5.8,30.8,5.8,25c0-3.3,0.8-6.3,2.3-9L22.1,30L12.6,39.6
	z M10.4,12.6c3.5-4.1,8.8-6.8,14.6-6.8c5.8,0,11.1,2.6,14.6,6.8L25,27.2L10.4,12.6z M37.4,39.6L27.8,30l14.1-14.1
	c1.5,2.7,2.3,5.8,2.3,9.1C44.2,30.9,41.5,36.1,37.4,39.6z"
            />
          </svg>
        </template>
        <router-view />
      </LxShell>
    </div>
  </div>
</template>
