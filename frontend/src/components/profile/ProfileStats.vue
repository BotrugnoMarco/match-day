<template>
  <div class="stats-container ion-padding-horizontal">
    <!-- Sport Selector -->
    <div class="sport-selector" v-if="stats && stats.statsBySport">
      <ion-segment v-model="selectedSport" scrollable>
        <ion-segment-button value="all">
          <ion-label>{{ t("matches.all") }}</ion-label>
        </ion-segment-button>
        <ion-segment-button v-for="(data, sport) in activeSports" :key="sport" :value="sport">
          <ion-label>{{ t("sports." + sport) }}</ion-label>
        </ion-segment-button>
      </ion-segment>
    </div>

    <ion-grid v-if="currentStats">
      <ion-row>
        <ion-col size="4">
          <div class="stat-box">
            <div class="stat-value">{{ currentStats.matchesPlayed }}</div>
            <div class="stat-label">{{ t("profile.matches") }}</div>
          </div>
        </ion-col>
        <ion-col size="4">
          <div class="stat-box win-rate-box">
            <div class="circular-chart">
              <svg viewBox="0 0 36 36" class="circle-svg">
                <path
                  class="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  class="circle-progress"
                  :stroke-dasharray="winRate + ', 100'"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div class="percentage-text">
                <span class="value">{{ winRate }}%</span>
                <span class="label">{{ t("profile.win_rate") }}</span>
              </div>
            </div>
          </div>
        </ion-col>
        <ion-col size="4">
          <div class="stat-box">
            <div class="stat-value text-warning">{{ currentStats.mvpCount }}</div>
            <div class="stat-label">{{ t("profile.mvp") }}</div>
          </div>
        </ion-col>
      </ion-row>

      <!-- Soccer Stats Row -->
      <ion-row v-if="currentStats.goals > 0 || currentStats.assists > 0" class="ion-margin-top">
        <ion-col size="6">
          <div class="stat-box">
            <div class="stat-value">{{ currentStats.goals }}</div>
            <div class="stat-label">{{ t("profile.goals") }}</div>
          </div>
        </ion-col>
        <ion-col size="6">
          <div class="stat-box">
            <div class="stat-value">{{ currentStats.assists }}</div>
            <div class="stat-label">{{ t("profile.assists") }}</div>
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
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { IonGrid, IonRow, IonCol, IonSegment, IonSegmentButton, IonLabel } from "@ionic/vue";

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
const selectedSport = ref("all");

const activeSports = computed(() => {
  if (!props.stats || !props.stats.statsBySport) return {};
  const active = {};
  for (const [sport, data] of Object.entries(props.stats.statsBySport)) {
    if (data.matchesPlayed > 0) {
      active[sport] = data;
    }
  }
  return active;
});

const currentStats = computed(() => {
  if (!props.stats) return null;
  if (selectedSport.value === "all") {
    return {
      matchesPlayed: props.stats.matchesPlayed,
      matchesWon: props.stats.matchesWon,
      mvpCount: props.stats.mvpCount,
      goals: props.stats.totalGoals,
      assists: props.stats.totalAssists,
    };
  } else {
    return props.stats.statsBySport[selectedSport.value];
  }
});

const winRate = computed(() => {
  if (!currentStats.value || !currentStats.value.matchesPlayed) return 0;
  return Math.round((currentStats.value.matchesWon / currentStats.value.matchesPlayed) * 100);
});
</script>

<style scoped>
.stats-container {
  margin-top: -20px;
  margin-bottom: var(--space-5);
}

.sport-selector {
  margin-bottom: var(--space-4);
  margin-top: var(--space-2);
}

.stat-box {
  background: var(--ion-card-background);
  border-radius: var(--rounded-md);
  padding: var(--space-4) var(--space-1);
  text-align: center;
  box-shadow: var(--shadow-md);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.win-rate-box {
  padding: var(--space-2);
}

.circular-chart {
  position: relative;
  width: 100%;
  max-width: 80px;
  aspect-ratio: 1;
}

.circle-svg {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  max-height: 100%;
}

.circle-bg {
  fill: none;
  stroke: var(--ion-color-light);
  stroke-width: 3.8;
}

.circle-progress {
  fill: none;
  stroke: var(--ion-color-primary);
  stroke-width: 3.8;
  stroke-linecap: round;
  animation: progress 1s ease-out forwards;
}

.percentage-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.percentage-text .value {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  line-height: 1;
}

.percentage-text .label {
  font-size: 0.5rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  margin-top: 2px;
}

@keyframes progress {
  0% {
    stroke-dasharray: 0 100;
  }
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--ion-color-dark);
  line-height: 1.2;
}

.stat-label {
  font-size: 0.75rem;
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

.form-box {
  background: var(--ion-card-background);
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

.form-dot.lost {
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
