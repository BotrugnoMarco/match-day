<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button :default-href="backLink" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t("profile.history") }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding-vertical">
      <ProfileHistory
        :history="history"
        :is-own-profile="isOwnProfile"
        :zen-mode="isOwnProfile && !!currentUser?.zen_mode"
        @go-to-match="goToMatch"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";
import { IonPage, IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent } from "@ionic/vue";
import ProfileHistory from "../components/profile/ProfileHistory.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();
const { t } = useI18n();

const userId = route.params.id;
const currentUser = computed(() => store.getters.currentUser);
const isOwnProfile = computed(() => {
  // If no ID in route, it's own profile (but this route requires ID)
  // Or if ID matches current user
  return !userId || (currentUser.value && currentUser.value.id == userId);
});

const history = computed(() => {
  if (isOwnProfile.value) {
    return currentUser.value?.history || [];
  }
  return store.getters.viewedUserHistory || [];
});

const backLink = computed(() => {
  return isOwnProfile.value ? "/profile" : `/profile/${userId}`;
});

const goToMatch = (id) => {
  router.push(`/matches/${id}`);
};

onMounted(async () => {
  if (userId) {
    // If it's not the current user, or if we need to refresh
    if (!isOwnProfile.value) {
      await store.dispatch("fetchUserProfile", userId);
    } else {
      // Ensure own profile is loaded
      if (!currentUser.value) {
        await store.dispatch("fetchUserProfile");
      }
    }
  } else {
    // Should not happen with /profile/:id/history route, but for safety
    await store.dispatch("fetchUserProfile");
  }
});
</script>
