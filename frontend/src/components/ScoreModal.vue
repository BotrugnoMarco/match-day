<template>
  <ion-modal :is-open="isOpen" @didDismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t("match_details.score_points") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="close">{{ t("common.close") }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Score Inputs -->
      <div class="score-container">
        <div class="team-score">
          <h3>{{ t("match_details.team_a") }}</h3>
          <ion-input type="number" v-model="scoreA" class="score-input"></ion-input>
        </div>
        <div class="vs">-</div>
        <div class="team-score">
          <h3>{{ t("match_details.team_b") }}</h3>
          <ion-input type="number" v-model="scoreB" class="score-input"></ion-input>
        </div>
      </div>

      <!-- Volleyball/Padel/Tennis Specific: Set Scores -->
      <div v-if="['volleyball', 'padel', 'tennis'].includes(match.sport_type)" class="sets-section">
        <div class="section-header">
          <h4>{{ t("match_details.set_scores") }}</h4>
          <ion-button size="small" fill="outline" @click="addSet">
            <ion-icon slot="start" :icon="addCircleOutline"></ion-icon>
            {{ t("match_details.add_set") }}
          </ion-button>
        </div>

        <div class="sets-container" v-if="sets.length > 0">
          <div class="sets-header-row">
            <div class="col-num">#</div>
            <div class="col-team team-a-header">{{ t("match_details.team_a") }}</div>
            <div class="col-team team-b-header">{{ t("match_details.team_b") }}</div>
            <div class="col-action"></div>
          </div>

          <div v-for="(set, index) in sets" :key="index" class="set-row">
            <div class="set-num">{{ index + 1 }}</div>
            <div class="set-input-wrapper">
              <ion-input type="number" v-model="set.a" class="set-input team-a-input"></ion-input>
            </div>
            <div class="set-divider">-</div>
            <div class="set-input-wrapper">
              <ion-input type="number" v-model="set.b" class="set-input team-b-input"></ion-input>
            </div>
            <div class="set-action">
              <ion-button size="small" color="danger" fill="clear" @click="removeSet(index)">
                <ion-icon slot="icon-only" :icon="trashOutline"></ion-icon>
              </ion-button>
            </div>
          </div>
        </div>
        <div v-else class="no-sets-message">
          {{ t("match_details.no_sets_added") }}
        </div>
      </div>

      <!-- Soccer Specific: Player Stats -->
      <div v-if="match.sport_type === 'soccer'" class="player-stats-section">
        <ion-segment v-model="selectedTeam" :value="selectedTeam">
          <ion-segment-button value="A">
            <ion-label :color="selectedTeam === 'A' ? 'danger' : ''">{{ t("match_details.team_a") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="B">
            <ion-label :color="selectedTeam === 'B' ? 'primary' : ''">{{ t("match_details.team_b") }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-list>
          <div v-for="player in currentTeamPlayers" :key="player.user_id" class="player-stat-row">
            <div class="player-name">
              <h2>{{ player.username }}</h2>
            </div>
            <div class="stats-controls">
              <div class="stat-group">
                <span class="stat-label">G</span>
                <ion-button size="small" fill="clear" @click="decrementStat(player.user_id, 'goals')">
                  <ion-icon :icon="removeCircleOutline"></ion-icon>
                </ion-button>
                <span class="stat-value">{{ getStat(player.user_id, "goals") }}</span>
                <ion-button size="small" fill="clear" @click="incrementStat(player.user_id, 'goals')">
                  <ion-icon :icon="addCircleOutline"></ion-icon>
                </ion-button>
              </div>
              <div class="stat-group">
                <span class="stat-label">A</span>
                <ion-button size="small" fill="clear" @click="decrementStat(player.user_id, 'assists')">
                  <ion-icon :icon="removeCircleOutline"></ion-icon>
                </ion-button>
                <span class="stat-value">{{ getStat(player.user_id, "assists") }}</span>
                <ion-button size="small" fill="clear" @click="incrementStat(player.user_id, 'assists')">
                  <ion-icon :icon="addCircleOutline"></ion-icon>
                </ion-button>
              </div>
            </div>
          </div>
        </ion-list>
      </div>

      <ion-button expand="block" class="ion-margin-top" @click="save">
        {{ t("common.save") }}
      </ion-button>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonInput,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
} from "@ionic/vue";
import { addCircleOutline, removeCircleOutline, trashOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  isOpen: Boolean,
  match: Object,
  participants: Array,
});

const emit = defineEmits(["close", "save"]);

const scoreA = ref(null);
const scoreB = ref(null);
const selectedTeam = ref("A");
const playerStats = ref({});
const sets = ref([]);

// Initialize stats when modal opens or match changes
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.match) {
      scoreA.value = props.match.score_team_a !== undefined && props.match.score_team_a !== null ? props.match.score_team_a : null;
      scoreB.value = props.match.score_team_b !== undefined && props.match.score_team_b !== null ? props.match.score_team_b : null;

      // Initialize sets
      if (props.match.set_scores) {
        try {
          sets.value = typeof props.match.set_scores === "string" ? JSON.parse(props.match.set_scores) : props.match.set_scores;
        } catch (e) {
          sets.value = [];
        }
      } else {
        sets.value = [];
      }

      // Initialize player stats map
      const stats = {};
      props.participants.forEach((p) => {
        stats[p.user_id] = {
          goals: p.goals || 0,
          assists: p.assists || 0,
        };
      });
      playerStats.value = stats;
    }
  }
);

const addSet = () => {
  sets.value.push({ a: 0, b: 0 });
};

const removeSet = (index) => {
  sets.value.splice(index, 1);
};

const currentTeamPlayers = computed(() => {
  if (!props.participants) return [];
  return props.participants.filter((p) => p.team === selectedTeam.value);
});

const getStat = (userId, type) => {
  if (!playerStats.value[userId]) return 0;
  return playerStats.value[userId][type];
};

const incrementStat = (userId, type) => {
  if (!playerStats.value[userId]) playerStats.value[userId] = { goals: 0, assists: 0 };
  playerStats.value[userId][type]++;

  // Auto-increment team score for goals
  if (type === "goals") {
    const player = props.participants.find((p) => p.user_id === userId);
    if (player) {
      if (player.team === "A") scoreA.value++;
      else if (player.team === "B") scoreB.value++;
    }
  }
};

const decrementStat = (userId, type) => {
  if (!playerStats.value[userId]) return;
  if (playerStats.value[userId][type] > 0) {
    playerStats.value[userId][type]--;

    // Auto-decrement team score for goals
    if (type === "goals") {
      const player = props.participants.find((p) => p.user_id === userId);
      if (player) {
        if (player.team === "A" && scoreA.value > 0) scoreA.value--;
        else if (player.team === "B" && scoreB.value > 0) scoreB.value--;
      }
    }
  }
};

const close = () => {
  emit("close");
};

const save = () => {
  // Convert stats map to array
  const statsArray = Object.keys(playerStats.value).map((userId) => ({
    userId: parseInt(userId),
    goals: playerStats.value[userId].goals,
    assists: playerStats.value[userId].assists,
  }));

  emit("save", {
    score_team_a: scoreA.value !== null && scoreA.value !== "" ? parseInt(scoreA.value) : null,
    score_team_b: scoreB.value !== null && scoreB.value !== "" ? parseInt(scoreB.value) : null,
    player_stats: statsArray,
    set_scores: sets.value,
  });
};
</script>

<style scoped>
.score-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.team-score {
  text-align: center;
  width: 100%;
}

.team-score h3 {
  font-weight: bold;
}

.team-score:first-child h3 {
  color: var(--ion-color-danger); /* Red for Team A */
}

.team-score:last-child h3 {
  color: var(--ion-color-primary); /* Blue for Team B */
}

.score-input {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  --padding-start: 0;
  --padding-end: 0;
  border: 1px solid var(--ion-color-medium-shade);
  border-radius: 8px;
  margin-top: 8px;
}

.vs {
  font-size: 2rem;
  font-weight: bold;
  color: var(--ion-color-medium);
}

.player-stats-section {
  margin-top: 20px;
}

.player-stat-row {
  display: flex;
  flex-direction: column;
  padding: 12px 0;
  border-bottom: 1px solid var(--ion-color-light-shade);
}

.player-name h2 {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
}

.stats-controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.stat-group {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 4px 8px;
  flex: 1;
}

.stat-label {
  font-weight: bold;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-right: 4px;
}

.stat-value {
  font-weight: bold;
  font-size: 1.1rem;
  min-width: 24px;
  text-align: center;
}

.sets-section {
  margin-top: 24px;
  border-top: 1px solid var(--ion-color-light-shade);
  padding-top: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.sets-container {
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 12px;
}

.sets-header-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--ion-color-medium);
  text-transform: uppercase;
}

.col-num {
  width: 30px;
  text-align: center;
}

.col-team {
  flex: 1;
  text-align: center;
}

.team-a-header {
  color: var(--ion-color-danger);
}

.team-b-header {
  color: var(--ion-color-primary);
}

.col-action {
  width: 40px;
}

.set-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  background: var(--ion-card-background);
  border-radius: 8px;
  padding: 4px;
}

.set-num {
  width: 30px;
  text-align: center;
  font-weight: bold;
  color: var(--ion-color-medium);
}

.set-input-wrapper {
  flex: 1;
}

.set-input {
  text-align: center;
  font-weight: bold;
  font-size: 1.2rem;
  --padding-start: 0;
  --padding-end: 0;
}

.team-a-input {
  color: var(--ion-color-danger);
}

.team-b-input {
  color: var(--ion-color-primary);
}

.set-divider {
  font-weight: bold;
  color: var(--ion-color-medium);
  margin: 0 8px;
}

.set-action {
  width: 40px;
  display: flex;
  justify-content: center;
}

.no-sets-message {
  text-align: center;
  color: var(--ion-color-medium);
  font-style: italic;
  padding: 20px;
}
</style>
