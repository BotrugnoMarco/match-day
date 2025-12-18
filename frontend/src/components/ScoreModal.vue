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
          <ion-button size="small" fill="clear" @click="addSet">
            <ion-icon :icon="addCircleOutline"></ion-icon>
          </ion-button>
        </div>
        <div v-for="(set, index) in sets" :key="index" class="set-row">
          <span class="set-label">Set {{ index + 1 }}</span>
          <div class="set-inputs">
            <ion-input type="number" v-model="set.a" class="set-input" placeholder="A"></ion-input>
            <span class="set-divider">:</span>
            <ion-input type="number" v-model="set.b" class="set-input" placeholder="B"></ion-input>
          </div>
          <ion-button size="small" color="danger" fill="clear" @click="removeSet(index)">
            <ion-icon :icon="removeCircleOutline"></ion-icon>
          </ion-button>
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
import { addCircleOutline, removeCircleOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  isOpen: Boolean,
  match: Object,
  participants: Array,
});

const emit = defineEmits(["close", "save"]);

const scoreA = ref(0);
const scoreB = ref(0);
const selectedTeam = ref("A");
const playerStats = ref({});
const sets = ref([]);

// Initialize stats when modal opens or match changes
watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal && props.match) {
      scoreA.value = props.match.score_team_a || 0;
      scoreB.value = props.match.score_team_b || 0;

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
    score_team_a: parseInt(scoreA.value),
    score_team_b: parseInt(scoreB.value),
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
</style>
