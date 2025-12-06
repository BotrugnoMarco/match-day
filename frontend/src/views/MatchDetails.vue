<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Match Details</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding" v-if="match">
      <!-- Match Info Card -->
      <ion-card class="match-info-card">
        <ion-card-header>
          <div class="status-badge-container">
            <ion-badge :color="getStatusColor(match.status)">{{ match.status.toUpperCase() }}</ion-badge>
          </div>
          <ion-card-title class="ion-text-center">{{ match.sport_type.toUpperCase() }}</ion-card-title>
          <ion-card-subtitle class="ion-text-center">{{ new Date(match.date_time).toLocaleString() }}</ion-card-subtitle>
        </ion-card-header>
        <ion-card-content>
          <ion-list lines="none">
            <ion-item>
              <ion-icon :icon="locationOutline" slot="start"></ion-icon>
              <ion-label>
                <h3>Location</h3>
                <p>{{ match.location }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-icon :icon="cashOutline" slot="start"></ion-icon>
              <ion-label>
                <h3>Price</h3>
                <p>€{{ match.price_total }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>

      <!-- Actions -->
      <div class="ion-padding-horizontal ion-margin-bottom">
        <div v-if="match.status === 'open' && !isParticipant">
          <ion-button expand="block" @click="joinMatch" size="large" :color="isFull ? 'warning' : 'primary'">
            <ion-icon :icon="isFull ? timeOutline : personAddOutline" slot="start"></ion-icon>
            {{ isFull ? "Join Waitlist" : "Join Match" }}
          </ion-button>
        </div>
        <div v-if="match.status === 'open' && isConfirmed">
          <ion-button expand="block" color="medium" disabled>
            <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
            Joined
          </ion-button>
        </div>
        <div v-if="match.status === 'open' && isWaitlisted">
          <ion-button expand="block" color="warning" disabled>
            <ion-icon :icon="timeOutline" slot="start"></ion-icon>
            On Waitlist
          </ion-button>
        </div>

        <!-- Admin/Creator Controls -->
        <div v-if="isCreator && (match.status === 'open' || match.status === 'locked')" class="admin-controls">
          <ion-button expand="block" color="secondary" @click="generateTeams" class="ion-margin-top">
            <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
            Generate Teams
          </ion-button>
          <ion-button expand="block" color="warning" @click="changeStatus('voting')" class="ion-margin-top">
            <ion-icon :icon="starOutline" slot="start"></ion-icon>
            Start Voting
          </ion-button>
        </div>
        <div v-if="isCreator && match.status === 'voting'">
          <ion-button expand="block" color="danger" @click="changeStatus('finished')" class="ion-margin-top">
            <ion-icon :icon="flagOutline" slot="start"></ion-icon>
            Finish Match
          </ion-button>
        </div>
      </div>

      <!-- Waitlist -->
      <div v-if="waitlistParticipants.length > 0" class="section-header ion-margin-top">
        <h3>Waitlist</h3>
        <ion-badge color="warning">{{ waitlistParticipants.length }}</ion-badge>
      </div>

      <ion-card class="participants-card" v-if="waitlistParticipants.length > 0">
        <ion-list>
          <ion-item v-for="p in waitlistParticipants" :key="p.id">
            <ion-avatar slot="start">
              <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
            </ion-avatar>
            <ion-label>
              <h2>{{ p.username }}</h2>
              <p>Waiting...</p>
            </ion-label>
          </ion-item>
        </ion-list>
      </ion-card>

      <!-- Participants List -->
      <div class="section-header">
        <h3>Participants</h3>
        <ion-badge color="medium">{{ activeParticipants ? activeParticipants.length : 0 }}</ion-badge>
      </div>

      <ion-card class="participants-card">
        <ion-list>
          <ion-item v-for="p in activeParticipants" :key="p.id">
            <ion-avatar slot="start">
              <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
            </ion-avatar>
            <ion-label>
              <h2>{{ p.username }}</h2>
              <p>{{ p.status }}</p>
            </ion-label>
            <ion-badge slot="end" v-if="p.team" :color="p.team === 'Team A' ? 'primary' : 'tertiary'" class="ion-margin-end">
              {{ p.team }}
            </ion-badge>

            <ion-button
              slot="end"
              fill="outline"
              size="small"
              v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id"
              @click="openVoteModal(p)"
            >
              Vote
            </ion-button>
          </ion-item>
        </ion-list>
      </ion-card>

      <!-- Results Section -->
      <div v-if="match.status === 'finished' && results.length > 0">
        <div class="section-header">
          <h3>Match Results</h3>
          <ion-icon :icon="trophyOutline" color="warning"></ion-icon>
        </div>
        <ion-card>
          <ion-list>
            <ion-item v-for="(r, index) in results" :key="r.target_id">
              <div slot="start" class="rank-number">{{ index + 1 }}</div>
              <ion-label>
                <h2>{{ r.target_name }}</h2>
                <div class="rating-bar-container">
                  <div class="rating-bar" :style="{ width: r.averageRating * 10 + '%' }"></div>
                </div>
                <p>
                  Rating: <strong>{{ r.averageRating.toFixed(1) }}</strong> / 10
                </p>
              </ion-label>
              <ion-badge slot="end" color="light">{{ r.voteCount }} votes</ion-badge>
            </ion-item>
          </ion-list>
        </ion-card>
      </div>
    </ion-content>
    <ion-content v-else class="ion-padding">
      <div class="ion-text-center ion-padding-top">
        <ion-spinner></ion-spinner>
        <p>Loading match details...</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import api from "../services/api";
import socket from "../services/socket";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonButton,
  IonButtons,
  IonBackButton,
  modalController,
  IonIcon,
  IonSpinner,
} from "@ionic/vue";
import {
  locationOutline,
  cashOutline,
  personAddOutline,
  checkmarkCircleOutline,
  peopleOutline,
  starOutline,
  flagOutline,
  trophyOutline,
  timeOutline,
} from "ionicons/icons";
import VoteModal from "../components/VoteModal.vue";

const route = useRoute();
const store = useStore();
const match = ref(null);
const votes = ref([]);
const currentUser = computed(() => store.getters.currentUser);

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

const activeParticipants = computed(() => {
  return match.value?.participants?.filter((p) => p.status !== "waitlist") || [];
});

const isFull = computed(() => {
  const confirmedCount = match.value?.participants?.filter((p) => p.status === "confirmed").length || 0;
  return confirmedCount >= (match.value?.max_players || 10);
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

const isParticipant = computed(() => {
  if (!match.value || !match.value.participants || !currentUser.value) return false;
  return match.value.participants.some((p) => p.user_id === currentUser.value.id);
});

const isCreator = computed(() => {
  if (!match.value || !currentUser.value) return false;
  return match.value.creator_id === currentUser.value.id;
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
      };
    }
    grouped[v.target_id].totalRating += v.rating;
    grouped[v.target_id].voteCount++;
  });

  return Object.values(grouped)
    .map((g) => ({
      ...g,
      averageRating: g.totalRating / g.voteCount,
    }))
    .sort((a, b) => b.averageRating - a.averageRating);
});

const fetchMatch = async () => {
  try {
    const response = await api.get(`/matches/${route.params.id}`);
    match.value = response.data;

    if (match.value.status === "finished") {
      fetchVotes();
    }
  } catch (error) {
    console.error("Error fetching match:", error);
    alert("Error fetching match details");
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

const joinMatch = async () => {
  try {
    const response = await api.post(`/matches/${route.params.id}/join`, { status: "confirmed" });
    if (response.data.status === "waitlist") {
      alert("Match is full. You have been added to the waitlist.");
    }
    await fetchMatch(); // Refresh data
  } catch (error) {
    console.error("Error joining match:", error);
    alert("Failed to join match: " + (error.response?.data?.error || error.message));
  }
};

const changeStatus = async (newStatus) => {
  try {
    await api.put(`/matches/${route.params.id}/status`, { status: newStatus });
    await fetchMatch();
  } catch (error) {
    console.error("Error updating status:", error);
    alert("Failed to update status");
  }
};

const generateTeams = async () => {
  try {
    const response = await api.post(`/matches/${route.params.id}/generate-teams`);
    alert(`Teams generated! Team A: ${response.data.stats.teamA_count}, Team B: ${response.data.stats.teamB_count}`);
    await fetchMatch();
  } catch (error) {
    console.error("Error generating teams:", error);
    alert("Failed to generate teams: " + (error.response?.data?.error || error.message));
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
      // Maybe refresh or show success toast
      console.log("Vote submitted");
    }
  });

  await modal.present();
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
.match-info-card {
  margin-top: 0;
  margin-bottom: 20px;
}

.status-badge-container {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  margin-top: 20px;
  margin-bottom: 10px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--ion-color-dark);
}

.participants-card {
  margin: 0;
}

.rank-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--ion-color-medium);
  width: 30px;
  text-align: center;
}

.rating-bar-container {
  height: 6px;
  background-color: var(--ion-color-light-shade);
  border-radius: 3px;
  margin: 5px 0;
  overflow: hidden;
}

.rating-bar {
  height: 100%;
  background-color: var(--ion-color-warning);
}

.admin-controls {
  border-top: 1px solid var(--ion-color-light);
  padding-top: 10px;
  margin-top: 10px;
}
</style>
