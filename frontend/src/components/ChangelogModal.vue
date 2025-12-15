<template>
  <ion-modal :is-open="isOpen" @didDismiss="close" class="changelog-modal">
    <ion-page>
      <ion-header>
        <ion-toolbar>
          <ion-title>{{ t("changelog.title") }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="close">{{ t("common.close") }}</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" v-if="currentVersion">
        <div class="changelog-content">
          <div class="version-header">
            <h2>v{{ currentVersion.version }}</h2>
            <p class="date">{{ formatDate(currentVersion.date) }}</p>
          </div>

          <h3 class="update-title">{{ currentVersion.title }}</h3>

          <ion-list lines="none">
            <ion-item v-for="(feature, index) in currentVersion.features" :key="index" class="feature-item">
              <ion-icon :icon="getIcon(feature.icon)" slot="start" color="primary" class="feature-icon"></ion-icon>
              <ion-label class="ion-text-wrap">
                <h3>{{ feature.title }}</h3>
                <p>{{ feature.description }}</p>
              </ion-label>
            </ion-item>
          </ion-list>
          <div class="donation-section ion-text-center ion-padding-top">
            <ion-button fill="clear" @click="openDonation" color="warning">
              <ion-icon :icon="beerOutline" slot="start"></ion-icon>
              {{ t("common.donate") }}
            </ion-button>
          </div>
          <div class="ion-padding-top">
            <ion-button expand="block" @click="close">{{ t("changelog.got_it") }}</ion-button>
          </div>
        </div>
      </ion-content>
    </ion-page>
  </ion-modal>
</template>

<script setup>
import { defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import {
  IonModal,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from "@ionic/vue";
import * as icons from "ionicons/icons";
import { beerOutline } from "ionicons/icons";

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  currentVersion: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["close"]);
const { t, locale } = useI18n();

const close = () => {
  emit("close");
};

const openDonation = () => {
  window.open("https://ko-fi.com/dlayk_mark", "_blank");
};

const getIcon = (iconName) => {
  if (!iconName) return icons.helpCircleOutline;
  // Convert kebab-case to camelCase
  const camelName = iconName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  return icons[camelName] || icons.helpCircleOutline;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale.value, { year: "numeric", month: "long", day: "numeric" });
  } catch (e) {
    return dateString;
  }
};
</script>

<style scoped>
.changelog-modal {
  --height: 80%;
  --border-radius: 16px;
}

.version-header {
  text-align: center;
  margin-bottom: 20px;
}

.version-header h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.date {
  color: var(--ion-color-medium);
  margin: 5px 0 0;
  font-size: 0.9rem;
}

.update-title {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 20px;
}

.feature-item {
  --padding-start: 0;
  margin-bottom: 10px;
}

.feature-icon {
  font-size: 1.5rem;
  margin-right: 15px;
  background: rgba(var(--ion-color-primary-rgb), 0.1);
  padding: 8px;
  border-radius: 50%;
}

.feature-item h3 {
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 4px;
}

.feature-item p {
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--ion-color-medium-shade);
}
</style>
