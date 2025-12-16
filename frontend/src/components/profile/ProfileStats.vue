<template>
  <div class="stats-container ion-padding-horizontal">
    <ion-grid v-if="stats">
      <ion-row>
        <ion-col size="4">
          <div class="stat-box">
            <div class="stat-value">{{ stats.matchesPlayed }}</div>
            <div class="stat-label">{{ t("profile.matches") }}</div>
          </div>
        </ion-col>
        <ion-col size="4">
          <div class="stat-box">
            <div class="stat-value text-primary">{{ stats.matchesWon }}</div>
            <div class="stat-label">{{ t("profile.won") }}</div>
          </div>
        </ion-col>
        <ion-col size="4">
          <div class="stat-box">
            <div class="stat-value text-warning">{{ stats.mvpCount }}</div>
            <div class="stat-label">{{ t("profile.mvp") }}</div>
          </div>
        </ion-col>
      </ion-row>
    </ion-grid>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { IonGrid, IonRow, IonCol } from "@ionic/vue";

defineProps({
  stats: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();
</script>

<style scoped>
.stats-container {
  margin-top: -20px;
  margin-bottom: var(--space-5);
}

.stat-box {
  background: white;
  border-radius: var(--rounded-md);
  padding: var(--space-4) var(--space-1);
  text-align: center;
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: var(--space-1);
}

.text-primary {
  color: var(--ion-color-primary);
}
.text-warning {
  color: var(--ion-color-warning);
}
</style>
