<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref } from 'vue';
import { LxButton, LxLoader } from '@wntr/lx-ui';
import { resolveDocumentOffer, issueDocumentOffer } from '@/services/issuanceService';
import useConfirmStore from '@/stores/useConfirmStore';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';

const t = useI18n();
const router = useRouter();
const confirmStore = useConfirmStore();
const notification = useNotifyStore();
const viewStore = useViewStore();

const loading = ref(true);

function exit() {
  router.replace({ name: 'dashboard' });
}

const resolveDocumentValue = ref();

async function addDocument() {
  if (resolveDocumentValue.value?.txCodeLength) {
    router.replace({ name: 'documentOfferCode' });
  } else {
    try {
      loading.value = true;
      await issueDocumentOffer(
        resolveDocumentValue.value?.offerUri,
        null,
        resolveDocumentValue.value?.issuerName
      );
      notification.pushSuccess(t.t('pages.documentAdd.documentAdded'));
      router.replace({ name: 'documentOfferManual', params: { status: 'success' } });
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
      router.replace({ name: 'documentOfferManual', params: { status: 'error' } });
    } finally {
      loading.value = false;
    }
  }
}

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard') {
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
});

onMounted(async () => {
  viewStore.navBar = false;
  viewStore.header = true;
  try {
    const res = await resolveDocumentOffer();
    resolveDocumentValue.value = res;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    router.replace({ name: 'documentOfferManual', params: { status: 'error' } });
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
          @click="exit"
          :label="t.t('pages.documentAdd.close')"
        />
        <p>{{ t.t('pages.documentAdd.description') }}</p>
      </div>
      <div v-if="loading">
        <LxLoader :loading="loading" />
      </div>
      <div v-else class="document-offer">
        <p>
          {{ t.t('pages.documentAdd.confirmation') }}
          <b v-for="item in resolveDocumentValue?.documents" :key="item.title">
            "{{
              t.te(`cards.names.${item.title?.toLowerCase()}`)
                ? t.t(`cards.names.${item.title?.toLowerCase()}`)
                : item?.title
            }}"
          </b>
          ?
        </p>

        <div class="document-offer-buttons">
          <LxButton :label="t.t('pages.documentAdd.addButton')" @click="addDocument" />
          <LxButton :label="t.t('pages.documentAdd.cancelButton')" @click="exit" kind="secondary" />
        </div>
      </div>
    </div>
  </div>
</template>
