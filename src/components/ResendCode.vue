<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { useI18n } from 'vue-i18n';
import { LxIcon, LxLoader } from '@wntr/lx-ui';

const t = useI18n();

const props = defineProps({
  timeLeft: { type: Number, default: 0 },
  formattedTime: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emits = defineEmits(['click']);

function buttonClick() {
  emits('click');
}
</script>

<template>
  <div class="onboarding-button-wrapper">
    <p>{{ t.t('pages.onboarding.phoneValidation.didntReceive') }}</p>
    <div
      class="lx-button lx-button-secondary"
      :class="[{ 'lx-disabled': timeLeft > 0 || disabled }, { 'lx-disabled lx-busy': loading }]"
      v-if="timeLeft > 0"
    >
      <div class="lx-button-content-wrapper">
        <div class="lx-loader-container" v-if="loading">
          <LxLoader :loading="true" size="s" />
        </div>
        <div class="custom-button-icon-wrapper" v-else-if="!loading && timeLeft > 0">
          <LxIcon value="timer" />
          <p>{{ formattedTime }}</p>
        </div>
        <div class="custom-button-icon-wrapper" v-else>
          <LxIcon value="refresh" />
        </div>

        <div class="lx-button-content">
          <div class="lx-button-label">
            {{ t.t('pages.onboarding.phoneValidation.sendAgain') }}
          </div>
        </div>
      </div>
    </div>

    <button
      class="lx-button lx-button-secondary"
      :class="[{ 'lx-disabled': timeLeft > 0 || disabled }, { 'lx-disabled lx-busy': loading }]"
      :disabled="timeLeft > 0 || loading || disabled"
      v-else
      @click="buttonClick"
    >
      <div class="lx-button-content-wrapper">
        <div class="lx-loader-container" v-if="loading">
          <LxLoader :loading="true" size="s" />
        </div>
        <div class="custom-button-icon-wrapper" v-else-if="!loading && timeLeft > 0">
          <LxIcon value="timer" />
          <p>{{ formattedTime }}</p>
        </div>
        <div class="custom-button-icon-wrapper" v-else>
          <LxIcon value="refresh" />
        </div>

        <div class="lx-button-content">
          <div class="lx-button-label">
            {{ t.t('pages.onboarding.phoneValidation.sendAgain') }}
          </div>
        </div>
      </div>
    </button>
  </div>
</template>
