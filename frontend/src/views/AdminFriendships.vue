<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Friendships</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="friendship in friendships" :key="friendship.id">
          <ion-label>
            <h2>{{ friendship.requester_name }} - {{ friendship.addressee_name }}</h2>
            <p>Status: {{ friendship.status }}</p>
            <p>Since: {{ new Date(friendship.created_at).toLocaleDateString() }}</p>
          </ion-label>
          <ion-button fill="clear" color="danger" slot="end" @click="deleteFriendship(friendship.id)">
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
  name: "AdminFriendships",
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons, IonBackButton },
  data() {
    return {
      friendships: [],
      trashOutline,
    };
  },
  async mounted() {
    this.loadFriendships();
  },
  methods: {
    async loadFriendships() {
      try {
        const res = await api.get("/admin/friendships");
        this.friendships = res.data;
      } catch (e) {
        console.error(e);
      }
    },
    async deleteFriendship(id) {
      if (!confirm("Are you sure you want to delete this friendship?")) return;
      try {
        await api.delete(`/admin/friendships/${id}`);
        this.loadFriendships();
      } catch (e) {
        console.error(e);
        alert("Failed to delete friendship");
      }
    },
  },
};
</script>
