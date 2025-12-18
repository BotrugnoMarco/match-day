<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-buttons slot="end" v-if="isAuthenticated">
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
    </ion-header>
    <ion-content class="home-content" :fullscreen="true">
      <div class="home-header ion-padding-horizontal ion-padding-top">
        <div class="logo-wrapper" v-if="!isAuthenticated">
          <img :src="logoUrl" alt="MatchDay Logo" class="main-logo" />
        </div>
        <div v-else class="user-welcome">
          <h2>{{ t("home.welcome", { name: user?.username }) }}</h2>
          <p>{{ t("home.ready_to_play") }}</p>
        </div>
      </div>

      <div class="dashboard-container" v-if="isAuthenticated">
        <!-- Next Match Card -->
        <div class="section-title">
          <h3>{{ nextMatch && new Date(nextMatch.date_time) <= new Date() ? t("home.last_match") : t("home.next_match") }}</h3>
        </div>

        <div v-if="nextMatch" class="next-match-card" @click="router.push(`/matches/${nextMatch.id}`)">
          <div class="match-time">
            <span class="day">{{ formatDate(nextMatch.date_time) }}</span>
            <span class="time">{{ formatTime(nextMatch.date_time) }}</span>
          </div>
          <div class="match-info">
            <div class="sport-badge" :class="nextMatch.sport_type">
              <ion-icon :icon="getSportIcon(nextMatch.sport_type)"></ion-icon>
              {{ t("sports." + nextMatch.sport_type) }}
            </div>
            <div class="location">
              <ion-icon :icon="locationOutline"></ion-icon>
              {{ nextMatch.location }}
            </div>
          </div>

          <div class="weather-widget" v-if="nextMatchWeather">
            <ion-icon :icon="getWeatherIconName(nextMatchWeather.weatherCode)" class="weather-icon"></ion-icon>
            <span class="weather-temp">{{ Math.round(nextMatchWeather.maxTemp) }}°</span>
          </div>

          <div class="match-action">
            <ion-icon :icon="chevronForwardOutline"></ion-icon>
          </div>
        </div>

        <div v-else class="empty-match-card">
          <p>{{ t("home.no_upcoming_matches") }}</p>
          <ion-button size="small" fill="outline" router-link="/matches/create">
            {{ t("home.schedule_one") }}
            <ion-icon slot="end" :icon="addCircleOutline"></ion-icon>
          </ion-button>
        </div>

        <!-- Nearby Matches Map -->
        <div class="section-title" v-if="nearbyMatches.length > 0">
          <h3>{{ t("home.nearby_matches") }}</h3>
        </div>
        <div class="map-container" v-if="nearbyMatches.length > 0" style="margin-bottom: 20px">
          <MatchesMap :matches="nearbyMatches" :userLocation="userLocation" />
        </div>

        <!-- Monthly Stats -->
        <div class="section-title" v-if="monthlyStats.played > 0">
          <h3>{{ t("home.monthly_stats") }}</h3>
        </div>
        <div class="stats-card" v-if="monthlyStats.played > 0">
          <div class="stat-item">
            <span class="stat-value">{{ monthlyStats.played }}</span>
            <span class="stat-label">{{ t("home.matches_played") }}</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ monthlyStats.winRate }}%</span>
            <span class="stat-label">{{ t("home.win_rate") }}</span>
          </div>
        </div>

        <!-- Quick Actions Grid -->
        <div class="section-title">
          <h3>{{ t("home.quick_actions") }}</h3>
        </div>
        <div class="actions-grid">
          <div class="action-item" @click="router.push('/matches')">
            <div class="action-icon blue">
              <ion-icon :icon="calendarOutline"></ion-icon>
            </div>
            <span>{{ t("menu.my_matches") }}</span>
          </div>
          <div class="action-item" @click="router.push('/calendar')">
            <div class="action-icon orange">
              <ion-icon :icon="calendarNumberOutline"></ion-icon>
            </div>
            <span>{{ t("menu.calendar") }}</span>
          </div>
          <div class="action-item" @click="router.push('/matches/create')">
            <div class="action-icon green">
              <ion-icon :icon="addCircleOutline"></ion-icon>
            </div>
            <span>{{ t("common.create") }}</span>
          </div>
          <div class="action-item" @click="router.push('/friends')">
            <div class="action-icon purple">
              <ion-icon :icon="peopleOutline"></ion-icon>
            </div>
            <span>{{ t("menu.friends") }}</span>
          </div>
          <div class="action-item" @click="router.push('/profile')">
            <div class="action-icon pink">
              <ion-icon :icon="personCircleOutline"></ion-icon>
            </div>
            <span>{{ t("menu.profile") }}</span>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="section-title" v-if="recentActivity.length > 0">
          <h3>{{ t("home.recent_activity") }}</h3>
        </div>
        <div class="activity-list" v-if="recentActivity.length > 0">
          <div v-for="notif in recentActivity" :key="notif.id" class="activity-item" @click="handleNotificationClick(notif)">
            <div class="activity-icon" :class="notif.type || 'info'">
              <ion-icon :icon="notificationsOutline"></ion-icon>
            </div>
            <div class="activity-content">
              <p class="activity-text">{{ getNotificationMessage(notif.message) }}</p>
              <span class="activity-time">{{ new Date(notif.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="actions-container" v-else>
        <div class="welcome-text">
          <h2>{{ t("home.welcome_title") }}</h2>
          <p>{{ t("home.welcome_subtitle") }}</p>
        </div>

        <div class="buttons-wrapper">
          <ion-button expand="block" size="large" router-link="/login" class="action-btn primary-btn">
            {{ t("home.login") }}
            <ion-icon slot="end" :icon="logInOutline"></ion-icon>
          </ion-button>
          <ion-button expand="block" size="large" fill="outline" router-link="/register" class="action-btn secondary-btn">
            {{ t("home.create_account") }}
            <ion-icon slot="end" :icon="personAddOutline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "../services/api";
import MatchesMap from "../components/MatchesMap.vue";
import { IonPage, IonContent, IonButton, IonIcon, IonBadge, IonHeader, IonToolbar, IonButtons, IonMenuButton } from "@ionic/vue";
import { getWeatherForLocation, getWeatherIcon } from "../services/weather";
import {
  logInOutline,
  personAddOutline,
  calendarOutline,
  calendarNumberOutline,
  personCircleOutline,
  notificationsOutline,
  addCircleOutline,
  peopleOutline,
  locationOutline,
  chevronForwardOutline,
  football,
  basketball,
  tennisball,
  baseballOutline,
  umbrella,
  trophy,
  sunny,
  cloudy,
  rainy,
  snow,
  thunderstorm,
  partlySunny,
  helpCircleOutline,
} from "ionicons/icons";

const store = useStore();
const router = useRouter();
const { t, locale } = useI18n();
const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`;

const userLocation = ref(null);
const nearbyMatches = ref([]);

const getUserLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        fetchNearbyMatches();
      },
      (error) => {
        console.log("Geolocation error:", error);
        fetchNearbyMatches();
      }
    );
  } else {
    fetchNearbyMatches();
  }
};

const fetchNearbyMatches = async () => {
  try {
    const params = {};
    if (userLocation.value) {
      params.lat = userLocation.value.lat;
      params.lng = userLocation.value.lng;
      params.radius = 50; // 50km radius
    }
    const response = await api.get("/matches", { params });
    // Filter only future matches
    nearbyMatches.value = response.data.filter((m) => new Date(m.date_time) > new Date());
  } catch (e) {
    console.error("Error fetching nearby matches:", e);
  }
};

const isAuthenticated = computed(() => store.getters.isAuthenticated);
const user = computed(() => store.getters.currentUser);
const unreadCount = computed(() => store.getters.unreadNotificationsCount);
const myMatches = computed(() => store.state.myMatches);
const notifications = computed(() => store.state.notifications);
const nextMatchWeather = ref(null);

const nextMatch = computed(() => {
  if (!myMatches.value || myMatches.value.length === 0) return null;

  const now = new Date();
  // Filter for future matches OR the most recent finished match
  const futureMatches = myMatches.value.filter((m) => new Date(m.date_time) > now);

  if (futureMatches.length > 0) {
    // Sort by date ascending (closest future match first)
    return futureMatches.sort((a, b) => new Date(a.date_time) - new Date(b.date_time))[0];
  }

  // If no future matches, show the last finished match
  const pastMatches = myMatches.value.filter((m) => new Date(m.date_time) <= now);
  if (pastMatches.length > 0) {
    // Sort by date descending (most recent past match first)
    return pastMatches.sort((a, b) => new Date(b.date_time) - new Date(a.date_time))[0];
  }

  return null;
});

const monthlyStats = computed(() => {
  if (!myMatches.value) return { played: 0, winRate: 0 };

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const finishedMatches = myMatches.value.filter((m) => {
    const d = new Date(m.date_time);
    return m.status === "finished" && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const played = finishedMatches.length;
  if (played === 0) return { played: 0, winRate: 0 };

  const won = finishedMatches.filter((m) => m.winner && m.user_team && m.winner === m.user_team).length;
  const winRate = Math.round((won / played) * 100);

  return { played, winRate };
});

watch(
  nextMatch,
  async (newMatch) => {
    if (newMatch && new Date(newMatch.date_time) > new Date()) {
      try {
        const weather = await getWeatherForLocation(newMatch.location, newMatch.date_time);
        nextMatchWeather.value = weather;
      } catch (e) {
        console.error("Error fetching weather for home:", e);
        nextMatchWeather.value = null;
      }
    } else {
      nextMatchWeather.value = null;
    }
  },
  { immediate: true }
);

const getWeatherIconName = (code) => {
  const iconName = getWeatherIcon(code);
  const iconMap = {
    sunny: sunny,
    "partly-sunny": partlySunny,
    cloudy: cloudy,
    rainy: rainy,
    snow: snow,
    thunderstorm: thunderstorm,
    "help-circle": helpCircleOutline,
  };
  return iconMap[iconName] || helpCircleOutline;
};

const recentActivity = computed(() => {
  if (!notifications.value) return [];
  return notifications.value.slice(0, 3);
});

onMounted(() => {
  if (isAuthenticated.value) {
    store.dispatch("fetchMyMatches");
    store.dispatch("fetchNotifications");
    getUserLocation();
  }
});

const goToNotifications = () => {
  router.push("/notifications");
};

const handleNotificationClick = (notification) => {
  if (notification.related_match_id) {
    router.push(`/matches/${notification.related_match_id}`);
  } else {
    router.push("/notifications");
  }
};

const getNotificationMessage = (message) => {
  try {
    const parsed = JSON.parse(message);
    if (parsed.key) {
      const params = { ...parsed.params };
      if (params.date) {
        params.date = new Date(params.date).toLocaleDateString(locale.value);
      }
      return t(parsed.key, params);
    }
    return message;
  } catch (e) {
    return message;
  }
};

const getSportIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "soccer":
      return football;
    case "basketball":
      return basketball;
    case "tennis":
      return tennisball;
    case "padel":
      return umbrella;
    case "volleyball":
      return baseballOutline;
    default:
      return trophy;
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale.value, { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};
</script>

<style scoped>
.home-content {
  --background: var(--ion-background-color);
  overflow-y: auto;
}

.home-header {
  padding-bottom: 10px;
  text-align: left;
}

.logo-wrapper {
  background: var(--ion-card-background);
  padding: 15px;
  border-radius: 20px;
  width: 100px;
  height: 100px;
  margin: 0 auto 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.main-logo {
  width: 100%;
}

.user-welcome h2 {
  margin: 0;
  font-weight: 800;
  font-size: 2rem;
  color: var(--ion-color-dark);
}

.user-welcome p {
  margin: 5px 0 0;
  color: var(--ion-color-medium);
  font-size: 1.1rem;
}

.dashboard-container {
  padding: 0 20px;
  padding-bottom: 30px;
}

.section-title {
  margin-bottom: 10px;
  margin-top: 20px;
}

.section-title h3 {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin: 0;
}

/* Next Match Card */
.next-match-card {
  background: var(--ion-card-background);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: transform 0.2s;
}

.next-match-card:active {
  transform: scale(0.98);
}

.match-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--ion-color-light);
  padding: 10px;
  border-radius: 12px;
  min-width: 70px;
}

.match-time .day {
  font-weight: 800;
  font-size: 0.9rem;
  color: var(--ion-color-dark);
  text-transform: uppercase;
}

.match-time .time {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.match-info {
  flex: 1;
}

.sport-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--ion-color-primary);
  margin-bottom: 5px;
}

.location {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
}

.match-action {
  color: var(--ion-color-medium);
}

.weather-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  padding: 8px;
  border-radius: 12px;
  min-width: 50px;
}

.weather-icon {
  font-size: 1.5rem;
  color: var(--ion-color-primary);
  margin-bottom: 2px;
}

.weather-temp {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.empty-match-card {
  background: var(--ion-card-background);
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  box-shadow: var(--shadow-lg);
  color: var(--ion-color-medium);
}

/* Stats Card */
.stats-card {
  background: var(--ion-card-background);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-weight: 600;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--ion-color-light);
}

/* Quick Actions Grid */
.actions-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  text-align: center;
  /* gap: 15px; */
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: 60px;
}

.action-icon {
  width: 55px;
  height: 55px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  box-shadow: var(--shadow-md);
  transition: transform 0.2s;
}

.action-item:active .action-icon {
  transform: scale(0.95);
}

.action-icon.blue {
  background: #3dc2ff;
}
.action-icon.green {
  background: #2dd36f;
}
.action-icon.orange {
  background: #ffc409;
}
.action-icon.purple {
  background: #9d4edd;
}
.action-icon.pink {
  background: #eb445a;
}

.action-item span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-dark);
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  background: var(--ion-card-background);
  padding: 15px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: var(--shadow-sm);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--ion-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ion-color-medium);
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--ion-color-dark);
  line-height: 1.3;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

/* Unauthenticated Styles */
.actions-container {
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -40px;
  position: relative;
  z-index: 2;
}

.welcome-text {
  text-align: center;
  margin-bottom: 30px;
  background: var(--ion-card-background);
  padding: 20px;
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
  width: 100%;
}

.welcome-text h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--ion-color-dark);
  margin-bottom: 10px;
}

.welcome-text p {
  color: var(--ion-color-medium);
  font-size: 1rem;
  line-height: 1.5;
}

.buttons-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.action-btn {
  --border-radius: 15px;
  font-weight: 700;
  height: 55px;
  --box-shadow: var(--shadow-md);
}

.primary-btn {
  --box-shadow: 0 8px 20px rgba(var(--ion-color-primary-rgb), 0.4);
}

.secondary-btn {
  --border-width: 2px;
}
</style>
