<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button v-if="isOwnProfile"></ion-menu-button>
          <ion-back-button v-else default-href="/matches" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t("profile.title") }}</ion-title>
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

    <EditProfileModal
      :is-open="isEditModalOpen"
      :user="user"
      @close="closeEditModal"
      @save="saveProfile"
      @export="exportData"
      @delete="confirmDeleteAccount"
    />

    <ion-content class="profile-content">
      <ProfileHeader
        :user="user"
        :is-own-profile="isOwnProfile"
        :friendship-status="friendshipStatus"
        @send-friend-request="sendFriendRequest"
        @accept-friend-request="acceptFriendRequest"
        @reject-friend-request="rejectFriendRequest"
        @open-friends="router.push('/friends')"
        @change-avatar="handleFileChange"
        @open-edit-modal="openEditModal"
      />

      <ProfileStats :stats="stats" :form="formHistory" />

      <ProfileRatingChart :history="history" />

      <ProfileSkills :skills="user?.skills" :stats="stats" />

      <ProfileBadges :tags="stats?.tags" />

      <ProfileHistory :history="history" :limit="5" @go-to-match="goToMatch" @view-all="goToAllMatches" />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "../services/api";
import socket from "../services/socket";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonBadge,
  IonMenuButton,
  toastController,
  alertController,
} from "@ionic/vue";
import { createOutline, notificationsOutline } from "ionicons/icons";

import ProfileHeader from "../components/profile/ProfileHeader.vue";
import ProfileStats from "../components/profile/ProfileStats.vue";
import ProfileRatingChart from "../components/profile/ProfileRatingChart.vue";
import ProfileSkills from "../components/profile/ProfileSkills.vue";
import ProfileBadges from "../components/profile/ProfileBadges.vue";
import ProfileHistory from "../components/profile/ProfileHistory.vue";
import EditProfileModal from "../components/profile/EditProfileModal.vue";

const store = useStore();
const router = useRouter();
const route = useRoute();
const { t } = useI18n();

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

const openEditModal = () => {
  isEditModalOpen.value = true;
};

const closeEditModal = () => {
  isEditModalOpen.value = false;
};

const saveProfile = async (formData) => {
  try {
    const payload = {
      username: formData.username,
      email: formData.email,
      birth_date: formData.birth_date ? formData.birth_date.split("T")[0] : null,
      gender: formData.gender,
      status: formData.status,
      preferred_number: formData.preferred_number !== null && formData.preferred_number !== "" ? parseInt(formData.preferred_number) : null,
      skills: formData.skills,
    };

    await api.put("/users/profile", payload);

    // Update local store
    const updatedUser = { ...currentUser.value, ...payload };
    store.commit("SET_USER", updatedUser);

    presentToast("Profile updated successfully", "success");
    closeEditModal();
  } catch (error) {
    console.error("Error updating profile:", error);
    presentToast("Error updating profile: " + (error.response?.data?.error || error.message), "danger");
  }
};

const stats = computed(() => (isOwnProfile.value ? store.getters.userStats : viewedUserStats.value));
const history = computed(() => (isOwnProfile.value ? myHistory.value : viewedUserHistory.value));

const formHistory = computed(() => {
  if (!history.value || history.value.length === 0) return [];
  // Sort by date desc just in case, though usually API returns sorted
  const sorted = [...history.value].sort((a, b) => new Date(b.date_time) - new Date(a.date_time));
  return sorted
    .slice(0, 5)
    .map((match) => match.result)
    .reverse(); // Show oldest to newest (left to right) or newest to oldest? Usually newest is right.
  // Let's return newest first (index 0) but for display we might want to reverse it to show timeline ->
  // Actually, "Last 5 matches" usually shows: [Oldest of 5] ... [Newest]
  // So if I take slice(0, 5), I get the 5 most recent.
  // If I reverse them, I get [5th recent, 4th recent, ..., Most recent]
});

const myHistory = ref([]);

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

  socket.on("friend:updated", (data) => {
    // If we are viewing the profile of the user involved in the update
    if (route.params.id && parseInt(route.params.id) == data.userId) {
      fetchFriendshipStatus(data.userId);
    }
  });
});

onUnmounted(() => {
  socket.off("friend:updated");
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

const goToAllMatches = () => {
  if (isOwnProfile.value) {
    router.push("/matches?filter=mine");
  } else {
    router.push(`/profile/${user.value.id}/history`);
  }
};

const fetchMyHistory = async () => {
  try {
    const response = await api.get("/users/history");
    myHistory.value = response.data;
  } catch (error) {
    console.error("Error fetching history:", error);
  }
};

const handleFileChange = async (file) => {
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
    presentToast("Avatar updated successfully!", "success");
  } catch (error) {
    console.error("Error uploading avatar:", error);
    presentToast("Failed to upload avatar", "danger");
  }
};

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
</script>

<style scoped>
.profile-content {
  /* --background: #ffffff; */
  overflow-y: auto;
}
</style>
