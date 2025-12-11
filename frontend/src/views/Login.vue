<template>
  <ion-page>
    <ion-content class="auth-content">
      <div class="auth-wrapper">
        <div class="auth-header">
          <div class="icon-container">
            <ion-icon :icon="football" class="app-logo"></ion-icon>
          </div>
          <h1>{{ t("auth.welcome_back") }}</h1>
          <p>{{ t("auth.sign_in_continue") }}</p>
        </div>

        <div class="auth-form-container">
          <form @submit.prevent="handleLogin">
            <div class="input-group">
              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="personOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="username" type="text" :placeholder="t('auth.username_placeholder')" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="lockClosedOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="password" type="password" :placeholder="t('auth.password_placeholder')" required></ion-input>
              </ion-item>
            </div>

            <div class="forgot-password">
              <a href="#">{{ t("auth.forgot_password") }}</a>
            </div>

            <ion-button expand="block" type="submit" class="auth-btn" shape="round"> {{ t("auth.login_btn") }} </ion-button>
          </form>

          <div class="auth-footer">
            <p>
              {{ t("auth.no_account") }} <span @click="router.push('/register')">{{ t("auth.create_account") }}</span>
            </p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon, toastController } from "@ionic/vue";
import { personOutline, lockClosedOutline, football } from "ionicons/icons";

const username = ref("");
const password = ref("");
const store = useStore();
const router = useRouter();
const { t } = useI18n();

const presentToast = async (message, color = "danger") => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    color: color,
    position: "top",
  });
  await toast.present();
};

const handleLogin = async () => {
  try {
    await store.dispatch("login", {
      username: username.value,
      password: password.value,
    });
    router.push("/matches");
  } catch (error) {
    console.error("Login failed", error);
    presentToast(t("auth.login_failed") + ": " + (error.response?.data?.error || error.message));
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
  margin-bottom: 40px;
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
  margin: 0 0 var(--space-3);
}

.auth-header p {
  margin: 0;
  opacity: 0.8;
  font-size: 16px;
  color: var(--ion-color-medium);
}

.auth-form-container {
  background: white;
  padding: var(--space-8);
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-lg);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.custom-input {
  --background: #f5f7fa;
  --border-radius: var(--rounded-md);
  --padding-start: var(--space-4);
  border-radius: var(--rounded-md);
}

.input-icon {
  color: #a0aec0;
  margin-right: var(--space-3);
}

.forgot-password {
  text-align: right;
  margin-bottom: var(--space-6);
}

.forgot-password a {
  color: var(--ion-color-primary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
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
