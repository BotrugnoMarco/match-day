<template>
  <ion-modal :is-open="isOpen" @didDismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t("report.title") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="close">{{ t("common.close") }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="report-container">
        <p class="description">{{ t("report.description", { name: userName }) }}</p>

        <ion-item>
          <ion-label position="stacked">{{ t("report.reason") }}</ion-label>
          <ion-select v-model="reason" :placeholder="t('report.select_reason')">
            <ion-select-option value="abusive_language">{{ t("report.reasons.abusive_language") }}</ion-select-option>
            <ion-select-option value="unsportsmanlike">{{ t("report.reasons.unsportsmanlike") }}</ion-select-option>
            <ion-select-option value="spam">{{ t("report.reasons.spam") }}</ion-select-option>
            <ion-select-option value="fake_profile">{{ t("report.reasons.fake_profile") }}</ion-select-option>
            <ion-select-option value="other">{{ t("report.reasons.other") }}</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">{{ t("report.details") }}</ion-label>
          <ion-textarea v-model="details" rows="4" :placeholder="t('report.details_placeholder')"></ion-textarea>
        </ion-item>

        <div class="ion-padding-top">
          <ion-button expand="block" color="danger" @click="submitReport" :disabled="!reason || loading">
            <span v-if="!loading">{{ t("report.submit") }}</span>
            <ion-spinner v-else></ion-spinner>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref } from "vue";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonSpinner,
  toastController,
} from "@ionic/vue";
import { useI18n } from "vue-i18n";
import api from "../services/api";

const props = defineProps({
  isOpen: Boolean,
  userId: [Number, String],
  userName: String,
  matchId: [Number, String],
});

const emit = defineEmits(["close"]);
const { t } = useI18n();

const reason = ref("");
const details = ref("");
const loading = ref(false);

const close = () => {
  reason.value = "";
  details.value = "";
  emit("close");
};

const submitReport = async () => {
  if (!reason.value) return;

  loading.value = true;
  try {
    await api.post("/reports", {
      reported_user_id: props.userId,
      match_id: props.matchId,
      reason: reason.value,
      description: details.value,
    });

    const toast = await toastController.create({
      message: t("report.success"),
      duration: 2000,
      color: "success",
    });
    await toast.present();
    close();
  } catch (error) {
    console.error("Report error:", error);
    const toast = await toastController.create({
      message: t("report.error"),
      duration: 2000,
      color: "danger",
    });
    await toast.present();
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.report-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.description {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-bottom: 8px;
}
</style>
