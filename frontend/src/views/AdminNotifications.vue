<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Notifications</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="notification in notifications" :key="notification.id">
          <ion-label>
            <h2>To: {{ notification.username }}</h2>
            <p>{{ notification.message }}</p>
            <p>Type: {{ notification.type }} | Read: {{ notification.is_read ? "Yes" : "No" }}</p>
            <p>{{ new Date(notification.created_at).toLocaleString() }}</p>
          </ion-label>
          <ion-button fill="clear" color="danger" slot="end" @click="deleteNotification(notification.id)">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>
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
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
} from "@ionic/vue";
import { trashOutline } from "ionicons/icons";
import api from "../services/api";

export default {
  name: "AdminNotifications",
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons, IonBackButton },
  data() {
    return {
      notifications: [],
      trashOutline,
    };
  },
  async mounted() {
    this.loadNotifications();
  },
  methods: {
    async loadNotifications() {
      try {
        const res = await api.get("/admin/notifications");
        this.notifications = res.data;
      } catch (e) {
        console.error(e);
      }
    },
    async deleteNotification(id) {
      if (!confirm("Are you sure you want to delete this notification?")) return;
      try {
        await api.delete(`/admin/notifications/${id}`);
        this.loadNotifications();
      } catch (e) {
        console.error(e);
        alert("Failed to delete notification");
      }
    },
  },
};
</script>
