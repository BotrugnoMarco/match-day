<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="profile-header" v-if="user">
        <div class="avatar-container" @click="triggerFileInput">
          <ion-avatar class="profile-avatar">
            <img :src="user.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
          </ion-avatar>
          <div class="edit-overlay">
            <ion-icon :icon="camera"></ion-icon>
          </div>
        </div>
        <input type="file" ref="fileInput" @change="handleFileChange" style="display: none" accept="image/*" />

        <h2>{{ user.username }}</h2>
        <p class="role-badge">{{ user.role.toUpperCase() }}</p>

        <ion-card class="stats-card">
          <ion-card-content>
            <div class="stats-grid">
              <div class="stat-item">
                <ion-icon :icon="star" color="warning" class="stat-icon"></ion-icon>
                <h3>{{ user.skill_rating || "N/A" }}</h3>
                <p>Skill Rating</p>
              </div>
              <div class="stat-item" v-if="stats">
                <ion-icon :icon="football" color="success" class="stat-icon"></ion-icon>
                <h3>{{ stats.matchesPlayed }}</h3>
                <p>Matches</p>
              </div>
              <div class="stat-item" v-if="stats">
                <ion-icon :icon="trophy" color="warning" class="stat-icon"></ion-icon>
                <h3>{{ stats.mvpCount }}</h3>
                <p>MVP</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <div v-if="stats && stats.recentRatings && stats.recentRatings.length > 0" class="recent-ratings ion-padding-top">
          <h3>Recent Ratings</h3>
          <ion-list>
            <ion-item v-for="(rating, index) in stats.recentRatings" :key="index">
              <ion-label>
                <h2>{{ rating.sport_type.toUpperCase() }}</h2>
                <p>{{ new Date(rating.date_time).toLocaleDateString() }}</p>
              </ion-label>
              <ion-badge slot="end" :color="getRatingColor(rating.rating)">{{ rating.rating }}</ion-badge>
            </ion-item>
          </ion-list>
        </div>
      </div>

      <div class="ion-padding">
        <ion-button expand="block" color="danger" fill="outline" @click="logout">
          <ion-icon :icon="logOutOutline" slot="start"></ion-icon>
          Logout
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useStore } from "vuex";
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
  IonAvatar,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
} from "@ionic/vue";
import { camera, star, logOutOutline, football, trophy } from "ionicons/icons";

const store = useStore();
const router = useRouter();
const user = computed(() => store.getters.currentUser);
const stats = computed(() => store.getters.userStats);
const fileInput = ref(null);

onMounted(() => {
  store.dispatch("fetchUserStats");
});

const getRatingColor = (rating) => {
  if (rating >= 8) return "success";
  if (rating >= 6) return "warning";
  return "danger";
};

const triggerFileInput = () => {
  fileInput.value.click();
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

    // Update user in store
    const updatedUser = { ...user.value, avatar_url: response.data.avatarUrl };
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
</script>

<style scoped>
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.avatar-container {
  position: relative;
  cursor: pointer;
}

.profile-avatar {
  width: 100px;
  height: 100px;
  margin-bottom: 10px;
}

.edit-overlay {
  position: absolute;
  bottom: 10px;
  right: 0;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.role-badge {
  background: var(--ion-color-light);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  margin-top: 5px;
}

.stats-card {
  width: 100%;
  margin-top: 20px;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 5px;
}

.stat-item h3 {
  margin: 0;
  font-size: 1.5em;
  font-weight: bold;
}

.stat-item p {
  margin: 0;
  font-size: 0.8em;
  color: var(--ion-color-medium);
}
</style>
