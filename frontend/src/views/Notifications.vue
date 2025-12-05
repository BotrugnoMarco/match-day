<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="markAllRead" v-if="unreadCount > 0"> Mark all read </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-list v-if="notifications.length > 0">
        <ion-item v-for="notification in notifications" :key="notification.id" @click="handleNotificationClick(notification)" button detail>
          <ion-icon :icon="getIcon(notification.type)" slot="start" :color="getColor(notification.type)"></ion-icon>
          <ion-label>
            <h2 :class="{ unread: !notification.is_read }">{{ notification.message }}</h2>
            <p>{{ new Date(notification.created_at).toLocaleString() }}</p>
          </ion-label>
          <ion-icon :icon="ellipse" slot="end" color="primary" v-if="!notification.is_read" style="font-size: 10px"></ion-icon>
        </ion-item>
      </ion-list>

      <div v-else class="ion-text-center ion-padding empty-state">
        <ion-icon :icon="notificationsOffOutline" class="empty-icon"></ion-icon>
        <p>No notifications yet.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonButtons,
  IonBackButton,
  IonIcon,
} from "@ionic/vue";
import {
  notificationsOutline,
  notificationsOffOutline,
  informationCircleOutline,
  warningOutline,
  checkmarkCircleOutline,
  ellipse,
} from "ionicons/icons";

const store = useStore();
const router = useRouter();
const notifications = computed(() => store.getters.notifications);
const unreadCount = computed(() => store.getters.unreadNotificationsCount);

onMounted(() => {
  store.dispatch("fetchNotifications");
});

const getIcon = (type) => {
  switch (type) {
    case "warning":
      return warningOutline;
    case "success":
      return checkmarkCircleOutline;
    default:
      return informationCircleOutline;
  }
};

const getColor = (type) => {
  switch (type) {
    case "warning":
      return "warning";
    case "success":
      return "success";
    default:
      return "primary";
  }
};

const markAllRead = () => {
  store.dispatch("markAllNotificationsRead");
};

const handleNotificationClick = (notification) => {
  if (!notification.is_read) {
    store.dispatch("markNotificationRead", notification.id);
  }

  if (notification.related_match_id) {
    router.push(`/matches/${notification.related_match_id}`);
  }
};
</script>

<style scoped>
.unread {
  font-weight: bold;
  color: var(--ion-color-dark);
}

.empty-state {
  margin-top: 50px;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 60px;
  margin-bottom: 10px;
}
</style>
