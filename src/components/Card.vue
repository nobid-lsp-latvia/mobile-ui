<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import { defineProps, computed } from 'vue';
import { getDocType, getDocTypeIcon, getIssuerLogo } from '@/utils/dataUtils';
import { lxDateUtils, LxIcon } from '@wntr/lx-ui';
import { useI18n } from 'vue-i18n';

const t = useI18n();

const props = defineProps({
  value: { type: Object, default: () => ({}) },
  collapsed: { type: Boolean, default: false },
});
const docColor = computed(() =>
  props.value.hasExpired ? 'expired' : props.value.type ? getDocType(props.value.type) : null
);

const docType = computed(() => (props.value.type ? getDocType(props.value.type) : null));
const docIcon = computed(() => getDocTypeIcon(getDocType(props.value.type)));

const docIssuerLogo = computed(() => {
  const issuerKey = getIssuerLogo(props.value.issuingAuthority);
  if (issuerKey && props.value.issuingAuthority) {
    return `./issuer-${issuerKey}.png`;
  }
  return null;
});

function stringToArray(str) {
  return str?.split(',')?.map((item) => item?.trim());
}

const docNumber = computed(() => {
  const { docNumber } = props.value;
  return docNumber || '—';
});

const description = computed(() => {
  const { description } = props.value;
  if (description === 'LV') return t.t('cards.countries.LV');
  return description || '—';
});

const additionalInfo = computed(() => {
  const { additionalInfo } = props.value;
  if (docType.value === 'mdl') {
    const res = stringToArray(additionalInfo);
    if (Array.isArray(res) && res.length > 1) {
      return res;
    }
  }

  return additionalInfo;
});

function formatDateValue(date) {
  try {
    return lxDateUtils.formatDate(date);
  } catch (e) {}

  return date;
}

const dates = computed(() => {
  const { issuanceDate, expirationDate } = props.value;
  return issuanceDate || expirationDate
    ? `${formatDateValue(issuanceDate)} ${expirationDate ? '-' : ''} ${formatDateValue(expirationDate)}`
    : '—';
});
</script>
<template>
  <div class="card-wrapper" :class="{ collapsed: collapsed }">
    <div
      class="card"
      :id="`card-${value.id}`"
      :style="`--card-color: var(--card-${docColor}-color)`"
    >
      <div class="card-header">
        <div class="card-title">
          {{ $t(`cards.names.${docType?.toLowerCase()}`) }}
        </div>
        <div class="card-icon"><LxIcon :value="docIcon.icon" :icon-set="docIcon.iconSet" /></div>
      </div>
      <div class="card-content">
        <p class="lx-primary">{{ description }}</p>
        <div v-if="Array.isArray(additionalInfo)" class="array-wrapper">
          <div class="array-item" v-for="val in additionalInfo" v-bind:key="val">
            {{ val }}
          </div>
        </div>
        <p class="lx-secondary" v-else>{{ additionalInfo }}</p>
      </div>
      <div class="card-footer">
        <div>
          <p>{{ docNumber }}</p>
          <p>{{ dates }}</p>
        </div>
        <div
          class="issuer-logo"
          v-if="docIssuerLogo"
          :aria-label="value.issuingAuthority"
          :style="`--issuer-pic: url('${docIssuerLogo}')`"
        />
        <div class="issuer-name" v-else>{{ value.issuingAuthority }}</div>
      </div>
    </div>
    <div class="fake-card" />
  </div>
</template>
