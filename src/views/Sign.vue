<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { computed, onMounted, ref } from 'vue';
import { LxButton, LxIcon, LxList, lxFileUploaderUtils, LxLoader, lxDateUtils } from '@wntr/lx-ui';
import { useRouter, onBeforeRouteLeave, useRoute } from 'vue-router';
import useViewStore from '@/stores/useViewStore';
import useConfirmStore from '@/stores/useConfirmStore';
import { useI18n } from 'vue-i18n';
import {
  pickFiles,
  getSigningMethods,
  signDocument,
  getSharedFile,
  openFile,
} from '@/services/signService';
import { APP_CONFIG } from '@/constants';
import CardDisplay from '@/components/CardDisplay.vue';
import useNotifyStore from '@/stores/useNotifyStore';

const t = useI18n();
const router = useRouter();
const viewStore = useViewStore();
const confirmStore = useConfirmStore();
const route = useRoute();
const notification = useNotifyStore();

const uploadedFiles = ref();
const details = ref(false);
const step = ref(1);
const signatureDocuments = ref();

const addFileLoading = ref(false);
const addSigLoading = ref(false);
const signDocumentLoading = ref(false);
const sharedFileLoading = ref(false);

onBeforeRouteLeave((to, _, next) => {
  if (to.name === 'dashboard' && step.value !== 5) {
    confirmStore.push(
      t.t('pages.sign.exit'),
      route.params.type === 'seal' ? t.t('pages.sign.cancelSeal') : t.t('pages.sign.cancel'),
      t.t('pages.sign.yes'),
      t.t('pages.sign.no'),
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

function goBack(value) {
  step.value = value - 1;
  if (value === 2) {
    uploadedFiles.value = [];
  }

  step.value = value - 1;
}

async function getAvailableSignatures() {
  try {
    const res = await getSigningMethods();
    signatureDocuments.value = res?.methods;
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
}

async function addSignature() {
  addSigLoading.value = true;
  if (route.params.id) {
    try {
      await signDocument(uploadedFiles.value?.files?.[0]?.path, route.params.id);
      if (!APP_CONFIG.embed) router.replace({ name: 'signDone', params: { step: 'success' } });
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
      if (!APP_CONFIG.embed) router.replace({ name: 'signDone', params: { step: 'error' } });
    }
  } else {
    try {
      await getAvailableSignatures();
      step.value = 3;
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
  }
  addSigLoading.value = false;
}

async function sendCode() {
  signDocumentLoading.value = true;
  try {
    await signDocument(uploadedFiles.value?.files?.[0]?.path, 'eparaksts');
    if (!APP_CONFIG.embed) router.replace({ name: 'signDone', params: { step: 'success' } });
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    if (!APP_CONFIG.embed) router.replace({ name: 'signDone', params: { step: 'error' } });
  }
  signDocumentLoading.value = false;
}

function chooseMethod(action, item) {
  if (action === 'click' && item === 'mobile') {
    sendCode();
  }
}

const preparedDocuments = computed(() => {
  if (signatureDocuments.value) {
    const res = signatureDocuments.value.map((doc) => ({
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
    return res;
  }
  return [];
});

async function listActionClick(action, item) {
  signDocumentLoading.value = true;
  try {
    await signDocument(uploadedFiles.value?.files?.[0]?.path, item);
    if (!APP_CONFIG.embed) router.replace({ name: 'signDone', params: { step: 'success' } });
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  signDocumentLoading.value = false;
}

async function archiveListClick(_, item) {
  try {
    viewStore.blockNavigation();
    await openFile(uploadedFiles.value?.files?.[0]?.path, item);
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  viewStore.unblockNavigation();
}

async function openFileInfo() {
  if (uploadedFiles.value?.files?.[0]?.containerInfo?.files?.length > 1 && !addSigLoading.value)
    details.value = !details.value;
  else if (
    uploadedFiles.value?.files?.[0]?.containerInfo?.files?.length === 1 ||
    uploadedFiles.value?.files?.[0]?.containerInfo?.files?.length === 0 ||
    !uploadedFiles.value?.files?.[0]?.containerInfo
  ) {
    try {
      viewStore.blockNavigation();
      await openFile(
        uploadedFiles.value?.files?.[0]?.path,
        uploadedFiles.value?.files?.[0]?.containerInfo?.files?.[0]?.name
      );
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
    viewStore.unblockNavigation();
  }
}

async function addFile() {
  try {
    addFileLoading.value = true;
    const res = await pickFiles();
    if (res && res?.files?.length > 0 && res?.files?.[0]?.isValid) {
      uploadedFiles.value = res;
      step.value = 2;
    } else if (res?.files?.[0]?.isValid === false) {
      notification.pushError(t.t('pages.sign.invalidFile'));
    } else {
      notification.pushError(t.t('pages.sign.pickFileError'));
    }
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  addFileLoading.value = false;
}

onMounted(async () => {
  viewStore.navBar = false;
  // Skip choosing file if file path is provided - used when opened from share sheet
  if (route.params.filePath !== 'null') {
    sharedFileLoading.value = true;
    try {
      const res = await getSharedFile(route.params.filePath);
      if (res && res?.files?.length > 0 && res?.files?.[0]?.isValid) {
        uploadedFiles.value = res;
        step.value = 2;
      } else if (res?.files?.[0]?.isValid === false) {
        notification.pushError(t.t('pages.sign.invalidFile'));
      } else {
        notification.pushError(t.t('pages.sign.pickFileError'));
      }
    } catch (e) {
      console.error(e);
      notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
    }
    sharedFileLoading.value = false;
  }
});
</script>

<template>
  <div class="page-wrapper">
    <div id="page" class="sign-page">
      <div class="close-button-wrapper">
        <LxButton
          v-if="step === 1"
          icon="close"
          kind="ghost"
          :disabled="addFileLoading || addSigLoading || signDocumentLoading"
          variant="icon-only"
          :label="
            route.params.type === 'seal' ? t.t('pages.sign.closeSeal') : t.t('pages.sign.close')
          "
          @click="router.replace({ name: 'dashboard' })"
        />
        <LxButton
          v-else
          icon="back"
          kind="ghost"
          variant="icon-only"
          :label="t.t('pages.sign.cancelSelection')"
          :disabled="addFileLoading || addSigLoading || signDocumentLoading"
          @click="goBack(step)"
        />
      </div>
      <div v-if="sharedFileLoading">
        <LxLoader :loading="true" />
      </div>
      <div v-else-if="step === 1">
        <div class="choose-file-texts">
          <p>
            {{
              route.params.type === 'seal'
                ? t.t('pages.sign.descriptionFirstSeal')
                : t.t('pages.sign.descriptionFirst')
            }}
          </p>
          <p>{{ t.t('pages.sign.descriptionSecond') }}</p>
          <p>{{ t.t('pages.sign.descriptionThird') }}</p>
        </div>

        <LxButton
          :label="t.t('pages.sign.addFile')"
          icon="add-item"
          customClass="action-button"
          :busy="addFileLoading"
          @click="addFile"
        />
      </div>
      <div v-else-if="step === 2 && !details">
        <div class="file-details" tabindex="0" @click="openFileInfo" @keydown.space="openFileInfo">
          <div class="file-details-info">
            <LxIcon
              :value="lxFileUploaderUtils.provideDefaultIcon(uploadedFiles?.files?.[0]?.name)"
            />
            <div>
              <p class="lx-primary">{{ uploadedFiles?.files?.[0]?.name }}</p>
              <p v-if="uploadedFiles?.files?.[0]?.containerInfo?.files?.length === 1">
                {{ uploadedFiles?.files?.[0]?.containerInfo?.files[0]?.name }}
              </p>
              <p
                class="lx-secondary"
                v-else-if="uploadedFiles?.files?.[0]?.containerInfo?.files?.length > 1"
              >
                {{ uploadedFiles?.files?.[0]?.containerInfo?.files?.length }}
                {{ t.t('pages.sign.files') }}
              </p>
            </div>
            <LxIcon
              value="expand-right"
              v-if="uploadedFiles?.files?.[0]?.containerInfo?.files?.length > 1"
            />
          </div>
        </div>

        <template
          v-if="
            uploadedFiles?.files?.[0]?.containerInfo?.signers &&
            uploadedFiles?.files?.[0]?.containerInfo?.signers?.length > 0
          "
        >
          <p class="sign-secondary-label">{{ t.t('pages.sign.signatures') }}</p>
          <div class="signatures-list">
            <LxList
              :items="uploadedFiles?.files?.[0]?.containerInfo?.signers"
              list-type="1"
              id-attribute="name"
            >
              <template #customItem="item">
                <div class="signature-detail-item">
                  <LxIcon :value="item?.type === 'eSeal' ? 'seal' : 'sign'" />
                  <div>
                    <p class="lx-primary">{{ item?.name }}</p>
                    <p class="lx-secondary">{{ lxDateUtils.formatDateTime(item?.signedAt) }}</p>
                  </div>
                </div>
              </template>
            </LxList>
          </div>
        </template>

        <LxButton
          :label="
            route.params.type === 'seal'
              ? t.t('pages.sign.addSeal')
              : t.t('pages.sign.addSignature')
          "
          icon="sign"
          customClass="action-button"
          :busy="addSigLoading"
          @click="addSignature()"
        />
      </div>
      <div v-else-if="step === 2 && details">
        <div
          class="file-details details-active"
          tabindex="0"
          @click="details = !details"
          @keydown.space="details = !details"
        >
          <div class="file-details-info">
            <LxIcon value="collapse-left" />
            <p class="lx-primary">{{ uploadedFiles?.files?.[0]?.name }}</p>
          </div>
        </div>

        <LxList
          :items="uploadedFiles?.files?.[0]?.containerInfo?.files"
          list-type="1"
          id-attribute="name"
          clickable-attribute="name"
          class="file-archive-list"
          @action-click="archiveListClick"
        >
          <template #customItem="item">
            <div class="file-archive-files">
              <LxIcon :value="lxFileUploaderUtils.provideDefaultIcon(item.name)" icon-set="cds" />
              <div class="file-archive-files-info">
                <p class="lx-primary">{{ item?.name }}</p>
              </div>
            </div>
          </template>
        </LxList>
      </div>
      <div v-else-if="step === 3">
        <div v-if="!signDocumentLoading">
          <p class="sign-primary-label">{{ t.t('pages.sign.chooseMethod') }}</p>
          <LxList
            :items="[{ id: 'mobile', name: 'eParaksts mobile', icon: 'open', clickable: true }]"
            list-type="1"
            @action-click="chooseMethod"
          >
            <template #customItem="item">
              <div class="signature-method-item">
                <LxIcon value="eparaksts-mobile" icon-set="brand" />
                <p>{{ item.name }}</p>
              </div>
            </template>
          </LxList>
          <p class="sign-primary-label" v-show="preparedDocuments.length > 0">
            {{ t.t('pages.sign.otherMethods') }}
          </p>
          <LxList
            v-show="preparedDocuments.length > 0"
            id="card-list"
            :items="preparedDocuments"
            clickable-attribute="id"
            @action-click="listActionClick"
            list-type="1"
            :texts="{ noItems: t.t('pages.documentAdd.documentList.noItems') }"
          >
            <template #customItem="{ preparedItem }">
              <CardDisplay :value="preparedItem" :collapsed="true" />
            </template>
          </LxList>
        </div>
        <LxLoader :loading="true" v-else />
      </div>
    </div>
  </div>
</template>
