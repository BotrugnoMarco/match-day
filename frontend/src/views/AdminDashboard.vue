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

      <ion-grid>
        <ion-row>
          <!-- Users -->
          <ion-col size="12" size-sm="6" size-md="4">
            <ion-card button @click="$router.push('/admin/users')" class="admin-card users-card">
              <div class="card-icon-wrapper">
                <ion-icon :icon="peopleOutline"></ion-icon>
              </div>
              <div class="card-content-wrapper">
                <ion-card-subtitle>Users</ion-card-subtitle>
                <ion-card-title>{{ stats.users }}</ion-card-title>
              </div>
            </ion-card>
          </ion-col>

          <!-- Matches -->
          <ion-col size="12" size-sm="6" size-md="4">
            <ion-card button @click="$router.push('/admin/matches')" class="admin-card matches-card">
              <div class="card-icon-wrapper">
                <ion-icon :icon="footballOutline"></ion-icon>
              </div>
              <div class="card-content-wrapper">
                <ion-card-subtitle>Matches</ion-card-subtitle>
                <ion-card-title>{{ stats.matches }}</ion-card-title>
              </div>
            </ion-card>
          </ion-col>

          <!-- Support -->
          <ion-col size="12" size-sm="6" size-md="4">
            <ion-card button @click="$router.push('/admin/support')" class="admin-card support-card">
              <div class="card-icon-wrapper">
                <ion-icon :icon="chatbubblesOutline"></ion-icon>
              </div>
              <div class="card-content-wrapper">
                <ion-card-subtitle>Tickets</ion-card-subtitle>
                <ion-card-title>{{ stats.tickets }}</ion-card-title>
              </div>
            </ion-card>
          </ion-col>

          <!-- Votes -->
          <ion-col size="12" size-sm="6" size-md="4">
            <ion-card button @click="$router.push('/admin/votes')" class="admin-card votes-card">
              <div class="card-icon-wrapper">
                <ion-icon :icon="starOutline"></ion-icon>
              </div>
              <div class="card-content-wrapper">
                <ion-card-subtitle>Votes</ion-card-subtitle>
                <ion-card-title>{{ stats.votes }}</ion-card-title>
              </div>
            </ion-card>
          </ion-col>

          <!-- Friendships -->
          <ion-col size="12" size-sm="6" size-md="4">
            <ion-card button @click="$router.push('/admin/friendships')" class="admin-card friends-card">
              <div class="card-icon-wrapper">
                <ion-icon :icon="heartOutline"></ion-icon>
              </div>
              <div class="card-content-wrapper">
                <ion-card-subtitle>Friendships</ion-card-subtitle>
                <ion-card-title>{{ stats.friendships }}</ion-card-title>
              </div>
            </ion-card>
          </ion-col>

          <!-- Participants -->
          <ion-col size="12" size-sm="6" size-md="4">
            <ion-card button @click="$router.push('/admin/participants')" class="admin-card participants-card">
              <div class="card-icon-wrapper">
                <ion-icon :icon="peopleCircleOutline"></ion-icon>
              </div>
              <div class="card-content-wrapper">
                <ion-card-subtitle>Participants</ion-card-subtitle>
                <ion-card-title>{{ stats.participants }}</ion-card-title>
              </div>
            </ion-card>
          </ion-col>

          <!-- Notifications -->
          <ion-col size="12" size-sm="6" size-md="4">
            <ion-card button @click="$router.push('/admin/notifications')" class="admin-card notifications-card">
              <div class="card-icon-wrapper">
                <ion-icon :icon="notificationsOutline"></ion-icon>
              </div>
              <div class="card-content-wrapper">
                <ion-card-subtitle>Notifications</ion-card-subtitle>
                <ion-card-title>{{ stats.notifications }}</ion-card-title>
              </div>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>
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
      stats: { users: 0, matches: 0, tickets: 0, votes: 0, friendships: 0, participants: 0, notifications: 0 },
      peopleOutline,
      footballOutline,
      chatbubblesOutline,
      starOutline,
      heartOutline,
      peopleCircleOutline,
      notificationsOutline,
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
  margin-bottom: 20px;
  padding: 0 10px;
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

.admin-card {
  display: flex;
  align-items: center;
  padding: 20px;
  margin: 10px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
}

.admin-card:active {
  transform: scale(0.98);
}

.card-icon-wrapper {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
}

.card-content-wrapper {
  flex: 1;
}

ion-card-subtitle {
  font-size: 14px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  color: var(--ion-color-medium);
}

ion-card-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ion-text-color);
}

/* Card Specific Colors */
.users-card .card-icon-wrapper {
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  color: var(--ion-color-primary);
}

.matches-card .card-icon-wrapper {
  background: rgba(var(--ion-color-success-rgb), 0.1);
  color: var(--ion-color-success);
}

.support-card .card-icon-wrapper {
  background: rgba(var(--ion-color-warning-rgb), 0.1);
  color: var(--ion-color-warning);
}

.votes-card .card-icon-wrapper {
  background: rgba(var(--ion-color-tertiary-rgb), 0.1);
  color: var(--ion-color-tertiary);
}

.friends-card .card-icon-wrapper {
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  color: var(--ion-color-danger);
}

.participants-card .card-icon-wrapper {
  background: rgba(var(--ion-color-secondary-rgb), 0.1);
  color: var(--ion-color-secondary);
}

.notifications-card .card-icon-wrapper {
  background: rgba(var(--ion-color-medium-rgb), 0.1);
  color: var(--ion-color-medium);
}
</style>
