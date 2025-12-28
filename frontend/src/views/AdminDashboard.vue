<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Admin Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding page-content">
      <div class="dashboard-header">
        <h1>Overview</h1>
        <p>Welcome back, Admin</p>
      </div>

      <div class="admin-grid">
        <!-- Users -->
        <div class="admin-item" @click="$router.push('/admin/users')">
          <div class="icon-circle users-icon">
            <ion-icon :icon="peopleOutline"></ion-icon>
          </div>
          <span class="item-label">Users</span>
          <span class="item-count">{{ stats.users }}</span>
        </div>

        <!-- Matches -->
        <div class="admin-item" @click="$router.push('/admin/matches')">
          <div class="icon-circle matches-icon">
            <ion-icon :icon="footballOutline"></ion-icon>
          </div>
          <span class="item-label">Matches</span>
          <span class="item-count">{{ stats.matches }}</span>
        </div>

        <!-- Support -->
        <div class="admin-item" @click="$router.push('/admin/support')">
          <div class="icon-circle support-icon">
            <ion-icon :icon="chatbubblesOutline"></ion-icon>
          </div>
          <span class="item-label">Tickets</span>
          <span class="item-count">{{ stats.tickets }}</span>
        </div>

        <!-- Votes -->
        <div class="admin-item" @click="$router.push('/admin/votes')">
          <div class="icon-circle votes-icon">
            <ion-icon :icon="starOutline"></ion-icon>
          </div>
          <span class="item-label">Votes</span>
          <span class="item-count">{{ stats.votes }}</span>
        </div>

        <!-- Friendships -->
        <div class="admin-item" @click="$router.push('/admin/friendships')">
          <div class="icon-circle friends-icon">
            <ion-icon :icon="heartOutline"></ion-icon>
          </div>
          <span class="item-label">Friends</span>
          <span class="item-count">{{ stats.friendships }}</span>
        </div>

        <!-- Participants -->
        <div class="admin-item" @click="$router.push('/admin/participants')">
          <div class="icon-circle participants-icon">
            <ion-icon :icon="peopleCircleOutline"></ion-icon>
          </div>
          <span class="item-label">Participants</span>
          <span class="item-count">{{ stats.participants }}</span>
        </div>

        <!-- Notifications -->
        <div class="admin-item" @click="$router.push('/admin/notifications')">
          <div class="icon-circle notifications-icon">
            <ion-icon :icon="notificationsOutline"></ion-icon>
          </div>
          <span class="item-label">Notifs</span>
          <span class="item-count">{{ stats.notifications }}</span>
        </div>

        <!-- Reports -->
        <div class="admin-item" @click="$router.push('/admin/reports')">
          <div class="icon-circle reports-icon">
            <ion-icon :icon="warningOutline"></ion-icon>
          </div>
          <span class="item-label">Reports</span>
          <span class="item-count">{{ stats.reports || 0 }}</span>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardSubtitle,
  IonCardTitle,
  IonButtons,
  IonMenuButton,
  IonIcon,
} from "@ionic/vue";
import {
  peopleOutline,
  footballOutline,
  chatbubblesOutline,
  starOutline,
  heartOutline,
  peopleCircleOutline,
  notificationsOutline,
  warningOutline,
} from "ionicons/icons";
import api from "../services/api";

export default {
  name: "AdminDashboard",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardSubtitle,
    IonCardTitle,
    IonButtons,
    IonMenuButton,
    IonIcon,
  },
  data() {
    return {
      stats: { users: 0, matches: 0, tickets: 0, votes: 0, friendships: 0, participants: 0, notifications: 0, reports: 0 },
      peopleOutline,
      footballOutline,
      chatbubblesOutline,
      starOutline,
      heartOutline,
      peopleCircleOutline,
      notificationsOutline,
      warningOutline,
    };
  },
  async mounted() {
    try {
      const res = await api.get("/admin/stats");
      this.stats = res.data;
    } catch (e) {
      console.error(e);
    }
  },
};
</script>

<style scoped>
.dashboard-header {
  margin-bottom: 30px;
  padding: 0 10px;
  text-align: center;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 5px;
  color: var(--ion-text-color);
}

.dashboard-header p {
  color: var(--ion-color-medium);
  margin: 0;
}

.admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px;
  padding: 10px;
  justify-items: center;
}

.admin-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 100%;
}

.admin-item:active {
  transform: scale(0.95);
}

.icon-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 10px;
  box-shadow: var(--shadow-md);
}

.item-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--ion-text-color);
  margin-bottom: 2px;
}

.item-count {
  font-size: 12px;
  color: var(--ion-color-medium);
}

/* Icon Colors */
.users-icon {
  background: rgba(var(--ion-color-primary-rgb), 0.2);
  color: var(--ion-color-primary);
}

.matches-icon {
  background: rgba(var(--ion-color-success-rgb), 0.2);
  color: var(--ion-color-success);
}

.support-icon {
  background: rgba(var(--ion-color-warning-rgb), 0.2);
  color: var(--ion-color-warning);
}

.votes-icon {
  background: rgba(var(--ion-color-tertiary-rgb), 0.2);
  color: var(--ion-color-tertiary);
}

.friends-icon {
  background: rgba(var(--ion-color-danger-rgb), 0.2);
  color: var(--ion-color-danger);
}

.participants-icon {
  background: rgba(var(--ion-color-secondary-rgb), 0.2);
  color: var(--ion-color-secondary);
}

.notifications-icon {
  background: rgba(var(--ion-color-medium-rgb), 0.2);
  color: var(--ion-color-medium);
}

.reports-icon {
  background: rgba(var(--ion-color-danger-rgb), 0.2);
  color: var(--ion-color-danger);
}

.participants-icon {
  background: rgba(var(--ion-color-secondary-rgb), 0.2);
  color: var(--ion-color-secondary);
}

.notifications-icon {
  background: rgba(var(--ion-color-medium-rgb), 0.2);
  color: var(--ion-color-medium);
}
</style>
