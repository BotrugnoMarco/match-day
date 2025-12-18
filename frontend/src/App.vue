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
              <ion-item router-link-active="selected" :router-link="p.url" lines="none" detail="false" class="hydrated" @click="closeMenu">
                <ion-icon slot="start" :ios="p.iosIcon" :md="p.mdIcon"></ion-icon>
                <ion-label>{{ p.title }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>

          <ion-list>
            <ion-menu-toggle auto-hide="false">
              <ion-item button @click="openDonation" lines="none" detail="false">
                <ion-icon slot="start" :icon="beerOutline"></ion-icon>
                <ion-label>{{ t("common.donate") }}</ion-label>
              </ion-item>
            </ion-menu-toggle>

            <ion-menu-toggle auto-hide="false">
              <ion-item router-link-active="selected" router-link="/support" lines="none" detail="false" @click="closeMenu">
                <ion-icon slot="start" :ios="helpCircleOutline" :md="helpCircleSharp"></ion-icon>
                <ion-label>{{ t("menu.support") }}</ion-label>
              </ion-item>
            </ion-menu-toggle>

            <ion-menu-toggle auto-hide="false" v-if="currentUser && currentUser.role === 'admin'">
              <ion-item router-link-active="selected" router-link="/admin" lines="none" detail="false" @click="closeMenu">
                <ion-icon slot="start" :ios="constructOutline" :md="constructSharp"></ion-icon>
                <ion-label>Admin Dashboard</ion-label>
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
          <div class="footer-content">
            <LanguageSwitcher />
            <div class="theme-toggle">
              <ion-icon :icon="moonOutline" class="theme-icon"></ion-icon>
              <ion-toggle :checked="isDarkMode" @ionChange="toggleTheme"></ion-toggle>
            </div>
          </div>
        </ion-toolbar>
      </ion-footer>
    </ion-menu>
    <ion-router-outlet id="main-content" />
    <ChangelogModal :is-open="isChangelogOpen" :current-version="latestVersion" @close="closeChangelog" />
  </ion-app>
</template>

<script setup>
import { onMounted, watch, computed, ref } from "vue";
import { useStore } from "vuex";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import LanguageSwitcher from "./components/LanguageSwitcher.vue";
import ChangelogModal from "./components/ChangelogModal.vue";
import { changelog } from "./data/changelog";
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
  menuController,
  IonToggle,
} from "@ionic/vue";
import {
  homeOutline,
  homeSharp,
  calendarOutline,
  calendarSharp,
  calendarNumberOutline,
  calendarNumberSharp,
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
  beerOutline,
  moonOutline,
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

const isChangelogOpen = ref(false);
const latestVersion = changelog[0];
const isDarkMode = ref(false);

const closeChangelog = () => {
  isChangelogOpen.value = false;
  localStorage.setItem("last_seen_version", latestVersion.version);
};

const closeMenu = () => {
  menuController.close();
};

// Initialize Dark Mode
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    isDarkMode.value = true;
  } else if (savedTheme === "light") {
    document.body.classList.remove("dark");
    isDarkMode.value = false;
  } else {
    // Check system preference
    /* const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    if (prefersDark.matches) {
      document.body.classList.add("dark");
      isDarkMode.value = true;
    } */
  }
};

const toggleTheme = (event) => {
  isDarkMode.value = event.detail.checked;
  if (isDarkMode.value) {
    document.body.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.body.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
};

onMounted(async () => {
  initializeTheme();

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

  // Check changelog
  const lastSeenVersion = localStorage.getItem("last_seen_version");
  if (!lastSeenVersion || lastSeenVersion !== latestVersion.version) {
    // Wait a bit before showing to let app load
    setTimeout(() => {
      isChangelogOpen.value = true;
    }, 1000);
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
    title: t("menu.calendar"),
    url: "/calendar",
    iosIcon: calendarNumberOutline,
    mdIcon: calendarNumberSharp,
  },
  {
    title: t("menu.my_matches"),
    url: "/matches?filter=mine",
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

const openDonation = () => {
  window.open("https://ko-fi.com/dlayk_mark", "_blank");
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
    if (!canGoBack) {
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
.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
}

.theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-icon {
  font-size: 1.2rem;
  color: var(--ion-color-medium);
}
</style>

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

ion-item.selected {
  --color: var(--ion-color-primary);
}

ion-menu ion-item {
  --color: var(--ion-text-color);
}
</style>
