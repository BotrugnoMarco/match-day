<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button v-if="isOwnProfile"></ion-menu-button>
          <ion-back-button v-else default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile</ion-title>
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
          <ion-button @click="openEditModal" v-if="isOwnProfile">
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-modal :is-open="isEditModalOpen" @didDismiss="closeEditModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>Edit Profile</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeEditModal">Close</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-item>
          <ion-label position="stacked">Status</ion-label>
          <ion-select v-model="editForm.status" interface="popover">
            <ion-select-option value="available">Available</ion-select-option>
            <ion-select-option value="injured">Injured</ion-select-option>
            <ion-select-option value="unavailable">Unavailable</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Preferred Jersey Number</ion-label>
          <ion-input type="number" v-model="editForm.preferred_number" placeholder="e.g. 10"></ion-input>
        </ion-item>

        <div class="ion-padding-top">
          <ion-button expand="block" @click="saveProfile">Save Changes</ion-button>
          <ion-button expand="block" color="secondary" fill="outline" class="ion-margin-top" @click="exportData"> Export My Data </ion-button>
          <ion-button expand="block" color="danger" fill="outline" class="ion-margin-top" @click="confirmDeleteAccount"> Delete Account </ion-button>
        </div>
      </ion-content>
    </ion-modal>

    <ion-content class="profile-content">
      <!-- Profile Header with Gradient -->
      <div class="profile-banner">
        <div class="profile-header-row">
          <div class="avatar-wrapper" @click="triggerFileInput">
            <ion-avatar class="main-avatar">
              <img :src="user?.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
            </ion-avatar>
            <div class="edit-badge" v-if="isOwnProfile">
              <ion-icon :icon="camera" color="light"></ion-icon>
            </div>
          </div>

          <div class="profile-info">
            <h2 class="username">{{ user?.username }}</h2>
            <div class="badges-row">
              <ion-badge color="light" class="role-badge">{{ user?.role?.toUpperCase() }}</ion-badge>

              <div class="status-section">
                <ion-badge :color="getStatusColor(user?.status)" class="status-badge">
                  {{ user?.status?.toUpperCase() || "AVAILABLE" }}
                </ion-badge>
              </div>
            </div>

            <!-- Preferred Number -->
            <div class="preferred-number-section" v-if="user?.preferred_number">
              <div class="number-display">
                <span class="number-label">Jersey #</span>
                <span class="number-value">{{ user?.preferred_number }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Friend Actions -->
        <div class="friend-actions" v-if="!isOwnProfile">
          <ion-button v-if="friendshipStatus === 'none'" size="small" color="light" fill="outline" @click="sendFriendRequest">
            <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
            Add Friend
          </ion-button>
          <ion-button v-if="friendshipStatus === 'sent'" size="small" color="light" fill="outline" disabled>
            <ion-icon :icon="timeOutline" slot="start"></ion-icon>
            Request Sent
          </ion-button>
          <div v-if="friendshipStatus === 'received'" class="friend-request-actions">
            <ion-button size="small" color="success" @click="acceptFriendRequest">
              <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
              Accept
            </ion-button>
            <ion-button size="small" color="danger" @click="rejectFriendRequest">
              <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
              Reject
            </ion-button>
          </div>
          <ion-badge v-if="friendshipStatus === 'accepted'" color="success" class="friend-badge">
            <ion-icon :icon="checkmarkCircleOutline"></ion-icon> Friends
          </ion-badge>
        </div>

        <!-- My Friends Button -->
        <div class="friend-actions" v-if="isOwnProfile">
          <ion-button size="small" fill="outline" color="light" @click="router.push('/friends')">
            <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
            Friends
          </ion-button>
        </div>

        <input type="file" ref="fileInput" @change="handleFileChange" style="display: none" accept="image/*" />
      </div>

      <!-- Main Stats Grid -->
      <div class="stats-container ion-padding-horizontal">
        <ion-grid v-if="stats">
          <ion-row>
            <ion-col size="4">
              <div class="stat-box">
                <div class="stat-value">{{ stats.matchesPlayed }}</div>
                <div class="stat-label">Matches</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-box">
                <div class="stat-value text-primary">{{ stats.matchesWon }}</div>
                <div class="stat-label">Won</div>
              </div>
            </ion-col>
            <ion-col size="4">
              <div class="stat-box">
                <div class="stat-value text-warning">{{ stats.mvpCount }}</div>
                <div class="stat-label">MVP</div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>

      <!-- Skills Section -->
      <div class="section-container ion-padding-horizontal">
        <div class="section-title">
          <ion-icon :icon="trophy" color="warning"></ion-icon>
          <h3>Skills</h3>
        </div>
        <ion-card class="skills-card">
          <ion-card-content>
            <ion-list lines="none">
              <ion-item v-for="skill in user?.skills" :key="skill.sport_type">
                <ion-icon :icon="getSportIcon(skill.sport_type)" slot="start" class="sport-icon"></ion-icon>
                <ion-label>
                  <div class="skill-header">
                    <h3>{{ capitalize(skill.sport_type) }}</h3>
                    <span class="skill-rating">{{ skill.rating }}</span>
                  </div>
                  <ion-progress-bar :value="skill.rating / 10" :color="getSkillColor(skill.rating)"></ion-progress-bar>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Badges / Tags Section -->
      <div class="section-container ion-padding-horizontal" v-if="stats && stats.tags && stats.tags.length > 0">
        <div class="section-title">
          <ion-icon :icon="ribbon" color="secondary"></ion-icon>
          <h3>Badges</h3>
        </div>
        <div class="badges-container">
          <div v-for="tagItem in stats.tags" :key="tagItem.tag" class="badge-chip">
            <span class="badge-name">{{ tagItem.tag }}</span>
            <span class="badge-count">x{{ tagItem.count }}</span>
          </div>
        </div>
      </div>

      <!-- Match History -->
      <div class="section-container ion-padding-horizontal">
        <div class="section-title">
          <ion-icon :icon="timeOutline" color="medium"></ion-icon>
          <h3>History</h3>
        </div>

        <div v-if="history.length > 0">
          <ion-card v-for="match in history" :key="match.id" class="match-card" @click="goToMatch(match.id)">
            <ion-card-content class="match-card-content">
              <div class="match-left">
                <div class="match-date">
                  <span class="day">{{ new Date(match.date_time).getDate() }}</span>
                  <span class="month">{{ new Date(match.date_time).toLocaleString("default", { month: "short" }) }}</span>
                </div>
                <div class="match-info">
                  <h3 class="sport-name">{{ match.sport_type.toUpperCase() }}</h3>
                  <p class="location">{{ match.location }}</p>
                </div>
              </div>

              <div class="match-right">
                <div class="result-badge" :class="match.result">
                  {{ match.result?.toUpperCase() || "PLAYED" }}
                </div>
                <div class="rating-mini" v-if="match.avg_rating">
                  <ion-icon :icon="star" color="warning"></ion-icon>
                  <span>{{ match.avg_rating }}</span>
                </div>
              </div>
            </ion-card-content>
          </ion-card>
        </div>
        <div v-else class="empty-state">
          <p>No matches played yet.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import api from "../services/api";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonAvatar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
  IonSelect,
  IonSelectOption,
  IonModal,
  IonInput,
  IonMenuButton,
  toastController,
} from "@ionic/vue";
import {
  camera,
  star,
  createOutline,
  logOutOutline,
  football,
  trophy,
  ribbon,
  timeOutline,
  tennisballOutline,
  baseballOutline,
  personAddOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  peopleOutline,
  notificationsOutline,
} from "ionicons/icons";

const store = useStore();
const router = useRouter();
const route = useRoute();

const currentUser = computed(() => store.getters.currentUser);
const viewedUser = computed(() => store.getters.viewedUser);
const viewedUserStats = computed(() => store.getters.viewedUserStats);
const viewedUserHistory = computed(() => store.getters.viewedUserHistory);
const unreadCount = computed(() => store.getters.unreadNotificationsCount);

const goToNotifications = () => {
  router.push("/notifications");
};

const isOwnProfile = computed(() => {
  return !route.params.id || (currentUser.value && parseInt(route.params.id) === currentUser.value.id);
});

const user = computed(() => (isOwnProfile.value ? currentUser.value : viewedUser.value));
const friendshipStatus = ref("none"); // none, sent, received, accepted
const friendshipId = ref(null);

const isEditModalOpen = ref(false);
const editForm = ref({
  status: "available",
  preferred_number: null,
});

const openEditModal = () => {
  editForm.value = {
    status: user.value?.status || "available",
    preferred_number: user.value?.preferred_number,
  };
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const saveProfile = async () => {
  try {
    // Update status
    if (editForm.value.status !== user.value.status) {
      await store.dispatch("updateUserStatus", editForm.value.status);
    }

    // Update number
    let newNumber = editForm.value.preferred_number;
    if (newNumber === "" || newNumber === null || newNumber === undefined) {
      newNumber = null;
    } else {
      newNumber = parseInt(newNumber);
    }

    if (newNumber !== user.value.preferred_number) {
      await api.put("/users/profile", { preferred_number: newNumber });
      const updatedUser = { ...currentUser.value, preferred_number: newNumber };
      store.commit("SET_USER", updatedUser);
    }

    presentToast("Profile updated successfully");
    closeEditModal();
  } catch (error) {
    console.error("Error updating profile:", error);
    presentToast("Failed to update profile", "danger");
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "available":
      return "success";
    case "injured":
      return "danger";
    case "unavailable":
      return "medium";
    default:
      return "success";
  }
};

const stats = computed(() => (isOwnProfile.value ? store.getters.userStats : viewedUserStats.value));
const history = computed(() => (isOwnProfile.value ? myHistory.value : viewedUserHistory.value));

const myHistory = ref([]);
const fileInput = ref(null);

const loadData = async () => {
  if (isOwnProfile.value) {
    store.dispatch("fetchUserStats");
    store.dispatch("fetchUserProfile");
    fetchMyHistory();
  } else {
    const userId = route.params.id;
    store.dispatch("fetchUserProfileById", userId);
    store.dispatch("fetchUserStatsById", userId);
    store.dispatch("fetchUserHistoryById", userId);
    fetchFriendshipStatus(userId);
  }
};

const fetchFriendshipStatus = async (userId) => {
  try {
    const response = await api.get(`/friends/status/${userId}`);
    friendshipStatus.value = response.data.status;
    friendshipId.value = response.data.id;
  } catch (error) {
    console.error("Error fetching friendship status:", error);
  }
};

const sendFriendRequest = async () => {
  try {
    await api.post("/friends/request", { addressee_id: user.value.id });
    friendshipStatus.value = "sent";
    presentToast("Friend request sent!");
  } catch (error) {
    console.error("Error sending friend request:", error);
    presentToast("Failed to send request", "danger");
  }
};

const acceptFriendRequest = async () => {
  try {
    await api.put(`/friends/accept/${friendshipId.value}`);
    friendshipStatus.value = "accepted";
    presentToast("Friend request accepted!");
  } catch (error) {
    console.error("Error accepting friend request:", error);
    presentToast("Failed to accept request", "danger");
  }
};

const rejectFriendRequest = async () => {
  try {
    await api.put(`/friends/reject/${friendshipId.value}`);
    friendshipStatus.value = "none";
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

onMounted(() => {
  loadData();
});

watch(
  () => route.params.id,
  () => {
    loadData();
  }
);

const goToMatch = (matchId) => {
  router.push(`/matches/${matchId}`);
};

const fetchMyHistory = async () => {
  try {
    const response = await api.get("/users/history");
    myHistory.value = response.data;
  } catch (error) {
    console.error("Error fetching history:", error);
  }
};

const triggerFileInput = () => {
  if (isOwnProfile.value) {
    fileInput.value.click();
  }
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("avatar", file);

  try {
    const response = await api.post("/users/avatar", formData, {
      headers: {
        "Content-Type": undefined,
      },
    });

    const updatedUser = { ...currentUser.value, avatar_url: response.data.avatarUrl };
    store.commit("SET_USER", updatedUser);
    alert("Avatar updated successfully!");
  } catch (error) {
    console.error("Error uploading avatar:", error);
    alert("Failed to upload avatar");
  }
};

const logout = () => {
  store.dispatch("logout");
  router.push("/home");
};

import { alertController } from "@ionic/vue";

const confirmDeleteAccount = async () => {
  const alert = await alertController.create({
    header: "Delete Account",
    message: "Are you sure you want to delete your account? This action cannot be undone.",
    buttons: [
      {
        text: "Cancel",
        role: "cancel",
      },
      {
        text: "Delete",
        role: "destructive",
        handler: async () => {
          await deleteAccount();
        },
      },
    ],
  });
  await alert.present();
};

const deleteAccount = async () => {
  try {
    await api.delete("/users/profile");
    store.dispatch("logout");
    router.push("/login");
    presentToast("Account deleted successfully", "success");
  } catch (error) {
    console.error("Error deleting account:", error);
    presentToast("Failed to delete account", "danger");
  }
};

const exportData = async () => {
  try {
    const response = await api.get("/users/export", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `user_data_${currentUser.value.id}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    presentToast("Data exported successfully", "success");
  } catch (error) {
    console.error("Error exporting data:", error);
    presentToast("Failed to export data", "danger");
  }
};

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const getSportIcon = (sport) => {
  switch (sport) {
    case "soccer":
      return football;
    case "tennis":
      return tennisballOutline;
    case "padel":
      return tennisballOutline;
    case "volleyball":
      return baseballOutline;
    default:
      return trophy;
  }
};

const getSkillColor = (rating) => {
  if (rating >= 8) return "success";
  if (rating >= 6) return "primary";
  if (rating >= 4) return "warning";
  return "danger";
};
</script>

<style scoped>
.profile-content {
  /* --background: #ffffff; */
  overflow-y: auto;
}

.profile-banner {
  background: var(--ion-color-primary);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  color: white;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-md);
}

.profile-header-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.badges-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 5px;
  flex-wrap: wrap;
}

.status-section {
  display: flex;
  align-items: center;
}

.status-selector {
  --background: transparent;
  width: auto;
  --min-height: 0;
}

.custom-select {
  --padding-start: 10px;
  --padding-end: 10px;
  --padding-top: 5px;
  --padding-bottom: 5px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--rounded-lg);
  color: white;
  font-size: 0.8rem;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 0;
}

.main-avatar {
  width: 70px;
  height: 70px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.edit-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--ion-color-secondary);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.edit-badge ion-icon {
  font-size: 14px;
}

.username {
  margin: 0;
  font-weight: 700;
  font-size: 1.3rem;
}

.role-badge {
  margin-top: var(--space-1);
  opacity: 0.9;
}

.stats-container {
  margin-top: -20px;
  margin-bottom: var(--space-5);
}

.stat-box {
  background: white;
  border-radius: var(--rounded-md);
  padding: var(--space-4) var(--space-1);
  text-align: center;
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: var(--space-1);
}

.text-primary {
  color: var(--ion-color-primary);
}
.text-warning {
  color: var(--ion-color-warning);
}

.section-container {
  margin-bottom: var(--space-5);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-left: var(--space-1);
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.skills-card {
  margin: 0;
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-sm);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-1);
}

.skill-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.skill-rating {
  font-weight: bold;
  color: var(--ion-color-medium);
}

.sport-icon {
  font-size: 1.4rem;
  color: var(--ion-color-medium);
}

.badges-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.badge-chip {
  background: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--rounded-lg);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  box-shadow: var(--shadow-sm);
  border: 1px solid #f0f2f5;
}

.badge-name {
  font-weight: 600;
  color: var(--ion-color-dark);
  font-size: 0.9rem;
}

.badge-count {
  background: var(--ion-color-secondary);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 2px var(--space-2);
  border-radius: 10px;
}

.match-card {
  margin: 0 0 var(--space-4) 0;
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-sm);
}

.match-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
}

.match-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.match-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f0f2f5;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--rounded-sm);
  min-width: 50px;
}

.match-date .day {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.match-date .month {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--ion-color-medium);
  font-weight: 600;
}

.match-info .sport-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.match-info .location {
  margin: 3px 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.match-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.result-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: var(--space-1) var(--space-2);
  border-radius: 6px;
  text-transform: uppercase;
}

.preferred-number-section {
  margin-top: var(--space-3);
  display: flex;
  justify-content: center;
}

.number-selector {
  --background: rgba(255, 255, 255, 0.2);
  border-radius: var(--rounded-sm);
  width: 100px;
  --padding-start: 10px;
  --inner-padding-end: 10px;
}

.custom-input {
  --color: white;
  --placeholder-color: rgba(255, 255, 255, 0.6);
  font-weight: bold;
  text-align: center;
}

.number-display {
  background: rgba(255, 255, 255, 0.2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--rounded-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.number-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
}

.number-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
}

.result-badge.win {
  background: rgba(var(--ion-color-success-rgb), 0.1);
  color: var(--ion-color-success);
}
.result-badge.loss {
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  color: var(--ion-color-danger);
}
.result-badge.draw {
  background: rgba(var(--ion-color-medium-rgb), 0.1);
  color: var(--ion-color-medium);
}

.rating-mini {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.85rem;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  color: var(--ion-color-medium);
  padding: var(--space-5);
}
</style>
