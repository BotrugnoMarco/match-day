<template>
  <div class="profile-banner">
    <div class="profile-header-row">
      <div class="avatar-wrapper" @click="triggerFileInput">
        <ion-avatar class="main-avatar">
          <img :src="user?.avatar_url || '/default-avatar.svg'" />
        </ion-avatar>
        <div class="edit-badge" v-if="isOwnProfile">
          <ion-icon :icon="camera" color="light"></ion-icon>
        </div>
      </div>

      <div class="profile-info">
        <h2 class="username">{{ user?.username }}</h2>
        <div class="badges-row">
          <ion-badge color="light" class="role-badge">{{ t("profile." + (user?.role || "player")) }}</ion-badge>

          <div class="status-section">
            <ion-badge :color="getStatusColor(user?.status)" class="status-badge">
              {{ t("profile." + (user?.status || "available")) }}
            </ion-badge>
          </div>
        </div>

        <!-- Preferred Number -->
        <div class="preferred-number-section">
          <div class="number-display">
            <span class="number-label">{{ t("profile.jersey_label") }}</span>
            <span class="number-value" :class="{ 'missing-number': user?.preferred_number == null }">
              {{ user?.preferred_number != null ? user.preferred_number : "-" }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Friend Actions -->
    <div class="friend-actions" v-if="!isOwnProfile">
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

    <!-- My Friends Button -->
    <div class="friend-actions" v-if="isOwnProfile">
      <ion-button size="small" fill="outline" color="light" @click="$emit('open-friends')">
        <ion-icon :icon="peopleOutline" slot="start"></ion-icon>
        {{ t("profile.friends_btn") }}
      </ion-button>
    </div>

    <input type="file" ref="fileInput" @change="handleFileChange" style="display: none" accept="image/*" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { IonAvatar, IonIcon, IonBadge, IonButton } from "@ionic/vue";
import { camera, personAddOutline, timeOutline, checkmarkCircleOutline, closeCircleOutline, peopleOutline } from "ionicons/icons";

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

const triggerFileInput = () => {
  if (props.isOwnProfile) {
    fileInput.value.click();
  }
};

const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    emit("change-avatar", file);
  }
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
  background: var(--ion-color-primary);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  color: white;
  border-bottom-left-radius: 30px;
  border-bottom-right-radius: 30px;
  margin-bottom: 20px;
  box-shadow: var(--shadow-md);
}

.profile-header-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.profile-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.badges-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  margin-top: 5px;
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
  width: 70px;
  height: 70px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.edit-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--ion-color-secondary);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.edit-badge ion-icon {
  font-size: 14px;
}

.username {
  margin: 0;
  font-weight: 700;
  font-size: 1.3rem;
}

.role-badge {
  margin-top: var(--space-1);
  opacity: 0.9;
}

.preferred-number-section {
  margin-top: var(--space-3);
  display: flex;
  justify-content: center;
}

.number-display {
  background: rgba(255, 255, 255, 0.2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--rounded-sm);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.number-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
}

.number-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
}

.missing-number {
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.friend-actions {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 8px;
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
