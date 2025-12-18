<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t("create_match.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="page-content">
      <div class="create-container ion-padding-horizontal ion-padding-top">
        <!-- Sport Selection -->
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

        <form @submit.prevent="createMatch" class="match-form">
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
                <ion-input v-model="location" :placeholder="t('create_match.location_placeholder')" :debounce="1000"></ion-input>
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
                <ion-label>{{ t("create_match.showers_available") }}</ion-label>
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
              <ion-icon :icon="addCircleOutline" slot="start"></ion-icon>
              {{ t("create_match.create_btn") }}
            </ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
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
  IonSelect,
  IonSelectOption,
  toastController,
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
  homeOutline,
  shirtOutline,
  lockClosedOutline,
  keyOutline,
  mapOutline,
  timeOutline,
} from "ionicons/icons";

const router = useRouter();
const { t } = useI18n();
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
const mapCoords = ref({ lat: 41.9028, lng: 12.4964 }); // Default Rome

const onLocationSelected = async (coords) => {
  // 1. Set coordinates immediately (so the map doesn't jump back)
  mapCoords.value = coords;

  // 2. Reverse Geocoding to get address
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`);
    if (response.data && response.data.display_name) {
      // Use the display name from Nominatim
      location.value = response.data.display_name;
    } else {
      // Fallback to coordinates if no address found
      location.value = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    }
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    location.value = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
  }
};

// Watch location input for geocoding
let debounceTimer = null;
watch(location, (newVal) => {
  if (!newVal) return;

  // Check if it's coordinates (to avoid re-triggering search when we just set it from map)
  const parts = newVal.split(",");
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      // It's coordinates, update map but don't search
      if (Math.abs(lat - mapCoords.value.lat) > 0.0001 || Math.abs(lng - mapCoords.value.lng) > 0.0001) {
        mapCoords.value = { lat, lng };
      }
      return;
    }
  }

  // Also check if it matches the address we just set (to avoid loop)
  // But since we set location.value, this watch triggers.
  // We need to distinguish between "user typing" and "map selection setting value".
  // However, if we set the text, we probably WANT the map to stay there.
  // The issue is if we search for the address we just got from reverse geocoding, it might move the pin slightly.
  // But it should be fine.

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

const presentToast = async (message, color = "danger") => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    color: color,
    position: "top",
  });
  await toast.present();
};

const sports = computed(() => [
  { value: "soccer", label: t("sports.soccer"), icon: football },
  { value: "volleyball", label: t("sports.volleyball"), icon: baseballOutline },
  { value: "padel", label: t("sports.padel"), icon: tennisball },
  { value: "tennis", label: t("sports.tennis"), icon: tennisball },
]);

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
    presentToast(t("create_match.fill_all_fields"));
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
      duration: duration.value,
    });
    presentToast(t("create_match.success"), "success");
    router.push(`/matches/${response.data.matchId}`);
  } catch (error) {
    console.error("Error creating match:", error);
    presentToast(t("create_match.failed") + ": " + (error.response?.data?.error || error.message), "danger");
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
  background: var(--ion-card-background);
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
  background: var(--ion-color-light);
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
  background: var(--ion-card-background);
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
  background: var(--ion-card-background);
  border-radius: var(--rounded-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.form-header {
  background: var(--ion-color-light);
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  border-bottom: 1px solid var(--ion-color-light);
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
