<template>
  <div class="section-container ion-padding-horizontal" v-if="tags && tags.length > 0">
    <div class="section-title">
      <ion-icon :icon="ribbon" color="secondary"></ion-icon>
      <h3>{{ t("profile.badges") }}</h3>
    </div>

    <div class="trophy-case">
      <div v-for="tagItem in tags" :key="tagItem.tag" class="trophy-item">
        <div class="trophy-icon-wrapper" :class="getBadgeColorClass(tagItem.tag)">
          <ion-icon :icon="getBadgeIcon(tagItem.tag)"></ion-icon>
          <div class="trophy-count">{{ tagItem.count }}</div>
        </div>
        <span class="trophy-name">{{ t("vote.tags." + tagItem.tag) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { IonIcon } from "@ionic/vue";
import { ribbon, trophy, shield, star, flash, heart, people, eye, fitness, handLeft, medal, flame, rocket, diamond } from "ionicons/icons";

defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();

const getBadgeIcon = (tag) => {
  const map = {
    MVP: trophy,
    "Fair Play": heart,
    "Top Scorer": flame,
    "Best Defender": shield,
    "The Wall": shield,
    Goalkeeper: handLeft,
    Playmaker: star,
    Leader: medal,
    "Team Spirit": people,
    Sniper: locateIcon, // Will define below or use generic
    Engine: rocket,
    Visionary: eye,
    Hustle: flash,
    Clutch: diamond,
    Powerhouse: fitness,
  };

  // Fallback for specific ones not in map or if I missed imports
  if (tag === "Sniper") return eye; // Use eye for sniper/vision

  return map[tag] || ribbon;
};

// Helper for icon mapping since I can't use variables before definition in the map object easily inside setup without defining them first
const locateIcon = eye; // Placeholder

const getBadgeColorClass = (tag) => {
  const map = {
    MVP: "gold",
    "Fair Play": "green",
    "Top Scorer": "red",
    "Best Defender": "blue",
    "The Wall": "blue",
    Leader: "purple",
    Clutch: "orange",
  };
  return map[tag] || "default";
};
</script>

<style scoped>
.section-container {
  margin-bottom: var(--space-5);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  padding-left: var(--space-1);
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.trophy-case {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 16px;
  padding: 10px 0;
}

.trophy-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.trophy-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #f4f5f8;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 8px;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}

.trophy-icon-wrapper:active {
  transform: scale(0.95);
}

.trophy-icon-wrapper ion-icon {
  font-size: 28px;
  color: var(--ion-color-medium);
}

/* Color variants */
.trophy-icon-wrapper.gold {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
}
.trophy-icon-wrapper.gold ion-icon {
  color: #ffb300;
}

.trophy-icon-wrapper.green {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}
.trophy-icon-wrapper.green ion-icon {
  color: #43a047;
}

.trophy-icon-wrapper.red {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
}
.trophy-icon-wrapper.red ion-icon {
  color: #e53935;
}

.trophy-icon-wrapper.blue {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}
.trophy-icon-wrapper.blue ion-icon {
  color: #1e88e5;
}

.trophy-icon-wrapper.purple {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
}
.trophy-icon-wrapper.purple ion-icon {
  color: #8e24aa;
}

.trophy-icon-wrapper.orange {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
}
.trophy-icon-wrapper.orange ion-icon {
  color: #fb8c00;
}

.trophy-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--ion-color-primary);
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.trophy-name {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ion-color-dark);
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>
