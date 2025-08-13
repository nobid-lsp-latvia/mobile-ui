<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref } from 'vue';
import { LxButton, LxLoader, LxTextInput, LxIllustration } from '@wntr/lx-ui';
import { getOfferCodeData, issueDocumentOffer } from '@/services/issuanceService';
import useNotifyStore from '@/stores/useNotifyStore';
import useConfirmStore from '@/stores/useConfirmStore';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';

const t = useI18n();
const notification = useNotifyStore();
const confirmStore = useConfirmStore();
const router = useRouter();
const viewStore = useViewStore();

const loading = ref(true);
const success = ref(false);
const error = ref(false);

const codesData = ref();
const inputCode = ref(null);

const allowNavigation = ref(false);

async function issueDocument() {
  try {
    document.getElementById('input-field').blur();
    await issueDocumentOffer(
      codesData.value?.offerUri,
      inputCode.value,
      codesData.value?.issuerName
    );
    notification.pushSuccess(t.t('pages.documentAdd.documentAdded'));
    success.value = true;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    inputCode.value = '';
  }
}

function exit() {
  router.replace({ name: 'dashboard' });
}

function endAddition() {
  allowNavigation.value = true;
  router.replace({ name: 'dashboard' });
}

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard' && !allowNavigation.value && !success.value && !error.value) {
    confirmStore.push(
      t.t('pages.documentAdd.canceling'),
      t.t('pages.documentAdd.cancelingDescription'),
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
  try {
    const res = await getOfferCodeData();
    codesData.value = res;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
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
        <p>{{ t.t('pages.documentAdd.description') }}</p>
      </div>
      <div v-if="loading">
        <LxLoader :loading="loading" />
      </div>
      <div v-else-if="success" class="success-screen">
        <LxIllustration value="success" class="accept-icon" />

        <p class="lx-primary">{{ t.t('pages.documentAdd.documentAddedSuccess') }}</p>
        <div class="button-wrapper">
          <LxButton :label="t.t('pages.documentAdd.continue')" @click="endAddition" />
        </div>
      </div>
      <div v-else-if="error" class="error-screen">
        <LxIllustration value="error" class="error-illustration" />

        <p class="lx-primary">{{ t.t('pages.documentAdd.documentAddedError') }}</p>
        <div class="button-wrapper">
          <LxButton :label="t.t('pages.documentAdd.continue')" @click="endAddition" />
        </div>
      </div>
      <div v-else class="document-add-code">
        <p v-if="codesData?.txCodeLength">{{ t.t('pages.documentAdd.documentAddCode.title') }}</p>
        <p v-if="codesData?.txCodeLength">
          {{ t.t('pages.documentAdd.documentAddCode.description') }}
        </p>
        <LxTextInput
          id="input-field"
          v-model="inputCode"
          :maxlength="codesData?.txCodeLength"
          mask="numeric"
          v-if="codesData?.txCodeLength"
        />
        <LxButton
          :label="t.t('pages.documentAdd.addButton')"
          :disabled="inputCode?.length?.toString() !== codesData?.txCodeLength?.toString()"
          @click="issueDocument"
        />
      </div>
    </div>
  </div>
</template>
