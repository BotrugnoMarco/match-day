<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-title>Matches</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToNotifications" class="notification-button">
            <ion-icon :icon="notificationsOutline"></ion-icon>
            <ion-badge color="danger" v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</ion-badge>
          </ion-button>
          <ion-button @click="goToProfile">
            <ion-icon :icon="personCircleOutline"></ion-icon>
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
          </ion-segment>
        </div>
      </div>

      <div class="matches-container ion-padding-horizontal">
        <div v-if="displayedMatches.length > 0">
          <div v-for="match in displayedMatches" :key="match.id" @click="viewMatch(match.id)" class="match-card">
            <div class="match-card-content">
              <div class="match-left">
                <div class="match-date">
                  <span class="day">{{ new Date(match.date_time).getDate() }}</span>
                  <span class="month">{{ new Date(match.date_time).toLocaleString("default", { month: "short" }) }}</span>
                </div>
                <div class="match-info">
                  <h3 class="sport-name">{{ match.sport_type.toUpperCase() }}</h3>
                  <p class="location">
                    <ion-icon :icon="locationOutline" style="vertical-align: text-bottom; font-size: 0.9em"></ion-icon>
                    {{ match.location }}
                  </p>
                  <p class="time">{{ new Date(match.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }}</p>
                </div>
              </div>
              <div class="match-right">
                <ion-badge :color="getStatusColor(match.status)" class="status-badge">{{ match.status }}</ion-badge>
                <ion-icon :icon="getSportIcon(match.sport_type)" class="sport-icon-small"></ion-icon>
              </div>
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
} from "ionicons/icons";

const store = useStore();
const router = useRouter();
const filter = ref("all");
const unreadCount = computed(() => store.getters.unreadNotificationsCount);

const displayedMatches = computed(() => {
  return filter.value === "mine" ? store.getters.myMatches : store.getters.allMatches;
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

const segmentChanged = (ev) => {
  if (ev.detail.value === "mine") {
    store.dispatch("fetchMyMatches");
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

onMounted(() => {
  store.dispatch("fetchMatches");
  store.dispatch("fetchNotifications");

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
  --background: #f4f5f8;
  overflow-y: auto;
}

.page-banner {
  background: var(--ion-color-primary);
  padding: 10px 20px;
  height: auto;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.segment-wrapper {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 5px;
}

.custom-segment {
  --background: transparent;
}

.matches-container {
  margin-top: -20px;
  padding-bottom: 80px;
}

.match-card {
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 15px;
  cursor: pointer;
  transition: transform 0.2s;
}

.match-card:active {
  transform: scale(0.98);
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
  min-width: 55px;
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
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.match-info .location {
  margin: 3px 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.match-info .time {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: var(--ion-color-primary);
  font-weight: 500;
}

.match-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-badge {
  padding: 5px 10px;
  border-radius: 15px;
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.7rem;
}

.sport-icon-small {
  font-size: 1.2rem;
  color: var(--ion-color-medium);
  opacity: 0.5;
}

.empty-state {
  margin-top: 50px;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 10px;
}

.notification-button {
  position: relative;
}

.notification-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 0.6rem;
  padding: 2px 4px;
  border-radius: 50%;
  z-index: 10;
}
</style>
