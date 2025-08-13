<!-- SPDX-License-Identifier: EUPL-1.2 -->

<script setup>
import Card from '@/components/Card.vue';
import { defineProps } from 'vue';

defineProps({
  value: { type: Object, default: () => ({}) },
  collapsed: { type: Boolean, default: false },
});
</script>
<template>
  <div class="card-display">
    <div class="card-cover">
      <Card :value="value" :collapsed="collapsed" />
    </div>
  </div>
</template>
