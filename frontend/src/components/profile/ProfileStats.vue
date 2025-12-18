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

    <!-- Form Row (Compact) -->
    <div v-if="form && form.length > 0" class="form-row ion-margin-top">
      <div class="form-label">{{ t("profile.form") }}:</div>
      <div class="form-dots">
        <div v-for="(result, index) in form" :key="index" class="form-dot-small" :class="result">
          {{ result ? result.charAt(0).toUpperCase() : "-" }}
        </div>
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
  form: {
    type: Array,
    default: () => [],
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

.form-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  background: var(--ion-item-background);
  padding: var(--space-2);
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-sm);
}

.form-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ion-color-medium);
}

.form-dots {
  display: flex;
  gap: 4px;
}

.form-dot-small {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: bold;
  color: white;
}

.form-dot-small.win {
  background-color: var(--ion-color-success);
}
.form-dot-small.draw {
  background-color: var(--ion-color-warning);
}
.form-dot-small.lost {
  background-color: var(--ion-color-danger);
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
