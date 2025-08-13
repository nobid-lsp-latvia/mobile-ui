<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, ref, computed } from 'vue';
import {
  getRequestDocuments,
  confirmRequest,
  presentationCanceled,
} from '@/services/presentationService';
import {
  LxButton,
  LxDataBlock,
  LxIcon,
  LxForm,
  LxRow,
  LxLoader,
  LxIllustration,
} from '@wntr/lx-ui';
import CardDisplay from '@/components/CardDisplay.vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import useConfirmStore from '@/stores/useConfirmStore';
import useNotifyStore from '@/stores/useNotifyStore';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import PaymentView from '@/views/Payment.vue';

const t = useI18n();
const router = useRouter();
const confirmStore = useConfirmStore();
const notification = useNotifyStore();
const viewStore = useViewStore();

const approved = ref(false);
const document = ref();
const items = ref([]);

const allowNavigation = ref(false);

const rejected = ref(false);

function exit() {
  router.replace({ name: 'dashboard' });
}

function reject() {
  rejected.value = true;
  router.replace({ name: 'dashboard' });
}

function approve() {
  approved.value = true;
}

async function updatedChecked(index, item) {
  try {
    const doc = items.value?.[index]?.fields?.find((x) => x.id === item.id);
    doc.checked = !doc.checked;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
}

const loading = ref(false);
const error = ref(false);
const success = ref(false);
const url = ref();

const requiredFields = computed(() =>
  document.value?.documents?.[0]?.fields?.filter((x) => x.isRequired)
);

const notSelectedRequiredFields = computed(() => requiredFields.value?.filter((x) => !x?.checked));

const optionalFields = computed(() =>
  document.value?.documents?.[0]?.fields?.filter((x) => !x.isRequired)
);

async function confirm() {
  if (notSelectedRequiredFields.value?.length > 0) {
    notification.pushError(t.t('pages.documentPresentation.requiredFieldsError'));

    const elem = window.document.getElementById(notSelectedRequiredFields.value[0].id);
    const elemWithPadding = elem.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: elemWithPadding, behavior: 'smooth' });

    return;
  }
  try {
    const fieldValues = { fields: {} };
    items.value?.[0]?.fields.forEach((x) => {
      fieldValues.fields[x.id] = x?.checked;
    });
    loading.value = true;
    const res = await confirmRequest(fieldValues);

    success.value = true;
    url.value = res?.redirectUrl;
    notification.pushSuccess(t.t('pages.documentPresentation.documentSent'));
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    error.value = true;
  }
  loading.value = false;
}

function endPresentation() {
  allowNavigation.value = true;
  if (url.value) router.replace(url.value);
  else router.replace({ name: 'dashboard' });
}

async function cancelPresentation(next) {
  next();
  presentationCanceled();
}

function getRejectText(value) {
  return value
    ? t.t('pages.documentPresentation.rejectDescription')
    : t.t('pages.documentPresentation.cancelingDescription');
}

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard' && !allowNavigation.value && !success.value && !error.value) {
    confirmStore.push(
      t.t('pages.documentPresentation.canceling'),
      document.value?.transactionData ? t.t('pages.payment.cancel') : getRejectText(rejected.value),
      t.t('pages.documentPresentation.yes'),
      t.t('pages.documentPresentation.no'),
      () => cancelPresentation(next),
      () => {
        confirmStore.confirm();
        next(false);
      }
    );
  } else {
    next();
  }
  rejected.value = false;
  allowNavigation.value = false;
});

const showValues = ref(false);

function formatValues(item) {
  if (item?.elementIdentifier === 'portrait')
    return t.t('pages.documentPresentation.fields.portrait');
  return item?.value;
}

const payment = ref(false);

onMounted(async () => {
  viewStore.navBar = false;
  try {
    loading.value = true;
    const res = await getRequestDocuments();
    if (res?.transactionData) payment.value = true;
    document.value = res;
    if (res?.documents?.length > 0 && res?.documents?.[0]?.meta?.displayNumber) {
      document.value.documents[0].meta.docNumber = res.documents[0].meta.displayNumber;
    }
    if (res?.documents?.length === 0) error.value = true;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    error.value = true;
  }
  items.value = document.value?.documents;
  loading.value = false;
});
</script>

<template>
  <div class="page-wrapper">
    <PaymentView :data="document" v-if="payment" />
    <div id="page" class="presentation" v-else>
      <LxLoader v-if="loading" :loading="loading" />
      <template v-else>
        <div class="close-button-wrapper">
          <LxButton
            icon="close"
            variant="icon-only"
            kind="ghost"
            :label="t.t('pages.dashboard.close')"
            @click="exit"
          />
        </div>

        <div v-if="!success && !error" class="layout" :class="{ approved: approved }">
          <div v-if="!approved">
            <p class="request-text">
              "{{ document?.verifierName }}"
              {{ t.t('pages.documentPresentation.requestText') }}
            </p>
          </div>
          <LxForm :show-footer="false" :show-header="false" :column-count="2" kind="compact">
            <LxRow :label="t.t('pages.documentPresentation.requester')" :column-span="2">
              <LxDataBlock
                :name="document?.verifierName"
                :force-uppercase="false"
                size="l"
                :icon="document?.verifierIsTrusted ? 'verified' : 'unverified'"
              />
            </LxRow>
            <LxRow :column-span="2" v-if="approved">
              <LxIcon class="indicator-icon" value="move-up" />
            </LxRow>
            <LxRow :label="t.t('pages.documentPresentation.documents')" :column-span="2">
              <CardDisplay :value="document?.documents?.[0]?.meta" :collapsed="approved" />
            </LxRow>
          </LxForm>

          <div v-if="approved">
            <p class="choose-data-text">
              {{ t.t('pages.documentPresentation.chooseData') }}
            </p>
          </div>

          <div v-if="!approved" class="lx-button-set">
            <LxButton :label="t.t('pages.documentPresentation.approve')" @click="approve" />
            <LxButton
              :label="t.t('pages.documentPresentation.reject')"
              kind="secondary"
              :destructive="true"
              @click="reject"
            />
          </div>

          <div v-else>
            <!-- TODO: add alert that some required fields are not selected -->

            <!-- <div class="not-selected-alert" v-if="notSelectedRequiredFields > 0">
            <LxIcon value="notification-error" />
            {{ notSelectedRequiredFields }}
          </div> -->
            <div class="show-values">
              <p class="lx-secondary">
                {{
                  t.t('pages.documentPresentation.dataAccess', {
                    verifierName: document?.verifierName,
                  })
                }}
              </p>
              <LxButton
                kind="ghost"
                :icon="showValues ? 'hidden' : 'visible'"
                variant="icon-only"
                :label="
                  showValues
                    ? t.t('pages.documentPresentation.hideValues')
                    : t.t('pages.documentPresentation.showValues')
                "
                @click="showValues = !showValues"
              />
            </div>
            <p v-if="requiredFields?.length > 0" class="list-heading">
              {{ t.t('pages.documentPresentation.requiredFields') }}
            </p>
            <div class="check-list">
              <!-- TODO: this should be about this one document, not all of them -->
              <div
                class="check-item-wrapper"
                :id="item.id"
                v-for="item in requiredFields"
                :key="item.id"
                @click="updatedChecked(0, item)"
              >
                <div
                  class="check-item"
                  :class="[{ selected: item?.checked }, { 'not-selected': !item?.checked }]"
                >
                  <div class="check-item-content">
                    <p :class="[{ 'lx-secondary': showValues }]">{{ item?.readableName }}</p>
                    <p v-if="showValues">{{ formatValues(item) }}</p>
                  </div>

                  <div>
                    <LxIcon :value="item?.checked ? 'accept' : 'invalid'" style="height: 1.5rem" />
                  </div>
                </div>
              </div>
            </div>

            <p v-if="optionalFields?.length > 0" class="list-heading">
              {{ t.t('pages.documentPresentation.optionalFields') }}
            </p>
            <div class="check-list">
              <!-- TODO: this should be about this one document, not all of them -->
              <div
                class="check-item-wrapper"
                v-for="item in optionalFields"
                :key="item.id"
                @click="updatedChecked(0, item)"
              >
                <div class="check-item" :class="[{ selected: item?.checked }]">
                  <div class="check-item-content">
                    <p :class="[{ 'lx-secondary': showValues }]">{{ item?.readableName }}</p>
                    <p v-if="showValues">{{ formatValues(item) }}</p>
                  </div>

                  <div>
                    <LxIcon
                      :value="item?.checked ? 'accept' : 'unselected'"
                      style="height: 1.5rem"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div class="lx-button-set">
              <div class="fab">
                <LxButton
                  :label="t.t('pages.documentPresentation.sendSelected')"
                  @click="confirm"
                />
                <LxButton
                  :label="t.t('pages.documentPresentation.cancel')"
                  kind="secondary"
                  @click="exit"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="success" class="success-screen">
          <LxIllustration value="success" class="accept-icon" />

          <p class="lx-primary">{{ t.t('pages.documentPresentation.documentSent') }}</p>
          <div class="button-wrapper">
            <LxButton
              :label="t.t('pages.documentPresentation.continue')"
              @click="endPresentation"
            />
          </div>
        </div>
        <div v-else-if="error" class="error-screen">
          <LxIllustration value="error" class="error-illustration" />

          <p class="lx-primary">{{ t.t('pages.documentPresentation.documentSentError') }}</p>
          <div class="button-wrapper">
            <LxButton
              :label="t.t('pages.documentPresentation.continue')"
              @click="endPresentation"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
