<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t("friends.title") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToNotifications">
            <ion-icon :icon="notificationsOutline"></ion-icon>
            <ion-badge
              color="danger"
              v-if="unreadCount > 0"
              style="position: absolute; top: 0; right: 0; font-size: 0.6rem; --padding-start: 4px; --padding-end: 4px"
              >{{ unreadCount }}</ion-badge
            >
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
      <ion-toolbar color="primary">
        <ion-segment v-model="selectedTab" mode="md">
          <ion-segment-button value="list">
            <ion-label>{{ t("friends.title") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="leaderboard">
            <ion-label>{{ t("friends.leaderboard") }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <div class="ion-padding" v-if="selectedTab === 'list'">
        <!-- Search Section -->
        <div class="section-container">
          <ion-searchbar v-model="searchQuery" :placeholder="t('friends.search_placeholder')" @ionInput="handleSearch"></ion-searchbar>

          <div v-if="searchResults.length > 0" class="search-results">
            <ion-list lines="none">
              <ion-item v-for="user in searchResults" :key="user.id" button @click="goToProfile(user.id)">
                <ion-avatar slot="start">
                  <img :src="user.avatar_url || '/default-avatar.svg'" />
                </ion-avatar>
                <ion-label>
                  <h2>{{ user.username }}</h2>
                  <p>{{ user.status }}</p>
                </ion-label>
                <ion-icon :icon="chevronForwardOutline" slot="end" color="medium"></ion-icon>
              </ion-item>
            </ion-list>
          </div>
        </div>

        <!-- Pending Requests Section -->
        <div v-if="pendingRequests.length > 0" class="section-container">
          <div class="section-title">
            <ion-icon :icon="timeOutline" color="warning"></ion-icon>
            <h3>{{ t("friends.pending_requests") }}</h3>
          </div>
          <ion-card class="custom-card">
            <ion-list lines="none">
              <ion-item v-for="req in pendingRequests" :key="req.id">
                <ion-avatar slot="start" @click="goToProfile(req.requester_id)">
                  <img :src="req.avatar_url || '/default-avatar.svg'" />
                </ion-avatar>
                <ion-label>
                  <h2>{{ req.username }}</h2>
                  <p>{{ t("friends.wants_to_be_friend") }}</p>
                </ion-label>
                <ion-button slot="end" size="small" color="success" @click="acceptFriendRequest(req.id)">
                  <ion-icon :icon="checkmarkCircleOutline"></ion-icon>
                </ion-button>
                <ion-button slot="end" size="small" color="danger" @click="rejectFriendRequest(req.id)">
                  <ion-icon :icon="closeCircleOutline"></ion-icon>
                </ion-button>
              </ion-item>
            </ion-list>
          </ion-card>
        </div>

        <!-- Friends List Section -->
        <div class="section-container">
          <div class="section-title">
            <ion-icon :icon="peopleOutline" color="primary"></ion-icon>
            <h3>{{ t("friends.my_friends", { count: friendsList.length }) }}</h3>
          </div>

          <div v-if="friendsList.length > 0">
            <ion-card class="custom-card" v-for="friend in friendsList" :key="friend.id" button @click="goToProfile(friend.id)">
              <ion-item lines="none">
                <ion-avatar slot="start">
                  <img :src="friend.avatar_url || '/default-avatar.svg'" />
                </ion-avatar>
                <ion-label>
                  <h2>{{ friend.username }}</h2>
                  <p>
                    <span :class="'status-text ' + friend.status">{{ friend.status }}</span>
                  </p>
                </ion-label>
                <ion-button slot="end" fill="clear" color="danger" @click.stop="confirmRemoveFriend(friend)">
                  <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
                </ion-button>
                <ion-icon :icon="chevronForwardOutline" slot="end" color="medium"></ion-icon>
              </ion-item>
            </ion-card>
          </div>

          <div v-else class="empty-state">
            <ion-icon :icon="peopleOutline" class="empty-icon"></ion-icon>
            <p>{{ t("friends.no_friends") }}</p>
          </div>
        </div>
      </div>

      <!-- Leaderboard Tab -->
      <div class="ion-padding" v-if="selectedTab === 'leaderboard'">
        <div class="sort-buttons">
          <ion-button size="small" :fill="leaderboardSort === 'matches' ? 'solid' : 'outline'" @click="leaderboardSort = 'matches'">
            {{ t("friends.matches") }}
          </ion-button>
          <ion-button size="small" :fill="leaderboardSort === 'win_rate' ? 'solid' : 'outline'" @click="leaderboardSort = 'win_rate'">
            {{ t("friends.win_rate") }}
          </ion-button>
        </div>

        <ion-card class="leaderboard-card">
          <div class="leaderboard-header">
            <span class="rank-col">#</span>
            <span class="player-col">{{ t("friends.player") }}</span>
            <span class="stat-col">{{ leaderboardSort === "matches" ? t("friends.matches") : t("friends.win_rate") }}</span>
          </div>

          <div v-if="sortedLeaderboard.length > 0">
            <div v-for="(friend, index) in sortedLeaderboard" :key="friend.id" class="leaderboard-row" @click="goToProfile(friend.id)">
              <span class="rank-col">
                <span v-if="index < 3" class="medal" :class="'medal-' + (index + 1)">{{ index + 1 }}</span>
                <span v-else>{{ index + 1 }}</span>
              </span>
              <div class="player-col player-info">
                <ion-avatar class="small-avatar">
                  <img :src="friend.avatar_url || '/default-avatar.svg'" />
                </ion-avatar>
                <span class="username">{{ friend.username }}</span>
              </div>
              <span class="stat-col highlight">
                {{ leaderboardSort === "matches" ? friend.matches_played : friend.win_rate + "%" }}
              </span>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>{{ t("friends.no_friends") }}</p>
          </div>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";
import api from "../services/api";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonMenuButton,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButton,
  IonIcon,
  IonCard,
  IonBadge,
  toastController,
  alertController,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
} from "@ionic/vue";
import {
  peopleOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  chevronForwardOutline,
  trashOutline,
  notificationsOutline,
} from "ionicons/icons";

const store = useStore();
const router = useRouter();
const { t } = useI18n();
const friendsList = ref([]);
const pendingRequests = ref([]);
const searchQuery = ref("");
const searchResults = ref([]);
const selectedTab = ref("list");
const leaderboardSort = ref("matches");

const unreadCount = computed(() => store.getters.unreadNotificationsCount);

const sortedLeaderboard = computed(() => {
  return [...friendsList.value].sort((a, b) => {
    if (leaderboardSort.value === "matches") {
      return (b.matches_played || 0) - (a.matches_played || 0);
    } else {
      return (b.win_rate || 0) - (a.win_rate || 0);
    }
  });
});

const goToNotifications = () => {
  router.push("/notifications");
};

const handleSearch = async (event) => {
  const query = event.target.value;
  if (!query || query.length < 2) {
    searchResults.value = [];
    return;
  }

  try {
    const response = await api.get(`/users/search?q=${query}`);
    searchResults.value = response.data;
  } catch (error) {
    console.error("Error searching users:", error);
  }
};

const fetchFriends = async () => {
  try {
    const response = await api.get("/friends");
    friendsList.value = response.data;
  } catch (error) {
    console.error("Error fetching friends:", error);
  }
};

const fetchPendingRequests = async () => {
  try {
    const response = await api.get("/friends/pending");
    pendingRequests.value = response.data;
  } catch (error) {
    console.error("Error fetching pending requests:", error);
  }
};

const confirmRemoveFriend = async (friend) => {
  const alert = await alertController.create({
    header: t("friends.remove_friend"),
    message: t("friends.remove_confirm", { name: friend.username }),
    buttons: [
      {
        text: t("common.cancel"),
        role: "cancel",
      },
      {
        text: t("common.remove"),
        role: "destructive",
        handler: () => {
          removeFriend(friend.id);
        },
      },
    ],
  });
  await alert.present();
};

const removeFriend = async (friendId) => {
  try {
    await api.delete(`/friends/${friendId}`);
    friendsList.value = friendsList.value.filter((f) => f.id !== friendId);
    presentToast(t("friends.removed"));
  } catch (error) {
    console.error("Error removing friend:", error);
    presentToast(t("friends.remove_error"), "danger");
  }
};

const acceptFriendRequest = async (id) => {
  try {
    await api.put(`/friends/accept/${id}`);
    pendingRequests.value = pendingRequests.value.filter((r) => r.id !== id);
    fetchFriends();
    presentToast(t("friends.accepted"));
  } catch (error) {
    console.error("Error accepting friend request:", error);
    presentToast(t("friends.accept_error"), "danger");
  }
};

const rejectFriendRequest = async (id) => {
  try {
    await api.put(`/friends/reject/${id}`);
    pendingRequests.value = pendingRequests.value.filter((r) => r.id !== id);
    presentToast(t("friends.rejected"));
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    presentToast(t("friends.reject_error"), "danger");
  }
};

const presentToast = async (message, color = "success") => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    color: color,
    position: "top",
  });
  await toast.present();
};

const goToProfile = (userId) => {
  router.push(`/profile/${userId}`);
};

onMounted(() => {
  fetchFriends();
  fetchPendingRequests();
});
</script>

<style scoped>
.page-content {
  --background: var(--ion-background-color);
}

.section-container {
  margin-bottom: var(--space-5);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  padding-left: var(--space-1);
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.custom-card {
  background: white;
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-sm);
  margin: 0 0 var(--space-3) 0;
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

.empty-state {
  text-align: center;
  padding: var(--space-10) var(--space-5);
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--space-3);
  opacity: 0.5;
}

.search-results {
  background: white;
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-sm);
  margin-top: var(--space-3);
  overflow: hidden;
}

/* Leaderboard Styles */
.sort-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.leaderboard-card {
  background: white;
  border-radius: 15px;
  padding: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.leaderboard-header {
  display: flex;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 700;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
  text-transform: uppercase;
}

.leaderboard-row {
  display: flex;
  align-items: center;
  padding: 15px 10px;
  border-bottom: 1px solid #f9f9f9;
  cursor: pointer;
}

.leaderboard-row:last-child {
  border-bottom: none;
}

.rank-col {
  width: 40px;
  text-align: center;
  font-weight: 700;
  color: var(--ion-color-medium);
}

.player-col {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-col {
  width: 80px;
  text-align: center;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.stat-col.highlight {
  color: var(--ion-color-primary);
  font-size: 1.1rem;
}

.small-avatar {
  width: 35px;
  height: 35px;
}

.username {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.medal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: white;
  font-size: 0.8rem;
}

.medal-1 {
  background: #ffd700; /* Gold */
  box-shadow: 0 2px 5px rgba(255, 215, 0, 0.4);
}

.medal-2 {
  background: #c0c0c0; /* Silver */
  box-shadow: 0 2px 5px rgba(192, 192, 192, 0.4);
}

.medal-3 {
  background: #cd7f32; /* Bronze */
  box-shadow: 0 2px 5px rgba(205, 127, 50, 0.4);
}
</style>
