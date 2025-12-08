<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Register</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="register-container">
        <ion-icon :icon="personAdd" class="auth-icon"></ion-icon>

        <ion-card>
          <ion-card-content>
            <form @submit.prevent="handleRegister">
              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="floating">Username</ion-label>
                <ion-input v-model="username" type="text" required></ion-input>
              </ion-item>
              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="floating">Email</ion-label>
                <ion-input v-model="email" type="email" required></ion-input>
              </ion-item>
              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="floating">Password</ion-label>
                <ion-input v-model="password" type="password" required></ion-input>
              </ion-item>
              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="stacked">Date of Birth</ion-label>
                <ion-input v-model="birthDate" type="date" :max="maxDate" required></ion-input>
              </ion-item>
              <ion-item lines="full" class="ion-margin-bottom">
                <ion-label position="stacked">Gender</ion-label>
                <ion-select v-model="gender" placeholder="Select Gender">
                  <ion-select-option value="M">Male</ion-select-option>
                  <ion-select-option value="F">Female</ion-select-option>
                  <ion-select-option value="Other">Other</ion-select-option>
                </ion-select>
              </ion-item>

              <div class="ion-padding-top">
                <ion-button expand="block" type="submit" size="large">Register</ion-button>
              </div>
            </form>
          </ion-card-content>
        </ion-card>

        <div class="ion-text-center ion-margin-top">
          <p>Already have an account? <router-link to="/login">Login</router-link></p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardContent,
  IonIcon,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";
import { personAdd } from "ionicons/icons";

const username = ref("");
const password = ref("");
const email = ref("");
const birthDate = ref("");
const gender = ref("");
const router = useRouter();

const maxDate = computed(() => {
  return new Date().toISOString().split("T")[0];
});

const handleRegister = async () => {
  if (!username.value || !password.value || !email.value || !birthDate.value || !gender.value) {
    alert("All fields are required.");
    return;
  }

  if (new Date(birthDate.value) > new Date()) {
    alert("Birth date cannot be in the future.");
    return;
  }

  try {
    await api.post("/auth/register", {
      username: username.value,
      password: password.value,
      email: email.value,
      birth_date: birthDate.value,
      gender: gender.value,
    });
    alert("Registration successful! Please login.");
    router.push("/login");
  } catch (error) {
    console.error("Registration failed", error);
    alert("Registration failed: " + (error.response?.data?.error || error.message));
  }
};
</script>

<style scoped>
.register-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.auth-icon {
  font-size: 80px;
  color: var(--ion-color-primary);
  align-self: center;
  margin-bottom: 20px;
}
</style>
