<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref } from 'vue';
import { LxLoader, LxButton, LxIllustration } from '@wntr/lx-ui';
import useViewStore from '@/stores/useViewStore';
import { initialiseWallet } from '@/services/onboardingService';
import useNotifyStore from '@/stores/useNotifyStore';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const t = useI18n();
const viewStore = useViewStore();
const notification = useNotifyStore();
const router = useRouter();

const error = ref(false);

onMounted(async () => {
  viewStore.navBar = false;
  viewStore.header = true;
  try {
    await initialiseWallet();
    router.replace({ name: 'dashboard' });
    notification.pushSuccess(t.t('pages.documentAdd.documentAddedSuccess'));
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    error.value = true;
  }
});
</script>

<template>
  <div>
    <LxLoader :loading="true" v-if="!error" style="margin-top: 6rem" />
    <div class="error-screen" v-else>
      <LxIllustration value="error" class="error-illustration" />
      <p class="lx-primary">{{ t.t('pages.documentAdd.documentAddedError') }}</p>
      <div class="button-wrapper">
        <LxButton
          :label="t.t('pages.documentAdd.continue')"
          @click="() => router.replace({ name: 'dashboard' })"
        />
      </div>
    </div>
  </div>
</template>
