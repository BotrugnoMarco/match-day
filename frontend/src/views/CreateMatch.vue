<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>Create Match</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="create-container">
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
              <ion-icon :icon="calendarOutline" slot="start" color="primary"></ion-icon>
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
              <ion-icon :icon="locationOutline" slot="start" color="primary"></ion-icon>
              <ion-input v-model="location" label="Location" label-placement="floating" placeholder="Where are we playing?"></ion-input>
            </ion-item>
          </div>

          <!-- Max Players -->
          <div class="form-group">
            <ion-item lines="none" class="custom-item">
              <ion-icon :icon="peopleOutline" slot="start" color="primary"></ion-icon>
              <ion-input type="number" v-model="maxPlayers" label="Max Players" label-placement="floating"></ion-input>
            </ion-item>
          </div>

          <!-- Price -->
          <div class="form-group">
            <ion-item lines="none" class="custom-item">
              <ion-icon :icon="cashOutline" slot="start" color="primary"></ion-icon>
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
import { addCircleOutline, football, basketball, tennisball, calendarOutline, locationOutline, peopleOutline, cashOutline } from "ionicons/icons";

const router = useRouter();
const dateTime = ref(new Date().toISOString());
const location = ref("");
const sportType = ref("soccer");
const priceTotal = ref("");
const maxPlayers = ref(10);

const sports = [
  { value: "soccer", label: "Soccer", icon: football },
  { value: "volleyball", label: "Volleyball", icon: basketball }, // Placeholder icon
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

    // alert("Match created successfully!");
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

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
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
  background: var(--ion-card-background, #fff);
  border-radius: 12px;
  padding: 12px 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.sport-card ion-icon {
  font-size: 24px;
  margin-bottom: 4px;
  color: var(--ion-color-medium);
}

.sport-card span {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ion-color-medium);
}

.sport-card.active {
  border-color: var(--ion-color-primary);
  background: var(--ion-color-light);
}

.sport-card.active ion-icon,
.sport-card.active span {
  color: var(--ion-color-primary);
  font-weight: 600;
}

.match-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  background: var(--ion-card-background, #fff);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.custom-item {
  --background: transparent;
  --padding-start: 16px;
  --inner-padding-end: 16px;
}

.create-btn {
  --border-radius: 12px;
  font-weight: 600;
  margin-top: 16px;
}
</style>
