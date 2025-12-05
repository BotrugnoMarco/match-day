<template>
  <ion-page>
    <ion-content class="ion-padding" :fullscreen="true">
      <div class="container">
        <div class="logo-container">
          <img :src="logoUrl" alt="MatchDay Logo" class="main-logo" />
        </div>
        <h1>MatchDay</h1>
        <p class="subtitle">Manage your amateur sports matches easily.</p>

        <div class="actions">
          <ion-button expand="block" size="large" router-link="/login" class="ion-margin-bottom"> Login </ion-button>
          <ion-button expand="block" size="large" fill="outline" router-link="/register"> Register </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonContent, IonButton } from "@ionic/vue";
const logoUrl = `${import.meta.env.BASE_URL}logo.jpg`;
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  text-align: center;
}

.logo-container {
  margin-bottom: 20px;
}

.main-logo {
  width: 150px;
  height: auto;
  border-radius: 10px;
}

h1 {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--ion-color-dark);
}

.subtitle {
  font-size: 1.2rem;
  color: var(--ion-color-medium);
  margin-bottom: 40px;
}

.actions {
  width: 100%;
  max-width: 300px;
}
</style>
