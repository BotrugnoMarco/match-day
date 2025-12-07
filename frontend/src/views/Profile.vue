<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Profile</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logout">
            <ion-icon :icon="logOutOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="profile-content">
      <!-- Profile Header with Gradient -->
      <div class="profile-banner">
        <div class="avatar-wrapper" @click="triggerFileInput">
          <ion-avatar class="main-avatar">
            <img :src="user?.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
          </ion-avatar>
          <div class="edit-badge">
            <ion-icon :icon="camera" color="light"></ion-icon>
          </div>
        </div>
        <h2 class="username">{{ user?.username }}</h2>
        <ion-badge color="light" class="role-badge">{{ user?.role?.toUpperCase() }}</ion-badge>
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
  IonGrid,
  IonRow,
  IonCol,
  IonProgressBar,
} from "@ionic/vue";
import { camera, star, logOutOutline, football, trophy, ribbon, timeOutline, tennisballOutline, baseballOutline } from "ionicons/icons";

const store = useStore();
const router = useRouter();
const user = computed(() => store.getters.currentUser);
const stats = computed(() => store.getters.userStats);
const history = ref([]);
const fileInput = ref(null);

onMounted(() => {
  store.dispatch("fetchUserStats");
  store.dispatch("fetchUserProfile");
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
  --background: #f4f5f8;
  overflow-y: auto;
}

.profile-banner {
  background: var(--ion-color-primary);
  padding: 30px 20px 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 15px;
}

.main-avatar {
  width: 100px;
  height: 100px;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--ion-color-secondary);
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.username {
  margin: 0;
  font-weight: 700;
  font-size: 1.5rem;
}

.role-badge {
  margin-top: 5px;
  opacity: 0.9;
}

.stats-container {
  margin-top: -40px;
  margin-bottom: 20px;
}

.stat-box {
  background: white;
  border-radius: 15px;
  padding: 15px 5px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
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
  margin-top: 5px;
}

.text-primary {
  color: var(--ion-color-primary);
}
.text-warning {
  color: var(--ion-color-warning);
}

.section-container {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  padding-left: 5px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.skills-card {
  margin: 0;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
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
  gap: 10px;
}

.badge-chip {
  background: white;
  padding: 8px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
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
  padding: 2px 6px;
  border-radius: 10px;
}

.match-card {
  margin: 0 0 15px 0;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.match-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
}

.match-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.match-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f0f2f5;
  padding: 8px 12px;
  border-radius: 10px;
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
  gap: 5px;
}

.result-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
  text-transform: uppercase;
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
  padding: 20px;
}
</style>
