<template>
  <ion-page>
    <ion-content class="auth-content">
      <div class="auth-wrapper">
        <div class="auth-header">
          <div class="icon-container">
            <ion-icon :icon="personAddOutline" class="app-logo"></ion-icon>
          </div>
          <h1>{{ t("auth.register_title") }}</h1>
          <p>{{ t("auth.register_subtitle") }}</p>
        </div>

        <div class="auth-form-container">
          <form @submit.prevent="handleRegister">
            <div class="input-group">
              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="personOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="username" type="text" :placeholder="t('auth.username_placeholder')" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="mailOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="email" type="email" :placeholder="t('auth.email_placeholder')" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="lockClosedOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="password" type="password" :placeholder="t('auth.password_placeholder')" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="lockClosedOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="confirmPassword" type="password" :placeholder="t('auth.confirm_password_placeholder')" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="calendarOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="birthDate" type="date" :max="maxDate" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="maleFemaleOutline" slot="start" class="input-icon"></ion-icon>
                <ion-select v-model="gender" :placeholder="t('auth.select_gender')" interface="popover">
                  <ion-select-option value="M">{{ t("auth.male") }}</ion-select-option>
                  <ion-select-option value="F">{{ t("auth.female") }}</ion-select-option>
                  <ion-select-option value="Other">{{ t("auth.other") }}</ion-select-option>
                </ion-select>
              </ion-item>

              <ion-item lines="none" class="terms-item">
                <ion-checkbox v-model="termsAccepted" slot="start"></ion-checkbox>
                <ion-label class="ion-text-wrap">
                  <i18n-t keypath="auth.terms_agreement" tag="span">
                    <template #terms>
                      <span class="link" @click.stop="router.push('/terms')">{{ t("auth.terms") }}</span>
                    </template>
                    <template #privacy>
                      <span class="link" @click.stop="router.push('/privacy')">{{ t("auth.privacy") }}</span>
                    </template>
                  </i18n-t>
                </ion-label>
              </ion-item>
            </div>

            <ion-button expand="block" type="submit" class="auth-btn" shape="round" :disabled="!termsAccepted">
              {{ t("auth.register_btn") }}
            </ion-button>
          </form>

          <div class="auth-footer">
            <p>
              {{ t("auth.already_have_account") }} <span @click="router.push('/login')">{{ t("auth.login_link") }}</span>
            </p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import api from "../services/api";
import {
  IonPage,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonLabel,
  toastController,
} from "@ionic/vue";
import { personAddOutline, personOutline, mailOutline, lockClosedOutline, calendarOutline, maleFemaleOutline } from "ionicons/icons";

const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const email = ref("");
const birthDate = ref("");
const gender = ref("");
const termsAccepted = ref(false);
const router = useRouter();
const { t } = useI18n();

const maxDate = computed(() => {
  return new Date().toISOString().split("T")[0];
});

const presentToast = async (message, color = "danger") => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    color: color,
    position: "top",
  });
  await toast.present();
};

const handleRegister = async () => {
  if (!username.value || !password.value || !confirmPassword.value || !email.value || !birthDate.value || !gender.value) {
    presentToast("All fields are required.");
    return;
  }

  if (password.value !== confirmPassword.value) {
    presentToast(t("auth.passwords_do_not_match"));
    return;
  }

  if (!termsAccepted.value) {
    presentToast("You must accept the Terms of Service and Privacy Policy.");
    return;
  }

  if (new Date(birthDate.value) > new Date()) {
    presentToast("Birth date cannot be in the future.");
    return;
  }

  try {
    await api.post("/auth/register", {
      username: username.value,
      email: email.value,
      password: password.value,
      birth_date: birthDate.value,
      gender: gender.value,
      terms_accepted: true,
    });
    presentToast("Registration successful! Please login.", "success");
    router.push("/login");
  } catch (error) {
    console.error("Registration failed", error);
    presentToast(t("auth.registration_failed") + ": " + (error.response?.data?.error || error.message));
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
  padding: var(--space-8);
}

.auth-header {
  text-align: center;
  margin-bottom: var(--space-8);
  color: var(--ion-color-dark);
}

.icon-container {
  width: 80px;
  height: 80px;
  background: var(--ion-card-background);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-5);
  box-shadow: var(--shadow-md);
}

.app-logo {
  font-size: 40px;
  color: var(--ion-color-primary);
}

.auth-header h1 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 var(--space-3);
}

.auth-header p {
  margin: 0;
  opacity: 0.8;
  font-size: 16px;
  color: var(--ion-color-medium);
}

.auth-form-container {
  background: var(--ion-card-background);
  padding: var(--space-8);
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-lg);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.custom-input {
  --background: var(--ion-color-light);
  --border-radius: var(--rounded-md);
  --padding-start: var(--space-4);
  border-radius: var(--rounded-md);
}

.terms-item {
  --background: transparent;
  margin-top: 10px;
  font-size: 0.9rem;
}

.link {
  color: var(--ion-color-primary);
  text-decoration: underline;
  cursor: pointer;
}

.input-icon {
  color: var(--ion-color-medium);
  margin-right: var(--space-3);
}

.auth-btn {
  --background: var(--ion-color-primary);
  --box-shadow: var(--shadow-md);
  font-weight: 700;
  letter-spacing: 1px;
  height: 50px;
  margin-bottom: var(--space-5);
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
