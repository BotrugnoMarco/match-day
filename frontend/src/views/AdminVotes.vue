<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>Manage Votes</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="vote in votes" :key="vote.id">
          <ion-label>
            <h2>{{ vote.voter_name }} -> {{ vote.target_name }} ({{ vote.rating }})</h2>
            <p>Match Date: {{ new Date(vote.match_date).toLocaleDateString() }}</p>
            <p v-if="vote.comment">Comment: {{ vote.comment }}</p>
            <p v-if="vote.tags">Tags: {{ vote.tags }}</p>
          </ion-label>
          <ion-button fill="clear" color="danger" slot="end" @click="deleteVote(vote.id)">
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
  name: "AdminVotes",
  components: { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButton, IonIcon, IonButtons, IonBackButton },
  data() {
    return {
      votes: [],
      trashOutline,
    };
  },
  async mounted() {
    this.loadVotes();
  },
  methods: {
    async loadVotes() {
      try {
        const res = await api.get("/admin/votes");
        this.votes = res.data;
      } catch (e) {
        console.error(e);
      }
    },
    async deleteVote(id) {
      if (!confirm("Are you sure you want to delete this vote?")) return;
      try {
        await api.delete(`/admin/votes/${id}`);
        this.loadVotes();
      } catch (e) {
        console.error(e);
        alert("Failed to delete vote");
      }
    },
  },
};
</script>
