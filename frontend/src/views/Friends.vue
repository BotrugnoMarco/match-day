<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Friends</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <div class="ion-padding">
        <!-- Search Section -->
        <div class="section-container">
          <ion-searchbar v-model="searchQuery" placeholder="Search users..." @ionInput="handleSearch"></ion-searchbar>

          <div v-if="searchResults.length > 0" class="search-results">
            <ion-list lines="none">
              <ion-item v-for="user in searchResults" :key="user.id" button @click="goToProfile(user.id)">
                <ion-avatar slot="start">
                  <img :src="user.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
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
            <h3>Pending Requests</h3>
          </div>
          <ion-card class="custom-card">
            <ion-list lines="none">
              <ion-item v-for="req in pendingRequests" :key="req.id">
                <ion-avatar slot="start" @click="goToProfile(req.requester_id)">
                  <img :src="req.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                </ion-avatar>
                <ion-label>
                  <h2>{{ req.username }}</h2>
                  <p>Wants to be your friend</p>
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
            <h3>My Friends ({{ friendsList.length }})</h3>
          </div>

          <div v-if="friendsList.length > 0">
            <ion-card class="custom-card" v-for="friend in friendsList" :key="friend.id" button @click="goToProfile(friend.id)">
              <ion-item lines="none">
                <ion-avatar slot="start">
                  <img :src="friend.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
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
            <p>No friends yet. Search for players in matches to add them!</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonButton,
  IonIcon,
  IonCard,
  toastController,
  alertController,
  IonSearchbar,
} from "@ionic/vue";
import { peopleOutline, timeOutline, checkmarkCircleOutline, closeCircleOutline, chevronForwardOutline, trashOutline } from "ionicons/icons";

const router = useRouter();
const friendsList = ref([]);
const pendingRequests = ref([]);
const searchQuery = ref("");
const searchResults = ref([]);

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
    header: "Remove Friend",
    message: `Are you sure you want to remove ${friend.username} from your friends?`,
    buttons: [
      {
        text: "Cancel",
        role: "cancel",
      },
      {
        text: "Remove",
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
    presentToast("Friend removed successfully");
  } catch (error) {
    console.error("Error removing friend:", error);
    presentToast("Failed to remove friend", "danger");
  }
};

const acceptFriendRequest = async (id) => {
  try {
    await api.put(`/friends/accept/${id}`);
    pendingRequests.value = pendingRequests.value.filter((r) => r.id !== id);
    fetchFriends();
    presentToast("Friend request accepted!");
  } catch (error) {
    console.error("Error accepting friend request:", error);
    presentToast("Failed to accept request", "danger");
  }
};

const rejectFriendRequest = async (id) => {
  try {
    await api.put(`/friends/reject/${id}`);
    pendingRequests.value = pendingRequests.value.filter((r) => r.id !== id);
    presentToast("Friend request rejected");
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    presentToast("Failed to reject request", "danger");
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
  --background: #ffffff;
}

.section-container {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding-left: 5px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.custom-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin: 0 0 10px 0;
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
  padding: 40px 20px;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 10px;
  opacity: 0.5;
}

.search-results {
  background: white;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-top: 10px;
  overflow: hidden;
}
</style>
