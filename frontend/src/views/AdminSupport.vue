<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="tertiary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t("admin_support.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <div class="ion-padding">
        <h2>{{ t("admin_support.ticket_management") }}</h2>

        <ion-segment v-model="filterStatus" mode="ios" class="custom-segment">
          <ion-segment-button value="all">
            <ion-label>{{ t("admin_support.all") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="open">
            <ion-label>{{ t("admin_support.open") }}</ion-label>
          </ion-segment-button>
          <ion-segment-button value="closed">
            <ion-label>{{ t("admin_support.closed") }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <div class="tickets-list">
          <div v-for="ticket in filteredTickets" :key="ticket.id" class="ticket-card" @click="openTicket(ticket)">
            <div class="ticket-header">
              <span class="ticket-user">{{ ticket.username }}</span>
              <ion-badge :color="getStatusColor(ticket.status)">{{ ticket.status }}</ion-badge>
            </div>
            <div class="ticket-subject">{{ ticket.subject }}</div>
            <div class="ticket-preview">{{ ticket.message.substring(0, 50) }}...</div>
            <div class="ticket-date">{{ new Date(ticket.created_at).toLocaleDateString() }}</div>
          </div>
        </div>
      </div>

      <!-- Reply Modal -->
      <ion-modal :is-open="isModalOpen" @didDismiss="closeModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>{{ t("admin_support.reply_title") }}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeModal">{{ t("common.close") }}</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding" v-if="selectedTicket">
          <div class="ticket-detail">
            <h3>{{ selectedTicket.subject }}</h3>
            <p class="meta">{{ t("admin_support.from") }}: {{ selectedTicket.username }} ({{ selectedTicket.email }})</p>
            <div class="message-box">
              {{ selectedTicket.message }}
            </div>

            <div v-if="selectedTicket.admin_response" class="response-box">
              <strong>{{ t("admin_support.previous_response") }}:</strong>
              <p>{{ selectedTicket.admin_response }}</p>
            </div>
          </div>

          <div class="reply-form">
            <ion-item lines="none" class="custom-item">
              <ion-label position="stacked">{{ t("admin_support.your_response") }}</ion-label>
              <ion-textarea v-model="replyMessage" rows="6" :placeholder="t('admin_support.reply_placeholder')"></ion-textarea>
            </ion-item>

            <ion-button expand="block" @click="sendReply" :disabled="isSubmitting">
              <span v-if="!isSubmitting">{{ t("admin_support.send_reply") }}</span>
              <ion-spinner v-else name="crescent"></ion-spinner>
            </ion-button>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
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
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonModal,
  IonButton,
  IonItem,
  IonTextarea,
  IonSpinner,
  toastController,
} from "@ionic/vue";

const { t } = useI18n();
const tickets = ref([]);
const filterStatus = ref("all");
const isModalOpen = ref(false);
const selectedTicket = ref(null);
const replyMessage = ref("");
const isSubmitting = ref(false);

const fetchTickets = async () => {
  try {
    const response = await api.get("/support/admin/all");
    tickets.value = response.data;
  } catch (error) {
    console.error("Error fetching tickets:", error);
  }
};

onMounted(() => {
  fetchTickets();
});

const filteredTickets = computed(() => {
  if (filterStatus.value === "all") return tickets.value;
  return tickets.value.filter((t) => t.status === filterStatus.value);
});

const openTicket = (ticket) => {
  selectedTicket.value = ticket;
  replyMessage.value = ""; // Reset reply
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedTicket.value = null;
};

const sendReply = async () => {
  if (!replyMessage.value) return;

  isSubmitting.value = true;
  try {
    await api.post(`/support/admin/${selectedTicket.value.id}/reply`, {
      response: replyMessage.value,
      status: "closed",
    });

    const toast = await toastController.create({
      message: "Reply sent successfully",
      duration: 2000,
      color: "success",
    });
    await toast.present();

    closeModal();
    fetchTickets(); // Refresh list
  } catch (error) {
    console.error("Error sending reply:", error);
    const toast = await toastController.create({
      message: "Failed to send reply",
      duration: 2000,
      color: "danger",
    });
    await toast.present();
  } finally {
    isSubmitting.value = false;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "open":
      return "danger";
    case "in_progress":
      return "warning";
    case "closed":
      return "success";
    default:
      return "medium";
  }
};
</script>

<style scoped>
.page-content {
  --background: #f4f5f8;
}

.custom-segment {
  margin-bottom: 20px;
}

.ticket-card {
  background: white;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.ticket-user {
  font-weight: 700;
  color: var(--ion-color-dark);
}

.ticket-subject {
  font-weight: 600;
  margin-bottom: 5px;
}

.ticket-preview {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.ticket-date {
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  text-align: right;
}

.ticket-detail {
  margin-bottom: 20px;
}

.ticket-detail h3 {
  margin-top: 0;
}

.meta {
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.message-box {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 15px;
}

.response-box {
  background: #e8f5e9;
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
  border-left: 4px solid var(--ion-color-success);
}

.custom-item {
  --background: #f8f9fa;
  --border-radius: 12px;
  margin-bottom: 15px;
}
</style>
