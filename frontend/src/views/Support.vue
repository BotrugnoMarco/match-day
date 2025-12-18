<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ t("support.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content">
      <div class="page-banner">
        <h2>{{ t("support.help_center") }}</h2>
        <p>{{ t("support.how_can_we_help") }}</p>
      </div>

      <div class="ion-padding-horizontal" style="margin-top: -30px">
        <div class="segment-wrapper">
          <ion-segment v-model="activeTab" mode="ios" class="custom-segment">
            <ion-segment-button value="contact">
              <ion-label>{{ t("support.contact_us") }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="faq">
              <ion-label>{{ t("support.faq") }}</ion-label>
            </ion-segment-button>
            <ion-segment-button value="donate">
              <ion-label>{{ t("support.support_us") }}</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>
      </div>

      <div class="content-container ion-padding">
        <!-- Contact Form -->
        <div v-if="activeTab === 'contact'">
          <div class="form-card">
            <div class="form-header">
              <ion-icon :icon="mailOutline" class="header-icon"></ion-icon>
              <span>{{ t("support.send_message") }}</span>
            </div>

            <form @submit.prevent="submitTicket">
              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">{{ t("support.category") }}</ion-label>
                <ion-select v-model="form.category" interface="popover">
                  <ion-select-option value="bug">{{ t("support.report_bug") }}</ion-select-option>
                  <ion-select-option value="feature_request">{{ t("support.feature_request") }}</ion-select-option>
                  <ion-select-option value="account">{{ t("support.account_issue") }}</ion-select-option>
                  <ion-select-option value="other">{{ t("support.other") }}</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">{{ t("support.subject") }}</ion-label>
                <ion-input v-model="form.subject" :placeholder="t('support.subject_placeholder')"></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-item">
                <ion-label position="stacked">{{ t("support.message") }}</ion-label>
                <ion-textarea v-model="form.message" rows="6" :placeholder="t('support.message_placeholder')"></ion-textarea>
              </ion-item>

              <ion-button expand="block" type="submit" class="submit-btn" :disabled="isSubmitting">
                <span v-if="!isSubmitting">{{ t("support.submit_ticket") }}</span>
                <ion-spinner v-else name="crescent"></ion-spinner>
              </ion-button>
            </form>
          </div>

          <div class="history-section" v-if="tickets.length > 0">
            <h3>{{ t("support.your_tickets") }}</h3>
            <div v-for="ticket in tickets" :key="ticket.id" class="ticket-card">
              <div class="ticket-header">
                <span class="ticket-category">{{ formatCategory(ticket.category) }}</span>
                <ion-badge :color="getStatusColor(ticket.status)">{{ ticket.status }}</ion-badge>
              </div>
              <h4>{{ ticket.subject }}</h4>
              <p>{{ ticket.message }}</p>

              <div v-if="ticket.admin_response" class="admin-response">
                <strong>{{ t("support.admin_response") }}:</strong>
                <p>{{ ticket.admin_response }}</p>
              </div>

              <div class="ticket-footer">
                <span>{{ new Date(ticket.created_at).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div v-else-if="activeTab === 'faq'">
          <ion-accordion-group>
            <ion-accordion value="first">
              <ion-item slot="header" color="light">
                <ion-label>{{ t("support.faq_create_match") }}</ion-label>
              </ion-item>
              <div class="ion-padding" slot="content">
                {{ t("support.faq_create_match_ans") }}
              </div>
            </ion-accordion>
            <ion-accordion value="second">
              <ion-item slot="header" color="light">
                <ion-label>{{ t("support.faq_jersey") }}</ion-label>
              </ion-item>
              <div class="ion-padding" slot="content">
                {{ t("support.faq_jersey_ans") }}
              </div>
            </ion-accordion>
            <ion-accordion value="third">
              <ion-item slot="header" color="light">
                <ion-label>{{ t("support.faq_voting") }}</ion-label>
              </ion-item>
              <div class="ion-padding" slot="content">
                {{ t("support.faq_voting_ans") }}
              </div>
            </ion-accordion>
            <ion-accordion value="fourth">
              <ion-item slot="header" color="light">
                <ion-label>{{ t("support.faq_free") }}</ion-label>
              </ion-item>
              <div class="ion-padding" slot="content">{{ t("support.faq_free_ans") }}</div>
            </ion-accordion>
          </ion-accordion-group>
        </div>

        <!-- Donate Section -->
        <div v-else-if="activeTab === 'donate'">
          <div class="donate-card">
            <div class="donate-header">
              <ion-icon :icon="beer" class="donate-icon"></ion-icon>
              <h3>{{ t("support.support_dev") }}</h3>
            </div>
            <p>{{ t("support.support_desc") }}</p>
            <ion-button expand="block" class="kofi-btn" href="https://ko-fi.com/dlayk_mark" target="_blank">
              <ion-icon slot="start" :icon="beer"></ion-icon>
              {{ t("support.support_kofi") }}
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
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
  IonItem,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonSpinner,
  IonAccordionGroup,
  IonAccordion,
  IonBadge,
  toastController,
} from "@ionic/vue";
import { mailOutline, beer } from "ionicons/icons";

const { t } = useI18n();
const activeTab = ref("contact");
const isSubmitting = ref(false);
const tickets = ref([]);
const form = ref({
  category: "bug",
  subject: "",
  message: "",
});

const fetchTickets = async () => {
  try {
    const response = await api.get("/support");
    tickets.value = response.data;
  } catch (error) {
    console.error("Error fetching tickets:", error);
  }
};

onMounted(() => {
  fetchTickets();
});

const submitTicket = async () => {
  if (!form.value.subject || !form.value.message) {
    const toast = await toastController.create({
      message: "Please fill in all fields",
      duration: 2000,
      color: "warning",
    });
    await toast.present();
    return;
  }

  isSubmitting.value = true;
  try {
    await api.post("/support", form.value);
    const toast = await toastController.create({
      message: "Ticket submitted successfully",
      duration: 2000,
      color: "success",
    });
    await toast.present();

    // Reset form
    form.value.subject = "";
    form.value.message = "";
    form.value.category = "bug";

    // Refresh list
    fetchTickets();
  } catch (error) {
    console.error("Error submitting ticket:", error);
    const toast = await toastController.create({
      message: "Failed to submit ticket",
      duration: 2000,
      color: "danger",
    });
    await toast.present();
  } finally {
    isSubmitting.value = false;
  }
};

const formatCategory = (cat) => {
  return cat
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getStatusColor = (status) => {
  switch (status) {
    case "open":
      return "primary";
    case "in_progress":
      return "warning";
    case "closed":
      return "medium";
    default:
      return "medium";
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
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  color: white;
  text-align: center;
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

.segment-wrapper {
  background: var(--ion-card-background);
  border-radius: 15px;
  padding: 5px;
  box-shadow: var(--shadow-md);
}

.custom-segment {
  --background: transparent;
}

.form-card {
  background: var(--ion-card-background);
  border-radius: 20px;
  padding: 20px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
  border: 1px solid var(--ion-color-light);
}

.form-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: var(--ion-color-dark);
  font-weight: 700;
  font-size: 1.1rem;
}

.header-icon {
  color: var(--ion-color-primary);
  font-size: 1.4rem;
}

.custom-item {
  --background: var(--ion-color-light);
  --border-radius: 12px;
  margin-bottom: 15px;
  --padding-start: 15px;
}

.submit-btn {
  margin-top: 20px;
  --border-radius: 12px;
  font-weight: 700;
}

.history-section h3 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 15px;
  color: var(--ion-color-dark);
}

.ticket-card {
  background: var(--ion-color-light);
  border-radius: 15px;
  padding: 15px;
  margin-bottom: 10px;
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.ticket-category {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ion-color-medium);
  text-transform: uppercase;
}

.ticket-card h4 {
  margin: 0 0 5px;
  font-size: 1rem;
  font-weight: 700;
}

.ticket-card p {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.admin-response {
  background: #e8f5e9;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 3px solid var(--ion-color-success);
}

.admin-response strong {
  display: block;
  font-size: 0.8rem;
  color: var(--ion-color-success);
  margin-bottom: 4px;
}

.admin-response p {
  margin: 0;
  color: var(--ion-color-dark);
}

.ticket-footer {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  text-align: right;
}

.donate-card {
  background: var(--ion-card-background);
  border-radius: 20px;
  padding: 30px;
  text-align: center;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--ion-color-light);
}

.donate-header {
  margin-bottom: 20px;
}

.donate-icon {
  font-size: 3rem;
  color: #ff5e5b;
  margin-bottom: 10px;
}

.donate-card h3 {
  margin: 0;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.donate-card p {
  color: var(--ion-color-medium);
  line-height: 1.6;
  margin-bottom: 25px;
}

.kofi-btn {
  --background: #ff5e5b;
  --background-hover: #ff4f4c;
  --border-radius: 12px;
  font-weight: 700;
}
</style>
