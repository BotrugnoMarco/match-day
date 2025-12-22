<template>
  <div class="section-container ion-padding-horizontal">
    <div class="section-title">
      <div class="title-left">
        <ion-icon :icon="timeOutline" color="medium"></ion-icon>
        <h3>{{ t("profile.history") }}</h3>
      </div>
    </div>

    <div v-if="displayedHistory.length > 0">
      <ion-card v-for="match in displayedHistory" :key="match.id" class="match-card" @click="$emit('go-to-match', match.id)">
        <ion-card-content class="match-card-content">
          <div class="match-left">
            <div class="match-date">
              <span class="day">{{ new Date(match.date_time).getDate() }}</span>
              <span class="month">{{ new Date(match.date_time).toLocaleString("default", { month: "short" }) }}</span>
            </div>
            <div class="match-info">
              <h3 class="sport-name">{{ t("sports." + match.sport_type).toUpperCase() }}</h3>
              <p class="location">{{ match.location }}</p>
            </div>
          </div>

          <div class="match-right">
            <div class="result-badge" :class="match.result">
              {{ match.result ? t("results." + match.result).toUpperCase() : t("profile.played") }}
            </div>
            <div class="rating-mini" v-if="match.avg_rating && isOwnProfile && !zenMode">
              <ion-icon :icon="star" color="warning"></ion-icon>
              <span>{{ match.avg_rating }}</span>
            </div>
          </div>
        </ion-card-content>
      </ion-card>

      <div class="ion-text-center ion-padding-top" v-if="limit > 0 && history.length > limit">
        <ion-button fill="clear" size="small" @click="$emit('view-all')">
          {{ t("common.view_all") }}
          <ion-icon slot="end" :icon="chevronForward"></ion-icon>
        </ion-button>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>{{ t("profile.no_matches") }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { IonIcon, IonCard, IonCardContent, IonButton } from "@ionic/vue";
import { timeOutline, star, chevronForward } from "ionicons/icons";

const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
  limit: {
    type: Number,
    default: 0,
  },
  isOwnProfile: {
    type: Boolean,
    default: false,
  },
  zenMode: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["go-to-match", "view-all"]);

const { t } = useI18n();

const displayedHistory = computed(() => {
  if (props.limit > 0) {
    return props.history.slice(0, props.limit);
  }
  return props.history;
});
</script>

<style scoped>
.section-container {
  margin-bottom: var(--space-5);
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
  padding-left: var(--space-1);
}

.title-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.match-card {
  margin: 0 0 var(--space-4) 0;
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-sm);
}

.match-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
}

.match-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.match-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--ion-color-light);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--rounded-sm);
  min-width: 50px;
}

.match-date .day {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.match-date .month {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--ion-color-medium);
  font-weight: 600;
}

.match-info .sport-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.match-info .location {
  margin: 3px 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.match-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
}

.result-badge {
  font-size: 0.75rem;
  font-weight: 800;
  padding: var(--space-1) var(--space-2);
  border-radius: 6px;
  text-transform: uppercase;
}

.result-badge.win {
  background: rgba(var(--ion-color-success-rgb), 0.1);
  color: var(--ion-color-success);
}
.result-badge.lost {
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  color: var(--ion-color-danger);
}
.result-badge.draw {
  background: rgba(var(--ion-color-medium-rgb), 0.1);
  color: var(--ion-color-medium);
}

.rating-mini {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.85rem;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  color: var(--ion-color-medium);
  padding: var(--space-5);
}
</style>
