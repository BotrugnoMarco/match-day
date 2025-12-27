<template>
  <div class="h2h-card" v-if="stats && stats.total_matches > 0">
    <div class="card-header">
      <h3>{{ t("profile.head_to_head") }}</h3>
      <span class="total-matches">{{ stats.total_matches }} {{ t("common.matches") }}</span>
    </div>

    <div class="stats-grid">
      <!-- Played Together -->
      <div class="stat-column">
        <div class="stat-title">
          <ion-icon :icon="peopleOutline"></ion-icon>
          <span>{{ t("profile.together") }}</span>
        </div>
        <div class="stat-value">{{ stats.played_together }}</div>
        <div class="win-rate" v-if="stats.played_together > 0">
          {{ Math.round((stats.together.wins / stats.played_together) * 100) }}% {{ t("profile.win_rate") }}
        </div>
      </div>

      <!-- Played Against -->
      <div class="stat-column">
        <div class="stat-title">
          <ion-icon :icon="flashOutline"></ion-icon>
          <span>{{ t("profile.against") }}</span>
        </div>
        <div class="stat-value">{{ stats.played_against }}</div>
        <div class="vs-record" v-if="stats.played_against > 0">
          <span class="wins">{{ stats.against.wins }}{{ t("stats.win_short") }}</span> -
          <span class="draws">{{ stats.against.draws }}{{ t("stats.draw_short") }}</span> -
          <span class="losses">{{ stats.against.losses }}{{ t("stats.loss_short") }}</span>
        </div>
      </div>
    </div>

    <!-- Last 5 Matches -->
    <div class="history-strip">
      <div
        v-for="match in [...stats.last_5_matches].reverse()"
        :key="match.id"
        class="history-dot"
        :class="[match.result, { together: match.played_together }]"
        :title="`${match.played_together ? t('profile.together') : t('profile.against')}: ${match.result} (${match.score})`"
      >
        {{ match.result === "win" ? t("stats.win_short") : match.result === "loss" ? t("stats.loss_short") : t("stats.draw_short") }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { IonIcon } from "@ionic/vue";
import { peopleOutline, flashOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import api from "../../services/api";

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true,
  },
});

const { t } = useI18n();
const stats = ref(null);
const loading = ref(false);

const fetchStats = async () => {
  if (!props.userId) return;

  loading.value = true;
  try {
    const response = await api.get(`/users/${props.userId}/stats/h2h`);
    stats.value = response.data;
  } catch (error) {
    console.error("Error fetching H2H stats:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchStats);
watch(() => props.userId, fetchStats);
</script>

<style scoped>
.h2h-card {
  background: var(--ion-card-background);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.total-matches {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  background: var(--ion-color-light);
  padding: 4px 8px;
  border-radius: 8px;
}

.stats-grid {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-column {
  flex: 1;
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.stat-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  text-transform: uppercase;
  font-weight: 600;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.win-rate {
  font-size: 0.8rem;
  color: var(--ion-color-success);
  font-weight: 600;
}

.vs-record {
  font-size: 0.8rem;
  font-weight: 600;
}

.wins {
  color: var(--ion-color-success);
}
.draws {
  color: var(--ion-color-medium);
}
.losses {
  color: var(--ion-color-danger);
}

.history-strip {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.history-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
}

.history-dot.win {
  background: var(--ion-color-success);
}
.history-dot.loss {
  background: var(--ion-color-danger);
}
.history-dot.draw {
  background: var(--ion-color-medium);
}

/* Add a border for "Played Together" matches to distinguish them */
.history-dot.together {
  border: 2px solid rgba(0, 0, 0, 0.2);
}
</style>
