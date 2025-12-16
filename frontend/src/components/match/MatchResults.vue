<template>
  <div>
    <!-- Results Section -->
    <div v-if="match.status === 'finished'" class="results-section">
      <div class="section-title">
        <h3>{{ t("match_details.match_results") }}</h3>
        <ion-icon :icon="trophyOutline" color="warning"></ion-icon>
      </div>

      <div class="winner-card">
        <div class="winner-label">{{ t("match_details.winner") }}</div>
        <h1 class="winner-team" v-if="match.winner !== 'Draw'">{{ t("match_details.team") }} {{ match.winner }}</h1>
        <h1 class="winner-team draw" v-else>{{ t("match_details.draw") }}</h1>
      </div>

      <div class="participants-card" v-if="results.length > 0">
        <ion-list lines="none">
          <ion-item v-for="(r, index) in results" :key="r.target_id" button @click="$emit('go-to-profile', r.target_id)">
            <div slot="start" class="rank-number">{{ index + 1 }}</div>
            <ion-label>
              <div class="name-container">
                <h2 :class="{ 'text-team-a': getPlayerTeam(r.target_id) === 'A', 'text-team-b': getPlayerTeam(r.target_id) === 'B' }">
                  {{ r.target_name }}
                </h2>
                <ion-icon v-if="isMvp(r.target_id)" :icon="trophyOutline" color="warning" class="status-icon"></ion-icon>
              </div>
              <div class="rating-bar-container">
                <div class="rating-bar" :style="{ width: r.averageRating * 10 + '%' }"></div>
              </div>
              <div class="badges-row" v-if="r.badges && r.badges.length > 0">
                <ion-badge v-for="badge in r.badges" :key="badge.name" color="secondary" class="result-badge-chip">
                  {{ t("vote.tags." + badge.name) }} <span v-if="badge.count > 1">x{{ badge.count }}</span>
                </ion-badge>
              </div>
            </ion-label>
            <div slot="end" class="rating-score">
              <span class="score">{{ r.averageRating.toFixed(1) }}</span>
              <span class="votes">{{ t("match_details.votes_count", { count: r.voteCount }) }}</span>
            </div>
          </ion-item>
        </ion-list>
      </div>
    </div>

    <!-- My Feedback Section -->
    <div v-if="match.status === 'finished' && myComments.length > 0" class="feedback-section">
      <div class="section-title">
        <h3>{{ t("match_details.my_feedback") }}</h3>
        <ion-icon :icon="chatboxEllipsesOutline" color="primary"></ion-icon>
      </div>

      <div class="feedback-card">
        <ion-list lines="none">
          <ion-item v-for="(comment, index) in myComments" :key="index" class="feedback-item">
            <ion-label class="ion-text-wrap">
              <p class="feedback-text">"{{ comment.comment }}"</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonList, IonItem, IonLabel, IonIcon, IonBadge } from "@ionic/vue";
import { trophyOutline, chatboxEllipsesOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
  results: {
    type: Array,
    default: () => [],
  },
  myComments: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["go-to-profile"]);

const getPlayerTeam = (userId) => {
  const player = props.match.participants?.find((p) => p.user_id === userId);
  if (!player) return null;
  return player.team === "A" || player.team === "Team A" ? "A" : player.team === "B" || player.team === "Team B" ? "B" : null;
};

const isMvp = (userId) => {
  return props.match.participants?.find((p) => p.user_id === userId)?.is_mvp;
};
</script>

<style scoped>
.results-section,
.feedback-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 0 4px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.winner-card {
  background: linear-gradient(135deg, var(--ion-color-warning), var(--ion-color-warning-shade));
  color: black;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 16px;
  box-shadow: 0 8px 20px rgba(255, 196, 9, 0.3);
}

.winner-label {
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.winner-team {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
}

.participants-card,
.feedback-card {
  background: var(--ion-card-background);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.rank-number {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--ion-color-medium);
  width: 24px;
  text-align: center;
}

.name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-team-a {
  color: var(--ion-color-primary);
}

.text-team-b {
  color: var(--ion-color-secondary);
}

.status-icon {
  font-size: 1.2rem;
}

.rating-bar-container {
  height: 4px;
  background: var(--ion-color-light-shade);
  border-radius: 2px;
  margin-top: 6px;
  overflow: hidden;
}

.rating-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--ion-color-primary), var(--ion-color-secondary));
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.result-badge-chip {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 8px;
}

.rating-score {
  text-align: right;
}

.score {
  display: block;
  font-size: 1.4rem;
  font-weight: bold;
  color: var(--ion-color-dark);
}

.votes {
  display: block;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.feedback-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 12px;
  --padding-bottom: 12px;
}

.feedback-text {
  font-style: italic;
  color: var(--ion-color-dark);
  font-size: 1rem;
  line-height: 1.5;
}
</style>
