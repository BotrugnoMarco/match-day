<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/register"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t("privacy.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>{{ t("privacy.title") }}</h1>
      <p>
        <strong>{{ t("privacy.last_updated") }}</strong>
      </p>

      <h3>{{ t("privacy.section1_title") }}</h3>
      <p>
        {{ t("privacy.section1_text") }}
      </p>

      <h3>{{ t("privacy.section2_title") }}</h3>
      <p>
        {{ t("privacy.section2_text") }}
      </p>

      <h3>{{ t("privacy.section3_title") }}</h3>
      <p>{{ t("privacy.section3_text") }}</p>

      <h3>{{ t("privacy.section4_title") }}</h3>
      <p>{{ t("privacy.section4_text") }}</p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from "@ionic/vue";

const { t } = useI18n();
</script>
