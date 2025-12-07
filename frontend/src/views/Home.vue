<template>
  <ion-page>
    <ion-content class="home-content" :fullscreen="true">
      <div class="home-banner">
        <div class="logo-wrapper">
          <img :src="logoUrl" alt="MatchDay Logo" class="main-logo" />
        </div>
        <h1 class="app-title">MatchDay</h1>
        <p class="app-tagline">Manage your amateur sports matches easily.</p>
      </div>

      <div class="actions-container">
        <div class="welcome-text">
          <h2>Welcome!</h2>
          <p>Organize matches, track scores, and rank up with your friends.</p>
        </div>

        <div class="buttons-wrapper">
          <ion-button expand="block" size="large" router-link="/login" class="action-btn primary-btn">
            Login
            <ion-icon slot="end" :icon="logInOutline"></ion-icon>
          </ion-button>
          <ion-button expand="block" size="large" fill="outline" router-link="/register" class="action-btn secondary-btn">
            Create Account
            <ion-icon slot="end" :icon="personAddOutline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonButton, IonIcon } from "@ionic/vue";
import { logInOutline, personAddOutline } from "ionicons/icons";

const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`;
</script>

<style scoped>
.home-content {
  --background: #ffffff;
}

.home-banner {
  background: var(--ion-color-primary);
  height: 55%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: 40px;
  border-bottom-right-radius: 40px;
  box-shadow: 0 10px 30px rgba(var(--ion-color-primary-rgb), 0.3);
  position: relative;
  padding-bottom: 40px;
  color: white;
  text-align: center;
}

.logo-wrapper {
  background: white;
  padding: 10px;
  border-radius: 25px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-logo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 18px;
}

.app-title {
  font-size: 2.8rem;
  font-weight: 900;
  margin: 0;
  letter-spacing: -1px;
}

.app-tagline {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-top: 10px;
  font-weight: 500;
  max-width: 80%;
}

.actions-container {
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 45%;
}

.welcome-text {
  text-align: center;
  margin-bottom: auto;
}

.welcome-text h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--ion-color-dark);
  margin-bottom: 10px;
}

.welcome-text p {
  color: var(--ion-color-medium);
  font-size: 1rem;
  line-height: 1.5;
}

.buttons-wrapper {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.action-btn {
  --border-radius: 15px;
  font-weight: 700;
  height: 55px;
  --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.primary-btn {
  --box-shadow: 0 8px 20px rgba(var(--ion-color-primary-rgb), 0.4);
}

.secondary-btn {
  --border-width: 2px;
}
</style>
