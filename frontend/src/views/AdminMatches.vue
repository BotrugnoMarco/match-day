<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Matches</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="match in matches" :key="match.id" button @click="goToMatch(match.id)">
          <ion-label>
            <h2>{{ match.sport_type }} - {{ new Date(match.date_time).toLocaleDateString() }}</h2>
            <p>Location: {{ match.location }}</p>
            <p>Creator: {{ match.creator_name || "Unknown" }}</p>
            <p>Status: {{ match.status }}</p>
          </ion-label>
          <ion-button fill="clear" color="danger" slot="end" @click.stop="deleteMatch(match.id)">
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
  name: "AdminMatches",
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons, IonBackButton },
  data() {
    return {
      matches: [],
      trashOutline,
    };
  },
  async mounted() {
    this.loadMatches();
  },
  methods: {
    async loadMatches() {
      try {
        const res = await api.get("/admin/matches");
        this.matches = res.data;
      } catch (e) {
        console.error(e);
      }
    },
    async deleteMatch(id) {
      if (!confirm("Are you sure you want to delete this match?")) return;
      try {
        await api.delete(`/admin/matches/${id}`);
        this.loadMatches();
      } catch (e) {
        console.error(e);
        alert("Failed to delete match");
      }
    },
    goToMatch(id) {
      this.$router.push(`/matches/${id}`);
    },
  },
};
</script>
