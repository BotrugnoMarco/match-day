<template>
  <div class="stats-container ion-padding-horizontal">
    <!-- Global Stats Row (Compact) -->
    <div class="global-stats-row" v-if="stats">
      <div class="mini-stat-card">
        <div class="mini-stat-value">{{ stats.matchesPlayed }}</div>
        <div class="mini-stat-label">{{ t("profile.matches") }}</div>
      </div>

      <div class="mini-stat-card">
        <div class="mini-stat-value">{{ winRate }}%</div>
        <div class="mini-stat-label">{{ t("profile.win_rate") }}</div>
      </div>

      <div class="mini-stat-card">
        <div class="mini-stat-value text-warning">{{ stats.mvpCount }}</div>
        <div class="mini-stat-label">{{ t("profile.mvp") }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();

const winRate = computed(() => {
  if (!props.stats || !props.stats.matchesPlayed) return 0;
  return Math.round((props.stats.matchesWon / props.stats.matchesPlayed) * 100);
});
</script>

<style scoped>
.stats-container {
  margin-top: -10px;
  margin-bottom: var(--space-4);
}

.global-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.mini-stat-card {
  background: var(--ion-item-background);
  border-radius: var(--rounded-md);
  padding: var(--space-2);
  text-align: center;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.mini-stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--ion-text-color);
  line-height: 1.2;
}

.mini-stat-label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  margin-top: 2px;
}

.text-warning {
  color: var(--ion-color-warning);
}

.sports-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sport-item {
  display: flex;
  align-items: center;
  background: var(--ion-item-background);
  padding: var(--space-3);
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-sm);
}

.sport-icon-wrapper {
  width: 36px;
  height: 36px;
  background: var(--ion-color-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-3);
}

.sport-icon {
  font-size: 1.2rem;
  color: var(--ion-color-dark);
}

.sport-details {
  flex: 1;
}

.sport-name {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 2px;
}

.sport-stats-line {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.dot {
  margin: 0 6px;
  font-size: 0.6rem;
  opacity: 0.7;
}
</style>
