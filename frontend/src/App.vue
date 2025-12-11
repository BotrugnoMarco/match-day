<template>
  <ion-app>
    <ion-menu content-id="main-content" type="overlay">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Menu</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-menu-toggle auto-hide="false" v-for="p in appPages" :key="p.url">
            <ion-item router-link-active="selected" :router-link="p.url" lines="none" detail="false" class="hydrated">
              <ion-icon slot="start" :ios="p.iosIcon" :md="p.mdIcon"></ion-icon>
              <ion-label>{{ p.title }}</ion-label>
            </ion-item>
          </ion-menu-toggle>

          <ion-menu-toggle auto-hide="false" v-if="currentUser">
            <ion-item button @click="logout" lines="none" detail="false">
              <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
              <ion-label>Logout</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>
      </ion-content>
    </ion-menu>
    <ion-router-outlet id="main-content" />
  </ion-app>
</template>

<script setup>
import { onMounted, watch, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  toastController,
} from "@ionic/vue";
import {
  homeOutline,
  homeSharp,
  calendarOutline,
  calendarSharp,
  addCircleOutline,
  addCircleSharp,
  peopleOutline,
  peopleSharp,
  personCircleOutline,
  personCircleSharp,
  notificationsOutline,
  notificationsSharp,
  logOutOutline,
} from "ionicons/icons";
import socket from "./services/socket";

const store = useStore();
const router = useRouter();
const currentUser = computed(() => store.state.user);

const appPages = [
  {
    title: "Home",
    url: "/home",
    iosIcon: homeOutline,
    mdIcon: homeSharp,
  },
  {
    title: "My Matches",
    url: "/matches",
    iosIcon: calendarOutline,
    mdIcon: calendarSharp,
  },
  {
    title: "Create Match",
    url: "/matches/create",
    iosIcon: addCircleOutline,
    mdIcon: addCircleSharp,
  },
  {
    title: "Friends",
    url: "/friends",
    iosIcon: peopleOutline,
    mdIcon: peopleSharp,
  },
  {
    title: "Profile",
    url: "/profile",
    iosIcon: personCircleOutline,
    mdIcon: personCircleSharp,
  },
];

const logout = async () => {
  await store.dispatch("logout");
  router.push("/login");
};

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

<style scoped>
ion-menu ion-content {
  --background: var(--ion-item-background, var(--ion-background-color, #fff));
}

ion-item.selected {
  --color: var(--ion-color-primary);
}
</style>
