<script setup>
import { onMounted, ref } from 'vue';
import { LxButton } from '@wntr/lx-ui';
import useViewStore from '@/stores/useViewStore';
import { launchSEB } from '@/services/issuanceService';
import { useRouter } from 'vue-router';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';

const t = useI18n();
const viewStore = useViewStore();
const router = useRouter();
const notification = useNotifyStore();

const disabled = ref(false);

async function openApp() {
  disabled.value = true;
  try {
    await launchSEB();
    notification.pushSuccess(t.t('pages.paymentAdd.success'));
    router.replace({ name: 'dashboard' });
  } catch (e) {
    console.error(e);
    notification.pushError(t.t('pages.paymentAdd.error'));
  }
  disabled.value = false;
}

onMounted(() => {
  viewStore.navBar = false;
  viewStore.header = true;
});
</script>

<template>
  <div class="page-wrapper">
    <div id="page" class="payment-add">
      <div class="close-button-wrapper">
        <LxButton
          icon="close"
          kind="ghost"
          variant="icon-only"
          :label="t.t('pages.dashboard.close')"
          :disabled="disabled"
          @click="router.replace({ name: 'dashboard' })"
        />
      </div>
      <p>{{ t.t('pages.paymentAdd.info') }}</p>
      <p>{{ t.t('pages.paymentAdd.infoLineTwo') }}</p>
      <p>{{ t.t('pages.paymentAdd.infoLineThree') }}</p>

      <div class="launch-button-wrapper">
        <LxButton
          :label="t.t('pages.paymentAdd.launch')"
          icon="open"
          :busy="disabled"
          @click="openApp"
        />
      </div>
    </div>
  </div>
</template>
