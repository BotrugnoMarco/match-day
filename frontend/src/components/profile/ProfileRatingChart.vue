<template>
  <div class="section-container ion-padding-horizontal" v-if="hasEnoughData">
    <div class="section-title">
      <ion-icon :icon="trendingUp" color="primary"></ion-icon>
      <h3>{{ t("profile.rating_trend") }}</h3>
    </div>

    <ion-card class="chart-card">
      <ion-card-content>
        <div class="chart-container">
          <svg viewBox="0 0 300 165" class="chart-svg">
            <!-- Grid lines -->
            <line x1="30" y1="10" x2="280" y2="10" stroke="#f0f0f0" stroke-width="1" />
            <line x1="30" y1="42.5" x2="280" y2="42.5" stroke="#f0f0f0" stroke-width="1" />
            <line x1="30" y1="75" x2="280" y2="75" stroke="#f0f0f0" stroke-width="1" />
            <line x1="30" y1="107.5" x2="280" y2="107.5" stroke="#f0f0f0" stroke-width="1" />
            <line x1="30" y1="140" x2="280" y2="140" stroke="#f0f0f0" stroke-width="1" />

            <!-- Y Axis Labels -->
            <text x="25" y="14" text-anchor="end" font-size="10" fill="#999">10</text>
            <text x="25" y="79" text-anchor="end" font-size="10" fill="#999">5</text>
            <text x="25" y="144" text-anchor="end" font-size="10" fill="#999">0</text>

            <!-- X Axis Labels (Results) -->
            <text
              v-for="(point, index) in pointsData"
              :key="'label-' + index"
              :x="point.x"
              y="160"
              text-anchor="middle"
              font-size="10"
              font-weight="bold"
              :fill="getResultColor(point.result)"
            >
              {{ getResultLabel(point.result) }}
            </text>

            <!-- Trend Line -->
            <polyline
              :points="chartPoints"
              fill="none"
              stroke="var(--ion-color-primary)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Data Points -->
            <circle
              v-for="(point, index) in pointsData"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="3"
              fill="white"
              stroke="var(--ion-color-primary)"
              stroke-width="2"
            />
          </svg>
        </div>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { IonIcon, IonCard, IonCardContent } from "@ionic/vue";
import { trendingUp } from "ionicons/icons";

const props = defineProps({
  history: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();

const validHistory = computed(() => {
  if (!props.history) return [];
  return props.history
    .filter((m) => m.avg_rating !== null && m.avg_rating !== undefined)
    .sort((a, b) => new Date(a.date_time) - new Date(b.date_time))
    .slice(-10); // Show last 10 rated matches max
});

const hasEnoughData = computed(() => validHistory.value.length >= 2);

const pointsData = computed(() => {
  const data = validHistory.value;
  if (data.length === 0) return [];

  const width = 250; // 300 - 30 (margin left) - 20 (margin right)
  const height = 130; // 150 - 20 (margin top/bottom)
  const startX = 30;
  const startY = 10;

  const stepX = width / (data.length - 1 || 1);

  return data.map((match, index) => {
    const rating = parseFloat(match.avg_rating);
    // Map rating 0-10 to Y coordinate (inverted, 0 is bottom)
    // y = height + startY - (rating / 10) * height
    const y = startY + height - (rating / 10) * height;
    const x = startX + index * stepX;
    return { x, y, rating, result: match.result };
  });
});

const chartPoints = computed(() => {
  return pointsData.value.map((p) => `${p.x},${p.y}`).join(" ");
});

const getResultLabel = (result) => {
  if (result === "win") return "W";
  if (result === "lost") return "L";
  return "D";
};

const getResultColor = (result) => {
  if (result === "win") return "var(--ion-color-success)";
  if (result === "lost") return "var(--ion-color-danger)";
  return "var(--ion-color-medium)";
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

.chart-card {
  margin: 0;
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-md);
  background: var(--ion-item-background);
}

.chart-container {
  width: 100%;
  overflow: hidden;
}

.chart-svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>
