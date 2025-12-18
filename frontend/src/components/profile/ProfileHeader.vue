<template>
  <div class="profile-banner">
    <!-- Top Row: Avatar (Left) and User Info (Right) -->
    <div class="profile-top-row">
      <div class="avatar-wrapper" @click="triggerFileInput">
        <ion-avatar class="main-avatar">
          <img :src="user?.avatar_url || '/default-avatar.svg'" />
        </ion-avatar>
        <div class="edit-badge" v-if="isOwnProfile">
          <ion-icon :icon="camera" color="light"></ion-icon>
        </div>
      </div>

      <div class="user-info-container">
        <h2 class="username">{{ user?.username }}</h2>
        <div class="jersey-status-row">
          <div class="jersey-container">
            <ion-icon :icon="shirt" class="jersey-icon"></ion-icon>
            <span class="jersey-number">{{ user?.preferred_number != null ? user.preferred_number : "?" }}</span>
          </div>
          <ion-badge :color="getStatusColor(user?.status)" class="status-badge">
            {{ t("profile." + (user?.status || "available")) }}
          </ion-badge>
        </div>
      </div>
    </div>

    <!-- Bottom Row: Roles -->
    <div class="profile-bottom-row">
      <div class="info-group">
        <ion-badge color="warning" class="role-badge" v-if="user?.role === 'admin'">{{ t("profile.admin") }}</ion-badge>
        <ion-badge v-for="skill in userRoles" :key="skill.sport_type" color="secondary" class="role-badge">
          <ion-icon :icon="getSportIcon(skill.sport_type)" style="margin-right: 4px; vertical-align: text-bottom"></ion-icon>
          {{ getRoleLabel(skill) }}
        </ion-badge>
      </div>

      <!-- Friend Actions Inline -->
      <div class="friend-actions-inline" v-if="!isOwnProfile">
        <ion-button v-if="friendshipStatus === 'none'" size="small" color="light" fill="outline" @click="$emit('send-friend-request')">
          <ion-icon :icon="personAddOutline" slot="start"></ion-icon>
          {{ t("profile.add_friend") }}
        </ion-button>
        <ion-button v-if="friendshipStatus === 'sent'" size="small" color="light" fill="outline" disabled>
          <ion-icon :icon="timeOutline" slot="start"></ion-icon>
          {{ t("profile.request_sent") }}
        </ion-button>
        <div v-if="friendshipStatus === 'received'" class="friend-request-actions">
          <ion-button size="small" color="success" @click="$emit('accept-friend-request')">
            <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
            {{ t("profile.accept") }}
          </ion-button>
          <ion-button size="small" color="danger" @click="$emit('reject-friend-request')">
            <ion-icon :icon="closeCircleOutline" slot="start"></ion-icon>
            {{ t("profile.reject") }}
          </ion-button>
        </div>
        <ion-badge v-if="friendshipStatus === 'accepted'" color="success" class="friend-badge">
          <ion-icon :icon="checkmarkCircleOutline"></ion-icon> {{ t("profile.friends_badge") }}
        </ion-badge>
      </div>
    </div>

    <input type="file" ref="fileInput" @change="handleFileChange" style="display: none" accept="image/*" />
  </div>

  <ImageCropperModal :is-open="isCropperOpen" :image-src="tempImageSrc" @cancel="closeCropper" @crop="handleCrop" />
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { IonAvatar, IonIcon, IonBadge, IonButton } from "@ionic/vue";
import {
  camera,
  personAddOutline,
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  peopleOutline,
  shirt,
  football,
  baseballOutline,
  tennisball,
  calendarOutline,
} from "ionicons/icons";
import ImageCropperModal from "./ImageCropperModal.vue";

const props = defineProps({
  user: {
    type: Object,
    required: true,
  },
  isOwnProfile: {
    type: Boolean,
    default: false,
  },
  friendshipStatus: {
    type: String,
    default: "none",
  },
});

const emit = defineEmits(["send-friend-request", "accept-friend-request", "reject-friend-request", "open-friends", "change-avatar"]);

const { t } = useI18n();
const fileInput = ref(null);

const userRoles = computed(() => {
  return props.user?.skills?.filter((s) => s.role) || [];
});

const getRoleLabel = (skill) => {
  if (!skill.role) return "";
  const roleKey = skill.role.toLowerCase().replace(" ", "_");
  return t(`roles.${skill.sport_type}.${roleKey}`);
};

const getSportIcon = (type) => {
  switch (type) {
    case "soccer":
      return football;
    case "volleyball":
      return baseballOutline;
    case "padel":
    case "tennis":
      return tennisball;
    default:
      return calendarOutline;
  }
};
const isCropperOpen = ref(false);
const tempImageSrc = ref(null);

const triggerFileInput = () => {
  if (props.isOwnProfile) {
    fileInput.value.click();
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      tempImageSrc.value = e.target.result;
      isCropperOpen.value = true;
    };
    reader.readAsDataURL(file);
  }
  // Reset input so same file can be selected again if needed
  event.target.value = "";
};

const closeCropper = () => {
  isCropperOpen.value = false;
  tempImageSrc.value = null;
};

const handleCrop = (blob) => {
  emit("change-avatar", blob);
  closeCropper();
};

const getStatusColor = (status) => {
  switch (status) {
    case "available":
      return "success";
    case "injured":
      return "danger";
    case "unavailable":
      return "medium";
    default:
      return "success";
  }
};
</script>

<style scoped>
.profile-banner {
  background: linear-gradient(135deg, var(--ion-color-primary) 0%, var(--ion-color-tertiary) 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  color: white;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

/* Decorative circles */
.profile-banner::before {
  content: "";
  position: absolute;
  top: -50px;
  right: -50px;
  width: 150px;
  height: 150px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  pointer-events: none;
}

.profile-banner::after {
  content: "";
  position: absolute;
  bottom: -20px;
  left: -40px;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  pointer-events: none;
}

.profile-top-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 20px;
  width: 100%;
  margin-bottom: 15px;
  position: relative;
  z-index: 1;
}

.user-info-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.jersey-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-bottom-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  width: 100%;
  position: relative;
  z-index: 1;
}

.info-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.status-section {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  position: relative;
  margin-bottom: 0;
}

.main-avatar {
  width: 150px;
  height: 150px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--ion-color-secondary);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.edit-badge ion-icon {
  font-size: 16px;
}

.username {
  margin: 0;
  font-weight: 800;
  font-size: 1.8rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.role-badge {
  opacity: 0.9;
  font-weight: 600;
}

.jersey-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.jersey-icon {
  font-size: 40px;
  color: rgba(255, 255, 255, 0.2);
}

.jersey-number {
  position: absolute;
  font-size: 1.1rem;
  font-weight: 900;
  color: white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.friend-actions-inline {
  display: flex;
  align-items: center;
  gap: 10px;
}

.friend-request-actions {
  display: flex;
  gap: 8px;
}

.friend-badge {
  padding: 6px 12px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
