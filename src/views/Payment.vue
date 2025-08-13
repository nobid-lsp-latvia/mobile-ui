<script setup>
import { onMounted, ref } from 'vue';
import { LxButton, LxForm, LxRow, LxDataBlock } from '@wntr/lx-ui';
import { useRouter } from 'vue-router';
import useViewStore from '@/stores/useViewStore';
import CardDisplay from '@/components/CardDisplay.vue';
import { confirmRequest } from '@/services/presentationService';
import { APP_CONFIG } from '@/constants';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: { type: Object, default: () => ({}) },
});

const t = useI18n();
const viewStore = useViewStore();
const router = useRouter();

const collapsed = ref(true);

const disabled = ref(false);

function exit() {
  disabled.value = true;
  try {
    router.push({ name: 'dashboard' });
  } catch (e) {
    console.error(e);
  }
  disabled.value = false;
}

async function confirm() {
  disabled.value = true;
  try {
    const fieldValues = { fields: {} };
    props.data?.documents?.[0]?.fields.forEach((x) => {
      fieldValues.fields[x.id] = x?.checked;
    });
    await confirmRequest(fieldValues);
    if (!APP_CONFIG.embed) {
      router.replace({ name: 'paymentDone', params: { step: 'loading' } });
    }
  } catch (e) {
    console.error(e);
  }
  disabled.value = false;
}

function formatCurrency(value) {
  // Format the currency symbol based on currency code
  if (value === 'EUR') return '€';
  if (value === 'USD') return '$';
  if (value === 'GBP') return '£';
  return value;
}

function formatAmount(value) {
  // Format the amount based on the locale
  if (t.locale.value === 'lv' && value.includes('.')) return value.replace('.', ',');
  if (value.includes(',')) return value.replace(',', '.');

  return value;
}

onMounted(() => {
  viewStore.navBar = false;
});
</script>
<template>
  <div id="page" class="payment-page">
    <div class="close-button-wrapper">
      <LxButton
        icon="close"
        kind="ghost"
        variant="icon-only"
        :label="t.t('pages.payment.close')"
        @click="exit()"
      />
    </div>

    <div class="layout">
      <div>
        <p class="request-text">
          "{{ data?.transactionData?.creditor }}"
          {{ t.t('pages.payment.requestText') }}
        </p>
      </div>
      <LxForm :show-footer="false" :show-header="false" :column-count="2" kind="compact">
        <LxRow :label="t.t('pages.payment.requester')" :column-span="2">
          <LxDataBlock
            :name="data?.transactionData?.creditor"
            :force-uppercase="false"
            size="l"
            :icon="'user'"
          />
        </LxRow>
        <LxRow :label="t.t('pages.payment.document')" :column-span="2">
          <CardDisplay
            :value="data?.documents?.[0]?.meta"
            :collapsed="collapsed"
            @click="collapsed = !collapsed"
          />
        </LxRow>
        <LxRow :label="t.t('pages.payment.amount')" :column-span="2">
          <div class="amount-wrapper">
            <p class="lx-primary">
              {{ formatAmount(data?.transactionData?.amount) }}
              {{ formatCurrency(data?.transactionData?.currency) }}
            </p>
            <p class="lx-secondary">{{ data?.transactionData?.purpose }}</p>
          </div>
        </LxRow>
      </LxForm>

      <div class="lx-button-set">
        <div class="fab">
          <LxButton :label="t.t('pages.payment.approve')" :disabled="disabled" @click="confirm" />
          <LxButton
            :label="t.t('pages.payment.reject')"
            kind="secondary"
            :disabled="disabled"
            @click="exit"
          />
        </div>
      </div>
    </div>
  </div>
</template>
