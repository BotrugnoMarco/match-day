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
            :class="{ active: sportType === sport.value, [sport.value]: sportType === sport.value }"
            @click="selectSport(sport.value)"
          >
            <div class="sport-icon-wrapper" :class="{ [sport.value]: true }">
              <ion-icon :icon="sport.icon"></ion-icon>
            </div>
            <span>{{ sport.label }}</span>
          </div>
        </div>

        <form @submit.prevent="createMatch" class="match-form">
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
                <ion-input v-model="location" placeholder="Where are we playing?" :debounce="1000"></ion-input>
              </ion-item>

              <div class="map-preview-container" v-if="location">
                <iframe
                  width="100%"
                  height="150"
                  style="border: 0; border-radius: var(--radius-md)"
                  loading="lazy"
                  allowfullscreen
                  :src="`https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`"
                >
                </iframe>
              </div>
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
              <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
              Create Match
            </ion-button>
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
  IonToggle,
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
  umbrella,
  water,
  lockClosedOutline,
  keyOutline,
  mapOutline,
} from "ionicons/icons";

const router = useRouter();
const dateTime = ref(new Date().toISOString());
const location = ref("");
const sportType = ref("soccer");
const priceTotal = ref("");
const maxPlayers = ref(10);
const isCovered = ref(false);
const hasShowers = ref(false);
const isPrivate = ref(false);
const accessCode = ref("");

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
  if (!location.value || !priceTotal.value) {
    alert("Please fill in all fields");
    return;
  }

  // Format date to local MySQL format (YYYY-MM-DD HH:mm:ss) to avoid timezone shifts
  // We need to adjust for the timezone offset manually because new Date(isoString) creates a date object in local time,
  // but getHours() returns local hours. However, the issue might be that the ISO string from ion-datetime
  // is already in a specific offset or UTC.
  // Let's try a simpler approach: just send the ISO string but let the backend handle it, OR
  // force the string to be what the user sees.

  // The ion-datetime value is an ISO string (e.g., 2023-10-27T10:00:00+02:00).
  // We want to extract "2023-10-27 10:00:00" exactly as written.
  const isoString = dateTime.value;
  const datePart = isoString.split("T")[0];
  const timePart = isoString.split("T")[1].substring(0, 5); // HH:mm
  // We append 'Z' to force the backend to treat this as UTC time,
  // so when it's retrieved it comes back as the same UTC time,
  // and the frontend converts it to local time which will be correct
  // IF the user selected the time in their local time.

  // WAIT. If I send "2025-12-10 10:00:00" to MySQL.
  // And I set timezone: '+00:00' in db config.
  // MySQL stores "2025-12-10 10:00:00".
  // When reading, it returns "2025-12-10T10:00:00.000Z".
  // Frontend new Date("...Z") -> 11:00 Local.

  // So if I want the user to see 10:00 Local.
  // I need the frontend to receive something that converts to 10:00 Local.
  // That is "09:00Z".

  // So I should store "09:00" in the DB?
  // If I store "09:00" in DB.
  // Read as "09:00Z".
  // Display as "10:00 Local". Correct.

  // So I need to convert the input time to UTC before sending.
  const d = new Date(dateTime.value);
  const formattedDate = d.toISOString().slice(0, 19).replace("T", " ");

  try {
    const response = await api.post("/matches", {
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
    router.push(`/matches/${response.data.matchId}`);
  } catch (error) {
    console.error("Error creating match:", error);
    alert("Failed to create match: " + (error.response?.data?.error || error.message));
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

.map-preview-container {
  padding: 0 var(--space-4) var(--space-4);
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
