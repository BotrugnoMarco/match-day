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

        <div v-if="history && history.length > 0" class="history-section ion-padding-top">
          <h3>Match History</h3>
          <ion-list>
            <ion-item v-for="match in history" :key="match.id" class="history-item" button @click="goToMatch(match.id)">
              <ion-label>
                <h2>{{ match.sport_type.toUpperCase() }}</h2>
                <p>{{ new Date(match.date_time).toLocaleDateString() }} - {{ match.location }}</p>
                <div v-if="match.tags && match.tags.length > 0" class="tags-container">
                  <ion-badge v-for="tag in match.tags" :key="tag" color="tertiary" class="tag-badge">{{ tag }}</ion-badge>
                </div>
              </ion-label>
              <div slot="end" class="rating-display" v-if="match.avg_rating">
                <span class="rating-value">{{ match.avg_rating }}</span>
                <ion-icon :icon="star" color="warning"></ion-icon>
              </div>
              <div slot="end" v-else>
                <ion-badge color="medium">No Votes</ion-badge>
              </div>
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
const history = ref([]);
const fileInput = ref(null);

onMounted(() => {
  store.dispatch("fetchUserStats");
  fetchHistory();
});

const goToMatch = (matchId) => {
  router.push(`/matches/${matchId}`);
};

const fetchHistory = async () => {
  try {
    const response = await api.get("/users/history");
    history.value = response.data;
  } catch (error) {
    console.error("Error fetching history:", error);
  }
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

.history-section {
  width: 100%;
}

.history-section h3 {
  margin-left: 10px;
  margin-bottom: 10px;
  font-size: 1.2em;
  font-weight: bold;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
}

.tag-badge {
  font-size: 0.7em;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 5px;
}

.rating-value {
  font-weight: bold;
  font-size: 1.1em;
}
</style>
