<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { computed, ref, onMounted } from 'vue';
import { LxList, LxButton } from '@wntr/lx-ui';
import { getDocuments } from '@/services/documentService';
import useViewStore from '@/stores/useViewStore';
import useNotifyStore from '@/stores/useNotifyStore';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const t = useI18n();
const viewStore = useViewStore();
const notification = useNotifyStore();
const router = useRouter();
const route = useRoute();

const documents = ref([]);
const loading = ref(false);

const groups = computed(() => {
  const group = [
    {
      id: 'all',
      name: t.t('pages.dashboard.allDocuments'),
      count: 0,
      icon: route.params.id === 'all' ? 'accept' : 'unselected',
    },
    {
      id: 'isFavorite',
      name: t.t('pages.dashboard.favoriteDocuments'),
      count: 0,
      icon: !route.params.id ? 'accept' : 'unselected',
    },
    {
      id: 'hasExpired',
      name: t.t('pages.dashboard.expiredDocuments'),
      count: 0,
      icon: route.params.id === 'hasExpired' ? 'accept' : 'unselected',
    },
  ];

  if (documents.value) {
    documents.value.forEach((x) => {
      if (x.meta.hasExpired) {
        group[2].count++;
      }
      if (x.meta.isFavorite) {
        group[1].count++;
      }
      group[0].count++;
    });
  }
  group.map((x) => (x.clickable = x.count > 0));
  return group;
});

function listActionClicked(action, item) {
  if (action === 'click') {
    if (item === 'isFavorite') {
      router.replace({ name: 'dashboard' });
    } else {
      router.replace({ name: 'dashboard', params: { id: item } });
    }
  }
}

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

onMounted(async () => {
  viewStore.navBar = false;
  await getDocumentsCall();
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
          :label="t.t('pages.dashboard.close')"
          @click="() => router.replace({ name: 'dashboard', params: { id: route.params.id } })"
        />
        <p>{{ t.t('pages.dashboard.chooseFolder') }}</p>
      </div>

      <LxList :items="groups" list-type="1" @action-click="listActionClicked" class="filter-list">
        <template #customItem="item">
          <p
            class="lx-primary"
            :class="[
              {
                'selected ':
                  item.id === route.params.id || (item.id === 'isFavorite' && !route.params.id),
              },
            ]"
          >
            {{ item.name }} ({{ item.count }})
          </p>
        </template>
      </LxList>
    </div>
  </div>
</template>
