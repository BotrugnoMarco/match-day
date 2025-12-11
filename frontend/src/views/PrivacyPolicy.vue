<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/register"></ion-back-button>
        </ion-buttons>
        <ion-title>Privacy Policy</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Privacy Policy</h1>
      <p><strong>Last updated: December 2025</strong></p>

      <h3>1. Information We Collect</h3>
      <p>
        We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with us. This may
        include your name, email address, and sports preferences.
      </p>

      <h3>2. How We Use Your Information</h3>
      <p>
        We use the information we collect to provide, maintain, and improve our services, such as to organize matches and facilitate communication
        between players.
      </p>

      <h3>3. Data Storage</h3>
      <p>Your data is stored securely. We do not share your personal data with third parties for marketing purposes.</p>

      <h3>4. Your Rights</h3>
      <p>You have the right to access, correct, or delete your personal data at any time.</p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from "@ionic/vue";
</script>
