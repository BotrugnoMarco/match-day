<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/matches/${route.params.id}`"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t("create_match.edit_title") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <div class="create-container ion-padding-horizontal ion-padding-top" v-if="match">
        <!-- Sport Selection (Read Only or Editable? Let's make it editable) -->
        <div class="section-title">{{ t("create_match.choose_sport") }}</div>
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
              <span>{{ t("create_match.when_where") }}</span>
            </div>
            <div class="form-content">
              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">{{ t("create_match.date_time") }}</ion-label>
                <ion-datetime-button datetime="datetime"></ion-datetime-button>
              </ion-item>
              <ion-modal :keep-contents-mounted="true">
                <ion-datetime id="datetime" v-model="dateTime" presentation="date-time" :prefer-wheel="true"></ion-datetime>
              </ion-modal>

              <div class="divider"></div>

              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">{{ t("create_match.location") }}</ion-label>
                <ion-input v-model="location" :placeholder="t('create_match.location_placeholder')"></ion-input>
              </ion-item>

              <div class="map-preview-container">
                <LocationPicker :lat="mapCoords.lat" :lng="mapCoords.lng" @location-selected="onLocationSelected" />
              </div>
            </div>
          </div>

          <!-- Details -->
          <div class="form-card">
            <div class="form-header">
              <ion-icon :icon="peopleOutline" class="header-icon"></ion-icon>
              <span>{{ t("create_match.match_details") }}</span>
            </div>
            <div class="form-content">
              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">{{ t("create_match.max_players") }}</ion-label>
                <ion-input type="number" v-model="maxPlayers" placeholder="10"></ion-input>
              </ion-item>

              <div class="divider"></div>

              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">{{ t("create_match.duration") }}</ion-label>
                <ion-select v-model="duration" interface="popover">
                  <ion-select-option :value="60">60 min</ion-select-option>
                  <ion-select-option :value="90">90 min</ion-select-option>
                  <ion-select-option :value="120">120 min</ion-select-option>
                </ion-select>
              </ion-item>

              <div class="divider"></div>

              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">{{ t("create_match.total_price") }}</ion-label>
                <ion-input type="number" v-model="priceTotal" placeholder="0.00"></ion-input>
              </ion-item>
            </div>
          </div>

          <!-- Field Options -->
          <div class="form-card">
            <div class="form-header">
              <ion-icon :icon="homeOutline" class="header-icon"></ion-icon>
              <span>{{ t("create_match.facilities") }}</span>
            </div>
            <div class="form-content">
              <ion-item lines="none" class="custom-item toggle-item">
                <ion-icon :icon="homeOutline" slot="start" color="medium"></ion-icon>
                <ion-label>{{ t("create_match.covered_field") }}</ion-label>
                <ion-toggle v-model="isCovered" slot="end"></ion-toggle>
              </ion-item>

              <div class="divider"></div>

              <ion-item lines="none" class="custom-item toggle-item">
                <ion-icon :icon="shirtOutline" slot="start" color="medium"></ion-icon>
                <ion-label>{{ t("create_match.showers") }}</ion-label>
                <ion-toggle v-model="hasShowers" slot="end"></ion-toggle>
              </ion-item>
            </div>
          </div>

          <!-- Private Match Options -->
          <div class="form-card">
            <div class="form-header">
              <ion-icon :icon="lockClosedOutline" class="header-icon"></ion-icon>
              <span>{{ t("create_match.privacy") }}</span>
            </div>
            <div class="form-content">
              <ion-item lines="none" class="custom-item toggle-item">
                <ion-label>{{ t("create_match.private_match") }}</ion-label>
                <ion-toggle v-model="isPrivate" slot="end"></ion-toggle>
              </ion-item>

              <div v-if="isPrivate">
                <div class="divider"></div>
                <ion-item lines="none" class="custom-item animate-item">
                  <ion-label position="stacked">{{ t("create_match.access_code") }}</ion-label>
                  <ion-input v-model="accessCode" :placeholder="t('create_match.access_code_placeholder')"></ion-input>
                </ion-item>
              </div>
            </div>
          </div>

          <div class="ion-padding-top ion-margin-top ion-margin-bottom">
            <ion-button expand="block" type="submit" class="create-btn" size="large">
              <ion-icon :icon="saveOutline" slot="start"></ion-icon>
              {{ t("common.save") }}
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
import { ref, onMounted, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "../services/api";
import LocationPicker from "../components/LocationPicker.vue";
import axios from "axios";
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
  IonSelect,
  IonSelectOption,
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
  homeOutline,
  shirtOutline,
  lockClosedOutline,
  keyOutline,
} from "ionicons/icons";

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const match = ref(null);

const dateTime = ref(new Date().toISOString());
const location = ref("");
const sportType = ref("soccer");
const priceTotal = ref("");
const maxPlayers = ref(10);
const duration = ref(60);
const isCovered = ref(false);
const hasShowers = ref(false);
const isPrivate = ref(false);
const accessCode = ref("");
const mapCoords = ref({ lat: 41.9028, lng: 12.4964 });

// Initialize map coords from location if possible
watch(location, (newVal) => {
  if (!newVal) return;

  // Check if it's coordinates
  const parts = newVal.split(",");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapCoords.value = { lat, lng };
      return;
    }
  }
});

// Watch location input for geocoding
let debounceTimer = null;
watch(location, (newVal) => {
  if (!newVal) return;

  // Skip if coordinates (handled above)
  const parts = newVal.split(",");
  if (parts.length === 2 && !isNaN(parseFloat(parts[0])) && !isNaN(parseFloat(parts[1]))) return;

  // If text, geocode
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newVal)}`);
      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        mapCoords.value = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  }, 1000);
});

const onLocationSelected = (coords) => {
  location.value = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
};

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
    duration.value = match.value.duration || 60;
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
      duration: duration.value,
    });

    presentToast("Match updated successfully. Participants will be notified.", "success");
    router.push(`/matches/${route.params.id}`);
  } catch (error) {
    console.error("Error updating match:", error);
    presentToast("Failed to update match: " + (error.response?.data?.error || error.message), "danger");
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
