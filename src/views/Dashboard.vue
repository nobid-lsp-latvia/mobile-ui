<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { LxList, LxButton, LxIcon } from '@wntr/lx-ui';
import Card from '@/components/Card.vue';
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { getDocuments } from '@/services/documentService';
import useNotifyStore from '@/stores/useNotifyStore';
import { useRouter, useRoute } from 'vue-router';
import { scanQrCode } from '@/services/presentationService';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import { useUserStore } from '@/stores/useUserStore';
import { getState } from '@/services/appService';

const router = useRouter();
const route = useRoute();
const t = useI18n();
const viewStore = useViewStore();
const userStore = useUserStore();

const notification = useNotifyStore();

const documents = ref([]);
const loading = ref(false);

async function getDocumentsCall() {
  loading.value = true;
  try {
    const res = await getDocuments();
    documents.value = res.documents;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
}

async function listActionClick(action, item) {
  if (action === 'click') {
    try {
      router.push({ name: 'document', params: { id: item } });
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
  }
}

function addDocument() {
  router.push({ name: 'addDocument' });
}

async function openQrScan() {
  try {
    await scanQrCode();
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
}

const preparedDocuments = computed(() => {
  if (documents.value) {
    let res = documents.value.map((doc) => ({
      ...doc.meta,
      preparedItem: {
        id: doc.meta.id,
        name: doc.meta.name,
        type: doc.meta.type,
        issuingAuthority: doc.meta.issuingAuthority,
        issuanceDate: doc.meta.issuanceDate,
        expirationDate: doc.meta.expirationDate,
        hasExpired: doc.meta.hasExpired,
        docNumber: doc.meta.displayNumber,
        description: doc.meta.description,
        additionalInfo: doc.meta.additionalInfo,
      },
    }));
    if (!route.params.id) {
      res = res.filter((doc) => doc.isFavorite);
    } else if (route.params.id === 'hasExpired') {
      res = res.filter((doc) => doc.hasExpired);
    }

    // if (res?.length === 0 && documents.value.length > 0) {
    //   router.replace({ name: 'dashboard', params: { id: 'all' } });
    // }
    return res;
  }
  return [];
});

async function setShellName() {
  try {
    const res = await getState();
    if (res?.fullName)
      userStore.user = {
        firstName: res?.fullName?.split(' ')[0],
        lastName: res?.fullName?.split(' ')[1],
      };
  } catch (e) {
    console.error(e);
  }
}

window.history.pushState(null, '', window.location.href);
window.addEventListener('popstate', () => {
  window.history.pushState(null, '', window.location.href);
});

onMounted(async () => {
  viewStore.navBar = true;
  viewStore.header = true;
  await getDocumentsCall();
  await setShellName();
});

onBeforeUnmount(() => {
  window.removeEventListener('popstate', () => {
    window.history.pushState(null, '', window.location.href);
  });
});
</script>

<template>
  <div id="wrapper" :style="`--card-count: ${preparedDocuments?.length}`">
    <LxButton
      v-if="documents.length > 0"
      icon="add-item"
      :label="t.t('pages.dashboard.addDocument')"
      kind="ghost"
      id="add-document"
      @click="addDocument"
    />
    <div class="filter-button" v-if="documents.length > 0">
      <LxButton
        kind="secondary"
        :label="
          route.params.id
            ? route.params.id === 'all'
              ? t.t('pages.dashboard.allDocuments')
              : t.t('pages.dashboard.expiredDocuments')
            : t.t('pages.dashboard.favoriteDocuments')
        "
        icon="menu"
        @click="router.push({ name: 'dashboardMenu', params: { id: route.params.id } })"
      />
    </div>
    <LxList
      v-show="documents.length > 0 || loading"
      id="card-list"
      :items="preparedDocuments"
      clickable-attribute="id"
      @action-click="listActionClick"
      list-type="1"
      :loading="loading"
      :texts="{ noItems: t.t('pages.documentAdd.documentList.noItems') }"
    >
      <template #customItem="{ preparedItem }">
        <Card :value="preparedItem" />
      </template>
    </LxList>

    <div
      class="empty-document-list-wrapper"
      v-if="documents.length === 0 && !loading"
      @click="() => router.push({ name: 'onboarding' })"
    >
      <div class="empty-document-list">
        <LxIcon value="add" />
        <p>{{ t.t('pages.dashboard.addDocument') }}</p>
      </div>
    </div>

    <div class="fab" v-if="documents.length > 0">
      <LxButton :label="t.t('pages.dashboard.scanQr')" @click="openQrScan" />
    </div>
  </div>
</template>
