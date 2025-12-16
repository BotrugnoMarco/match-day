<template>
  <div class="section-container ion-padding-horizontal" v-if="tags && tags.length > 0">
    <div class="section-title">
      <ion-icon :icon="ribbon" color="secondary"></ion-icon>
      <h3>{{ t("profile.badges") }}</h3>
    </div>
    <div class="badges-container">
      <div v-for="tagItem in tags" :key="tagItem.tag" class="badge-chip">
        <span class="badge-name">{{ t("vote.tags." + tagItem.tag) }}</span>
        <span class="badge-count">x{{ tagItem.count }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { IonIcon } from "@ionic/vue";
import { ribbon } from "ionicons/icons";

defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();
</script>

<style scoped>
.section-container {
  margin-bottom: var(--space-5);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-left: var(--space-1);
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.badge-chip {
  background: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--rounded-lg);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
  border: 1px solid #f0f2f5;
}

.badge-name {
  font-weight: 600;
  color: var(--ion-color-dark);
  font-size: 0.9rem;
}

.badge-count {
  background: var(--ion-color-secondary);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px var(--space-2);
  border-radius: 10px;
}
</style>
