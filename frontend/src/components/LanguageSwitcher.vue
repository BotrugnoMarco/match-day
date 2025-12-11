<template>
  <ion-item lines="none" class="language-switcher">
    <ion-label>{{ t("common.language") }}</ion-label>
    <ion-select v-model="locale" interface="popover" @ionChange="changeLanguage">
      <ion-select-option value="it">Italiano</ion-select-option>
      <ion-select-option value="en">English</ion-select-option>
    </ion-select>
  </ion-item>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { IonItem, IonLabel, IonSelect, IonSelectOption } from "@ionic/vue";

const { t, locale } = useI18n();

const changeLanguage = (event) => {
  locale.value = event.detail.value;
  localStorage.setItem("user-locale", event.detail.value);
};
</script>

<style scoped>
.language-switcher {
  --background: transparent;
}
</style>
