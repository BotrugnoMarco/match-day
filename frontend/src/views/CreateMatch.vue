<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Create Match</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <div class="page-banner">
        <h2>New Match</h2>
        <p>Set up a new game</p>
      </div>

      <div class="create-container ion-padding-horizontal">
        <!-- Sport Selection -->
        <div class="section-title">Choose Sport</div>
        <div class="sports-grid">
          <div
            v-for="sport in sports"
            :key="sport.value"
            class="sport-card"
            :class="{ active: sportType === sport.value }"
            @click="selectSport(sport.value)"
          >
            <ion-icon :icon="sport.icon"></ion-icon>
            <span>{{ sport.label }}</span>
          </div>
        </div>

        <form @submit.prevent="createMatch" class="match-form">
          <!-- Date & Time -->
          <div class="form-group">
            <ion-item lines="none" class="custom-item">
              <ion-icon :icon="calendarOutline" slot="start" class="form-icon"></ion-icon>
              <ion-label>Date & Time</ion-label>
              <ion-datetime-button datetime="datetime"></ion-datetime-button>
            </ion-item>
            <ion-modal :keep-contents-mounted="true">
              <ion-datetime id="datetime" v-model="dateTime" presentation="date-time"></ion-datetime>
            </ion-modal>
          </div>

          <!-- Location -->
          <div class="form-group">
            <ion-item lines="none" class="custom-item">
              <ion-icon :icon="locationOutline" slot="start" class="form-icon"></ion-icon>
              <ion-input v-model="location" label="Location" label-placement="floating" placeholder="Where are we playing?"></ion-input>
            </ion-item>
          </div>

          <!-- Max Players -->
          <div class="form-group">
            <ion-item lines="none" class="custom-item">
              <ion-icon :icon="peopleOutline" slot="start" class="form-icon"></ion-icon>
              <ion-input type="number" v-model="maxPlayers" label="Max Players" label-placement="floating"></ion-input>
            </ion-item>
          </div>

          <!-- Price -->
          <div class="form-group">
            <ion-item lines="none" class="custom-item">
              <ion-icon :icon="cashOutline" slot="start" class="form-icon"></ion-icon>
              <ion-input type="number" v-model="priceTotal" label="Total Price (€)" label-placement="floating" placeholder="0.00"></ion-input>
            </ion-item>
          </div>

          <div class="ion-padding-top ion-margin-top">
            <ion-button expand="block" type="submit" class="create-btn" size="large"> Create Match </ion-button>
          </div>
        </form>
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
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonIcon,
} from "@ionic/vue";
import {
  addCircleOutline,
  football,
  basketball,
  tennisball,
  calendarOutline,
  locationOutline,
  peopleOutline,
  cashOutline,
  baseballOutline,
} from "ionicons/icons";

const router = useRouter();
const dateTime = ref(new Date().toISOString());
const location = ref("");
const sportType = ref("soccer");
const priceTotal = ref("");
const maxPlayers = ref(10);

const sports = [
  { value: "soccer", label: "Soccer", icon: football },
  { value: "volleyball", label: "Volleyball", icon: baseballOutline },
  { value: "padel", label: "Padel", icon: tennisball },
  { value: "tennis", label: "Tennis", icon: tennisball },
];

const selectSport = (type) => {
  sportType.value = type;
  updateMaxPlayers();
};

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
    const formattedDate = dateTime.value.replace("T", " ").slice(0, 19);

    await api.post("/matches", {
      date_time: formattedDate,
      location: location.value,
      sport_type: sportType.value,
      price_total: priceTotal.value,
      max_players: maxPlayers.value,
    });

    router.push("/matches");
  } catch (error) {
    console.error("Error creating match:", error);
    alert("Failed to create match: " + (error.response?.data?.error || error.message));
  }
};
</script>

<style scoped>
.page-content {
  --background: #f4f5f8;
}

.page-banner {
  background: var(--ion-color-primary);
  padding: 20px 20px 50px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  margin-bottom: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: white;
}

.page-banner h2 {
  margin: 0;
  font-weight: 800;
  font-size: 1.8rem;
}

.page-banner p {
  margin: 5px 0 0;
  opacity: 0.9;
}

.create-container {
  margin-top: -40px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
  margin-bottom: 12px;
  margin-left: 4px;
}

.sports-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.sport-card {
  background: white;
  border-radius: 15px;
  padding: 15px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.sport-card ion-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: var(--ion-color-medium);
}

.sport-card span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-medium);
}

.sport-card.active {
  border-color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.05);
}

.sport-card.active ion-icon,
.sport-card.active span {
  color: var(--ion-color-primary);
}

.match-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.custom-item {
  --background: transparent;
  --padding-start: 16px;
  --inner-padding-end: 16px;
  --min-height: 60px;
}

.form-icon {
  color: var(--ion-color-primary);
  margin-right: 10px;
}

.create-btn {
  --border-radius: 15px;
  font-weight: 700;
  margin-top: 10px;
  --box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.4);
}
</style>
