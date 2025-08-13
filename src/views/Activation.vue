<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { onMounted } from 'vue';
import useViewStore from '@/stores/useViewStore';
import { LxButton, LxDropDownMenu } from '@wntr/lx-ui';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/stores/useUserStore';

const t = useI18n();
const viewStore = useViewStore();
const router = useRouter();
const userStore = useUserStore();

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

onMounted(async () => {
  viewStore.navBar = false;
});
</script>
<template>
  <div class="page-wrapper activation-page">
    <LxDropDownMenu>
      <LxButton
        customClass="lx-header-button"
        variant="icon-only"
        :label="t.t('shell.languages')"
        kind="ghost"
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
    <div id="page" class="activation">
      <div class="onboarding-greeting first">
        <div class="image-wrapper">
          <img src="@/assets/wallet_logo.png" />
        </div>
        <p class="highlight-text">{{ t.t('pages.activation.hi') }}</p>
        <p>{{ t.t('pages.activation.description') }}</p>

        <LxButton
          :label="t.t('pages.activation.activate')"
          icon="next"
          @click="() => router.replace({ name: 'dashboard' })"
        />
      </div>
    </div>
  </div>
</template>
