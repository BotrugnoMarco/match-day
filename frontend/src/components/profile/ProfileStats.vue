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

      <!-- Form Status Row -->
      <ion-row v-if="form && form.length > 0" class="ion-margin-top">
        <ion-col size="12">
          <div class="form-box">
            <div class="form-label">{{ t("profile.form") }}</div>
            <div class="form-indicators">
              <div v-for="(result, index) in form" :key="index" class="form-dot" :class="result" :title="result">
                {{ result ? result.charAt(0).toUpperCase() : "-" }}
              </div>
            </div>
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
  form: {
    type: Array,
    default: () => [],
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
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-box {
  background: white;
  border-radius: var(--rounded-md);
  padding: var(--space-3) var(--space-4);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--ion-color-medium);
  text-transform: uppercase;
}

.form-indicators {
  display: flex;
  gap: 8px;
}

.form-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: white;
  text-transform: uppercase;
}

.form-dot.win {
  background-color: var(--ion-color-success);
}

.form-dot.loss {
  background-color: var(--ion-color-danger);
}

.form-dot.draw {
  background-color: var(--ion-color-medium);
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
