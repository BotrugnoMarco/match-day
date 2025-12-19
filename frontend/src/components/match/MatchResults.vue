<template>
  <div>
    <!-- Results Section -->
    <div v-if="match.status === 'finished'" class="results-section">
      <div class="section-title">
        <h3>{{ t("match_details.match_results") }}</h3>
        <div style="display: flex; align-items: center; gap: 10px">
          <ion-button v-if="myResult" size="small" fill="outline" @click="generateAndShareCard" :disabled="isGeneratingCard">
            <ion-icon :icon="shareSocialOutline" slot="start" v-if="!isGeneratingCard"></ion-icon>
            <ion-spinner v-if="isGeneratingCard" name="crescent" style="width: 16px; height: 16px; margin-right: 8px"></ion-spinner>
            Card
          </ion-button>
          <ion-icon :icon="trophyOutline" color="warning"></ion-icon>
        </div>
      </div>

      <div class="winner-card">
        <div class="main-result-row">
          <div class="winner-info">
            <div class="winner-label">{{ t("match_details.winner") }}</div>
            <h2 class="winner-team" v-if="match.winner !== 'Draw'">{{ t("match_details.team") }} {{ match.winner }}</h2>
            <h2 class="winner-team draw" v-else>{{ t("match_details.draw") }}</h2>
          </div>

          <div class="score-display" v-if="match.score_team_a != null && match.score_team_b != null">
            <span class="score-team-a">{{ match.score_team_a }}</span>
            <span class="score-divider">-</span>
            <span class="score-team-b">{{ match.score_team_b }}</span>
          </div>
        </div>

        <div class="sets-display" v-if="match.set_scores && match.set_scores.length > 0">
          <div v-for="(set, index) in match.set_scores" :key="index" class="set-pill">
            <span class="set-num">{{ index + 1 }}°</span>
            <span class="set-value">{{ set.a }}-{{ set.b }}</span>
          </div>
        </div>
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

    <!-- Hidden Player Card for Generation -->
    <div style="position: absolute; left: -9999px; top: -9999px" v-if="myResult">
      <PlayerCard
        ref="playerCardRef"
        :name="currentUser?.username || 'Player'"
        :rating="Math.round(myResult.averageRating * 10)"
        :position="currentUser?.preferred_position || 'AT'"
        :avatar-url="currentUser?.avatar_url"
        :stats="myStats"
        :tags="myTags"
        :sport="match.sport_type"
        :is-mvp="myStats.MVP === 1"
        :match-date="formattedDate"
        :preferred-side="myPreferredSide"
      />
    </div>
  </div>
</template>

<script setup>
import { IonList, IonItem, IonLabel, IonIcon, IonBadge, IonButton, IonSpinner } from "@ionic/vue";
import { trophyOutline, chatboxEllipsesOutline, shareSocialOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import { useStore } from "vuex";
import { computed, ref } from "vue";
import PlayerCard from "../PlayerCard.vue";
import html2canvas from "html2canvas";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";

const { t } = useI18n();
const store = useStore();
const currentUser = computed(() => store.getters.currentUser);
const isGeneratingCard = ref(false);
const playerCardRef = ref(null);

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

const emit = defineEmits(["go-to-profile"]);

const myResult = computed(() => {
  if (!currentUser.value || !props.results) return null;
  return props.results.find((r) => r.target_id === currentUser.value.id);
});

const myStats = computed(() => {
  if (!myResult.value) return {};

  const myParticipant = props.match.participants?.find((p) => p.user_id === currentUser.value.id);
  const isSoccer = props.match.sport_type === "soccer";

  const stats = {};

  if (isSoccer) {
    stats.GOL = myParticipant?.goals || 0;
    stats.AST = myParticipant?.assists || 0;
  }

  // MVP removed from stats as requested
  // stats.MVP = myParticipant?.is_mvp ? 1 : 0;

  return stats;
});

const myTags = computed(() => {
  if (!myResult.value || !myResult.value.badges) return [];
  return myResult.value.badges.map((b) => t("vote.tags." + b.name));
});

const formattedDate = computed(() => {
  if (!props.match.date_time) return "";
  return new Date(props.match.date_time).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
});

const myPreferredSide = computed(() => {
  if (!currentUser.value) return "";
  if (props.match.sport_type === "soccer") {
    return currentUser.value.preferred_foot || "";
  }
  if (["volleyball", "tennis", "padel"].includes(props.match.sport_type)) {
    return currentUser.value.preferred_hand || "";
  }
  return "";
});

const generateAndShareCard = async () => {
  if (!playerCardRef.value || !playerCardRef.value.cardRef) return;

  isGeneratingCard.value = true;
  try {
    // Wait for render
    await new Promise((resolve) => setTimeout(resolve, 100));

    const element = playerCardRef.value.cardRef;
    const canvas = await html2canvas(element, {
      backgroundColor: null,
      scale: 2, // Better quality
      useCORS: true, // For images
    });

    const dataUrl = canvas.toDataURL("image/png");

    // Save to filesystem
    const fileName = `match-card-${Date.now()}.png`;
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: dataUrl,
      directory: Directory.Cache,
    });

    // Share the file
    await Share.share({
      title: "La mia prestazione su MatchDay",
      text: `Ho preso ${myResult.value.averageRating.toFixed(1)} in pagella! ⚽🔥`,
      url: savedFile.uri,
      dialogTitle: "Condividi la tua card",
    });
  } catch (error) {
    console.error("Error generating card:", error);
  } finally {
    isGeneratingCard.value = false;
  }
};

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
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 8px 20px rgba(255, 196, 9, 0.3);
}

.main-result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.winner-info {
  text-align: left;
}

.winner-label {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 1px;
  opacity: 0.8;
  margin-bottom: 2px;
}

.winner-team {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 2.5rem;
  font-weight: 900;
  line-height: 1;
}

.sets-display {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.set-pill {
  background: rgba(255, 255, 255, 0.25);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  display: flex;
  gap: 6px;
  align-items: center;
}

.set-num {
  opacity: 0.7;
  font-size: 0.8rem;
}

.set-value {
  font-weight: bold;
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
  color: var(--ion-color-danger);
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
  background: var(--ion-color-warning);
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
