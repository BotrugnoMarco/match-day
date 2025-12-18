<template>
  <div>
    <!-- Pending Requests -->
    <div v-if="isAdmin && pendingParticipants.length > 0" class="list-section">
      <div class="section-title">
        <h3>{{ t("match_details.pending_requests") }}</h3>
        <ion-badge color="tertiary">{{ pendingParticipants.length }}</ion-badge>
      </div>
      <div class="participants-card">
        <ion-list lines="none">
          <ion-item v-for="p in pendingParticipants" :key="p.id">
            <ion-avatar slot="start" :class="{ 'supporter-border': p.is_supporter || p.system_role === 'admin' }">
              <img :src="p.avatar_url || '/default-avatar.svg'" />
            </ion-avatar>
            <ion-label>
              <h2>{{ p.username }}</h2>
              <p>{{ t("match_details.wants_to_join") }}</p>
            </ion-label>
            <div class="action-buttons-small">
              <ion-button color="success" fill="clear" @click="$emit('approve-request', p.user_id)">
                <ion-icon :icon="checkmarkOutline" slot="icon-only"></ion-icon>
              </ion-button>
              <ion-button color="danger" fill="clear" @click="$emit('reject-request', p.user_id)">
                <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        </ion-list>
      </div>
    </div>

    <!-- Waitlist -->
    <div v-if="waitlistParticipants.length > 0" class="list-section">
      <div class="section-title">
        <h3>{{ t("match_details.waitlist") }}</h3>
        <ion-badge color="warning">{{ waitlistParticipants.length }}</ion-badge>
      </div>
      <div class="participants-card">
        <ion-list lines="none">
          <ion-item v-for="p in waitlistParticipants" :key="p.id" button @click="$emit('go-to-profile', p.user_id)">
            <ion-avatar slot="start" :class="{ 'supporter-border': p.is_supporter || p.system_role === 'admin' }">
              <img :src="p.avatar_url || '/default-avatar.svg'" />
            </ion-avatar>
            <ion-label>
              <h2>{{ p.username }}</h2>
              <p>{{ t("match_details.waiting") }}</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </div>

    <!-- Participants / Teams -->
    <div class="list-section">
      <div class="section-title">
        <h3>{{ t("match_details.participants") }}</h3>
        <ion-badge color="medium">{{ activeParticipants ? activeParticipants.length : 0 }} / {{ match.max_players || 10 }}</ion-badge>
      </div>

      <div v-if="hasTeams" class="teams-container">
        <!-- Team A -->
        <div class="team-block">
          <div class="participants-card team-a-card">
            <div class="team-header-label team-a">
              {{ t("match_details.team_a") }}
              <span v-if="teamAAverageSkill > 0" class="team-avg"> ({{ t("match_details.average_skill") }}: {{ teamAAverageSkill }}) </span>
            </div>
            <ion-list lines="none">
              <ion-item v-for="p in teamAParticipants" :key="p.id">
                <div
                  slot="start"
                  class="avatar-wrapper"
                  @click="$emit('go-to-profile', p.user_id)"
                  :class="{ 'supporter-border': p.is_supporter || p.system_role === 'admin' }"
                >
                  <ion-avatar>
                    <img :src="p.avatar_url || '/default-avatar.svg'" />
                  </ion-avatar>
                  <div v-if="p.is_captain" class="captain-badge-overlay">C</div>
                </div>
                <ion-label @click="$emit('go-to-profile', p.user_id)">
                  <div class="name-container">
                    <h2>{{ p.username }}</h2>
                    <span v-if="p.preferred_number != null" class="jersey-number">#{{ p.preferred_number }}</span>
                  </div>
                  <p>
                    {{ t("match_details.skill") }}: {{ p.skill_rating || "N/A" }}
                    <span v-if="p.role" style="font-weight: 600; color: var(--ion-color-primary)">
                      • {{ getRoleLabel(p.role, match.sport_type) }}</span
                    >
                  </p>
                </ion-label>
                <div slot="end" class="item-actions">
                  <ion-icon v-if="p.is_mvp" :icon="trophyOutline" color="warning" class="status-icon"></ion-icon>
                  <ion-icon v-if="p.is_admin" :icon="shieldCheckmarkOutline" color="secondary" class="status-icon"></ion-icon>
                  <ion-icon v-if="p.post_match" :icon="beer" color="warning" class="status-icon"></ion-icon>
                  <ion-icon :icon="cashOutline" :color="p.has_paid ? 'success' : 'medium'" class="status-icon"></ion-icon>
                  <ion-button
                    v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id && isConfirmed"
                    fill="outline"
                    size="small"
                    :disabled="myVotes.includes(p.user_id)"
                    @click.stop="$emit('open-vote-modal', p)"
                  >
                    {{ myVotes.includes(p.user_id) ? t("vote.voted") : t("vote.vote_action") }}
                  </ion-button>
                  <ion-button v-if="isAdmin" fill="clear" size="small" @click.stop="$emit('open-player-actions', p)">
                    <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
                  </ion-button>
                </div>
              </ion-item>
            </ion-list>
          </div>
        </div>

        <!-- Team B -->
        <div class="team-block">
          <div class="participants-card team-b-card">
            <div class="team-header-label team-b">
              {{ t("match_details.team_b") }}
              <span v-if="teamBAverageSkill > 0" class="team-avg"> ({{ t("match_details.average_skill") }}: {{ teamBAverageSkill }}) </span>
            </div>
            <ion-list lines="none">
              <ion-item v-for="p in teamBParticipants" :key="p.id">
                <div
                  slot="start"
                  class="avatar-wrapper"
                  @click="$emit('go-to-profile', p.user_id)"
                  :class="{ 'supporter-border': p.is_supporter || p.system_role === 'admin' }"
                >
                  <ion-avatar>
                    <img :src="p.avatar_url || '/default-avatar.svg'" />
                  </ion-avatar>
                  <div v-if="p.is_captain" class="captain-badge-overlay">C</div>
                </div>
                <ion-label @click="$emit('go-to-profile', p.user_id)">
                  <div class="name-container">
                    <h2>{{ p.username }}</h2>
                    <span v-if="p.preferred_number != null" class="jersey-number">#{{ p.preferred_number }}</span>
                  </div>
                  <p>
                    {{ t("match_details.skill") }}: {{ p.skill_rating || "N/A" }}
                    <span v-if="p.role" style="font-weight: 600; color: var(--ion-color-danger)">
                      • {{ getRoleLabel(p.role, match.sport_type) }}</span
                    >
                  </p>
                </ion-label>
                <div slot="end" class="item-actions">
                  <ion-icon v-if="p.is_mvp" :icon="trophyOutline" color="warning" class="status-icon"></ion-icon>
                  <ion-icon v-if="p.is_admin" :icon="shieldCheckmarkOutline" color="secondary" class="status-icon"></ion-icon>
                  <ion-icon v-if="p.post_match" :icon="beer" color="warning" class="status-icon"></ion-icon>
                  <ion-icon :icon="cashOutline" :color="p.has_paid ? 'success' : 'medium'" class="status-icon"></ion-icon>
                  <ion-button
                    v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id && isConfirmed"
                    fill="outline"
                    size="small"
                    :disabled="myVotes.includes(p.user_id)"
                    @click.stop="$emit('open-vote-modal', p)"
                  >
                    {{ myVotes.includes(p.user_id) ? t("vote.voted") : t("vote.vote_action") }}
                  </ion-button>
                  <ion-button v-if="isAdmin" fill="clear" size="small" @click.stop="$emit('open-player-actions', p)">
                    <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
                  </ion-button>
                </div>
              </ion-item>
            </ion-list>
          </div>
        </div>
      </div>

      <div v-else class="participants-card">
        <ion-list lines="none">
          <ion-item v-for="p in activeParticipants" :key="p.id">
            <ion-avatar
              slot="start"
              @click="$emit('go-to-profile', p.user_id)"
              :class="{ 'supporter-border': p.is_supporter || p.system_role === 'admin' }"
            >
              <img :src="p.avatar_url || '/default-avatar.svg'" />
            </ion-avatar>
            <ion-label @click="$emit('go-to-profile', p.user_id)">
              <div class="name-container">
                <h2>{{ p.username }}</h2>
                <span v-if="p.preferred_number != null" class="jersey-number">#{{ p.preferred_number }}</span>
              </div>
              <p>
                {{ t("match_details.skill") }}: {{ p.skill_rating || "N/A" }}
                <span v-if="p.role"> • {{ getRoleLabel(p.role, match.sport_type) }}</span>
              </p>
              <p v-if="p.status !== 'confirmed' || p.user_status">
                <span v-if="p.status !== 'confirmed'">{{ p.status }}</span>
                <span v-if="p.user_status" :class="'status-text ' + p.user_status">
                  <span v-if="p.status !== 'confirmed'"> • </span>
                  {{ t("profile." + p.user_status) }}
                </span>
              </p>
            </ion-label>
            <div slot="end" class="item-actions">
              <ion-icon v-if="p.is_mvp" :icon="trophyOutline" color="warning" class="status-icon"></ion-icon>
              <ion-icon v-if="p.is_admin" :icon="shieldCheckmarkOutline" color="secondary" class="status-icon"></ion-icon>
              <ion-icon v-if="p.post_match" :icon="beer" color="warning" class="status-icon"></ion-icon>
              <ion-icon :icon="cashOutline" :color="p.has_paid ? 'success' : 'medium'" class="status-icon"></ion-icon>
              <ion-button
                v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id && isConfirmed"
                fill="outline"
                size="small"
                :disabled="myVotes.includes(p.user_id)"
                @click.stop="$emit('open-vote-modal', p)"
              >
                {{ myVotes.includes(p.user_id) ? t("vote.voted") : t("vote.vote_action") }}
              </ion-button>
              <ion-button v-if="isAdmin" fill="clear" size="small" @click.stop="$emit('open-player-actions', p)">
                <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
              </ion-button>
            </div>
          </ion-item>
        </ion-list>
      </div>

      <div v-if="hasTeams" class="field-container ion-margin-top">
        <div class="section-title">
          <h3>{{ t("match_details.formation") }}</h3>
        </div>
        <FormationField
          :players="[...teamAParticipants, ...teamBParticipants]"
          :is-editable="isAdmin"
          :sport-type="match.sport_type"
          @save="$emit('save-formation', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { IonList, IonItem, IonAvatar, IonLabel, IonButton, IonIcon, IonBadge } from "@ionic/vue";
import { checkmarkOutline, closeOutline, trophyOutline, shieldCheckmarkOutline, beer, cashOutline, ellipsisVertical } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import FormationField from "../FormationField.vue";

const { t } = useI18n();

defineProps({
  match: {
    type: Object,
    required: true,
  },
  pendingParticipants: {
    type: Array,
    default: () => [],
  },
  waitlistParticipants: {
    type: Array,
    default: () => [],
  },
  activeParticipants: {
    type: Array,
    default: () => [],
  },
  teamAParticipants: {
    type: Array,
    default: () => [],
  },
  teamBParticipants: {
    type: Array,
    default: () => [],
  },
  hasTeams: Boolean,
  teamAAverageSkill: [Number, String],
  teamBAverageSkill: [Number, String],
  isAdmin: Boolean,
  isConfirmed: Boolean,
  currentUser: Object,
  myVotes: {
    type: Array,
    default: () => [],
  },
});

defineEmits(["approve-request", "reject-request", "go-to-profile", "open-vote-modal", "open-player-actions", "save-formation"]);

const getRoleLabel = (role, sportType) => {
  if (!role) return "";
  const roleKey = role.toLowerCase().replace(" ", "_");
  return t(`roles.${sportType}.${roleKey}`);
};
</script>

<style scoped>
.list-section {
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

.participants-card {
  background: var(--ion-card-background);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.action-buttons-small {
  display: flex;
  gap: 4px;
}

.teams-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.team-block {
  width: 100%;
}

.team-header-label {
  padding: 12px 16px;
  font-weight: bold;
  font-size: 1rem;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.team-a-card .team-header-label {
  background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-primary-shade));
}

.team-b-card .team-header-label {
  background: linear-gradient(135deg, var(--ion-color-danger), var(--ion-color-danger-shade));
}

.team-avg {
  font-size: 0.8rem;
  opacity: 0.9;
  font-weight: normal;
}

.avatar-wrapper {
  position: relative;
}

.captain-badge-overlay {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--ion-color-warning);
  color: black;
  font-size: 10px;
  font-weight: bold;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--ion-card-background);
  z-index: 10;
}

.name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.jersey-number {
  background: var(--ion-color-light-shade);
  color: var(--ion-color-medium-shade);
  font-size: 0.75rem;
  font-weight: bold;
  padding: 1px 5px;
  border-radius: 4px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-icon {
  font-size: 1.2rem;
}

.status-text {
  font-weight: 500;
  text-transform: capitalize;
}

.status-text.available {
  color: var(--ion-color-success);
}

.status-text.injured {
  color: var(--ion-color-danger);
}

.status-text.tired {
  color: var(--ion-color-warning);
}

.field-container {
  background: var(--ion-card-background);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}
</style>
