<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { ref, onMounted, toRaw } from 'vue';
import { LxButton, LxIcon } from '@wntr/lx-ui';
import { onBeforeRouteLeave, useRouter } from 'vue-router';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import { getUserSignatureOptions, selectUserSignatures } from '@/services/issuanceService';
import useViewStore from '@/stores/useViewStore';
import { APP_CONFIG } from '@/constants';
import useConfirmStore from '@/stores/useConfirmStore';

const router = useRouter();
const notification = useNotifyStore();
const t = useI18n();
const viewStore = useViewStore();
const confirmStore = useConfirmStore();

const loading = ref(false);
const selectionData = ref(null);
const selectedItems = ref([]);
const eSign = ref(false);

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

function toggleSelection(id) {
  const idx = selectedItems.value.indexOf(id);
  if (idx > -1) {
    selectedItems.value.splice(idx, 1);
  } else {
    selectedItems.value.push(id);
  }
}

async function submitSelection() {
  loading.value = true;
  try {
    const res = toRaw(selectedItems.value);
    await selectUserSignatures(res);
    if (!APP_CONFIG.embed)
      router.replace({ name: 'documentOfferManual', params: { status: 'success' } });
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  loading.value = false;
}

async function loadSelectionOptions() {
  loading.value = true;
  try {
    const response = await getUserSignatureOptions();
    selectionData.value = response.options?.eSign || response.options?.eSeal;
    if (response.options?.eSign) {
      eSign.value = true;
    }
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    router.back();
  }
  loading.value = false;
}

onMounted(async () => {
  viewStore.navBar = false;
  await loadSelectionOptions();
});
</script>

<template>
  <div class="page-wrapper">
    <div id="page" class="signature-select">
      <div class="close-button-wrapper">
        <LxButton
          icon="close"
          variant="icon-only"
          kind="ghost"
          :label="t.t('pages.dashboard.close')"
          @click="router.replace({ name: 'dashboard' })"
        />
      </div>
      <p v-if="eSign">
        {{ t.t('pages.signatureSelect.eSign') }}
      </p>
      <p v-else>{{ t.t('pages.signatureSelect.eSeal') }}</p>

      <div v-if="selectionData">
        <div class="check-list">
          <div
            v-for="item in selectionData"
            :key="item.id"
            class="check-item-wrapper"
            @click="toggleSelection(item.id)"
          >
            <div class="check-item" :class="{ selected: selectedItems.includes(item.id) }">
              <div class="check-item-content">
                <p>{{ item.name }}</p>
              </div>
              <div style="display: flex">
                <LxIcon
                  :value="selectedItems.includes(item.id) ? 'accept' : 'unselected'"
                  style="height: 1.5rem"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="button-set">
          <div class="fab">
            <LxButton
              :label="
                selectedItems.length === 0
                  ? t.t('pages.signatureSelect.submitNull')
                  : selectedItems.length === 1
                    ? t.t('pages.signatureSelect.submit', selectedItems.length)
                    : t.t('pages.signatureSelect.submitMultiple', selectedItems.length)
              "
              :loading="loading"
              :disabled="selectedItems.length === 0"
              @click="submitSelection"
            />
            <LxButton
              :label="t.t('pages.signatureSelect.cancel')"
              kind="secondary"
              :loading="loading"
              @click="router.replace({ name: 'dashboard' })"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
