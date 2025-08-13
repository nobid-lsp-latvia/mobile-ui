<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref } from 'vue';
import { getTransactions } from '@/services/transactionsService';
import { LxLoader, LxIllustration } from '@wntr/lx-ui';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import TransactionList from '@/components/TransactionList.vue';
import useViewStore from '@/stores/useViewStore';

const t = useI18n();
const notification = useNotifyStore();
const viewStore = useViewStore();

const transactions = ref([]);
const loading = ref(true);
const error = ref(false);

onMounted(async () => {
  viewStore.navBar = true;
  viewStore.header = true;
  try {
    const res = await getTransactions();
    transactions.value = res?.transactions;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    error.value = true;
  }
  loading.value = false;
});
</script>

<template>
  <div class="page-wrapper">
    <div class="page-header-text-wrapper">
      <p>{{ t.t('pages.usageHistory.title') }}</p>
    </div>
    <div id="page">
      <LxLoader v-if="loading" :loading="true" />
      <div v-else-if="error">
        <LxIllustration value="error" class="error-illustration" />

        <p>{{ t.t('pages.usageHistory.error') }}</p>
      </div>
      <TransactionList :items="transactions" v-if="!loading && !error" />
    </div>
  </div>
</template>
