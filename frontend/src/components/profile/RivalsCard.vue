<template>
  <div class="rivals-card" v-if="rivals && (rivals.idealPartner || rivals.nemesis)">
    <div class="card-header">
      <h3>{{ t("profile.rivals_title") }}</h3>
    </div>

    <div class="rivals-grid">
      <!-- Ideal Partner -->
      <div class="rival-item partner" v-if="rivals.idealPartner" @click="goToProfile(rivals.idealPartner.user_id)">
        <div class="rival-label">
          <ion-icon :icon="heartOutline"></ion-icon>
          <span>{{ t("profile.ideal_partner") }}</span>
        </div>
        <div class="rival-avatar">
          <img :src="rivals.idealPartner.avatar_url || '/assets/default-avatar.png'" alt="Avatar" />
        </div>
        <div class="rival-name">{{ rivals.idealPartner.username }}</div>
        <div class="rival-stat">{{ rivals.idealPartner.winRate }}% {{ t("profile.win_rate_together") }}</div>
        <div class="rival-substat">{{ rivals.idealPartner.played_together }} {{ t("common.matches") }}</div>
      </div>

      <!-- Nemesis -->
      <div class="rival-item nemesis" v-if="rivals.nemesis" @click="goToProfile(rivals.nemesis.user_id)">
        <div class="rival-label">
          <ion-icon :icon="skullOutline"></ion-icon>
          <span>{{ t("profile.nemesis") }}</span>
        </div>
        <div class="rival-avatar">
          <img :src="rivals.nemesis.avatar_url || '/assets/default-avatar.png'" alt="Avatar" />
        </div>
        <div class="rival-name">{{ rivals.nemesis.username }}</div>
        <div class="rival-stat">{{ rivals.nemesis.lossRate }}% {{ t("profile.loss_rate_against") }}</div>
        <div class="rival-substat">{{ rivals.nemesis.played_against }} {{ t("common.matches") }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { IonIcon } from "@ionic/vue";
import { heartOutline, skullOutline } from "ionicons/icons";
import { useI18n } from "vue-i18n";
import api from "../../services/api";

const props = defineProps({
  userId: {
    type: [String, Number],
    required: true,
  },
});

const router = useRouter();
const { t } = useI18n();
const rivals = ref(null);
const loading = ref(false);

const fetchRivals = async () => {
  if (!props.userId) return;

  loading.value = true;
  try {
    const response = await api.get(`/users/${props.userId}/stats/rivals`);
    rivals.value = response.data;
  } catch (error) {
    console.error("Error fetching rivals stats:", error);
  } finally {
    loading.value = false;
  }
};

const goToProfile = (userId) => {
  router.push(`/profile/${userId}`);
};

onMounted(fetchRivals);
watch(() => props.userId, fetchRivals);
</script>

<style scoped>
.rivals-card {
  background: var(--ion-card-background);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.rivals-grid {
  display: flex;
  gap: 16px;
}

.rival-item {
  flex: 1;
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.rival-item:active {
  transform: scale(0.98);
}

.rival-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.partner .rival-label {
  color: var(--ion-color-success);
}
.nemesis .rival-label {
  color: var(--ion-color-danger);
}

.rival-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 8px;
  border: 2px solid white;
  box-shadow: var(--shadow-sm);
}

.rival-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.rival-name {
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 4px;
  color: var(--ion-color-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.rival-stat {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.rival-substat {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
}
</style>
