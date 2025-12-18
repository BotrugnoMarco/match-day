<template>
  <div class="info-card">
    <div class="info-row">
      <div class="info-block">
        <ion-icon :icon="calendarOutline" class="info-icon"></ion-icon>
        <div class="info-text">
          <span class="label">{{ t("common.date") }}</span>
          <div class="date-value-row">
            <span class="value">{{ formatDate(match.date_time) }}</span>
            <ion-button fill="clear" size="small" class="calendar-btn" @click="addToCalendar" title="Add to Google Calendar">
              <ion-icon slot="icon-only" :icon="logoGoogle"></ion-icon>
            </ion-button>
          </div>
        </div>
      </div>
      <div class="info-block">
        <ion-icon :icon="timeOutline" class="info-icon"></ion-icon>
        <div class="info-text">
          <span class="label">{{ t("common.time") }}</span>
          <span class="value">{{ formatTime(match.date_time) }}</span>
          <span class="sub-value" v-if="match.duration">({{ match.duration }} min)</span>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="info-row">
      <div class="info-block full-width">
        <ion-icon :icon="locationOutline" class="info-icon"></ion-icon>
        <div class="info-text">
          <span class="label">{{ t("create_match.location") }}</span>
          <span class="value">{{ match.location }}</span>
        </div>
      </div>
    </div>

    <div class="map-container" v-if="match.location">
      <iframe
        width="100%"
        height="200"
        style="border: 0; border-radius: var(--radius-md)"
        loading="lazy"
        allowfullscreen
        :src="`https://maps.google.com/maps?q=${encodeURIComponent(match.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`"
      >
      </iframe>
      <ion-button fill="clear" size="small" expand="block" @click="$emit('open-maps', match.location)">
        {{ t("match_details.open_maps") }}
        <ion-icon slot="end" :icon="mapOutline"></ion-icon>
      </ion-button>
    </div>

    <div class="divider" v-if="weather"></div>

    <div class="info-row" v-if="weather">
      <div class="info-block full-width">
        <ion-icon :icon="getWeatherIconObj(getWeatherIcon(weather.weatherCode))" class="info-icon"></ion-icon>
        <div class="info-text">
          <span class="label">{{ t("match_details.weather_forecast") }}</span>
          <div class="weather-value">
            <span class="weather-desc">{{ t(getWeatherDescription(weather.weatherCode)) }}</span>
            <span class="weather-temp">
              <ion-icon :icon="arrowUpOutline" size="small" style="vertical-align: middle; color: var(--ion-color-danger)"></ion-icon>
              {{ weather.maxTemp }}°
              <ion-icon
                :icon="arrowDownOutline"
                size="small"
                style="vertical-align: middle; color: var(--ion-color-primary); margin-left: 8px"
              ></ion-icon>
              {{ weather.minTemp }}°
            </span>
          </div>
          <div class="weather-sub" v-if="weather.precipProb > 0">
            <ion-icon :icon="umbrella" size="small" style="vertical-align: middle; margin-right: 4px"></ion-icon>
            {{ weather.precipProb }}% {{ t("match_details.precip_prob") }}
          </div>
        </div>
      </div>
    </div>

    <div class="divider"></div>

    <div class="info-row">
      <div class="info-block">
        <ion-icon :icon="cashOutline" class="info-icon"></ion-icon>
        <div class="info-text">
          <span class="label">{{ t("match_details.price") }}</span>
          <span class="value">€{{ match.price_total }}</span>
          <span class="sub-value" v-if="activeParticipants.length > 0">
            €{{ (match.price_total / activeParticipants.length).toFixed(2) }} {{ t("match_details.per_person") }}
          </span>
          <span class="sub-value" v-else>
            €{{ (match.price_total / (match.max_players || 10)).toFixed(2) }} {{ t("match_details.per_person_est") }}
          </span>
        </div>
      </div>
      <div class="info-block" @click="$emit('go-to-profile', match.creator_id)">
        <ion-icon :icon="personOutline" class="info-icon"></ion-icon>
        <div class="info-text">
          <span class="label">{{ t("match_details.organizer") }}</span>
          <div class="organizer-value">
            <ion-avatar class="mini-avatar">
              <img :src="match.creator_avatar || '/default-avatar.svg'" />
            </ion-avatar>
            <span>{{ match.creator_username || "Unknown" }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="divider" v-if="match.status !== 'finished'"></div>

    <div class="info-row" v-if="match.status !== 'finished'">
      <div class="info-block full-width post-match-row">
        <div class="pm-left">
          <ion-icon :icon="beerOutline" class="info-icon pm-icon"></ion-icon>
          <div class="info-text">
            <span class="label">{{ t("match_details.post_match") }}</span>
            <span class="value">{{ postMatchCount }} {{ t("match_details.people_staying") }}</span>
          </div>
        </div>
        <ion-button
          v-if="isParticipant"
          size="small"
          :fill="myPostMatchStatus ? 'solid' : 'outline'"
          :color="myPostMatchStatus ? 'warning' : 'medium'"
          @click="$emit('toggle-post-match')"
          shape="round"
          class="pm-btn"
        >
          {{ myPostMatchStatus ? t("match_details.im_in") : t("match_details.join") }}
        </ion-button>
      </div>
    </div>

    <div class="divider" v-if="match.is_covered || match.has_showers || averageAge"></div>

    <div class="features-row" v-if="match.is_covered || match.has_showers || averageAge">
      <div class="feature-item" v-if="match.is_covered">
        <ion-icon :icon="homeOutline"></ion-icon>
        <span>{{ t("create_match.covered_field") }}</span>
      </div>
      <div class="feature-item" v-if="match.has_showers">
        <ion-icon :icon="shirtOutline"></ion-icon>
        <span>{{ t("create_match.showers_available") }}</span>
      </div>
      <div class="feature-item" v-if="averageAge">
        <ion-icon :icon="peopleOutline"></ion-icon>
        <span>{{ t("match_details.avg_age", { age: averageAge }) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import { IonIcon, IonButton, IonAvatar } from "@ionic/vue";
import {
  calendarOutline,
  timeOutline,
  locationOutline,
  mapOutline,
  arrowUpOutline,
  arrowDownOutline,
  umbrella,
  cashOutline,
  personOutline,
  homeOutline,
  shirtOutline,
  peopleOutline,
  beerOutline,
  sunny,
  partlySunny,
  cloudy,
  rainy,
  snow,
  thunderstorm,
  helpCircle,
  logoGoogle,
} from "ionicons/icons";
import { getWeatherIcon, getWeatherDescription } from "../../services/weather";

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
  weather: {
    type: Object,
    default: null,
  },
  activeParticipants: {
    type: Array,
    default: () => [],
  },
  averageAge: {
    type: [String, Number],
    default: null,
  },
  postMatchCount: {
    type: Number,
    default: 0,
  },
  myPostMatchStatus: {
    type: Boolean,
    default: false,
  },
  isParticipant: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["open-maps", "go-to-profile", "toggle-post-match"]);

const { t, locale } = useI18n();

const weatherIcons = {
  sunny: sunny,
  "partly-sunny": partlySunny,
  cloudy: cloudy,
  rainy: rainy,
  snow: snow,
  thunderstorm: thunderstorm,
  "help-circle": helpCircle,
};

const getWeatherIconObj = (iconName) => {
  return weatherIcons[iconName] || helpCircle;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale.value, { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const addToCalendar = () => {
  const matchDate = new Date(props.match.date_time);
  const startTime = matchDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const duration = props.match.duration || 90;
  const endDate = new Date(matchDate.getTime() + duration * 60000);
  const endTime = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

  const title = encodeURIComponent("Partita MatchDay");
  const details = encodeURIComponent(
    `${t("match_details.organizer")}: ${props.match.creator_username || "Unknown"}\n${t("match_details.price")}: €${props.match.price_total}`
  );
  const location = encodeURIComponent(props.match.location);

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;

  window.open(url, "_blank");
};
</script>

<style scoped>
.info-card {
  background: var(--ion-card-background);
  border-radius: var(--rounded-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  gap: 20px;
}

.info-block {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-block.full-width {
  width: 100%;
}

.info-icon {
  font-size: 1.4rem;
  color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.2);
  padding: 10px;
  border-radius: var(--rounded-sm);
}

.info-text {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.date-value-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.calendar-btn {
  margin: 0;
  height: 20px;
  width: 20px;
  --padding-start: 0;
  --padding-end: 0;
  color: var(--ion-color-medium);
}

.value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.sub-value {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.organizer-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.mini-avatar {
  width: 24px;
  height: 24px;
}

.divider {
  height: 1px;
  background: var(--ion-color-light);
  margin: 16px 0;
}

.features-row {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--ion-color-light);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--rounded-md);
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.map-container {
  margin: var(--space-4) 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.weather-value {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.weather-desc {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.weather-temp {
  font-weight: 700;
  color: var(--ion-color-medium-shade);
}

.weather-sub {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}
.post-match-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pm-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pm-icon {
  color: var(--ion-color-warning);
}

.pm-btn {
  margin: 0;
  height: 32px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
