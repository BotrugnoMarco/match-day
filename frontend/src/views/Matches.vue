<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Matches</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToNotifications" class="notification-button">
            <ion-icon :icon="notificationsOutline"></ion-icon>
            <ion-badge color="danger" v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</ion-badge>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <div class="page-banner">
        <div class="segment-wrapper">
          <ion-segment v-model="filter" @ionChange="segmentChanged" mode="ios" class="custom-segment">
            <ion-segment-button value="all">
              <ion-label>All</ion-label>
            </ion-segment-button>
            <ion-segment-button value="mine">
              <ion-label>My Matches</ion-label>
            </ion-segment-button>
            <ion-segment-button value="friends">
              <ion-label>Friends</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </div>

      <div class="matches-container ion-padding-horizontal">
        <div v-if="displayedMatches.length > 0">
          <div v-for="match in displayedMatches" :key="match.id" @click="viewMatch(match.id)" class="match-card">
            <div class="match-card-header">
              <div class="sport-info">
                <div class="sport-icon-wrapper" :class="match.sport_type">
                  <ion-icon :icon="getSportIcon(match.sport_type)"></ion-icon>
                </div>
                <div class="sport-details">
                  <span class="sport-name">{{ match.sport_type }}</span>
                  <div class="privacy-indicator">
                    <ion-icon :icon="match.is_private ? lockClosedOutline : globeOutline" class="privacy-icon"></ion-icon>
                    <span class="privacy-text">{{ match.is_private ? "Private" : "Public" }}</span>
                  </div>
                </div>
              </div>
              <ion-badge :color="getStatusColor(match.status)" class="status-badge">{{ match.status }}</ion-badge>
            </div>

            <div class="match-card-body">
              <div class="match-datetime">
                <ion-icon :icon="calendarOutline" class="info-icon"></ion-icon>
                <span class="date">{{ formatDate(match.date_time) }}</span>
                <span class="separator">•</span>
                <span class="time">{{ formatTime(match.date_time) }}</span>
              </div>
              <div class="match-location">
                <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
                <span>{{ match.location }}</span>
              </div>
              <div class="match-features" v-if="match.is_covered || match.has_showers">
                <ion-chip v-if="match.is_covered" outline color="medium" class="feature-chip">
                  <ion-icon :icon="umbrella"></ion-icon>
                  <ion-label>Covered</ion-label>
                </ion-chip>
                <ion-chip v-if="match.has_showers" outline color="medium" class="feature-chip">
                  <ion-icon :icon="water"></ion-icon>
                  <ion-label>Showers</ion-label>
                </ion-chip>
              </div>
            </div>

            <div class="match-card-footer">
              <div class="organizer-info">
                <ion-avatar class="organizer-avatar">
                  <img :src="match.creator_avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
                </ion-avatar>
                <span class="organizer-name">Hosted by {{ match.creator_username }}</span>
              </div>
              <ion-icon :icon="chevronForwardOutline" class="arrow-icon"></ion-icon>
            </div>
          </div>
        </div>

        <div v-else class="ion-text-center ion-padding empty-state">
          <ion-icon :icon="calendarOutline" class="empty-icon"></ion-icon>
          <p>No matches found.</p>
        </div>
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="createMatch">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import socket from "../services/socket";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonBadge,
  IonLabel,
  IonAvatar,
  IonChip,
  IonMenuButton,
  onIonViewWillEnter,
} from "@ionic/vue";
import {
  add,
  personCircleOutline,
  locationOutline,
  calendarOutline,
  notificationsOutline,
  football,
  basketball,
  tennisball,
  baseballOutline,
  umbrella,
  water,
  chevronForwardOutline,
  lockClosedOutline,
  globeOutline,
} from "ionicons/icons";

const store = useStore();
const router = useRouter();
const filter = ref("all");
const unreadCount = computed(() => store.getters.unreadNotificationsCount);

const displayedMatches = computed(() => {
  if (filter.value === "mine") return store.getters.myMatches;
  if (filter.value === "friends") return store.getters.friendsMatches;
  // Show only open matches in the main list
  return store.getters.allMatches.filter((m) => m.status === "open");
});

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

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const segmentChanged = (ev) => {
  if (ev.detail.value === "mine") {
    store.dispatch("fetchMyMatches");
  } else if (ev.detail.value === "friends") {
    store.dispatch("fetchFriendsMatches");
  } else {
    store.dispatch("fetchMatches");
  }
};

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

onIonViewWillEnter(() => {
  if (filter.value === "mine") {
    store.dispatch("fetchMyMatches");
  } else if (filter.value === "friends") {
    store.dispatch("fetchFriendsMatches");
  } else {
    store.dispatch("fetchMatches");
  }
  store.dispatch("fetchNotifications");
});

onMounted(() => {
  socket.on("match_created", () => {
    store.dispatch("fetchMatches");
  });
  socket.on("match_updated", () => {
    store.dispatch("fetchMatches");
  });
});

onUnmounted(() => {
  socket.off("match_created");
  socket.off("match_updated");
});

const goToProfile = () => {
  router.push("/profile");
};

const goToNotifications = () => {
  router.push("/notifications");
};

const viewMatch = (id) => {
  router.push(`/matches/${id}`);
};

const createMatch = () => {
  router.push("/matches/create");
};
</script>

<style scoped>
.page-content {
  /* --background: #ffffff; */
  overflow-y: auto;
}

.features-row {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.feature-icon {
  font-size: 1.1em;
  color: var(--ion-color-medium);
}

.page-banner {
  background: var(--ion-color-primary);
  padding: var(--space-3) var(--space-5);
  height: auto;
  border-bottom-left-radius: var(--rounded-xl);
  border-bottom-right-radius: var(--rounded-xl);
  margin-bottom: var(--space-5);
  box-shadow: var(--shadow-md);
}

.segment-wrapper {
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--rounded-md);
  padding: var(--space-1);
}

.custom-segment {
  --background: transparent;
}

.matches-container {
  margin-top: -1.25rem;
  padding-bottom: var(--space-8);
}

.match-card {
  background: #ffffff;
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-4);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.match-card:active {
  transform: scale(0.98);
}

.match-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid #f0f0f0;
}

.sport-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.sport-icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.sport-icon-wrapper.soccer {
  background-color: #2dd36f;
}
.sport-icon-wrapper.basketball {
  background-color: #ffc409;
}
.sport-icon-wrapper.tennis {
  background-color: #eb445a;
}
.sport-icon-wrapper.padel {
  background-color: #3dc2ff;
}
.sport-icon-wrapper.volleyball {
  background-color: #5260ff;
}

.sport-name {
  font-weight: 700;
  text-transform: capitalize;
  font-size: 1rem;
  color: var(--ion-color-dark);
  line-height: 1.2;
}

.sport-details {
  display: flex;
  flex-direction: column;
}

.privacy-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.privacy-icon {
  font-size: 0.8rem;
}

.status-badge {
  padding: var(--space-2) var(--space-3);
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.5px;
}

.match-card-body {
  padding: var(--space-4);
}

.match-datetime {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  color: var(--ion-color-dark);
  font-size: 1rem;
  font-weight: 600;
}

.match-location {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-bottom: var(--space-3);
}

.info-icon {
  color: var(--ion-color-primary);
  font-size: 1.1rem;
}

.separator {
  color: var(--ion-color-medium);
}

.match-features {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
}

.feature-chip {
  margin: 0;
  height: 24px;
  font-size: 0.75rem;
}

.match-card-footer {
  background: #f9f9f9;
  padding: var(--space-3) var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.organizer-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.organizer-avatar {
  width: 24px;
  height: 24px;
}

.organizer-name {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.arrow-icon {
  color: var(--ion-color-medium);
  font-size: 1.2rem;
}

.empty-state {
  margin-top: var(--space-12);
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: var(--space-3);
}

.notification-button {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  font-size: 0.6rem;
  padding: 2px var(--space-1);
  border-radius: 50%;
  z-index: 10;
}
</style>
