<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Users</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="user in users" :key="user.id">
          <ion-label>
            <h2>{{ user.username }} <span v-if="user.role === 'admin'" style="color: red">(Admin)</span></h2>
            <p>{{ user.email }}</p>
            <p>Status: {{ user.status }}</p>
          </ion-label>
          <ion-button fill="clear" color="danger" slot="end" @click="deleteUser(user.id)">
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
  name: "AdminUsers",
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons, IonBackButton },
  data() {
    return {
      users: [],
      trashOutline,
    };
  },
  async mounted() {
    this.loadUsers();
  },
  methods: {
    async loadUsers() {
      try {
        const res = await api.get("/admin/users");
        this.users = res.data;
      } catch (e) {
        console.error(e);
      }
    },
    async deleteUser(id) {
      if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
      try {
        await api.delete(`/admin/users/${id}`);
        this.loadUsers();
      } catch (e) {
        console.error(e);
        alert("Failed to delete user");
      }
    },
  },
};
</script>
