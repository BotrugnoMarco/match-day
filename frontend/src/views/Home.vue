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
        <div class="welcome-text" v-if="!isAuthenticated">
          <h2>Welcome!</h2>
          <p>Organize matches, track scores, and rank up with your friends.</p>
        </div>
        <div class="welcome-text" v-else>
          <h2>Welcome back, {{ user?.username }}!</h2>
          <p>Ready for your next match?</p>
          <div class="user-info-pills" v-if="user">
            <ion-badge color="light" class="info-pill">{{ user.role?.toUpperCase() }}</ion-badge>
          </div>
        </div>

        <div class="buttons-wrapper" v-if="!isAuthenticated">
          <ion-button expand="block" size="large" router-link="/login" class="action-btn primary-btn">
            Login
            <ion-icon slot="end" :icon="logInOutline"></ion-icon>
          </ion-button>
          <ion-button expand="block" size="large" fill="outline" router-link="/register" class="action-btn secondary-btn">
            Create Account
            <ion-icon slot="end" :icon="personAddOutline"></ion-icon>
          </ion-button>
        </div>

        <div class="buttons-wrapper" v-else>
          <ion-button expand="block" size="large" router-link="/matches" class="action-btn primary-btn">
            Go to Matches
            <ion-icon slot="end" :icon="calendarOutline"></ion-icon>
          </ion-button>
          <ion-button expand="block" size="large" fill="outline" router-link="/profile" class="action-btn secondary-btn">
            My Profile
            <ion-icon slot="end" :icon="personCircleOutline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "vuex";
import { IonPage, IonContent, IonButton, IonIcon, IonBadge } from "@ionic/vue";
import { logInOutline, personAddOutline, calendarOutline, personCircleOutline } from "ionicons/icons";

const store = useStore();
const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`;

const isAuthenticated = computed(() => store.getters.isAuthenticated);
const user = computed(() => store.getters.currentUser);
</script>

<style scoped>
.home-content {
  --background: var(--ion-background-color);
  overflow-y: auto;
}

.home-banner {
  background: var(--ion-color-primary);
  height: auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-bottom-left-radius: var(--rounded-xl);
  border-bottom-right-radius: var(--rounded-xl);
  box-shadow: var(--shadow-lg);
  position: relative;
  padding-bottom: var(--space-10);
  color: white;
  text-align: center;
}

.logo-wrapper {
  background: white;
  padding: var(--space-3);
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: var(--space-5);
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
  border-radius: var(--rounded-md);
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
  margin-top: var(--space-3);
  font-weight: 500;
  max-width: 80%;
}

.actions-container {
  padding: var(--space-10) var(--space-8);
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
  margin-bottom: var(--space-3);
}

.welcome-text p {
  color: var(--ion-color-medium);
  font-size: 1rem;
  line-height: 1.5;
}

.user-info-pills {
  margin-top: var(--space-4);
}

.info-pill {
  padding: var(--space-2) var(--space-3);
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: var(--rounded-sm);
}

.buttons-wrapper {
  width: 100%;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.action-btn {
  --border-radius: var(--rounded-md);
  font-weight: 700;
  height: 55px;
  --box-shadow: var(--shadow-sm);
}

.primary-btn {
  --box-shadow: var(--shadow-md);
}

.secondary-btn {
  --border-width: 2px;
}
</style>
