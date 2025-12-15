<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t("calendar.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Month Navigation -->
      <div class="calendar-header">
        <ion-button fill="clear" @click="prevMonth">
          <ion-icon :icon="chevronBackOutline"></ion-icon>
        </ion-button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <ion-button fill="clear" @click="nextMonth">
          <ion-icon :icon="chevronForwardOutline"></ion-icon>
        </ion-button>
      </div>

      <!-- Days of Week -->
      <div class="weekdays-grid">
        <div v-for="day in weekDays" :key="day" class="weekday-label">
          {{ day }}
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="days-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            'is-today': day.isToday,
            'is-selected': isSelected(day.date),
            'has-event': day.hasEvent,
          }"
          @click="selectDate(day.date)"
        >
          <span class="day-number">{{ day.dayNumber }}</span>
          <div class="event-dots" v-if="day.events.length > 0">
            <div v-for="event in day.events.slice(0, 3)" :key="event.id" class="dot-wrapper">
              <ion-icon :icon="getSportIcon(event.sport_type)" class="status-icon-small" :class="event.sport_type"></ion-icon>
            </div>
            <div v-if="day.events.length > 3" class="dot more">+</div>
          </div>
        </div>
      </div>

      <!-- Selected Day Events -->
      <div class="selected-events-section">
        <h3>{{ formatDateFull(selectedDate) }}</h3>

        <div v-if="selectedDayEvents.length === 0" class="no-events">
          <p>{{ t("calendar.no_matches") }}</p>
        </div>

        <ion-card v-for="match in selectedDayEvents" :key="match.id" class="match-card" @click="goToMatch(match.id)">
          <div class="sport-strip" :class="match.sport_type"></div>
          <ion-card-content>
            <div class="match-row">
              <div class="time-col">
                <span class="time">{{ formatTime(match.date_time) }}</span>
              </div>
              <div class="info-col">
                <h3 class="sport-name">{{ t("sports." + match.sport_type) }}</h3>
                <p class="location">
                  <ion-icon :icon="locationOutline" size="small"></ion-icon>
                  {{ match.location }}
                </p>
              </div>
              <div class="status-col">
                <ion-icon v-if="match.user_participation_status === 'confirmed'" :icon="checkmarkCircle" color="success"></ion-icon>
                <ion-icon v-else-if="match.user_participation_status === 'waitlist'" :icon="hourglassOutline" color="warning"></ion-icon>
                <ion-icon v-else :icon="helpCircleOutline" color="medium"></ion-icon>
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "../services/api";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
} from "@ionic/vue";
import {
  chevronBackOutline,
  chevronForwardOutline,
  locationOutline,
  checkmarkCircle,
  hourglassOutline,
  helpCircleOutline,
  football,
  basketball,
  baseballOutline,
  tennisball,
} from "ionicons/icons";

const router = useRouter();
const { t, locale } = useI18n();

const currentDate = ref(new Date());
const selectedDate = ref(new Date());
const matches = ref([]);

const weekDays = computed(() => {
  // Simple way to get localized weekdays
  const days = [];
  const d = new Date(2024, 0, 1); // Monday Jan 1 2024
  for (let i = 0; i < 7; i++) {
    days.push(d.toLocaleDateString(locale.value, { weekday: "short" }));
    d.setDate(d.getDate() + 1);
  }
  return days;
});

const currentMonthName = computed(() => {
  return currentDate.value.toLocaleDateString(locale.value, { month: "long" });
});

const currentYear = computed(() => {
  return currentDate.value.getFullYear();
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();

  // 0 = Sunday, 1 = Monday. We want Monday as 0.
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6; // Sunday becomes 6

  const days = [];

  // Previous month padding
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      dayNumber: d.getDate(),
      date: d,
      isCurrentMonth: false,
      isToday: isSameDate(d, new Date()),
      events: getEventsForDate(d),
      hasEvent: getEventsForDate(d).length > 0,
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    days.push({
      dayNumber: i,
      date: d,
      isCurrentMonth: true,
      isToday: isSameDate(d, new Date()),
      events: getEventsForDate(d),
      hasEvent: getEventsForDate(d).length > 0,
    });
  }

  // Next month padding
  const remainingCells = 42 - days.length; // 6 rows * 7 cols
  for (let i = 1; i <= remainingCells; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      dayNumber: i,
      date: d,
      isCurrentMonth: false,
      isToday: isSameDate(d, new Date()),
      events: getEventsForDate(d),
      hasEvent: getEventsForDate(d).length > 0,
    });
  }

  return days;
});

const selectedDayEvents = computed(() => {
  return getEventsForDate(selectedDate.value);
});

const isSameDate = (d1, d2) => {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

const getEventsForDate = (date) => {
  return matches.value.filter((m) => isSameDate(new Date(m.date_time), date));
};

const isSelected = (date) => {
  return isSameDate(date, selectedDate.value);
};

const selectDate = (date) => {
  selectedDate.value = date;
  // If selected date is in another month, switch view? Optional.
  if (date.getMonth() !== currentDate.value.getMonth()) {
    currentDate.value = new Date(date.getFullYear(), date.getMonth(), 1);
  }
};

const prevMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const formatDateFull = (date) => {
  return date.toLocaleDateString(locale.value, { weekday: "long", year: "numeric", month: "long", day: "numeric" });
};

const formatTime = (dateString) => {
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const goToMatch = (id) => {
  router.push(`/matches/${id}`);
};

const fetchMatches = async () => {
  try {
    const response = await api.get("/matches/mine");
    matches.value = response.data;
  } catch (error) {
    console.error("Error fetching matches:", error);
  }
};

const getSportIcon = (sport) => {
  switch (sport) {
    case "soccer":
      return football;
    case "basketball":
      return basketball;
    case "volleyball":
      return baseballOutline;
    case "padel":
    case "tennis":
      return tennisball;
    default:
      return helpCircleOutline;
  }
};

onMounted(() => {
  fetchMatches();
});
</script>

<style scoped>
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.calendar-header h2 {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
  text-transform: capitalize;
}

.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  margin-bottom: 10px;
}

.weekday-label {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 600;
  text-transform: uppercase;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  margin-bottom: 20px;
}

.day-cell {
  aspect-ratio: 1;
  border-radius: 10px;
  background: var(--ion-color-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 5px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.status-icon-small {
  font-size: 12px;
}
.status-icon-small.soccer {
  color: #2dd36f;
}
.status-icon-small.basketball {
  color: #ffc409;
}
.status-icon-small.padel {
  color: #3dc2ff;
}
.status-icon-small.tennis {
  color: #eb445a;
}
.status-icon-small.volleyball {
  color: #5260ff;
}
.status-icon-small.other {
  color: #8c8c8c;
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.is-today {
  border: 2px solid var(--ion-color-primary);
  font-weight: bold;
}

.day-cell.is-selected {
  background: var(--ion-color-primary);
  color: white;
}

.day-number {
  font-size: 0.9rem;
}

.event-dots {
  display: flex;
  gap: 2px;
  margin-top: 4px;
  flex-wrap: wrap;
  justify-content: center;
}

.dot-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.dot.soccer {
  background-color: #2dd36f;
}
.dot.basketball {
  background-color: #ffc409;
}
.dot.tennis {
  background-color: #eb445a;
}
.dot.padel {
  background-color: #3dc2ff;
}
.dot.volleyball {
  background-color: #5260ff;
}
.dot.more {
  background: none;
  color: inherit;
  font-size: 8px;
  width: auto;
  height: auto;
  line-height: 6px;
}

.selected-events-section {
  margin-top: 20px;
}

.selected-events-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 15px;
  text-transform: capitalize;
}

.no-events {
  text-align: center;
  color: var(--ion-color-medium);
  padding: 20px;
  background: var(--ion-color-light);
  border-radius: 10px;
}

.match-card {
  margin: 0 0 15px 0;
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.sport-strip {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
}

.sport-strip.soccer {
  background-color: #2dd36f;
}
.sport-strip.basketball {
  background-color: #ffc409;
}
.sport-strip.tennis {
  background-color: #eb445a;
}
.sport-strip.padel {
  background-color: #3dc2ff;
}
.sport-strip.volleyball {
  background-color: #5260ff;
}

.match-row {
  display: flex;
  align-items: center;
  gap: 15px;
  padding-left: 10px;
}

.time-col {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--ion-color-dark);
}

.info-col {
  flex: 1;
}

.sport-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  text-transform: capitalize;
}

.location {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-col {
  display: flex;
  align-items: center;
}
</style>
