<template>
  <ion-page>
    <ion-content class="auth-content">
      <div class="auth-wrapper">
        <div class="auth-header">
          <div class="icon-container">
            <ion-icon :icon="personAddOutline" class="app-logo"></ion-icon>
          </div>
          <h1>Create Account</h1>
          <p>Join the community today</p>
        </div>

        <div class="auth-form-container">
          <form @submit.prevent="handleRegister">
            <div class="input-group">
              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="personOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="username" type="text" placeholder="Username" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="mailOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="email" type="email" placeholder="Email" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="lockClosedOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="password" type="password" placeholder="Password" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="calendarOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="birthDate" type="date" :max="maxDate" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="maleFemaleOutline" slot="start" class="input-icon"></ion-icon>
                <ion-select v-model="gender" placeholder="Select Gender" interface="popover">
                  <ion-select-option value="M">Male</ion-select-option>
                  <ion-select-option value="F">Female</ion-select-option>
                  <ion-select-option value="Other">Other</ion-select-option>
                </ion-select>
              </ion-item>
            </div>

            <ion-button expand="block" type="submit" class="auth-btn" shape="round"> REGISTER </ion-button>
          </form>

          <div class="auth-footer">
            <p>Already have an account? <span @click="router.push('/login')">Sign In</span></p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import { IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon, IonSelect, IonSelectOption } from "@ionic/vue";
import { personAddOutline, personOutline, mailOutline, lockClosedOutline, calendarOutline, maleFemaleOutline } from "ionicons/icons";

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
      email: email.value,
      password: password.value,
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
.auth-content {
  --background: var(--ion-background-color);
}

.auth-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 100%;
  padding: 30px;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
  color: var(--ion-color-dark);
}

.icon-container {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: var(--shadow-md);
}

.app-logo {
  font-size: 40px;
  color: var(--ion-color-primary);
}

.auth-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 10px;
}

.auth-header p {
  margin: 0;
  opacity: 0.8;
  font-size: 16px;
  color: var(--ion-color-medium);
}

.auth-form-container {
  background: white;
  padding: 30px;
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-lg);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 25px;
}

.custom-input {
  --background: #f5f7fa;
  --border-radius: var(--rounded-md);
  --padding-start: 15px;
  border-radius: var(--rounded-md);
}

.input-icon {
  color: #a0aec0;
  margin-right: 10px;
}

.auth-btn {
  --background: var(--ion-color-primary);
  --box-shadow: var(--shadow-md);
  font-weight: 700;
  letter-spacing: 1px;
  height: 50px;
  margin-bottom: 20px;
  --border-radius: var(--rounded-md);
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: var(--ion-color-medium);
}

.auth-footer span {
  color: var(--ion-color-primary);
  font-weight: 700;
  cursor: pointer;
}
</style>
