<template>
  <ion-page>
    <ion-content class="auth-content">
      <div class="auth-wrapper">
        <div class="auth-header">
          <div class="icon-container">
            <ion-icon :icon="football" class="app-logo"></ion-icon>
          </div>
          <h1>Welcome Back!</h1>
          <p>Sign in to continue</p>
        </div>

        <div class="auth-form-container">
          <form @submit.prevent="handleLogin">
            <div class="input-group">
              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="personOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="username" type="text" placeholder="Username" required></ion-input>
              </ion-item>

              <ion-item lines="none" class="custom-input">
                <ion-icon :icon="lockClosedOutline" slot="start" class="input-icon"></ion-icon>
                <ion-input v-model="password" type="password" placeholder="Password" required></ion-input>
              </ion-item>
            </div>

            <div class="forgot-password">
              <a href="#">Forgot Password?</a>
            </div>

            <ion-button expand="block" type="submit" class="auth-btn" shape="round"> LOGIN </ion-button>
          </form>

          <div class="auth-footer">
            <p>Don't have an account? <span @click="router.push('/register')">Create Account</span></p>
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
import { IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon } from "@ionic/vue";
import { personOutline, lockClosedOutline, football } from "ionicons/icons";

const username = ref("");
const password = ref("");
const store = useStore();
const router = useRouter();

const handleLogin = async () => {
  try {
    await store.dispatch("login", {
      username: username.value,
      password: password.value,
    });
    router.push("/matches");
  } catch (error) {
    console.error("Login failed", error);
    alert("Login failed: " + (error.response?.data?.error || error.message));
  }
};
</script>

<style scoped>
.auth-content {
  --background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
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
  color: white;
}

.icon-container {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  backdrop-filter: blur(10px);
}

.app-logo {
  font-size: 40px;
  color: white;
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
}

.auth-form-container {
  background: white;
  padding: 30px;
  border-radius: 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.custom-input {
  --background: #f5f7fa;
  --border-radius: 15px;
  --padding-start: 15px;
  border-radius: 15px;
}

.input-icon {
  color: #a0aec0;
  margin-right: 10px;
}

.forgot-password {
  text-align: right;
  margin-bottom: 25px;
}

.forgot-password a {
  color: #2a5298;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
}

.auth-btn {
  --background: linear-gradient(90deg, #1e3c72 0%, #2a5298 100%);
  --box-shadow: 0 4px 15px rgba(42, 82, 152, 0.4);
  font-weight: 700;
  letter-spacing: 1px;
  height: 50px;
  margin-bottom: 20px;
}

.auth-footer {
  text-align: center;
  font-size: 14px;
  color: #718096;
}

.auth-footer span {
  color: #2a5298;
  font-weight: 700;
  cursor: pointer;
}
</style>
