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

    <!-- Sports Breakdown List -->
    <div v-if="hasActiveSports" class="sports-list ion-margin-top">
      <div v-for="(data, sport) in activeSports" :key="sport" class="sport-item">
        <div class="sport-icon-wrapper">
          <ion-icon :icon="getSportIcon(sport)" class="sport-icon" />
        </div>
        <div class="sport-details">
          <div class="sport-name">{{ t("sports." + sport) }}</div>
          <div class="sport-stats-line">
            <span>{{ data.matchesPlayed }} {{ t("profile.matches") }}</span>
            <span class="dot">•</span>
            <span>{{ calculateWinRate(data) }}% Win</span>
            <span v-if="data.goals > 0" class="dot">•</span>
            <span v-if="data.goals > 0">{{ data.goals }} Goal</span>
            <span v-if="data.assists > 0" class="dot">•</span>
            <span v-if="data.assists > 0">{{ data.assists }} Assist</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { IonIcon } from "@ionic/vue";
import { football, baseballOutline, tennisball } from "ionicons/icons";

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

const hasActiveSports = computed(() => Object.keys(activeSports.value).length > 0);

const winRate = computed(() => {
  if (!props.stats || !props.stats.matchesPlayed) return 0;
  return Math.round((props.stats.matchesWon / props.stats.matchesPlayed) * 100);
});

const calculateWinRate = (data) => {
  if (!data.matchesPlayed) return 0;
  return Math.round((data.matchesWon / data.matchesPlayed) * 100);
};

const getSportIcon = (sport) => {
  switch (sport) {
    case "soccer":
      return football;
    case "volleyball":
      return baseballOutline;
    case "padel":
    case "tennis":
      return tennisball;
    default:
      return football;
  }
};
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
  background: var(--ion-card-background);
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
  background: var(--ion-card-background);
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
  background: var(--ion-card-background);
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
