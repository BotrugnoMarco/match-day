<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/admin"></ion-back-button>
        </ion-buttons>
        <ion-title>User Reports</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>

      <div v-else-if="reports.length === 0" class="empty-state">
        <ion-icon :icon="checkmarkCircleOutline" class="empty-icon"></ion-icon>
        <p>No reports found</p>
      </div>

      <ion-list v-else>
        <ion-card v-for="report in reports" :key="report.id" class="report-card">
          <ion-card-header>
            <div class="header-row">
              <ion-badge :color="getStatusColor(report.status)">{{ report.status }}</ion-badge>
              <span class="date">{{ formatDate(report.created_at) }}</span>
            </div>
            <ion-card-title class="report-reason">{{ getReasonLabel(report.reason) }}</ion-card-title>
          </ion-card-header>

          <ion-card-content>
            <div class="users-row">
              <div class="user-info">
                <span class="label">Reporter:</span>
                <div class="user-chip">
                  <ion-avatar class="small-avatar">
                    <img :src="report.reporter_avatar || '/default-avatar.svg'" />
                  </ion-avatar>
                  <span>{{ report.reporter_name }}</span>
                </div>
              </div>

              <div class="arrow">
                <ion-icon :icon="arrowForwardOutline"></ion-icon>
              </div>

              <div class="user-info">
                <span class="label">Reported:</span>
                <div class="user-chip">
                  <ion-avatar class="small-avatar">
                    <img :src="report.reported_avatar || '/default-avatar.svg'" />
                  </ion-avatar>
                  <span>{{ report.reported_name }}</span>
                </div>
              </div>
            </div>

            <div class="details-box" v-if="report.description">
              <p>{{ report.description }}</p>
            </div>

            <div class="match-info" v-if="report.match_id">
              <ion-icon :icon="footballOutline"></ion-icon>
              <span>Match #{{ report.match_id }} - {{ formatDate(report.match_date) }}</span>
            </div>

            <div class="actions-row">
              <ion-button v-if="report.status === 'pending'" size="small" color="warning" fill="outline" @click="updateStatus(report.id, 'reviewed')">
                Mark Reviewed
              </ion-button>

              <ion-button
                v-if="report.status !== 'resolved'"
                size="small"
                color="success"
                fill="outline"
                @click="updateStatus(report.id, 'resolved')"
              >
                Resolve
              </ion-button>

              <ion-button
                v-if="report.status !== 'dismissed'"
                size="small"
                color="medium"
                fill="outline"
                @click="updateStatus(report.id, 'dismissed')"
              >
                Dismiss
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonAvatar,
  IonIcon,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  toastController,
} from "@ionic/vue";
import { checkmarkCircleOutline, arrowForwardOutline, footballOutline, warningOutline } from "ionicons/icons";
import api from "../services/api";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const reports = ref([]);
const loading = ref(true);

const fetchReports = async () => {
  try {
    const response = await api.get("/reports");
    reports.value = response.data;
  } catch (error) {
    console.error("Error fetching reports:", error);
  } finally {
    loading.value = false;
  }
};

const handleRefresh = async (event) => {
  await fetchReports();
  event.target.complete();
};

const updateStatus = async (id, status) => {
  try {
    await api.put(`/reports/${id}/status`, { status });

    // Optimistic update
    const report = reports.value.find((r) => r.id === id);
    if (report) report.status = status;

    const toast = await toastController.create({
      message: "Status updated",
      duration: 2000,
      color: "success",
    });
    await toast.present();
  } catch (error) {
    console.error("Error updating status:", error);
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "danger";
    case "reviewed":
      return "warning";
    case "resolved":
      return "success";
    case "dismissed":
      return "medium";
    default:
      return "medium";
  }
};

const getReasonLabel = (reason) => {
  return t(`report.reasons.${reason}`) || reason;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

onMounted(fetchReports);
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 80%;
  color: var(--ion-color-medium);
}
.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.report-card {
  margin-bottom: 16px;
  border-radius: 12px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.date {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
}

.report-reason {
  font-size: 1.1rem;
  font-weight: bold;
}

.users-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  background: var(--ion-color-light);
  padding: 12px;
  border-radius: 8px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.small-avatar {
  width: 24px;
  height: 24px;
}

.arrow {
  color: var(--ion-color-medium);
}

.details-box {
  background: var(--ion-color-light);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-style: italic;
}

.match-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  border-top: 1px solid var(--ion-color-light);
  padding-top: 12px;
}
</style>
