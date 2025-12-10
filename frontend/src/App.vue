<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup>
import { onMounted, watch, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { IonApp, IonRouterOutlet, toastController } from "@ionic/vue";
import socket from "./services/socket";

const store = useStore();
const router = useRouter();
const currentUser = computed(() => store.state.user);

const joinUserRoom = (userId) => {
  if (userId) {
    socket.emit("join_user_room", userId);
  }
};

onMounted(() => {
  if (currentUser.value) {
    joinUserRoom(currentUser.value.id);
  }

  socket.on("notification", async (notification) => {
    store.commit("ADD_NOTIFICATION", notification);

    const toast = await toastController.create({
      message: notification.message,
      duration: 3000,
      position: "top",
      color: "primary",
      buttons: [
        {
          text: "View",
          role: "info",
          handler: () => {
            if (notification.related_match_id) {
              router.push(`/matches/${notification.related_match_id}`);
            } else if (notification.message && notification.message.toLowerCase().includes("friend request")) {
              router.push("/friends");
            } else {
              router.push("/notifications");
            }
          },
        },
      ],
    });
    await toast.present();
  });
});

watch(currentUser, (newUser) => {
  if (newUser) {
    joinUserRoom(newUser.id);
  }
});
</script>
