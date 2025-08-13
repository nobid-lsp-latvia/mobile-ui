<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref } from 'vue';
import { LxLoader, LxButton, LxIllustration } from '@wntr/lx-ui';
import { useRouter, onBeforeRouteLeave, useRoute } from 'vue-router';
import useConfirmStore from '@/stores/useConfirmStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import useNotifyStore from '@/stores/useNotifyStore';

const t = useI18n();
const router = useRouter();
const confirmStore = useConfirmStore();
const viewStore = useViewStore();
const route = useRoute();
const notification = useNotifyStore();

const loading = ref(true);
const allowNavigation = ref(false);

const success = ref(false);
const error = ref(false);

function continueToDashboard() {
  allowNavigation.value = true;
  router.replace({ name: 'dashboard' });
}

function exit() {
  router.replace({ name: 'dashboard' });
}

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard' && !allowNavigation.value && !success.value && !error.value) {
    confirmStore.push(
      t.t('pages.documentAdd.canceling'),
      route?.params?.status === 'presentationError'
        ? t.t('pages.documentPresentation.cancelingDescription')
        : t.t('pages.documentAdd.cancelingDescription'),
      t.t('pages.documentAdd.yes'),
      t.t('pages.documentAdd.no'),
      () => next(),
      () => {
        confirmStore.confirm();
        next(false);
      }
    );
  } else {
    next();
  }
  allowNavigation.value = false;
});

onMounted(async () => {
  viewStore.navBar = false;
  viewStore.header = true;
  if (route?.params?.status === 'success') {
    success.value = true;
    loading.value = false;
  } else if (route?.params?.status === 'error' || route?.params?.status === 'presentationError') {
    error.value = true;
    loading.value = false;
    if (route?.query?.error && t.te(`errors.${route?.query?.error}`))
      notification.pushError(t.t(`errors.${route?.query?.error}`));
  }
});
</script>
<template>
  <div class="page-wrapper">
    <div id="page">
      <div class="close-button-wrapper">
        <LxButton
          icon="close"
          variant="icon-only"
          kind="ghost"
          :label="t.t('pages.documentAdd.close')"
          @click="exit"
        />
        <p v-if="route?.params?.status === 'error'">{{ t.t('pages.documentAdd.description') }}</p>
      </div>
      <div class="document-offer-manual">
        <LxLoader v-if="loading" :loading="loading" />
        <div v-else-if="success" class="success-screen">
          <LxIllustration value="success" class="accept-icon" />

          <p class="lx-primary">{{ t.t('pages.documentAdd.documentAddedSuccess') }}</p>
          <div class="button-wrapper">
            <LxButton :label="t.t('pages.documentAdd.continue')" @click="continueToDashboard" />
          </div>
        </div>
        <div v-else-if="error" class="error-screen">
          <LxIllustration value="error" class="error-illustration" />

          <p class="lx-primary" v-if="route?.params?.status === 'presentationError'">
            {{ t.t('pages.documentAdd.documentPresentError') }}
          </p>
          <p class="lx-primary" v-else>
            {{ t.t('pages.documentAdd.documentAddedError') }}
          </p>

          <div class="button-wrapper">
            <LxButton :label="t.t('pages.documentAdd.continue')" @click="continueToDashboard" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
