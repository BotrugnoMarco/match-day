<template>
  <div class="actions-section">
    <div v-if="match.status === 'open' && !isParticipant">
      <ion-button expand="block" @click="$emit('join')" size="large" :color="isFull ? 'warning' : 'primary'" class="main-action-btn">
        <ion-icon :icon="isFull ? timeOutline : personAddOutline" slot="start"></ion-icon>
        {{ isFull ? t("match_details.join_waitlist") : t("match_details.join_match") }}
      </ion-button>
    </div>
    <div v-if="match.status === 'open' && isConfirmed">
      <ion-button expand="block" color="danger" fill="outline" @click="$emit('leave')" class="main-action-btn">
        <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
        {{ t("match_details.leave_match") }}
      </ion-button>
    </div>
    <div v-if="match.status === 'open' && isWaitlisted">
      <ion-button expand="block" color="danger" fill="outline" @click="$emit('leave')" class="main-action-btn">
        <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
        {{ t("match_details.leave_waitlist") }}
      </ion-button>
    </div>

    <!-- Admin Controls -->
    <div v-if="isAdmin && (match.status === 'open' || match.status === 'locked')" class="admin-controls-grid">
      <ion-button expand="block" color="secondary" fill="solid" @click="$emit('generate-teams')" class="admin-btn">
        <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
        {{ hasTeams ? t("match_details.regenerate_teams") : t("match_details.generate_teams") }}
      </ion-button>
      <ion-button expand="block" color="warning" fill="solid" @click="$emit('change-status', 'voting')" class="admin-btn">
        <ion-icon :icon="starOutline" slot="start"></ion-icon>
        {{ t("match_details.voting") }}
      </ion-button>
      <ion-button expand="block" color="success" fill="solid" @click="$emit('open-score-modal')" class="admin-btn">
        <ion-icon :icon="createOutline" slot="start"></ion-icon>
        {{ t("match_details.score_points") }}
      </ion-button>
      <ion-button expand="block" color="tertiary" fill="solid" @click="$emit('edit')" class="admin-btn">
        <ion-icon :icon="createOutline" slot="start"></ion-icon>
        {{ t("common.edit") }}
      </ion-button>
      <ion-button v-if="isCreator" expand="block" color="danger" fill="clear" @click="$emit('delete')" class="admin-btn full-width">
        <ion-icon :icon="trashOutline" slot="start"></ion-icon>
        {{ t("match_details.delete_match") }}
      </ion-button>
    </div>
    <div v-if="isAdmin && match.status === 'voting'">
      <div v-if="voteStats" class="vote-stats-container ion-margin-bottom">
        <div class="vote-progress-text">
          {{ t("match_details.votes_progress") }}: <strong>{{ voteStats.total_votes }} / {{ voteStats.expected_votes }}</strong>
        </div>
        <div v-if="voteStats.missing_votes > 0">
          <div class="missing-votes-text">
            {{ t("match_details.missing_votes", { count: voteStats.missing_votes }) }}
          </div>
          <div v-if="voteStats.missing_voters && voteStats.missing_voters.length > 0" class="missing-voters-list">
            <div class="missing-voters-title">{{ t("match_details.missing_voters_title") }}</div>
            <div v-for="voter in voteStats.missing_voters" :key="voter.id" class="missing-voter-item">
              <span>{{ voter.username }}</span>
              <span class="missing-count">-{{ voter.votes_missing }}</span>
            </div>
          </div>
        </div>
        <div v-else class="all-voted-text">
          <ion-icon :icon="checkmarkOutline" color="success"></ion-icon>
          {{ t("match_details.all_voted") }}
        </div>
      </div>
      <ion-button expand="block" color="success" @click="$emit('open-score-modal')" class="main-action-btn">
        <ion-icon :icon="createOutline" slot="start"></ion-icon>
        {{ t("match_details.score_points") }}
      </ion-button>
      <ion-button expand="block" color="danger" @click="$emit('change-status', 'finished')" class="main-action-btn">
        <ion-icon :icon="flagOutline" slot="start"></ion-icon>
        {{ t("match_details.finish_match") }}
      </ion-button>
      <ion-button expand="block" color="medium" fill="outline" @click="$emit('change-status', 'locked')" class="main-action-btn">
        <ion-icon :icon="arrowUndoOutline" slot="start"></ion-icon>
        {{ t("match_details.cancel_voting") }}
      </ion-button>
    </div>

    <!-- Finished Match Admin Controls -->
    <div v-if="isAdmin && match.status === 'finished'" class="admin-controls-grid">
      <ion-button expand="block" color="success" fill="solid" @click="$emit('open-score-modal')" class="admin-btn">
        <ion-icon :icon="createOutline" slot="start"></ion-icon>
        {{ t("match_details.score_points") }}
      </ion-button>
    </div>
  </div>
</template>

<script setup>
import { IonButton, IonIcon } from "@ionic/vue";
import {
  timeOutline,
  personAddOutline,
  closeCircleOutline,
  peopleOutline,
  starOutline,
  createOutline,
  trashOutline,
  checkmarkOutline,
  flagOutline,
  arrowUndoOutline,
} from "ionicons/icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

defineProps({
  match: {
    type: Object,
    required: true,
  },
  isParticipant: Boolean,
  isConfirmed: Boolean,
  isWaitlisted: Boolean,
  isFull: Boolean,
  isAdmin: Boolean,
  isCreator: Boolean,
  hasTeams: Boolean,
  voteStats: Object,
});

defineEmits(["join", "leave", "generate-teams", "change-status", "edit", "delete"]);
</script>

<style scoped>
.actions-section {
  margin-bottom: 20px;
}

.main-action-btn {
  margin-bottom: 12px;
  font-weight: 600;
  --border-radius: 12px;
  height: 50px;
}

.admin-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}

.admin-btn {
  margin: 0;
  --border-radius: 12px;
  font-size: 0.9rem;
}

.full-width {
  grid-column: span 2;
}

.vote-stats-container {
  background: var(--ion-color-light);
  padding: 15px;
  border-radius: 12px;
  border: 1px solid var(--ion-color-medium-shade);
}

.vote-progress-text {
  font-size: 1.1rem;
  text-align: center;
  margin-bottom: 8px;
}

.missing-votes-text {
  color: var(--ion-color-warning-shade);
  text-align: center;
  font-weight: 500;
  margin-bottom: 8px;
}

.missing-voters-list {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 8px;
  margin-top: 8px;
}

.missing-voters-title {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.missing-voter-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 2px 0;
  border-bottom: 1px dashed var(--ion-color-medium-tint);
}

.missing-voter-item:last-child {
  border-bottom: none;
}

.missing-count {
  color: var(--ion-color-danger);
  font-weight: bold;
}

.all-voted-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--ion-color-success);
  font-weight: bold;
  font-size: 1.1rem;
}
</style>
