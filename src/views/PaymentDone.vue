<script setup>
import { onMounted, onBeforeUnmount, ref, computed } from 'vue';
import { LxButton, LxLoader, LxIllustration } from '@wntr/lx-ui';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import useViewStore from '@/stores/useViewStore';
import { APP_CONFIG } from '@/constants';

const t = useI18n();
const viewStore = useViewStore();
const router = useRouter();
const route = useRoute();

const status = ref(null);

const statusHandler = (event) => {
  const response = event.detail;
  status.value = response?.status;

  if (response?.status === 'ACSC') {
    // if accepted show accept screen
    router.replace({ name: 'paymentDone', params: { step: 'success' } });
  } else if (
    response?.status === 'NAUT' ||
    response?.status === 'RJCT' ||
    response?.status === 'CANC'
  ) {
    // if NotAuthorized, Rejected or Cancelled show error screen
    router.replace({ name: 'paymentDone', params: { step: 'error' } });
  }
};

const statusLabel = computed(() =>
  t.te(`pages.paymentDone.status.${status.value}`)
    ? t.t(`pages.paymentDone.status.${status.value}`)
    : null
);

onMounted(async () => {
  viewStore.navBar = false;
  if (route.params.step === 'loading') {
    window.addEventListener('lx-payment-status', statusHandler);
  }
  if (!APP_CONFIG.embed) {
    // eslint-disable-next-line no-new
    new Promise((resolve) => {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('lx-payment-status', {
            detail: {
              status: 'ACSC',
            },
          })
        );
        resolve();
      }, 1000);
    });
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('lx-payment-status', statusHandler);
});
</script>

<template>
  <div class="page-wrapper">
    <div id="page" class="sign-page payment-done">
      <div class="close-button-wrapper" v-if="route.params.step !== 'loading'">
        <LxButton
          icon="close"
          kind="ghost"
          variant="icon-only"
          :label="t.t('pages.payment.close')"
          @click="router.replace({ name: 'dashboard' })"
        />
      </div>

      <div v-if="route.params.step === 'loading'">
        <LxLoader :loading="true" :label="statusLabel" />
      </div>
      <div v-else-if="route.params.step === 'success'" class="success-screen">
        <div class="image-wrapper">
          <LxIllustration value="success" class="accept-icon" />

          <p class="lx-primary">
            {{ t.t('pages.paymentDone.success') }}
          </p>
          <p class="lx-secondary">
            {{ t.t('pages.paymentDone.successDescription') }}
          </p>
        </div>
        <div class="button-wrapper">
          <LxButton
            :label="t.t('pages.paymentDone.continue')"
            @click="router.replace({ name: 'dashboard' })"
          />
        </div>
      </div>
      <div v-else-if="route.params.step === 'error'" class="error-screen">
        <div class="image-wrapper">
          <LxIllustration value="error" class="error-illustration" />

          <p class="lx-primary">
            {{ t.t('pages.paymentDone.error') }}
          </p>
        </div>
        <div class="button-wrapper">
          <LxButton
            :label="t.t('pages.paymentDone.continue')"
            @click="router.replace({ name: 'dashboard' })"
          />
        </div>
      </div>
    </div>
  </div>
</template>
