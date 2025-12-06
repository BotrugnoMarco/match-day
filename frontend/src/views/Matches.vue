<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
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
      <ion-toolbar>
        <ion-segment v-model="filter" @ionChange="segmentChanged">
          <ion-segment-button value="all">
            <ion-label>All Matches</ion-label>
          </ion-segment-button>
          <ion-segment-button value="mine">
            <ion-label>My Matches</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="displayedMatches.length > 0">
        <ion-card v-for="match in displayedMatches" :key="match.id" @click="viewMatch(match.id)" class="match-card">
          <ion-card-header>
            <div class="match-header">
              <ion-card-subtitle
                >{{ new Date(match.date_time).toLocaleDateString() }} -
                {{ new Date(match.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }}</ion-card-subtitle
              >
              <ion-badge :color="getStatusColor(match.status)">{{ match.status }}</ion-badge>
            </div>
            <div class="sport-title">
              <ion-icon :icon="getSportIcon(match.sport_type)" class="sport-icon"></ion-icon>
              <ion-card-title>{{ match.sport_type.toUpperCase() }}</ion-card-title>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="match-info">
              <ion-icon :icon="locationOutline"></ion-icon>
              <span>{{ match.location }}</span>
            </div>
          </ion-card-content>
        </ion-card>
      </div>

      <div v-else class="ion-text-center ion-padding empty-state">
        <ion-icon :icon="calendarOutline" class="empty-icon"></ion-icon>
        <p>No matches found.</p>
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonBadge,
  IonLabel,
} from "@ionic/vue";
import { add, personCircleOutline, locationOutline, calendarOutline, notificationsOutline, football, basketball, tennisball } from "ionicons/icons";

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
      return basketball; // Placeholder
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
.match-card {
  cursor: pointer;
}

.match-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sport-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.sport-icon {
  font-size: 1.5em;
  color: var(--ion-color-primary);
}

.match-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1em;
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
  top: 0;
  right: 0;
  font-size: 0.6rem;
  padding: 2px 4px;
  border-radius: 50%;
  z-index: 10;
}
</style>
