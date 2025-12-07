<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Notifications</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="markAllRead" v-if="unreadCount > 0">
            <ion-icon :icon="checkmarkDoneOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <div class="page-banner">
        <h2>Alerts</h2>
        <p>Stay updated</p>
      </div>

      <div class="notifications-container ion-padding-horizontal">
        <div v-if="notifications.length > 0">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            @click="handleNotificationClick(notification)"
            class="notification-card"
            :class="{ 'is-unread': !notification.is_read }"
          >
            <div class="icon-wrapper" :class="notification.type || 'info'">
              <ion-icon :icon="getIcon(notification.type)"></ion-icon>
            </div>
            <div class="content">
              <div class="message" :class="{ unread: !notification.is_read }">{{ notification.message }}</div>
              <div class="time">{{ new Date(notification.created_at).toLocaleString() }}</div>
            </div>
            <div class="indicator" v-if="!notification.is_read"></div>
          </div>
        </div>

        <div v-else class="ion-text-center ion-padding empty-state">
          <ion-icon :icon="notificationsOffOutline" class="empty-icon"></ion-icon>
          <p>No notifications yet.</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonBackButton, IonIcon } from "@ionic/vue";
import {
  notificationsOutline,
  notificationsOffOutline,
  informationCircleOutline,
  warningOutline,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
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
.page-content {
  --background: #f4f5f8;
  min-height: 100vh;
  height: 100%;
  overflow-y: auto;
}

.page-banner {
  background: var(--ion-color-primary);
  padding: 20px 20px 50px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: white;
}

.page-banner h2 {
  margin: 0;
  font-weight: 800;
  font-size: 1.8rem;
}

.page-banner p {
  margin: 5px 0 0;
  opacity: 0.9;
}

.notifications-container {
  margin-top: -40px;
}

.notification-card {
  background: white;
  border-radius: 15px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  transition: transform 0.2s;
  cursor: pointer;
}

.notification-card:active {
  transform: scale(0.98);
}

.notification-card.is-unread {
  background: #fff;
  border-left: 4px solid var(--ion-color-primary);
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.icon-wrapper.info {
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  color: var(--ion-color-primary);
}

.icon-wrapper.warning {
  background: rgba(var(--ion-color-warning-rgb), 0.1);
  color: var(--ion-color-warning);
}

.icon-wrapper.success {
  background: rgba(var(--ion-color-success-rgb), 0.1);
  color: var(--ion-color-success);
}

.content {
  flex: 1;
}

.message {
  font-size: 0.95rem;
  color: var(--ion-color-dark);
  margin-bottom: 4px;
  line-height: 1.3;
}

.message.unread {
  font-weight: 700;
}

.time {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.indicator {
  width: 8px;
  height: 8px;
  background: var(--ion-color-danger);
  border-radius: 50%;
  position: absolute;
  top: 15px;
  right: 15px;
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
