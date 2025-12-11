<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/register" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t("terms.title") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>{{ t("terms.title") }}</h1>
      <p>
        <strong>{{ t("terms.last_updated") }}</strong>
      </p>

      <h3>{{ t("terms.section1_title") }}</h3>
      <p>
        {{ t("terms.section1_text") }}
      </p>

      <h3>{{ t("terms.section2_title") }}</h3>
      <p>{{ t("terms.section2_text") }}</p>

      <h3>{{ t("terms.section3_title") }}</h3>
      <p>{{ t("terms.section3_text") }}</p>

      <h3>{{ t("terms.section4_title") }}</h3>
      <p>
        {{ t("terms.section4_text") }}
      </p>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton } from "@ionic/vue";

const { t } = useI18n();
</script>
