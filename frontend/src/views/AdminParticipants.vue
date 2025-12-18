<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Participants</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="participant in participants" :key="participant.id">
          <ion-label>
            <h2>{{ participant.username }} in {{ participant.sport_type }}</h2>
            <p>Match Date: {{ new Date(participant.match_date).toLocaleDateString() }}</p>
            <p>Status: {{ participant.status }} | Team: {{ participant.team || "N/A" }}</p>
            <p>Paid: {{ participant.has_paid ? "Yes" : "No" }}</p>
          </ion-label>
          <ion-button fill="clear" color="danger" slot="end" @click="deleteParticipant(participant.id)">
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
  name: "AdminParticipants",
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons, IonBackButton },
  data() {
    return {
      participants: [],
      trashOutline,
    };
  },
  async mounted() {
    this.loadParticipants();
  },
  methods: {
    async loadParticipants() {
      try {
        const res = await api.get("/admin/participants");
        this.participants = res.data;
      } catch (e) {
        console.error(e);
      }
    },
    async deleteParticipant(id) {
      if (!confirm("Are you sure you want to delete this participant?")) return;
      try {
        await api.delete(`/admin/participants/${id}`);
        this.loadParticipants();
      } catch (e) {
        console.error(e);
        alert("Failed to delete participant");
      }
    },
  },
};
</script>
