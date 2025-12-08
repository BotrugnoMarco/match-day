<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Match Details</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content" v-if="match">
      <!-- Banner -->
      <div class="page-banner">
        <div class="match-banner-content">
          <ion-icon :icon="getSportIcon(match.sport_type)" class="banner-icon"></ion-icon>
          <h2>{{ match.sport_type.toUpperCase() }}</h2>
          <ion-badge :color="getStatusColor(match.status)" class="status-badge">{{ match.status.toUpperCase() }}</ion-badge>
        </div>
      </div>

      <div class="details-container ion-padding-horizontal">
        <!-- Info Card -->
        <div class="custom-card info-card">
          <div class="info-row">
            <div class="info-item">
              <ion-icon :icon="calendarOutline" class="info-icon"></ion-icon>
              <div>
                <div class="label">Date</div>
                <div class="value">{{ new Date(match.date_time).toLocaleDateString() }}</div>
              </div>
            </div>
            <div class="info-item">
              <ion-icon :icon="timeOutline" class="info-icon"></ion-icon>
              <div>
                <div class="label">Time</div>
                <div class="value">{{ new Date(match.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }}</div>
              </div>
            </div>
          </div>
          <div class="divider"></div>
          <div class="info-row">
            <div class="info-item">
              <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
              <div>
                <div class="label">Location</div>
                <div class="value">{{ match.location }}</div>
              </div>
            </div>
            <div class="info-item">
              <ion-icon :icon="cashOutline" class="info-icon"></ion-icon>
              <div>
                <div class="label">Price</div>
                <div class="value">€{{ match.price_total }}</div>
              </div>
            </div>
          </div>
          <div class="divider" v-if="averageAge"></div>
          <div class="info-row" v-if="averageAge">
            <div class="info-item">
              <ion-icon :icon="peopleOutline" class="info-icon"></ion-icon>
              <div>
                <div class="label">Avg Age</div>
                <div class="value">{{ averageAge }} years</div>
              </div>
            </div>
          </div>
          <div class="divider" v-if="match.is_covered || match.has_showers"></div>
          <div class="info-row" v-if="match.is_covered || match.has_showers">
            <div class="info-item" v-if="match.is_covered">
              <ion-icon :icon="umbrellaOutline" class="info-icon"></ion-icon>
              <div>
                <div class="label">Field</div>
                <div class="value">Covered</div>
              </div>
            </div>
            <div class="info-item" v-if="match.has_showers">
              <ion-icon :icon="waterOutline" class="info-icon"></ion-icon>
              <div>
                <div class="label">Showers</div>
                <div class="value">Available</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-container ion-margin-bottom">
          <div v-if="match.status === 'open' && !isParticipant">
            <ion-button expand="block" @click="joinMatch" size="large" :color="isFull ? 'warning' : 'primary'" class="action-btn">
              <ion-icon :icon="isFull ? timeOutline : personAddOutline" slot="start"></ion-icon>
              {{ isFull ? "Join Waitlist" : "Join Match" }}
            </ion-button>
          </div>
          <div v-if="match.status === 'open' && isConfirmed">
            <ion-button expand="block" color="danger" @click="leaveMatch" class="action-btn">
              <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
              Leave Match
            </ion-button>
          </div>
          <div v-if="match.status === 'open' && isWaitlisted">
            <ion-button expand="block" color="danger" @click="leaveMatch" class="action-btn">
              <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
              Leave Waitlist
            </ion-button>
          </div>

          <!-- Admin/Creator Controls -->
          <div v-if="isCreator && (match.status === 'open' || match.status === 'locked')" class="admin-controls">
            <ion-button expand="block" color="secondary" @click="generateTeams" class="action-btn ion-margin-top">
              <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
              Generate Teams
            </ion-button>
            <ion-button expand="block" color="warning" @click="changeStatus('voting')" class="action-btn ion-margin-top">
              <ion-icon :icon="starOutline" slot="start"></ion-icon>
              Start Voting
            </ion-button>
          </div>
          <div v-if="isCreator && match.status === 'voting'">
            <ion-button expand="block" color="danger" @click="changeStatus('finished')" class="action-btn ion-margin-top">
              <ion-icon :icon="flagOutline" slot="start"></ion-icon>
              Finish Match
            </ion-button>
          </div>
        </div>

        <!-- Waitlist -->
        <div v-if="waitlistParticipants.length > 0" class="section-header">
          <h3>Waitlist</h3>
          <ion-badge color="warning">{{ waitlistParticipants.length }}</ion-badge>
        </div>

        <div class="custom-card participants-list" v-if="waitlistParticipants.length > 0">
          <ion-list lines="none">
            <ion-item v-for="p in waitlistParticipants" :key="p.id" button @click="goToProfile(p.user_id)">
              <ion-avatar slot="start">
                <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
              </ion-avatar>
              <ion-label>
                <h2>{{ p.username }}</h2>
                <p>
                  Waiting...
                  <span v-if="p.status" :class="'status-text ' + p.status">• {{ p.status }}</span>
                </p>
              </ion-label>
            </ion-item>
          </ion-list>
        </div>

        <!-- Participants List -->
        <div class="section-header">
          <h3>Participants</h3>
          <ion-badge color="medium">{{ activeParticipants ? activeParticipants.length : 0 }}</ion-badge>
        </div>

        <div v-if="hasTeams">
          <div class="team-header">
            <ion-badge color="primary">TEAM A</ion-badge>
          </div>
          <div class="custom-card participants-list">
            <ion-list lines="none">
              <ion-item v-for="p in teamAParticipants" :key="p.id" button @click="goToProfile(p.user_id)">
                <ion-avatar slot="start">
                  <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                </ion-avatar>
                <ion-label>
                  <h2>{{ p.username }}</h2>
                  <p>
                    Skill: {{ p.skill_rating || "N/A" }}
                    <span v-if="p.status" :class="'status-text ' + p.status">• {{ p.status }}</span>
                  </p>
                </ion-label>
                <ion-button
                  slot="end"
                  fill="outline"
                  size="small"
                  v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id"
                  :disabled="myVotes.includes(p.user_id)"
                  @click.stop="openVoteModal(p)"
                >
                  {{ myVotes.includes(p.user_id) ? "Voted" : "Vote" }}
                </ion-button>
              </ion-item>
            </ion-list>
          </div>

          <div class="team-header">
            <ion-badge color="tertiary">TEAM B</ion-badge>
          </div>
          <div class="custom-card participants-list">
            <ion-list lines="none">
              <ion-item v-for="p in teamBParticipants" :key="p.id" button @click="goToProfile(p.user_id)">
                <ion-avatar slot="start">
                  <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                </ion-avatar>
                <ion-label>
                  <h2>{{ p.username }}</h2>
                  <p>
                    Skill: {{ p.skill_rating || "N/A" }}
                    <span v-if="p.status" :class="'status-text ' + p.status">• {{ p.status }}</span>
                  </p>
                </ion-label>
                <ion-button
                  slot="end"
                  fill="outline"
                  size="small"
                  v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id"
                  :disabled="myVotes.includes(p.user_id)"
                  @click.stop="openVoteModal(p)"
                >
                  {{ myVotes.includes(p.user_id) ? "Voted" : "Vote" }}
                </ion-button>
              </ion-item>
            </ion-list>
          </div>
        </div>

        <div class="custom-card participants-list" v-else>
          <ion-list lines="none">
            <ion-item v-for="p in activeParticipants" :key="p.id" button @click="goToProfile(p.user_id)">
              <ion-avatar slot="start">
                <img :src="p.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
              </ion-avatar>
              <ion-label>
                <h2>{{ p.username }}</h2>
                <p>
                  {{ p.status }}
                  <span v-if="p.status && ['available', 'injured', 'unavailable'].includes(p.status)" :class="'status-text ' + p.status"
                    >• {{ p.status }}</span
                  >
                </p>
              </ion-label>
              <ion-button
                slot="end"
                fill="outline"
                size="small"
                v-if="match.status === 'voting' && currentUser && p.user_id !== currentUser.id"
                :disabled="myVotes.includes(p.user_id)"
                @click.stop="openVoteModal(p)"
              >
                {{ myVotes.includes(p.user_id) ? "Voted" : "Vote" }}
              </ion-button>
            </ion-item>
          </ion-list>
        </div>

        <!-- Results Section -->
        <div v-if="match.status === 'finished'">
          <div class="section-header">
            <h3>Match Results</h3>
            <ion-icon :icon="trophyOutline" color="warning"></ion-icon>
          </div>

          <div class="custom-card ion-text-center ion-padding ion-margin-bottom">
            <ion-card-subtitle>WINNER</ion-card-subtitle>
            <h1 class="winner-text" v-if="match.winner !== 'Draw'">TEAM {{ match.winner }}</h1>
            <h1 class="winner-text draw" v-else>DRAW</h1>
          </div>

          <div class="custom-card participants-list" v-if="results.length > 0">
            <ion-list lines="none">
              <ion-item v-for="(r, index) in results" :key="r.target_id" button @click="goToProfile(r.target_id)">
                <div slot="start" class="rank-number">{{ index + 1 }}</div>
                <ion-label>
                  <h2>{{ r.target_name }}</h2>
                  <div class="rating-bar-container">
                    <div class="rating-bar" :style="{ width: r.averageRating * 10 + '%' }"></div>
                  </div>
                  <p>
                    Rating: <strong>{{ r.averageRating.toFixed(1) }}</strong> / 10
                  </p>
                  <div class="badges-row" v-if="r.badges && r.badges.length > 0">
                    <ion-badge v-for="badge in r.badges" :key="badge.name" color="secondary" class="result-badge-chip">
                      {{ badge.name }} <span v-if="badge.count > 1">x{{ badge.count }}</span>
                    </ion-badge>
                  </div>
                </ion-label>
                <ion-badge slot="end" color="light">{{ r.voteCount }} votes</ion-badge>
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
  umbrellaOutline,
  waterOutline,
} from "ionicons/icons";
import VoteModal from "../components/VoteModal.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();
const match = ref(null);
const votes = ref([]);
const myVotes = ref([]);
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

const leaveMatch = async () => {
  try {
    if (!confirm("Are you sure you want to leave this match?")) return;

    await api.post(`/matches/${route.params.id}/leave`);
    await fetchMatch();
  } catch (error) {
    console.error("Error leaving match:", error);
    alert("Failed to leave match: " + (error.response?.data?.error || error.message));
  }
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
.page-content {
  --background: #f4f5f8;
  /* min-height: 100vh; */
  height: 100%;
  overflow-y: auto;
}

.status-text {
  font-size: 0.8em;
  font-weight: bold;
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

.details-container {
  min-height: 0;
  height: auto;
}

.page-banner {
  background: var(--ion-color-primary);
  padding: 20px 20px 50px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: white;
}

.match-banner-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.banner-icon {
  font-size: 3rem;
}

.match-banner-content h2 {
  margin: 0;
  font-weight: 800;
  font-size: 1.8rem;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 700;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.details-container {
  margin-top: -40px;
}

.custom-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  overflow: hidden;
}

.info-card {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.info-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  padding: 8px;
  border-radius: 10px;
}

.label {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-weight: 600;
}

.value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.divider {
  height: 1px;
  background: #f0f2f5;
  margin: 15px 0;
}

.action-btn {
  --border-radius: 12px;
  margin-bottom: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 5px;
  margin-bottom: 10px;
}

.section-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.participants-list ion-item {
  --padding-start: 10px;
  --inner-padding-end: 10px;
}

.team-header {
  padding-left: 5px;
  margin-bottom: 5px;
  margin-top: 15px;
}

.winner-text {
  font-weight: 900;
  color: var(--ion-color-primary);
  margin: 10px 0;
}

.winner-text.draw {
  color: var(--ion-color-medium);
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
  margin: 5px 0;
  overflow: hidden;
  width: 100px;
}

.rating-bar {
  height: 100%;
  background-color: var(--ion-color-warning);
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.result-badge-chip {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 10px;
}
</style>
