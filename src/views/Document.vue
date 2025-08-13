<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref, computed } from 'vue';
import { LxButton, LxModal, LxForm, LxRow, LxFlag, lxDateUtils } from '@wntr/lx-ui';
import {
  getDocumentDetails,
  deleteDocument,
  setDocumentFavorite,
} from '@/services/documentService';
import { getDataType } from '@/utils/dataUtils';
import { getTransactions } from '@/services/transactionsService';
import { useRoute, useRouter } from 'vue-router';
import CardDisplay from '@/components/CardDisplay.vue';
import useNotifyStore from '@/stores/useNotifyStore';
import useConfirmStore from '@/stores/useConfirmStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import TransactionList from '@/components/TransactionList.vue';

const t = useI18n();
const viewStore = useViewStore();

const route = useRoute();
const router = useRouter();
const document = ref();
const notification = useNotifyStore();
const confirmStore = useConfirmStore();

const loadingTransactions = ref(false);
const loadingFavorite = ref(false);
const loadingDelete = ref(false);
const disabled = ref(false);
const modal = ref();
const transactions = ref([]);

async function deleteItem(item) {
  try {
    await deleteDocument(item);
    notification.pushSuccess(t.t('pages.document.deleted'));
    router.push({ name: 'dashboard' });
  } catch (e) {
    console.error(e);
    notification.pushError(t.t('pages.document.notDeleted'));
  }
}

function deleteCheck(item) {
  confirmStore.push(
    t.t('pages.document.confirmTitle'),
    t.t('pages.document.confirmDelete'),
    t.t('pages.document.yes'),
    t.t('pages.document.no'),
    () => deleteItem(item),
    confirmStore.confirm
  );
}

async function getDocumentTransactions(id) {
  disabled.value = true;
  loadingTransactions.value = true;
  try {
    const res = await getTransactions(id);
    modal.value.open();
    transactions.value = res.transactions;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  disabled.value = false;
  loadingTransactions.value = false;
}

const preparedDoc = computed(() => {
  // put the meta object here
  if (document.value) {
    return {
      id: document.value.meta.id,
      name: document.value.meta.name,
      type: document.value.meta.type,
      issuingAuthority: document.value.meta.issuingAuthority,
      issuanceDate: document.value.meta.issuanceDate,
      expirationDate: document.value.meta.expirationDate,
      hasExpired: document.value.meta.hasExpired,
      docNumber: document.value.meta.displayNumber,
      description: document.value.meta.description,
      additionalInfo: document.value.meta.additionalInfo,
    };
  }
  return {};
});

const preparedDocDetails = computed(() => {
  if (document.value && document.value?.meta?.type === 'PID') {
    const order = [
      'given_name',
      'family_name',
      'birth_date',
      'personal_administrative_number',
      'nationality',
      'birth_country',
      'birth_place',
      'age_over_18',
      'issuance_date',
      'expiry_date',
      'issuing_authority',
      'issuing_country',
    ];
    const res = [...document.value.documentDetails];
    return res.sort((a, b) => {
      const indexA = order.indexOf(a.identifier);
      const indexB = order.indexOf(b.identifier);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }
  if (document.value?.meta?.type === 'eSeal' || document.value?.meta?.type === 'eSign') {
    const res = document.value.documentDetails.filter(
      (detail) => detail.identifier !== 'sid' && detail.identifier !== 'type'
    );
    return res;
  }
  if (document.value) {
    return document.value?.documentDetails;
  }
  return [];
});

function stringToArray(str) {
  return str?.split(',')?.map((item) => item?.trim());
}

const favorite = ref(false);

async function changeFavorite() {
  disabled.value = true;
  loadingFavorite.value = true;
  try {
    await setDocumentFavorite(document.value.meta.id, !favorite.value);
    notification.pushSuccess(
      !favorite.value ? t.t('pages.document.addedFavorite') : t.t('pages.document.removedFavorite')
    );
    favorite.value = !favorite.value;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loadingFavorite.value = false;
  disabled.value = false;
}

function translateLabel(label) {
  if (document.value?.meta?.type === 'eSeal' && label === 'cn') {
    return t.t('pages.document.labelTranslations.cnSeal');
  }
  if (document.value?.meta?.type === 'eSeal' || document.value?.meta?.type === 'eSign') {
    return t.t(`pages.document.labelTranslations.${label}`);
  }
  if (label === 'iat' || label === 'exp' || label === 'nbf') {
    return t.t(`pages.document.labelTranslations.IBAN.${label}`);
  }
  return label;
}

function formatDateValue(date) {
  try {
    return lxDateUtils.formatDate(date);
  } catch (e) {}

  return date;
}

onMounted(async () => {
  viewStore.navBar = false;
  try {
    const res = await getDocumentDetails(route.params.id);
    document.value = res;
    favorite.value = res.meta.isFavorite;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
});
</script>

<template>
  <div class="page-wrapper">
    <div id="page" class="document-view">
      <div class="close-button-wrapper">
        <LxButton
          icon="close"
          kind="ghost"
          variant="icon-only"
          :label="t.t('pages.dashboard.close')"
          @click="router.push({ name: 'dashboard' })"
          :disabled="disabled"
        />
      </div>
      <div class="lx-divider"></div>

      <CardDisplay :value="preparedDoc" />
      <div
        class="document-signing-button"
        v-if="preparedDoc?.type === 'eSeal' || preparedDoc?.type === 'eSign'"
      >
        <LxButton
          :label="
            preparedDoc?.type === 'eSeal' ? t.t('pages.document.seal') : t.t('pages.document.sign')
          "
          :icon="preparedDoc?.type === 'eSeal' ? 'seal' : 'sign'"
          kind="secondary"
          :href="{
            name: 'sign',
            params: {
              filePath: 'null',
              id: preparedDoc?.id,
              type: preparedDoc?.type === 'eSeal' ? 'seal' : 'sign',
            },
          }"
        />
      </div>

      <LxForm kind="compact" :show-footer="false" :show-header="false" :column-count="1">
        <LxRow :label="t.t('pages.document.image')" v-if="document?.documentImage">
          <!-- TODO: Fix unexpected aspect-ratios -->
          <img
            :src="`data:image/jpeg;base64,${document?.documentImage}`"
            :alt="t.t('pages.document.image')"
          />
        </LxRow>
        <LxRow
          :id="detail.identifier"
          :label="translateLabel(detail.label)"
          v-for="detail in preparedDocDetails"
          v-bind:key="detail.identifier"
          :column-span="1"
        >
          <p
            class="lx-data"
            v-if="detail.value === null || detail.value === '' || detail.value === undefined"
          >
            —
          </p>
          <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'date'">
            {{ formatDateValue(detail.value) }}
          </p>
          <p class="lx-data flag-display" v-else-if="getDataType(detail.identifier) === 'country'">
            <LxFlag :value="detail.value" /> {{ t.t(`cards.countries.${detail.value}`) }}
          </p>
          <div class="array-wrapper" v-else-if="getDataType(detail.identifier) === 'array'">
            <div class="array-item" v-for="val in stringToArray(detail.value)" v-bind:key="val">
              {{ val }}
            </div>
          </div>
          <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'boolean'">
            {{
              t.te(`pages.document.${detail.value}`)
                ? t.t(`pages.document.${detail.value}`)
                : detail.value
            }}
          </p>
          <p class="lx-data" v-else-if="getDataType(detail.identifier) === 'exception'">
            {{ t.t('pages.document.shownAbove') }}
          </p>
          <p class="lx-data" v-else>{{ detail.value }}</p>
        </LxRow>
      </LxForm>
      <LxForm
        kind="compact"
        :show-footer="false"
        :show-header="false"
        :column-count="1"
        class="document-view-type-form"
        v-if="document?.meta?.type === 'eSeal' || document?.meta?.type === 'eSign'"
      >
        <LxRow id="type" :label="translateLabel('type')">
          <p class="lx-data">
            {{
              t.t(
                `pages.document.labelTranslations.${document.documentDetails.find((x) => x.identifier === 'type').value}`
              )
            }}
          </p>
        </LxRow>
      </LxForm>

      <div class="lx-button-set">
        <LxButton
          :label="
            favorite ? t.t('pages.document.removeFavorite') : t.t('pages.document.addFavorite')
          "
          :icon="favorite ? 'favorite-remove' : 'favorite-add'"
          kind="secondary"
          :busy="loadingFavorite"
          :disabled="disabled"
          @click="changeFavorite"
        />
        <LxButton
          icon="history"
          kind="secondary"
          :label="t.t('pages.document.usageHistory')"
          :busy="loadingTransactions"
          :disabled="disabled"
          @click="getDocumentTransactions(preparedDoc?.id)"
        />
        <LxButton
          icon="delete"
          kind="secondary"
          :label="t.t('pages.document.remove')"
          :destructive="true"
          :busy="loadingDelete"
          :disabled="disabled"
          @click="deleteCheck(route.params.id)"
        />
      </div>
      <LxModal ref="modal" :label="t.t('pages.usageHistory.title')">
        <TransactionList :items="transactions" />
      </LxModal>
    </div>
  </div>
</template>
