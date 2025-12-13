<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t("vote.title", { name: targetName }) }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="cancel">{{ t("common.cancel") }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <form @submit.prevent="submitVote">
        <ion-item lines="none" class="rating-item">
          <ion-label position="stacked">{{ t("vote.rating") }}</ion-label>
          <div class="rating-display">
            <span class="rating-value">{{ rating }}</span>
            <span class="rating-max">/ 10</span>
          </div>
          <ion-range v-model="rating" min="1" max="10" step="0.5" pin="true" ticks="true" snaps="true" color="primary"></ion-range>
        </ion-item>

        <div class="tags-section">
          <ion-label class="tags-label">{{ t("vote.select_tag") }}</ion-label>
          <div class="tags-container">
            <ion-chip
              v-for="tag in availableTags"
              :key="tag"
              :color="selectedTag === tag ? 'primary' : 'medium'"
              :outline="selectedTag !== tag"
              @click="toggleTag(tag)"
            >
              <ion-label>{{ t(`vote.tags.${tag}`) }}</ion-label>
            </ion-chip>
          </div>
        </div>

        <div class="ion-padding-top">
          <ion-button expand="block" type="submit" size="large">{{ t("vote.submit_btn") }}</ion-button>
        </div>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonItem,
  IonLabel,
  IonRange,
  IonChip,
  modalController,
  toastController,
} from "@ionic/vue";
import api from "../services/api";

const props = defineProps({
  matchId: { type: Number, required: true },
  targetId: { type: Number, required: true },
  targetName: { type: String, required: true },
});

const { t } = useI18n();
const rating = ref(6);
const selectedTag = ref(null);

const availableTags = ["MVP", "Fair Play", "Top Scorer", "Best Defender", "Playmaker", "Goalkeeper", "Team Spirit", "Hustle", "Clutch", "Leader"];

const toggleTag = (tag) => {
  if (selectedTag.value === tag) {
    selectedTag.value = null;
  } else {
    selectedTag.value = tag;
  }
};

const cancel = () => {
  modalController.dismiss(null, "cancel");
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

const submitVote = async () => {
  try {
    await api.post("/votes", {
      match_id: props.matchId,
      target_id: props.targetId,
      rating: rating.value,
      tags: selectedTag.value || "",
    });
    presentToast(t("vote.success"), "success");
    modalController.dismiss(true, "confirm");
  } catch (error) {
    console.error("Error submitting vote:", error);
    presentToast(t("vote.failed"), "danger");
  }
};
</script>

<style scoped>
.rating-item {
  --background: transparent;
  margin-bottom: var(--space-5);
}

.rating-display {
  text-align: center;
  margin: var(--space-5) 0;
}

.rating-value {
  font-size: 4rem;
  font-weight: 800;
  color: var(--ion-color-primary);
}

.rating-max {
  font-size: 1.5rem;
  color: var(--ion-color-medium);
  margin-left: 5px;
}

.tags-section {
  margin-top: var(--space-5);
  padding: 0 var(--space-2);
}

.tags-label {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin-bottom: var(--space-2);
  display: block;
  font-weight: 600;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

ion-chip {
  margin: 0;
  font-weight: 600;
}
</style>
