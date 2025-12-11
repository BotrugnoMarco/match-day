<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/matches/${route.params.id}`"></ion-back-button>
        </ion-buttons>
        <ion-title>Edit Match</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <div class="page-banner">
        <h2>Edit Match</h2>
        <p>Update match details</p>
      </div>

      <div class="create-container ion-padding-horizontal" v-if="match">
        <!-- Sport Selection (Read Only or Editable? Let's make it editable) -->
        <div class="section-title">Sport</div>
        <div class="sports-grid">
          <div
            v-for="sport in sports"
            :key="sport.value"
            class="sport-card"
            :class="{ active: sportType === sport.value, [sport.value]: sportType === sport.value }"
            @click="selectSport(sport.value)"
          >
            <div class="sport-icon-wrapper" :class="{ [sport.value]: true }">
              <ion-icon :icon="sport.icon"></ion-icon>
            </div>
            <span>{{ sport.label }}</span>
          </div>
        </div>

        <form @submit.prevent="updateMatch" class="match-form">
          <!-- Date & Time -->
          <div class="form-card">
            <div class="form-header">
              <ion-icon :icon="calendarOutline" class="header-icon"></ion-icon>
              <span>When & Where</span>
            </div>
            <div class="form-content">
              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">Date & Time</ion-label>
                <ion-datetime-button datetime="datetime"></ion-datetime-button>
              </ion-item>
              <ion-modal :keep-contents-mounted="true">
                <ion-datetime id="datetime" v-model="dateTime" presentation="date-time"></ion-datetime>
              </ion-modal>

              <div class="divider"></div>

              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">Location</ion-label>
                <ion-input v-model="location" placeholder="Where are we playing?"></ion-input>
              </ion-item>
            </div>
          </div>

          <!-- Details -->
          <div class="form-card">
            <div class="form-header">
              <ion-icon :icon="peopleOutline" class="header-icon"></ion-icon>
              <span>Match Details</span>
            </div>
            <div class="form-content">
              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">Max Players</ion-label>
                <ion-input type="number" v-model="maxPlayers" placeholder="10"></ion-input>
              </ion-item>

              <div class="divider"></div>

              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">Total Price (€)</ion-label>
                <ion-input type="number" v-model="priceTotal" placeholder="0.00"></ion-input>
              </ion-item>
            </div>
          </div>

          <!-- Field Options -->
          <div class="form-card">
            <div class="form-header">
              <ion-icon :icon="umbrella" class="header-icon"></ion-icon>
              <span>Facilities</span>
            </div>
            <div class="form-content">
              <ion-item lines="none" class="custom-item toggle-item">
                <ion-label>Covered Field</ion-label>
                <ion-toggle v-model="isCovered" slot="end"></ion-toggle>
              </ion-item>

              <div class="divider"></div>

              <ion-item lines="none" class="custom-item toggle-item">
                <ion-label>Showers Available</ion-label>
                <ion-toggle v-model="hasShowers" slot="end"></ion-toggle>
              </ion-item>
            </div>
          </div>

          <!-- Private Match Options -->
          <div class="form-card">
            <div class="form-header">
              <ion-icon :icon="lockClosedOutline" class="header-icon"></ion-icon>
              <span>Privacy</span>
            </div>
            <div class="form-content">
              <ion-item lines="none" class="custom-item toggle-item">
                <ion-label>Private Match</ion-label>
                <ion-toggle v-model="isPrivate" slot="end"></ion-toggle>
              </ion-item>

              <div v-if="isPrivate">
                <div class="divider"></div>
                <ion-item lines="none" class="custom-item animate-item">
                  <ion-label position="stacked">Access Code</ion-label>
                  <ion-input v-model="accessCode" placeholder="Secret code"></ion-input>
                </ion-item>
              </div>
            </div>
          </div>

          <div class="ion-padding-top ion-margin-top ion-margin-bottom">
            <ion-button expand="block" type="submit" class="create-btn" size="large">
              <ion-icon :icon="saveOutline" slot="start"></ion-icon>
              Save Changes
            </ion-button>
          </div>
        </form>
      </div>
      <div v-else class="ion-padding ion-text-center">
        <ion-spinner></ion-spinner>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
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
  IonToggle,
  IonSpinner,
  alertController,
  toastController,
} from "@ionic/vue";
import {
  saveOutline,
  football,
  basketball,
  tennisball,
  calendarOutline,
  locationOutline,
  peopleOutline,
  cashOutline,
  baseballOutline,
  umbrella,
  water,
  lockClosedOutline,
  keyOutline,
} from "ionicons/icons";

const router = useRouter();
const route = useRoute();
const match = ref(null);

const dateTime = ref(new Date().toISOString());
const location = ref("");
const sportType = ref("soccer");
const priceTotal = ref("");
const maxPlayers = ref(10);
const isCovered = ref(false);
const hasShowers = ref(false);
const isPrivate = ref(false);
const accessCode = ref("");

const presentToast = async (message, color = "danger") => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    color: color,
    position: "top",
  });
  await toast.present();
};

const sports = [
  { value: "soccer", label: "Soccer", icon: football },
  { value: "volleyball", label: "Volleyball", icon: baseballOutline },
  { value: "padel", label: "Padel", icon: tennisball },
  { value: "tennis", label: "Tennis", icon: tennisball },
];

const selectSport = (type) => {
  sportType.value = type;
};

const fetchMatch = async () => {
  try {
    const response = await api.get(`/matches/${route.params.id}`);
    match.value = response.data;

    // Populate fields
    // Convert UTC date from DB to local ISO string for ion-datetime
    // DB sends "2025-12-10T10:00:00.000Z"
    // new Date(match.value.date_time) creates a Date object in local time (e.g. 11:00)
    // toISOString() converts it back to UTC "2025-12-10T10:00:00.000Z"
    // ion-datetime expects ISO string. If we give it UTC, it might display in UTC or Local depending on config.
    // Usually ion-datetime works with local time if no offset is specified or if it matches system.

    // Let's try simply passing the ISO string of the date object.
    dateTime.value = new Date(match.value.date_time).toISOString();

    location.value = match.value.location;
    sportType.value = match.value.sport_type;
    priceTotal.value = match.value.price_total;
    maxPlayers.value = match.value.max_players;
    isCovered.value = !!match.value.is_covered;
    hasShowers.value = !!match.value.has_showers;
    isPrivate.value = !!match.value.is_private;
    accessCode.value = match.value.access_code || "";
  } catch (error) {
    console.error("Error fetching match:", error);
    presentToast("Error fetching match details");
    router.push("/matches");
  }
};

onMounted(() => {
  fetchMatch();
});

const updateMatch = async () => {
  if (!location.value || !priceTotal.value) {
    presentToast("Please fill in all fields");
    return;
  }

  const d = new Date(dateTime.value);
  const formattedDate = d.toISOString().slice(0, 19).replace("T", " ");

  try {
    await api.put(`/matches/${route.params.id}`, {
      sport_type: sportType.value,
      date_time: formattedDate,
      location: location.value,
      max_players: maxPlayers.value,
      price_total: priceTotal.value,
      is_covered: isCovered.value,
      has_showers: hasShowers.value,
      is_private: isPrivate.value,
      access_code: accessCode.value,
    });

    presentToast("Match updated successfully. Participants will be notified.", "success");
    router.push(`/matches/${route.params.id}`);
  } catch (error) {
    console.error("Error updating match:", error);
    presentToast("Failed to update match: " + (error.response?.data?.error || error.message));
  }
};
</script>

<style scoped>
.page-content {
  --background: var(--ion-background-color);
}

.page-banner {
  background: var(--ion-color-primary);
  padding: 20px 20px 50px;
  border-bottom-left-radius: var(--rounded-xl);
  border-bottom-right-radius: var(--rounded-xl);
  margin-bottom: 20px;
  box-shadow: var(--shadow-md);
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
  padding-bottom: 40px;
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
  border-radius: var(--rounded-md);
  padding: 15px 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  border: 2px solid transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.sport-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  background: #f0f2f5;
  color: var(--ion-color-medium);
  font-size: 1.2rem;
  transition: all 0.2s ease;
}

.sport-card span {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-medium);
}

.sport-card.active {
  border-color: var(--ion-color-primary);
  background: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.sport-card.active.soccer {
  border-color: #2dd36f;
}
.sport-card.active.basketball {
  border-color: #ffc409;
}
.sport-card.active.tennis {
  border-color: #eb445a;
}
.sport-card.active.padel {
  border-color: #3dc2ff;
}
.sport-card.active.volleyball {
  border-color: #5260ff;
}

.sport-card.active .sport-icon-wrapper.soccer {
  background: #2dd36f;
  color: white;
}
.sport-card.active .sport-icon-wrapper.basketball {
  background: #ffc409;
  color: white;
}
.sport-card.active .sport-icon-wrapper.tennis {
  background: #eb445a;
  color: white;
}
.sport-card.active .sport-icon-wrapper.padel {
  background: #3dc2ff;
  color: white;
}
.sport-card.active .sport-icon-wrapper.volleyball {
  background: #5260ff;
  color: white;
}

.sport-card.active span {
  color: var(--ion-color-dark);
}

.match-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-card {
  background: white;
  border-radius: var(--rounded-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.form-header {
  background: #f8f9fa;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border-bottom: 1px solid #f0f0f0;
}

.header-icon {
  color: var(--ion-color-primary);
  font-size: 1.2rem;
}

.form-header span {
  font-weight: 700;
  color: var(--ion-color-dark);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-content {
  padding: var(--space-2) 0;
}

.custom-item {
  --background: transparent;
  --padding-start: var(--space-4);
  --inner-padding-end: var(--space-4);
  --min-height: 60px;
}

.custom-item ion-label {
  font-weight: 600;
  color: var(--ion-color-medium);
  font-size: 0.85rem !important;
  margin-bottom: var(--space-2);
}

.toggle-item ion-label {
  font-size: 1rem !important;
  color: var(--ion-color-dark);
  margin-bottom: 0;
}

.divider {
  height: 1px;
  background: #f0f2f5;
  margin: 0 var(--space-4);
}

.create-btn {
  --border-radius: var(--rounded-md);
  font-weight: 700;
  --box-shadow: var(--shadow-lg);
  height: 56px;
}
</style>
