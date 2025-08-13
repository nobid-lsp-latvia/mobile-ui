<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { LxButton, LxList, LxIcon, LxLoader } from '@wntr/lx-ui';
import { stringifyQuery, useRouter } from 'vue-router';
import { getDocumentOptions, issueDocument, scanQrCode } from '@/services/issuanceService';
import { APP_CONFIG } from '@/constants';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import { getDocTypeIcon } from '@/utils/dataUtils';

const t = useI18n();
const router = useRouter();
const viewStore = useViewStore();

const notification = useNotifyStore();

const documentList = ref([]);

const loading = ref(false);
const globalLoading = ref(false);

async function listActionClick(_, id) {
  if (id === 'IBAN') {
    router.replace({ name: 'addDocumentPayment' });
    return;
  }

  try {
    const item = documentList.value.find((x) => x?.text === id);
    globalLoading.value = true;
    await issueDocument(item?.type);
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    globalLoading.value = false;
  }
}

async function scanQr() {
  try {
    await scanQrCode();
    if (!APP_CONFIG.embed) {
      router.replace({ name: 'documentOffer' });
    }
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
}

// add groups to communication functions
const groups = [
  { id: 'PID', name: 'PMLP', expanded: true },
  { id: 'mDL', name: 'CSDD', expanded: true },
  { id: 'Diploma', name: 'RTU', expanded: true },
  { id: 'LVRTC', name: 'LVRTC', expanded: true },
  { id: 'IBAN', name: 'SEB', expanded: true },
];

function getGroup(text) {
  if (text === 'eSeal' || text === 'eSign') {
    return 'LVRTC';
  }
  return text;
}

onBeforeUnmount(() => {
  viewStore.navBar = true;
});

onMounted(async () => {
  try {
    loading.value = true;
    const res = await getDocumentOptions();
    documentList.value = res?.options.map((x) => ({
      ...x,
      translatedName: t.t(`cards.names.${x.text?.toLowerCase()}`),
      icon: 'add',
      typeIcon: getDocTypeIcon(x?.text?.toLowerCase()),
      added: x?.exists === 'false',
      group: getGroup(x?.text),
    }));
    viewStore.navBar = false;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
});
</script>

<template>
  <div class="page-wrapper">
    <div id="page" class="add-document-page">
      <LxLoader :loading="globalLoading" v-if="globalLoading" />
      <template v-else>
        <div class="close-button-wrapper">
          <LxButton
            icon="close"
            kind="ghost"
            variant="icon-only"
            :label="t.t('pages.documentAdd.close')"
            @click="() => router.push({ name: 'dashboard' })"
          />
        </div>

        <div class="lx-button-set" style="margin-bottom: 0.5rem; margin-top: 0.5rem">
          <LxButton :label="t.t('pages.documentAdd.scanQr')" @click="scanQr" />
        </div>
        <p class="document-list-call-action">
          {{ t.t('pages.documentAdd.documentList.callToAction') }}
        </p>
        <LxList
          :items="documentList"
          :groupDefinitions="groups"
          id-attribute="text"
          primary-attribute="translatedName"
          clickable-attribute="added"
          :has-search="true"
          list-type="1"
          icon-attribute="icon"
          :loading="loading"
          :hideFilteredItems="true"
          :texts="{
            placeholder: '',
            notFoundSearch: t.t('pages.documentAdd.documentList.notFoundSearch'),
            noItems: t.t('pages.documentAdd.documentList.noItems'),
            clear: t.t('pages.documentAdd.documentList.clear'),
            search: t.t('pages.documentAdd.documentList.search'),
          }"
          @action-click="listActionClick"
        >
          <template #customItem="item">
            <div class="add-document-list-item" :class="[{ 'already-added': !item?.added }]">
              <div class="add-item-group">
                <LxIcon :value="item?.typeIcon?.icon" :iconSet="item?.typeIcon?.iconSet" />
                <p class="lx-primary">{{ item?.translatedName }}</p>
              </div>
              <LxIcon value="check" v-if="!item?.added" />
            </div>
          </template>
          <template #customExpanderHeader="item">
            <p class="lx-secondary">{{ item?.name }}</p>
          </template>
        </LxList>
      </template>
    </div>
  </div>
</template>
