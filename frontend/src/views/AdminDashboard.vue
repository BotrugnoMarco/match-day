<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Admin Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-grid>
        <ion-row>
          <ion-col size="12" size-md="6">
            <ion-card button @click="$router.push('/admin/users')">
              <ion-card-header>
                <ion-card-title>Users</ion-card-title>
              </ion-card-header>
              <ion-card-content>Manage users ({{ stats.users }})</ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="12" size-md="6">
            <ion-card button @click="$router.push('/admin/matches')">
              <ion-card-header>
                <ion-card-title>Matches</ion-card-title>
              </ion-card-header>
              <ion-card-content>Manage matches ({{ stats.matches }})</ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col size="12" size-md="6">
            <ion-card button @click="$router.push('/admin/support')">
              <ion-card-header>
                <ion-card-title>Support Tickets</ion-card-title>
              </ion-card-header>
              <ion-card-content>Manage tickets ({{ stats.tickets }})</ion-card-content>
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
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonMenuButton,
} from "@ionic/vue";
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
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonMenuButton,
  },
  data() {
    return {
      stats: { users: 0, matches: 0, tickets: 0 },
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
