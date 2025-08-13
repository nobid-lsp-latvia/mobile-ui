<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted, shallowRef, onBeforeUnmount, watch } from 'vue';
import { LxIllustration, LxButton, LxLoader } from '@wntr/lx-ui';
import { useRouter, useRoute, onBeforeRouteUpdate, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import useViewStore from '@/stores/useViewStore';
import { downloadSignedDocument, shareSignedDocument } from '@/services/signService';
import useNotifyStore from '@/stores/useNotifyStore';

const t = useI18n();
const router = useRouter();
const route = useRoute();
const viewStore = useViewStore();
const notification = useNotifyStore();

const downloadLoading = shallowRef(false);
const shareLoading = shallowRef(false);
const disabled = shallowRef(false);

async function download() {
  downloadLoading.value = true;
  disabled.value = true;
  try {
    await downloadSignedDocument();
    if (viewStore.system !== 'ios') notification.pushSuccess(t.t('pages.sign.downloadSuccess'));
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  downloadLoading.value = false;
  disabled.value = false;
}

async function share() {
  shareLoading.value = true;
  disabled.value = true;
  try {
    await shareSignedDocument();
  } catch (e) {
    console.error(e);
    notification.pushError(t.te(`errors.${e}`) ? t.t(`errors.${e}`) : t.t('errors.unknownError'));
  }
  shareLoading.value = false;
  disabled.value = false;
}
</script>

<template>
  <div class="page-wrapper">
    <div id="page" class="sign-page">
      <div class="close-button-wrapper" v-if="route.params.step !== 'loading'">
        <LxButton
          icon="close"
          kind="ghost"
          variant="icon-only"
          :label="
            route.params.type === 'seal' ? t.t('pages.sign.closeSeal') : t.t('pages.sign.close')
          "
          :disabled="disabled"
          @click="router.replace({ name: 'dashboard' })"
        />
      </div>
      <div v-if="route.params.step === 'loading'">
        <LxLoader :loading="true" />
      </div>
      <div v-else-if="route.params.step === 'success'" class="success-screen">
        <div class="image-wrapper">
          <LxIllustration value="success" class="accept-icon" />

          <p class="lx-primary">
            {{
              route.params.type === 'seal'
                ? t.t('pages.sign.successSeal')
                : t.t('pages.sign.success')
            }}
          </p>
        </div>
        <div class="button-wrapper-multiple">
          <div>
            <LxButton
              :label="
                viewStore.system !== 'ios'
                  ? t.t('pages.sign.download')
                  : t.t('pages.sign.downloadAndShare')
              "
              :icon="viewStore.system !== 'ios' ? 'download' : 'share'"
              :busy="downloadLoading"
              :disabled="disabled"
              @click="download"
            />
          </div>
          <div v-if="viewStore.system !== 'ios'">
            <LxButton
              :label="t.t('pages.sign.share')"
              icon="share"
              :busy="shareLoading"
              :disabled="disabled"
              @click="share"
            />
          </div>
          <div>
            <LxButton
              :label="t.t('pages.sign.continue')"
              icon="cancel"
              kind="secondary"
              :disabled="disabled"
              @click="router.replace({ name: 'dashboard' })"
            />
          </div>
        </div>
      </div>
      <div v-else-if="route.params.step === 'error'" class="error-screen">
        <div class="image-wrapper">
          <LxIllustration value="error" class="error-illustration" />

          <p class="lx-primary">
            {{
              route.params.type === 'seal' ? t.t('pages.sign.errorSeal') : t.t('pages.sign.error')
            }}
          </p>
        </div>
        <div class="button-wrapper">
          <LxButton
            :label="t.t('pages.sign.continue')"
            @click="router.replace({ name: 'dashboard' })"
          />
        </div>
      </div>
    </div>
  </div>
</template>
