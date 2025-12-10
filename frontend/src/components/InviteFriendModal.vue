<template>
  <ion-modal :is-open="isOpen" @didDismiss="close">
    <ion-header>
      <ion-toolbar>
        <ion-title>Invite Friends</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="close">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-searchbar v-model="searchQuery" placeholder="Search friends..."></ion-searchbar>

      <ion-list v-if="filteredFriends.length > 0">
        <ion-item v-for="friend in filteredFriends" :key="friend.id">
          <ion-avatar slot="start">
            <img :src="friend.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
          </ion-avatar>
          <ion-label>
            <h2>{{ friend.username }}</h2>
          </ion-label>
          <ion-button slot="end" fill="outline" @click="invite(friend)" :disabled="invitedFriends.has(friend.id)">
            {{ invitedFriends.has(friend.id) ? "Invited" : "Invite" }}
          </ion-button>
        </ion-item>
      </ion-list>
      <div v-else class="empty-state">
        <p>No friends found.</p>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonSearchbar,
  toastController,
} from "@ionic/vue";
import api from "../services/api";

const props = defineProps({
  isOpen: Boolean,
  matchId: Number,
  participants: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["close"]);

const friends = ref([]);
const searchQuery = ref("");
const invitedFriends = ref(new Set());

const fetchFriends = async () => {
  try {
    const response = await api.get("/friends");
    friends.value = response.data;
  } catch (error) {
    console.error("Error fetching friends:", error);
  }
};

const isParticipant = (friendId) => {
  return props.participants.some((p) => p.user_id === friendId);
};

const filteredFriends = computed(() => {
  let filtered = friends.value;

  // Filter out existing participants
  filtered = filtered.filter((friend) => !isParticipant(friend.id));

  if (searchQuery.value) {
    filtered = filtered.filter((friend) => friend.username.toLowerCase().includes(searchQuery.value.toLowerCase()));
  }

  return filtered;
});

const invite = async (friend) => {
  try {
    await api.post(`/matches/${props.matchId}/invite`, { userId: friend.id });
    invitedFriends.value.add(friend.id);
    const toast = await toastController.create({
      message: `Invitation sent to ${friend.username}`,
      duration: 2000,
      color: "success",
      position: "top",
    });
    await toast.present();
  } catch (error) {
    console.error("Error sending invitation:", error);
    const toast = await toastController.create({
      message: "Failed to send invitation",
      duration: 2000,
      color: "danger",
      position: "top",
    });
    await toast.present();
  }
};

const close = () => {
  emit("close");
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (newVal) {
      fetchFriends();
      invitedFriends.value.clear();
    }
  }
);
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: var(--space-5);
  color: var(--ion-color-medium);
}
</style>
