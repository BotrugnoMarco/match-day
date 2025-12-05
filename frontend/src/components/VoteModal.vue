<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>Vote for {{ targetName }}</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="cancel">Cancel</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <form @submit.prevent="submitVote">
      <ion-item>
        <ion-label position="stacked">Rating (1-10)</ion-label>
        <ion-range v-model="rating" min="1" max="10" pin="true" ticks="true" snaps="true">
          <ion-label slot="start">1</ion-label>
          <ion-label slot="end">10</ion-label>
        </ion-range>
        <div class="ion-text-center ion-padding-bottom">
          <h1>{{ rating }}</h1>
        </div>
      </ion-item>

      <ion-item>
        <ion-label position="floating">Tags (comma separated)</ion-label>
        <ion-input v-model="tags" placeholder="e.g. MVP, Good Defense"></ion-input>
      </ion-item>

      <div class="ion-padding-top">
        <ion-button expand="block" type="submit">Submit Vote</ion-button>
      </div>
    </form>
  </ion-content>
</template>

<script setup>
import { ref } from "vue";
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonRange,
  IonInput,
  modalController,
} from "@ionic/vue";
import api from "../services/api";

const props = defineProps({
  matchId: { type: Number, required: true },
  targetId: { type: Number, required: true },
  targetName: { type: String, required: true },
});

const rating = ref(6);
const tags = ref("");

const cancel = () => {
  modalController.dismiss(null, "cancel");
};

const submitVote = async () => {
  try {
    await api.post("/votes", {
      match_id: props.matchId,
      target_id: props.targetId,
      rating: rating.value,
      tags: tags.value,
    });
    modalController.dismiss(null, "confirm");
  } catch (error) {
    console.error("Vote error:", error);
    alert("Failed to submit vote: " + (error.response?.data?.error || error.message));
  }
};
</script>
