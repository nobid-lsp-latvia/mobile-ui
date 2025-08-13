<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted } from 'vue';
import { LxButton, LxDropDownMenu } from '@wntr/lx-ui';
import { useI18n } from 'vue-i18n';
import { deleteWallet } from '@/services/settingsService';
import useConfirmStore from '@/stores/useConfirmStore';
import useNotifyStore from '@/stores/useNotifyStore';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/stores/useUserStore';
import useViewStore from '@/stores/useViewStore';

const t = useI18n();
const confirmStore = useConfirmStore();
const notification = useNotifyStore();
const router = useRouter();
const userStore = useUserStore();
const viewStore = useViewStore();

async function removeWallet() {
  try {
    await deleteWallet();
    notification.pushSuccess(t.t('pages.settings.walletDeletedSuccess'));
    router.replace({ name: 'activation' });
  } catch (e) {
    console.error(e);
    notification.pushError(t.t('pages.settings.walletDeletedError'));
  }
}

function confirmDeactivate() {
  confirmStore.push(
    t.t('pages.settings.deleteWallet'),
    t.t('pages.settings.deleteWalletDescription'),
    t.t('pages.settings.yes'),
    t.t('pages.settings.no'),
    () => removeWallet(),
    confirmStore.confirm
  );
}

const languages = [
  {
    id: 'lv',
    name: 'Latviešu',
  },
  {
    id: 'en',
    name: 'Angļu (English)',
  },
];

function changeLanguage(language) {
  userStore.setLanguage(language);
}

onMounted(() => {
  viewStore.navBar = true;
  viewStore.header = true;
});
</script>
<template>
  <div class="page-wrapper">
    <div class="page-header-text-wrapper">
      <p>{{ t.t('pages.settings.title') }}</p>
    </div>
    <div id="page" class="settings">
      <div class="button-set">
        <LxDropDownMenu>
          <LxButton
            customClass="lx-header-button"
            :label="t.t('shell.languages')"
            kind="secondary"
            icon="language"
          />

          <template #panel>
            <LxButton
              v-for="item in languages"
              kind="ghost"
              :key="item?.languages"
              :active="userStore.language.id === item.id"
              :label="item?.name"
              @click="changeLanguage(item?.id)"
            />
          </template>
        </LxDropDownMenu>
        <LxButton
          :label="t.t('pages.settings.deleteWallet')"
          icon="delete"
          kind="secondary"
          :destructive="true"
          @click="confirmDeactivate"
        />
      </div>
    </div>
  </div>
</template>
