<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Match Details</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="openInviteModal">
            <ion-icon slot="icon-only" :icon="personAddOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content" v-if="match">
      <!-- Header Section -->
      <div class="match-header">
        <div class="sport-icon-large" :class="match.sport_type">
          <ion-icon :icon="getSportIcon(match.sport_type)"></ion-icon>
        </div>
        <div class="header-info">
          <h1>{{ match.sport_type }}</h1>
          <div class="header-badges">
            <ion-badge :color="getStatusColor(match.status)" class="status-badge">{{ match.status }}</ion-badge>
            <ion-badge v-if="match.is_private" color="medium" class="status-badge">Private</ion-badge>
          </div>
        </div>
      </div>

      <div class="details-wrapper">
        <!-- Main Info Card -->
        <div class="info-card">
          <div class="info-row">
            <div class="info-block">
              <ion-icon :icon="calendarOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span class="label">Date</span>
                <span class="value">{{ formatDate(match.date_time) }}</span>
              </div>
            </div>
            <div class="info-block">
              <ion-icon :icon="timeOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span class="label">Time</span>
                <span class="value">{{ formatTime(match.date_time) }}</span>
                <span class="sub-value" v-if="match.duration">({{ match.duration }} min)</span>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="info-row">
            <div class="info-block full-width">
              <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span class="label">Location</span>
                <span class="value">{{ match.location }}</span>
              </div>
            </div>
          </div>

          <div class="map-container" v-if="match.location">
            <iframe
              width="100%"
              height="200"
              style="border: 0; border-radius: var(--radius-md)"
              loading="lazy"
              allowfullscreen
              :src="`https://maps.google.com/maps?q=${encodeURIComponent(match.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`"
            >
            </iframe>
            <ion-button fill="clear" size="small" expand="block" @click="openMaps(match.location)">
              Open in Maps
              <ion-icon slot="end" :icon="mapOutline"></ion-icon>
            </ion-button>
          </div>

          <div class="divider"></div>

          <div class="info-row">
            <div class="info-block">
              <ion-icon :icon="cashOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span class="label">Price</span>
                <span class="value">€{{ match.price_total }}</span>
                <span class="sub-value" v-if="activeParticipants.length > 0">
                  €{{ (match.price_total / activeParticipants.length).toFixed(2) }} / person
                </span>
                <span class="sub-value" v-else> €{{ (match.price_total / (match.max_players || 10)).toFixed(2) }} / person (est.) </span>
              </div>
            </div>
            <div class="info-block" @click="goToProfile(match.creator_id)">
              <ion-icon :icon="personOutline" class="info-icon"></ion-icon>
              <div class="info-text">
                <span class="label">Organizer</span>
                <div class="organizer-value">
                  <ion-avatar class="mini-avatar">
                    <img :src="match.creator_avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                  </ion-avatar>
                  <span>{{ match.creator_username || "Unknown" }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="divider" v-if="match.is_covered || match.has_showers || averageAge"></div>

          <div class="features-row" v-if="match.is_covered || match.has_showers || averageAge">
            <div class="feature-item" v-if="match.is_covered">
              <ion-icon :icon="umbrella"></ion-icon>
              <span>Covered</span>
            </div>
            <div class="feature-item" v-if="match.has_showers">
              <ion-icon :icon="water"></ion-icon>
              <span>Showers</span>
            </div>
            <div class="feature-item" v-if="averageAge">
              <ion-icon :icon="peopleOutline"></ion-icon>
              <span>Avg Age: {{ averageAge }}</span>
            </div>
          </div>
        </div>

        <!-- Post Match Section -->
        <div class="post-match-card">
          <div class="pm-content">
            <div class="pm-icon">
              <ion-icon :icon="beerOutline"></ion-icon>
            </div>
            <div class="pm-info">
              <h3>Post Match</h3>
              <p>{{ postMatchCount }} people staying</p>
            </div>
          </div>
          <ion-button
            v-if="isParticipant && match.status !== 'finished'"
            size="small"
            :fill="myPostMatchStatus ? 'solid' : 'outline'"
            :color="myPostMatchStatus ? 'warning' : 'medium'"
            @click="togglePostMatch"
            shape="round"
          >
            {{ myPostMatchStatus ? "I'm In!" : "Join" }}
          </ion-button>
        </div>

        <!-- Action Buttons -->
        <div class="actions-section">
          <div v-if="match.status === 'open' && !isParticipant">
            <ion-button expand="block" @click="joinMatch" size="large" :color="isFull ? 'warning' : 'primary'" class="main-action-btn">
              <ion-icon :icon="isFull ? timeOutline : personAddOutline" slot="start"></ion-icon>
              {{ isFull ? "Join Waitlist" : "Join Match" }}
            </ion-button>
          </div>
          <div v-if="match.status === 'open' && isConfirmed">
            <ion-button expand="block" color="danger" fill="outline" @click="leaveMatch" class="main-action-btn">
              <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
              Leave Match
            </ion-button>
          </div>
          <div v-if="match.status === 'open' && isWaitlisted">
            <ion-button expand="block" color="danger" fill="outline" @click="leaveMatch" class="main-action-btn">
              <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
              Leave Waitlist
            </ion-button>
          </div>

          <!-- Admin Controls -->
          <div v-if="isAdmin && (match.status === 'open' || match.status === 'locked')" class="admin-controls-grid">
            <ion-button expand="block" color="secondary" fill="solid" @click="generateTeams" class="admin-btn">
              <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
              Teams
            </ion-button>
            <ion-button expand="block" color="warning" fill="solid" @click="changeStatus('voting')" class="admin-btn">
              <ion-icon :icon="starOutline" slot="start"></ion-icon>
              Voting
            </ion-button>
            <ion-button expand="block" color="tertiary" fill="solid" @click="editMatch" class="admin-btn">
              <ion-icon :icon="createOutline" slot="start"></ion-icon>
              Edit
            </ion-button>
            <ion-button v-if="isCreator" expand="block" color="danger" fill="clear" @click="deleteMatch" class="admin-btn full-width">
              <ion-icon :icon="trashOutline" slot="start"></ion-icon>
              Delete Match
            </ion-button>
          </div>
          <div v-if="isAdmin && match.status === 'voting'">
            <ion-button expand="block" color="danger" @click="changeStatus('finished')" class="main-action-btn">
              <ion-icon :icon="flagOutline" slot="start"></ion-icon>
              Finish Match
            </ion-button>
          </div>
        </div>

        <!-- Pending Requests -->
        <div v-if="isAdmin && pendingParticipants.length > 0" class="list-section">
          <div class="section-title">
            <h3>Pending Requests</h3>
            <ion-badge color="tertiary">{{ pendingParticipants.length }}</ion-badge>
          </div>
          <div class="participants-card">
            <ion-list lines="none">
              <ion-item v-for="p in pendingParticipants" :key="p.id">
                <ion-avatar slot="start">
                  <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                </ion-avatar>
                <ion-label>
                  <h2>{{ p.username }}</h2>
                  <p>Wants to join</p>
                </ion-label>
                <div class="action-buttons-small">
                  <ion-button color="success" fill="clear" @click="approveRequest(p.user_id)">
                    <ion-icon :icon="checkmarkOutline" slot="icon-only"></ion-icon>
                  </ion-button>
                  <ion-button color="danger" fill="clear" @click="rejectRequest(p.user_id)">
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
            <h3>Waitlist</h3>
            <ion-badge color="warning">{{ waitlistParticipants.length }}</ion-badge>
          </div>
          <div class="participants-card">
            <ion-list lines="none">
              <ion-item v-for="p in waitlistParticipants" :key="p.id" button @click="goToProfile(p.user_id)">
                <ion-avatar slot="start">
                  <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                </ion-avatar>
                <ion-label>
                  <h2>{{ p.username }}</h2>
                  <p>Waiting...</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </div>
        </div>

        <!-- Participants / Teams -->
        <div class="list-section">
          <div class="section-title">
            <h3>Participants</h3>
            <ion-badge color="medium">{{ activeParticipants ? activeParticipants.length : 0 }} / {{ match.max_players || 10 }}</ion-badge>
          </div>

          <div v-if="hasTeams" class="teams-container">
            <!-- Team A -->
            <div class="team-block">
              <div class="team-header-label team-a">TEAM A</div>
              <div class="participants-card">
                <ion-list lines="none">
                  <ion-item v-for="p in teamAParticipants" :key="p.id">
                    <ion-avatar slot="start" @click="goToProfile(p.user_id)">
                      <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                    </ion-avatar>
                    <ion-label @click="goToProfile(p.user_id)">
                      <h2>{{ p.username }}</h2>
                      <p>Skill: {{ p.skill_rating || "N/A" }}</p>
                    </ion-label>
                    <div slot="end" class="item-actions">
                      <ion-icon v-if="p.is_admin" :icon="shieldCheckmarkOutline" color="secondary" class="status-icon"></ion-icon>
                      <ion-icon v-if="p.is_captain" :icon="ribbon" color="warning" class="status-icon"></ion-icon>
                      <ion-icon v-if="p.post_match" :icon="beer" color="warning" class="status-icon"></ion-icon>
                      <ion-icon :icon="cashOutline" :color="p.has_paid ? 'success' : 'medium'" class="status-icon"></ion-icon>
                      <ion-button
                        v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id"
                        fill="outline"
                        size="small"
                        :disabled="myVotes.includes(p.user_id)"
                        @click.stop="openVoteModal(p)"
                      >
                        {{ myVotes.includes(p.user_id) ? "Voted" : "Vote" }}
                      </ion-button>
                      <ion-button v-if="isAdmin" fill="clear" size="small" @click.stop="openPlayerActions(p)">
                        <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
                      </ion-button>
                    </div>
                  </ion-item>
                </ion-list>
              </div>
            </div>

            <!-- Team B -->
            <div class="team-block">
              <div class="team-header-label team-b">TEAM B</div>
              <div class="participants-card">
                <ion-list lines="none">
                  <ion-item v-for="p in teamBParticipants" :key="p.id">
                    <ion-avatar slot="start" @click="goToProfile(p.user_id)">
                      <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                    </ion-avatar>
                    <ion-label @click="goToProfile(p.user_id)">
                      <h2>{{ p.username }}</h2>
                      <p>Skill: {{ p.skill_rating || "N/A" }}</p>
                    </ion-label>
                    <div slot="end" class="item-actions">
                      <ion-icon v-if="p.is_admin" :icon="shieldCheckmarkOutline" color="secondary" class="status-icon"></ion-icon>
                      <ion-icon v-if="p.is_captain" :icon="ribbon" color="warning" class="status-icon"></ion-icon>
                      <ion-icon v-if="p.post_match" :icon="beer" color="warning" class="status-icon"></ion-icon>
                      <ion-icon :icon="cashOutline" :color="p.has_paid ? 'success' : 'medium'" class="status-icon"></ion-icon>
                      <ion-button
                        v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id"
                        fill="outline"
                        size="small"
                        :disabled="myVotes.includes(p.user_id)"
                        @click.stop="openVoteModal(p)"
                      >
                        {{ myVotes.includes(p.user_id) ? "Voted" : "Vote" }}
                      </ion-button>
                      <ion-button v-if="isAdmin" fill="clear" size="small" @click.stop="openPlayerActions(p)">
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
                <ion-avatar slot="start" @click="goToProfile(p.user_id)">
                  <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                </ion-avatar>
                <ion-label @click="goToProfile(p.user_id)">
                  <h2>{{ p.username }}</h2>
                  <p>
                    <span v-if="p.status !== 'confirmed'">{{ p.status }}</span>
                    <span v-if="p.user_status" :class="'status-text ' + p.user_status">{{ p.user_status }}</span>
                  </p>
                </ion-label>
                <div slot="end" class="item-actions">
                  <ion-icon v-if="p.is_admin" :icon="shieldCheckmarkOutline" color="secondary" class="status-icon"></ion-icon>
                  <ion-icon v-if="p.post_match" :icon="beer" color="warning" class="status-icon"></ion-icon>
                  <ion-icon :icon="cashOutline" :color="p.has_paid ? 'success' : 'medium'" class="status-icon"></ion-icon>
                  <ion-button
                    v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id"
                    fill="outline"
                    size="small"
                    :disabled="myVotes.includes(p.user_id)"
                    @click.stop="openVoteModal(p)"
                  >
                    {{ myVotes.includes(p.user_id) ? "Voted" : "Vote" }}
                  </ion-button>
                  <ion-button v-if="isAdmin" fill="clear" size="small" @click.stop="openPlayerActions(p)">
                    <ion-icon slot="icon-only" :icon="ellipsisVertical"></ion-icon>
                  </ion-button>
                </div>
              </ion-item>
            </ion-list>
          </div>

          <div v-if="hasTeams" class="field-container ion-margin-top">
            <div class="section-title">
              <h3>Formation</h3>
            </div>
            <FormationField
              :players="[...teamAParticipants, ...teamBParticipants]"
              :is-editable="isAdmin"
              :sport-type="match.sport_type"
              @save="saveFormation"
            />
          </div>
        </div>

        <!-- Results Section -->
        <div v-if="match.status === 'finished'" class="results-section">
          <div class="section-title">
            <h3>Match Results</h3>
            <ion-icon :icon="trophyOutline" color="warning"></ion-icon>
          </div>

          <div class="winner-card">
            <div class="winner-label">WINNER</div>
            <h1 class="winner-team" v-if="match.winner !== 'Draw'">TEAM {{ match.winner }}</h1>
            <h1 class="winner-team draw" v-else>DRAW</h1>
          </div>

          <div class="participants-card" v-if="results.length > 0">
            <ion-list lines="none">
              <ion-item v-for="(r, index) in results" :key="r.target_id" button @click="goToProfile(r.target_id)">
                <div slot="start" class="rank-number">{{ index + 1 }}</div>
                <ion-label>
                  <h2>{{ r.target_name }}</h2>
                  <div class="rating-bar-container">
                    <div class="rating-bar" :style="{ width: r.averageRating * 10 + '%' }"></div>
                  </div>
                  <div class="badges-row" v-if="r.badges && r.badges.length > 0">
                    <ion-badge v-for="badge in r.badges" :key="badge.name" color="secondary" class="result-badge-chip">
                      {{ badge.name }} <span v-if="badge.count > 1">x{{ badge.count }}</span>
                    </ion-badge>
                  </div>
                </ion-label>
                <div slot="end" class="rating-score">
                  <span class="score">{{ r.averageRating.toFixed(1) }}</span>
                  <span class="votes">{{ r.voteCount }} votes</span>
                </div>
              </ion-item>
            </ion-list>
          </div>
        </div>
      </div>
    </ion-content>
    <div v-else class="ion-padding">
      <div class="ion-text-center ion-padding-top">
        <ion-spinner></ion-spinner>
        <p>Loading match details...</p>
      </div>
    </div>
    <InviteFriendModal
      :is-open="isInviteModalOpen"
      :match-id="match?.id"
      :participants="match?.participants || []"
      @close="isInviteModalOpen = false"
    />
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import api from "../services/api";
import socket from "../services/socket";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCardSubtitle,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonButton,
  IonButtons,
  IonBackButton,
  modalController,
  alertController,
  actionSheetController,
  toastController,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";
import {
  locationOutline,
  cashOutline,
  personAddOutline,
  peopleOutline,
  starOutline,
  flagOutline,
  trophyOutline,
  timeOutline,
  closeCircleOutline,
  calendarOutline,
  football,
  basketball,
  tennisball,
  baseballOutline,
  umbrella,
  water,
  personOutline,
  beerOutline,
  beer,
  checkmarkOutline,
  closeOutline,
  trashOutline,
  createOutline,
  swapHorizontalOutline,
  ribbonOutline,
  ribbon,
  shieldCheckmarkOutline,
  mapOutline,
  ellipsisVertical,
} from "ionicons/icons";
import VoteModal from "../components/VoteModal.vue";
import InviteFriendModal from "../components/InviteFriendModal.vue";
import FormationField from "../components/FormationField.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();
const match = ref(null);
const votes = ref([]);
const myVotes = ref([]);
const isInviteModalOpen = ref(false);
const currentUser = computed(() => store.getters.currentUser);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const presentToast = async (message, color = "danger") => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    color: color,
    position: "top",
  });
  await toast.present();
};

const isWaitlisted = computed(() => {
  if (!match.value || !match.value.participants || !currentUser.value) return false;
  return match.value.participants.some((p) => p.user_id === currentUser.value.id && p.status === "waitlist");
});

const isConfirmed = computed(() => {
  if (!match.value || !match.value.participants || !currentUser.value) return false;
  return match.value.participants.some((p) => p.user_id === currentUser.value.id && p.status === "confirmed");
});

const waitlistParticipants = computed(() => {
  return match.value?.participants?.filter((p) => p.status === "waitlist") || [];
});

const pendingParticipants = computed(() => {
  return match.value?.participants?.filter((p) => p.status === "pending_approval") || [];
});

const activeParticipants = computed(() => {
  return match.value?.participants?.filter((p) => p.status !== "waitlist" && p.status !== "pending_approval" && p.status !== "declined") || [];
});

const hasTeams = computed(() => {
  return activeParticipants.value.some((p) => p.team);
});

const teamAParticipants = computed(() => {
  return activeParticipants.value.filter((p) => p.team === "A" || p.team === "Team A");
});

const teamBParticipants = computed(() => {
  return activeParticipants.value.filter((p) => p.team === "B" || p.team === "Team B");
});

const isFull = computed(() => {
  const confirmedCount = match.value?.participants?.filter((p) => p.status === "confirmed").length || 0;
  return confirmedCount >= (match.value?.max_players || 10);
});

const averageAge = computed(() => {
  if (!activeParticipants.value || activeParticipants.value.length === 0) return null;

  const participantsWithAge = activeParticipants.value.filter((p) => p.birth_date);
  if (participantsWithAge.length === 0) return null;

  const totalAge = participantsWithAge.reduce((sum, p) => {
    const birthDate = new Date(p.birth_date);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return sum + Math.abs(ageDate.getUTCFullYear() - 1970);
  }, 0);

  return (totalAge / participantsWithAge.length).toFixed(1);
});

const getStatusColor = (status) => {
  switch (status) {
    case "open":
      return "success";
    case "locked":
      return "warning";
    case "finished":
      return "medium";
    case "voting":
      return "tertiary";
    default:
      return "primary";
  }
};

const getSportIcon = (type) => {
  switch (type) {
    case "soccer":
      return football;
    case "volleyball":
      return baseballOutline;
    case "padel":
    case "tennis":
      return tennisball;
    default:
      return calendarOutline;
  }
};

const isParticipant = computed(() => {
  if (!match.value || !match.value.participants || !currentUser.value) return false;
  return match.value.participants.some((p) => p.user_id === currentUser.value.id);
});

const isCreator = computed(() => {
  if (!match.value || !currentUser.value) return false;
  return match.value.creator_id == currentUser.value.id;
});

const isAdmin = computed(() => {
  if (!match.value || !currentUser.value) return false;
  if (match.value.creator_id == currentUser.value.id) return true;
  const me = match.value.participants?.find((p) => p.user_id === currentUser.value.id);
  return me && me.is_admin;
});

const postMatchCount = computed(() => {
  return activeParticipants.value.filter((p) => p.post_match).length;
});

const myPostMatchStatus = computed(() => {
  if (!currentUser.value) return false;
  const me = activeParticipants.value.find((p) => p.user_id === currentUser.value.id);
  return me ? !!me.post_match : false;
});

const results = computed(() => {
  if (votes.value.length === 0) return [];

  const grouped = {};
  votes.value.forEach((v) => {
    if (!grouped[v.target_id]) {
      grouped[v.target_id] = {
        target_id: v.target_id,
        target_name: v.target_name,
        totalRating: 0,
        voteCount: 0,
        tags: {},
      };
    }
    grouped[v.target_id].totalRating += v.rating;
    grouped[v.target_id].voteCount++;

    if (v.tags) {
      const tagList = v.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      tagList.forEach((tag) => {
        grouped[v.target_id].tags[tag] = (grouped[v.target_id].tags[tag] || 0) + 1;
      });
    }
  });

  return Object.values(grouped)
    .map((g) => ({
      ...g,
      averageRating: g.totalRating / g.voteCount,
      badges: Object.entries(g.tags)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.averageRating - a.averageRating);
});

const goToProfile = (userId) => {
  router.push(`/profile/${userId}`);
};

const openMaps = (location) => {
  const query = encodeURIComponent(location);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
};

const openInviteModal = () => {
  isInviteModalOpen.value = true;
};

const fetchMatch = async () => {
  try {
    const response = await api.get(`/matches/${route.params.id}`);
    match.value = response.data;

    if (match.value.status === "finished") {
      fetchVotes();
    }
    if (match.value.status === "voting") {
      fetchMyVotes();
    }
  } catch (error) {
    console.error("Error fetching match:", error);
    presentToast("Error fetching match details");
  }
};

const fetchVotes = async () => {
  try {
    const response = await api.get(`/votes/match/${route.params.id}`);
    votes.value = response.data;
  } catch (error) {
    console.error("Error fetching votes:", error);
  }
};

const fetchMyVotes = async () => {
  try {
    const response = await api.get(`/votes/match/${route.params.id}/mine`);
    myVotes.value = response.data.map((v) => v.target_id);
  } catch (error) {
    console.error("Error fetching my votes:", error);
  }
};

const joinMatch = async () => {
  try {
    let accessCode = null;
    // Only ask for code if private, not creator, AND NOT FRIEND
    if (match.value.is_private && !isCreator.value && !match.value.is_friend) {
      const alert = await alertController.create({
        header: "Private Match",
        message: "Enter access code to join immediately, or leave blank to send a request.",
        inputs: [
          {
            name: "code",
            type: "text",
            placeholder: "Access Code",
          },
        ],
        buttons: [
          {
            text: "Cancel",
            role: "cancel",
          },
          {
            text: "Join",
            handler: (data) => {
              return data;
            },
          },
        ],
      });
      await alert.present();
      const { role, data } = await alert.onDidDismiss();
      if (role === "cancel") return;
      accessCode = data.values.code;
    }

    const response = await api.post(`/matches/${route.params.id}/join`, { status: "confirmed", access_code: accessCode });
    if (response.data.status === "waitlist") {
      presentToast("Match is full. You have been added to the waitlist.", "warning");
    } else if (response.data.status === "pending_approval") {
      presentToast("Request sent to the organizer.", "success");
    }
    await fetchMatch(); // Refresh data
  } catch (error) {
    console.error("Error joining match:", error);
    presentToast("Failed to join match: " + (error.response?.data?.error || error.message));
  }
};

const leaveMatch = async () => {
  try {
    if (!confirm("Are you sure you want to leave this match?")) return;

    await api.post(`/matches/${route.params.id}/leave`);
    await fetchMatch();
  } catch (error) {
    console.error("Error leaving match:", error);
    presentToast("Failed to leave match: " + (error.response?.data?.error || error.message));
  }
};

const editMatch = () => {
  router.push(`/matches/${match.value.id}/edit`);
};

const deleteMatch = async () => {
  const alert = await alertController.create({
    header: "Delete Match",
    message: "Are you sure you want to delete this match? This action cannot be undone and all participants will be notified.",
    buttons: [
      {
        text: "Cancel",
        role: "cancel",
      },
      {
        text: "Delete",
        role: "destructive",
        handler: async () => {
          try {
            await api.delete(`/matches/${route.params.id}`);
            router.push("/matches");
          } catch (error) {
            console.error("Error deleting match:", error);
            // show alert
          }
        },
      },
    ],
  });
  await alert.present();
};

const changeStatus = async (newStatus) => {
  try {
    let winner = null;
    if (newStatus === "finished") {
      const alert = await alertController.create({
        header: "Select Winner",
        buttons: [
          {
            text: "Team A",
            role: "A",
            handler: () => {
              winner = "A";
            },
          },
          {
            text: "Team B",
            role: "B",
            handler: () => {
              winner = "B";
            },
          },
          {
            text: "Draw",
            role: "Draw",
            handler: () => {
              winner = "Draw";
            },
          },
        ],
      });

      await alert.present();
      const { role } = await alert.onDidDismiss();
      if (role && role !== "backdrop") {
        winner = role;
      } else {
        return; // Cancelled
      }
    }

    await api.put(`/matches/${route.params.id}/status`, { status: newStatus, winner });
    await fetchMatch();
  } catch (error) {
    console.error("Error updating status:", error);
    presentToast("Failed to update status");
  }
};

const generateTeams = async () => {
  try {
    const response = await api.post(`/matches/${route.params.id}/generate-teams`);
    presentToast(`Teams generated! Team A: ${response.data.stats.teamA_count}, Team B: ${response.data.stats.teamB_count}`, "success");
    await fetchMatch();
  } catch (error) {
    console.error("Error generating teams:", error);
    presentToast("Failed to generate teams: " + (error.response?.data?.error || error.message));
  }
};

const togglePostMatch = async () => {
  try {
    const newStatus = !myPostMatchStatus.value;
    await api.put(`/matches/${route.params.id}/post-match`, { post_match: newStatus });
    await fetchMatch();
  } catch (error) {
    console.error("Error updating post-match status:", error);
    presentToast("Failed to update status");
  }
};

const togglePayment = async (participant) => {
  console.log("Toggling payment for:", participant.user_id);
  if (!isCreator.value) return;
  try {
    await api.put(`/matches/${match.value.id}/payment`, { userId: participant.user_id });
  } catch (error) {
    console.error("Error toggling payment:", error);
    presentToast("Failed to update payment status");
  }
};

const movePlayer = async (userId, team) => {
  try {
    await api.put(`/matches/${match.value.id}/move-player`, { userId, team });
    // Socket will update the list, but we can also fetch manually if needed
  } catch (error) {
    console.error("Error moving player:", error);
    presentToast("Failed to move player");
  }
};

const openPlayerActions = async (player) => {
  const buttons = [];

  // Admin Toggle
  buttons.push({
    text: player.is_admin ? "Remove Admin" : "Make Admin",
    icon: shieldCheckmarkOutline,
    handler: () => toggleAdmin(player),
  });

  // Captain Toggle
  buttons.push({
    text: player.is_captain ? "Remove Captain" : "Make Captain",
    icon: player.is_captain ? ribbonOutline : ribbon,
    handler: () => toggleCaptain(player),
  });

  // Payment Toggle
  buttons.push({
    text: player.has_paid ? "Mark Unpaid" : "Mark Paid",
    icon: cashOutline,
    handler: () => togglePayment(player),
  });

  // Move Player (only if teams exist)
  if (hasTeams.value) {
    const targetTeam = player.team === "A" || player.team === "Team A" ? "B" : "A";
    buttons.push({
      text: `Move to Team ${targetTeam}`,
      icon: swapHorizontalOutline,
      handler: () => movePlayer(player.user_id, targetTeam),
    });
  }

  // Cancel
  buttons.push({
    text: "Cancel",
    role: "cancel",
    icon: closeOutline,
  });

  const actionSheet = await actionSheetController.create({
    header: `Manage ${player.username}`,
    buttons: buttons,
  });
  await actionSheet.present();
};

const saveFormation = async (positions) => {
  try {
    await api.put(`/matches/${match.value.id}/positions`, { positions });
    // Socket will update
  } catch (error) {
    console.error("Error saving formation:", error);
    presentToast("Failed to save formation");
  }
};

const approveRequest = async (userId) => {
  try {
    await api.post(`/matches/${route.params.id}/approve`, { userId });
    await fetchMatch();
  } catch (error) {
    console.error("Error approving request:", error);
    presentToast("Failed to approve request");
  }
};

const rejectRequest = async (userId) => {
  try {
    await api.post(`/matches/${route.params.id}/reject`, { userId });
    await fetchMatch();
  } catch (error) {
    console.error("Error rejecting request:", error);
    presentToast("Failed to reject request");
  }
};

const openVoteModal = async (participant) => {
  const modal = await modalController.create({
    component: VoteModal,
    componentProps: {
      matchId: match.value.id,
      targetId: participant.user_id,
      targetName: participant.username,
    },
  });

  modal.onDidDismiss().then((data) => {
    if (data.role === "confirm") {
      console.log("Vote submitted");
      fetchMyVotes();
    }
  });

  await modal.present();
};

const toggleAdmin = async (participant) => {
  try {
    const response = await api.put(`/matches/${match.value.id}/admin`, {
      targetUserId: participant.user_id,
    });
    fetchMatch();
  } catch (error) {
    console.error("Error toggling admin:", error);
    presentToast("Failed to update admin status: " + (error.response?.data?.error || error.message));
  }
};

const toggleCaptain = async (player) => {
  try {
    // If already captain, unset (userId = null)
    // If not captain, set (userId = player.user_id)
    const newCaptainId = player.is_captain ? null : player.user_id;

    await api.put(`/matches/${match.value.id}/captain`, {
      userId: newCaptainId,
      team: player.team,
    });

    // Optimistic update or wait for socket
    fetchMatch();
  } catch (error) {
    console.error("Error toggling captain:", error);
    presentToast("Failed to update captain", "danger");
  }
};

onMounted(() => {
  fetchMatch();

  socket.on("match_updated", (data) => {
    if (data.matchId == route.params.id) {
      fetchMatch();
    }
  });
});

onUnmounted(() => {
  socket.off("match_updated");
});
</script>

<style scoped>
.page-content {
  /* --background: #ffffff; */
  height: 100%;
  overflow-y: auto;
}

.match-header {
  background: white;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.sport-icon-large {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  box-shadow: var(--shadow-lg);
}

.sport-icon-large.soccer {
  background-color: #2dd36f;
}
.sport-icon-large.basketball {
  background-color: #ffc409;
}
.sport-icon-large.tennis {
  background-color: #eb445a;
}
.sport-icon-large.padel {
  background-color: #3dc2ff;
}
.sport-icon-large.volleyball {
  background-color: #5260ff;
}

.header-info h1 {
  margin: 0 0 8px;
  font-weight: 800;
  font-size: 1.8rem;
  text-transform: capitalize;
  color: var(--ion-color-dark);
}

.header-badges {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: var(--rounded-lg);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.details-wrapper {
  padding: 0 16px 40px;
}

.info-card {
  background: white;
  border-radius: var(--rounded-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  gap: 20px;
}

.info-block {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-block.full-width {
  width: 100%;
}

.info-icon {
  font-size: 1.4rem;
  color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.08);
  padding: 10px;
  border-radius: var(--rounded-sm);
}

.info-text {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.sub-value {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.organizer-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.mini-avatar {
  width: 24px;
  height: 24px;
}

.divider {
  height: 1px;
  background: #f0f2f5;
  margin: 16px 0;
}

.features-row {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: #f8f9fa;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--rounded-md);
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.post-match-card {
  background: white;
  border-radius: var(--rounded-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-5);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pm-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.pm-icon {
  font-size: 1.5rem;
  color: var(--ion-color-warning);
  background: rgba(var(--ion-color-warning-rgb), 0.1);
  padding: var(--space-3);
  border-radius: var(--rounded-sm);
}

.pm-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.pm-info p {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.actions-section {
  margin-bottom: var(--space-6);
}

.main-action-btn {
  margin-bottom: var(--space-3);
  --border-radius: var(--rounded-md);
  font-weight: 600;
}

.admin-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.admin-btn {
  margin: 0;
  --border-radius: var(--rounded-sm);
}

.admin-btn.full-width {
  grid-column: span 2;
}

.list-section {
  margin-bottom: var(--space-6);
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding: 0 var(--space-1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: 0;
  padding: 0;
}

.view-segment {
  width: 100px;
  min-height: 32px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.participants-card {
  background: white;
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.teams-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.team-header-label {
  font-size: 0.8rem;
  font-weight: 800;
  margin-bottom: var(--space-2);
  padding-left: var(--space-2);
  text-transform: uppercase;
}

.team-a {
  color: var(--ion-color-primary);
}
.team-b {
  color: var(--ion-color-tertiary);
}

.item-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.status-icon {
  font-size: 1.2rem;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.status-text.available {
  color: var(--ion-color-success);
}
.status-text.injured {
  color: var(--ion-color-danger);
}
.status-text.unavailable {
  color: var(--ion-color-medium);
}

.results-section {
  margin-top: var(--space-8);
}

.winner-card {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: var(--rounded-lg);
  padding: var(--space-5);
  text-align: center;
  color: white;
  margin-bottom: var(--space-5);
  box-shadow: 0 4px 15px rgba(255, 170, 0, 0.3);
}

.winner-label {
  font-size: 0.9rem;
  font-weight: 700;
  opacity: 0.9;
  letter-spacing: 1px;
}

.winner-team {
  margin: 5px 0 0;
  font-size: 2rem;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.winner-team.draw {
  color: white;
}

.rank-number {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--ion-color-medium);
  width: 30px;
  text-align: center;
}

.rating-bar-container {
  height: 6px;
  background-color: #f0f2f5;
  border-radius: 3px;
  margin: var(--space-2) 0;
  overflow: hidden;
  width: 100px;
}

.rating-bar {
  height: 100%;
  background-color: var(--ion-color-warning);
}

.rating-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.rating-score .score {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.rating-score .votes {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.result-badge-chip {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px var(--space-2);
  border-radius: var(--rounded-sm);
  height: auto;
}

.map-container {
  margin: var(--space-4) 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
</style>
