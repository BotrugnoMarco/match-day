<template>
  <div class="match-header">
    <div class="sport-icon-large" :class="match.sport_type">
      <ion-icon :icon="getSportIcon(match.sport_type)"></ion-icon>
    </div>
    <div class="header-info">
      <h1>{{ t("sports." + match.sport_type) }}</h1>
      <div class="header-badges">
        <ion-badge v-if="!(match.status === 'open' && match.is_private)" :color="getStatusColor(match.status)" class="status-badge">{{
          t("status." + match.status)
        }}</ion-badge>
        <ion-badge v-if="match.is_private" color="medium" class="status-badge">{{ t("matches.private") }}</ion-badge>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from "vue";
import { useI18n } from "vue-i18n";
import { IonIcon, IonBadge } from "@ionic/vue";
import { football, baseballOutline, tennisball, calendarOutline } from "ionicons/icons";

const props = defineProps({
  match: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();

const getStatusColor = (status) => {
  switch (status) {
    case "open":
      return "success";
    case "locked":
      return "warning";
    case "finished":
      return "medium";
    case "voting":
      return "tertiary";
    default:
      return "primary";
  }
};

const getSportIcon = (type) => {
  switch (type) {
    case "soccer":
      return football;
    case "volleyball":
      return baseballOutline;
    case "padel":
    case "tennis":
      return tennisball;
    default:
      return calendarOutline;
  }
};
</script>

<style scoped>
.match-header {
  background: var(--ion-card-background);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.sport-icon-large {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
  box-shadow: var(--shadow-lg);
}

.sport-icon-large.soccer {
  background-color: #2dd36f;
}
.sport-icon-large.basketball {
  background-color: #ffc409;
}
.sport-icon-large.tennis {
  background-color: #eb445a;
}
.sport-icon-large.padel {
  background-color: #3dc2ff;
}
.sport-icon-large.volleyball {
  background-color: #5260ff;
}

.header-info h1 {
  margin: 0 0 8px;
  font-weight: 800;
  font-size: 1.8rem;
  text-transform: capitalize;
  color: var(--ion-color-dark);
}

.header-badges {
  display: flex;
  gap: 8px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: var(--rounded-lg);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
