<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/register"></ion-back-button>
        </ion-buttons>
        <ion-title>Terms of Service</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Terms of Service</h1>
      <p><strong>Last updated: December 2025</strong></p>

      <h3>1. Acceptance of Terms</h3>
      <p>
        By accessing or using our app, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the
        service.
      </p>

      <h3>2. User Conduct</h3>
      <p>You agree not to use the service for any unlawful purpose or to solicit others to perform or participate in any unlawful acts.</p>

      <h3>3. Liability</h3>
      <p>We are not responsible for any injuries or damages that may occur during matches organized through this platform. Play responsibly.</p>

      <h3>4. Account Termination</h3>
      <p>
        We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without
        limitation if you breach the Terms.
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from "@ionic/vue";
</script>
