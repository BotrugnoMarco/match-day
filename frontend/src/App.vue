<template>
  <ion-app>
    <ion-menu content-id="main-content" type="overlay">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>{{ t("menu.menu_title") }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <div class="menu-inner">
          <ion-list>
            <ion-menu-toggle auto-hide="false" v-for="p in appPages" :key="p.url">
              <ion-item router-link-active="selected" :router-link="p.url" lines="none" detail="false" class="hydrated">
                <ion-icon slot="start" :ios="p.iosIcon" :md="p.mdIcon"></ion-icon>
                <ion-label>{{ p.title }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>

          <ion-list>
            <ion-menu-toggle auto-hide="false">
              <ion-item router-link-active="selected" router-link="/support" lines="none" detail="false">
                <ion-icon slot="start" :ios="helpCircleOutline" :md="helpCircleSharp"></ion-icon>
                <ion-label>{{ t("menu.support") }}</ion-label>
              </ion-item>
            </ion-menu-toggle>

            <ion-menu-toggle auto-hide="false" v-if="currentUser && currentUser.role === 'admin'">
              <ion-item router-link-active="selected" router-link="/admin/support" lines="none" detail="false">
                <ion-icon slot="start" :ios="constructOutline" :md="constructSharp"></ion-icon>
                <ion-label>{{ t("menu.admin_support") }}</ion-label>
              </ion-item>
            </ion-menu-toggle>

            <ion-menu-toggle auto-hide="false" v-if="currentUser">
              <ion-item button @click="logout" lines="none" detail="false">
                <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
                <ion-label>{{ t("menu.logout") }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </div>
      </ion-content>

      <ion-footer class="ion-no-border">
        <ion-toolbar color="light">
          <LanguageSwitcher />
        </ion-toolbar>
      </ion-footer>
    </ion-menu>
    <ion-router-outlet id="main-content" />

    <div class="donation-footer" v-if="currentUser">
      <a href="https://ko-fi.com/marcobotrugno" target="_blank">
        <ion-icon :icon="cafeOutline"></ion-icon>
        <span>{{ t("common.donate") }}</span>
      </a>
    </div>
  </ion-app>
</template>

<script setup>
import { onMounted, watch, computed } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import LanguageSwitcher from "./components/LanguageSwitcher.vue";
import {
  IonApp,
  IonRouterOutlet,
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
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
  helpCircleOutline,
  helpCircleSharp,
  constructOutline,
  constructSharp,
  logOutOutline,
  cafeOutline,
} from "ionicons/icons";

import socket from "./services/socket";
import { requestNotificationPermission, initPushListeners } from "./services/firebase";
import { AppUpdate, AppUpdateAvailability } from "@capawesome/capacitor-app-update";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

const store = useStore();
const router = useRouter();
const { t, locale } = useI18n();
const currentUser = computed(() => store.state.user);

onMounted(async () => {
  if (currentUser.value) {
    requestNotificationPermission();
    initPushListeners();
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const result = await AppUpdate.getAppUpdateInfo();
      if (result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
        if (Capacitor.getPlatform() === "android") {
          await AppUpdate.performImmediateUpdate();
        }
      }
    } catch (e) {
      console.error("App update check failed", e);
    }
  }
});

watch(currentUser, (newUser) => {
  if (newUser) {
    requestNotificationPermission();
    initPushListeners();
  }
});

const appPages = computed(() => [
  {
    title: t("menu.home"),
    url: "/home",
    iosIcon: homeOutline,
    mdIcon: homeSharp,
  },
  {
    title: t("menu.my_matches"),
    url: "/matches",
    iosIcon: calendarOutline,
    mdIcon: calendarSharp,
  },
  {
    title: t("menu.create_match"),
    url: "/matches/create",
    iosIcon: addCircleOutline,
    mdIcon: addCircleSharp,
  },
  {
    title: t("menu.friends"),
    url: "/friends",
    iosIcon: peopleOutline,
    mdIcon: peopleSharp,
  },
  {
    title: t("menu.profile"),
    url: "/profile",
    iosIcon: personCircleOutline,
    mdIcon: personCircleSharp,
  },
]);

const logout = async () => {
  await store.dispatch("logout");
  router.push("/login");
};

const getNotificationMessage = (message) => {
  try {
    const parsed = JSON.parse(message);
    if (parsed.key) {
      const params = { ...parsed.params };
      if (params.date) {
        params.date = new Date(params.date).toLocaleDateString(locale.value);
      }
      return t(parsed.key, params);
    }
    return message;
  } catch (e) {
    return message;
  }
};

const joinUserRoom = (userId) => {
  if (userId) {
    socket.emit("join_user_room", userId);
  }
};

onMounted(() => {
  // Handle Android Hardware Back Button
  App.addListener("backButton", ({ canGoBack }) => {
    if (canGoBack) {
      router.back();
    } else {
      App.exitApp();
    }
  });

  if (currentUser.value) {
    joinUserRoom(currentUser.value.id);
  }

  socket.on("notification", async (notification) => {
    store.commit("ADD_NOTIFICATION", notification);

    const toast = await toastController.create({
      message: getNotificationMessage(notification.message),
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
            } else {
              let isFriendRequest = false;
              try {
                const parsed = JSON.parse(notification.message);
                if (parsed.key && parsed.key.includes("friend_request")) {
                  isFriendRequest = true;
                }
              } catch (e) {
                if (notification.message && notification.message.toLowerCase().includes("friend request")) {
                  isFriendRequest = true;
                }
              }

              if (isFriendRequest) {
                router.push("/friends");
              } else {
                router.push("/notifications");
              }
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

.menu-inner {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.donation-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding: 8px 0;
  display: flex;
  justify-content: center;
  gap: 15px;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.donation-footer a {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--ion-color-medium);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
}

.donation-footer a:active {
  transform: scale(0.95);
  background: rgba(0, 0, 0, 0.08);
}

.donation-footer ion-icon {
  font-size: 1.1rem;
  color: #6f4e37; /* Coffee color */
}

ion-item.selected {
  --color: var(--ion-color-primary);
}
</style>
