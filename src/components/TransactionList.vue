<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { ref, computed } from 'vue';
import { LxList, lxDateUtils, LxStateDisplay, LxIcon, LxToggle } from '@wntr/lx-ui';
import { useI18n } from 'vue-i18n';

const t = useI18n();

const props = defineProps({
  items: { type: Array, default: () => [] },
});

const toggle = ref(false);

const preparedTransactions = computed(() =>
  props.items
    .map((x) => ({
      id: x?.id,
      name: x?.nameSpace,
      date: x?.timestamp,
      type: x?.eventType,
      status: x?.status,
      authority: x?.authority,
    }))
    .filter((x) => !toggle.value || x.status === 'SUCCESS')
);

function getTypeIcon(type) {
  if (type === 'DOCUMENT_PRESENTED') {
    return 'status-seen';
  }
  if (type === 'DOCUMENT_DELETED') {
    return 'status-deleted';
  }
  if (type === 'DOCUMENT_ISSUED') {
    return 'status-new';
  }
  if (type === 'DOCUMENT_SIGNED') {
    return 'status-signed';
  }
  if (type === 'DOCUMENT_PAYMENT') {
    return 'status-default';
  }
  return 'status-default';
}

function getTypeText(type) {
  if (type === 'DOCUMENT_PRESENTED') {
    return t.t('pages.usageHistory.presented');
  }
  if (type === 'DOCUMENT_DELETED') {
    return t.t('pages.usageHistory.deleted');
  }
  if (type === 'DOCUMENT_ISSUED') {
    return t.t('pages.usageHistory.issued');
  }
  if (type === 'DOCUMENT_SIGNED') {
    return t.t('pages.usageHistory.signed');
  }
  if (type === 'DOCUMENT_PAYMENT') {
    return t.t('pages.usageHistory.paying');
  }
  return t.t('pages.usageHistory.other');
}

const statusDictionary = computed(() => [
  {
    value: 'SUCCESS',
    displayName: t.t('pages.usageHistory.successLabel'),
    displayType: 'finished',
  },
  {
    value: 'ERROR',
    displayName: t.t('pages.usageHistory.errorLabel'),
    displayType: 'error',
  },
]);
</script>
<template>
  <div>
    <div class="history-toggle-wrapper">
      <LxToggle v-model="toggle">{{ t.t('pages.usageHistory.showSuccess') }} </LxToggle>
    </div>
    <LxList
      :items="preparedTransactions"
      list-type="1"
      :texts="{ noItems: t.t('pages.documentAdd.documentList.noItems') }"
    >
      <template #customItem="item">
        <div class="transaction-item">
          <div class="first-row">
            <p class="lx-primary">{{ t.t(`cards.names.${item.name?.toLowerCase()}`) }}</p>
            <p v-if="item?.authority">{{ item?.authority }}</p>
            <p>{{ lxDateUtils.formatDateTime(new Date(item?.date)) }}</p>
          </div>
          <div class="second-row">
            <div class="status-wrapper">
              <LxStateDisplay :value="item.status" :dictionary="statusDictionary" />
            </div>
            <div class="type-wrapper">
              <p>{{ getTypeText(item.type) }}</p>
              <LxIcon :value="getTypeIcon(item.type)" icon-set="material" />
            </div>
          </div>
        </div>
      </template>
    </LxList>
  </div>
</template>
