<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Create Match</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="create-container">
        <ion-card>
          <ion-card-header>
            <ion-card-title>New Match Details</ion-card-title>
            <ion-card-subtitle>Fill in the information below</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <form @submit.prevent="createMatch">
              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="stacked">Date & Time</ion-label>
                <ion-datetime-button datetime="datetime"></ion-datetime-button>
                <ion-modal :keep-contents-mounted="true">
                  <ion-datetime id="datetime" v-model="dateTime"></ion-datetime>
                </ion-modal>
              </ion-item>

              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="floating">Location</ion-label>
                <ion-input v-model="location" required placeholder="e.g. Central Park Field 1"></ion-input>
              </ion-item>

              <ion-item lines="full" class="ion-margin-bottom">
                <ion-select v-model="sportType" label="Sport Type" placeholder="Select Sport" @ionChange="updateMaxPlayers">
                  <ion-select-option value="soccer">Soccer</ion-select-option>
                  <ion-select-option value="volleyball">Volleyball</ion-select-option>
                  <ion-select-option value="padel">Padel</ion-select-option>
                  <ion-select-option value="tennis">Tennis</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="floating">Max Players</ion-label>
                <ion-input type="number" v-model="maxPlayers" required></ion-input>
              </ion-item>

              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="floating">Total Price (€)</ion-label>
                <ion-input type="number" v-model="priceTotal" required placeholder="0.00"></ion-input>
              </ion-item>

              <div class="ion-padding-top">
                <ion-button expand="block" type="submit" size="large">
                  <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
                  Create Match
                </ion-button>
              </div>
            </form>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonSelect,
  IonSelectOption,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon,
} from "@ionic/vue";
import { addCircleOutline } from "ionicons/icons";

const router = useRouter();
const dateTime = ref(new Date().toISOString());
const location = ref("");
const sportType = ref("soccer");
const priceTotal = ref("");
const maxPlayers = ref(10);

const updateMaxPlayers = () => {
  if (sportType.value === "soccer") {
    maxPlayers.value = 10;
  } else if (sportType.value === "volleyball") {
    maxPlayers.value = 12;
  } else if (sportType.value === "padel" || sportType.value === "tennis") {
    maxPlayers.value = 4;
  }
};

const createMatch = async () => {
  try {
    // Ensure date is in MySQL compatible format or ISO string that backend can handle
    // The backend expects DATETIME, mysql2 usually handles JS Date objects or ISO strings well.
    // ion-datetime returns ISO string.
    const formattedDate = dateTime.value.replace("T", " ").slice(0, 19);

    await api.post("/matches", {
      date_time: formattedDate,
      location: location.value,
      sport_type: sportType.value,
      price_total: priceTotal.value,
      max_players: maxPlayers.value,
    });

    alert("Match created successfully!");
    router.push("/matches");
  } catch (error) {
    console.error("Error creating match:", error);
    alert("Failed to create match: " + (error.response?.data?.error || error.message));
  }
};
</script>

<style scoped>
.create-container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
