<template>
  <div class="player-card-wrapper" ref="cardRef">
    <div class="fut-card" :class="rarityClass">
      <div class="card-top">
        <div class="rating">{{ rating }}</div>
        <div class="position">{{ position }}</div>
        <div class="nation">
          <img src="/assets/flags/it.png" alt="IT" v-if="false" />
          <!-- Placeholder for flag -->
          <ion-icon :icon="football" v-else></ion-icon>
        </div>
        <div class="club">
          <img src="/assets/logo.png" alt="MatchDay" />
        </div>
      </div>

      <div class="card-image">
        <img :src="avatarUrl || '/default-avatar.svg'" alt="Player" crossorigin="anonymous" />
      </div>

      <div class="card-info">
        <div class="name">{{ name }}</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-val">{{ pac }}</span>
            <span class="stat-label">PAC</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ sho }}</span>
            <span class="stat-label">TIR</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ pas }}</span>
            <span class="stat-label">PAS</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ dri }}</span>
            <span class="stat-label">DRI</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ def }}</span>
            <span class="stat-label">DIF</span>
          </div>
          <div class="stat-item">
            <span class="stat-val">{{ phy }}</span>
            <span class="stat-label">FIS</span>
          </div>
        </div>
      </div>

      <div class="card-bottom-logo">
        <span>MATCHDAY</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { IonIcon } from "@ionic/vue";
import { football } from "ionicons/icons";

const props = defineProps({
  name: { type: String, default: "Player" },
  rating: { type: [Number, String], default: 99 },
  position: { type: String, default: "AT" },
  avatarUrl: { type: String, default: "" },
  stats: {
    type: Object,
    default: () => ({
      pac: 90,
      sho: 85,
      pas: 88,
      dri: 92,
      def: 45,
      phy: 78,
    }),
  },
  rarity: { type: String, default: "gold" }, // gold, silver, bronze, special
});

const cardRef = ref(null);

const pac = computed(() => props.stats.pac || 0);
const sho = computed(() => props.stats.sho || 0);
const pas = computed(() => props.stats.pas || 0);
const dri = computed(() => props.stats.dri || 0);
const def = computed(() => props.stats.def || 0);
const phy = computed(() => props.stats.phy || 0);

const rarityClass = computed(() => {
  if (props.rating >= 90) return "special";
  if (props.rating >= 80) return "gold";
  if (props.rating >= 70) return "silver";
  return "bronze";
});

defineExpose({ cardRef });
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap");

.player-card-wrapper {
  display: inline-block;
  padding: 20px;
  background: transparent; /* Transparent for capture */
}

.fut-card {
  width: 280px;
  height: 420px;
  background-image: url("/assets/card-bg-gold.png"); /* Fallback */
  background-size: cover;
  background-position: center;
  position: relative;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  font-family: "Oswald", sans-serif;
  color: #46390c;
  overflow: hidden;
  /* Gold Gradient Default */
  background: linear-gradient(135deg, #eecda3 0%, #dbb67e 100%);
  border: 2px solid #bf953f;
}

.fut-card.special {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  border: 2px solid #4facfe;
}

.fut-card.silver {
  background: linear-gradient(135deg, #d7d2cc 0%, #304352 100%);
  color: #333;
  border: 2px solid #bdc3c7;
}

.fut-card.bronze {
  background: linear-gradient(135deg, #c2794f 0%, #8e5234 100%);
  color: #3e2723;
  border: 2px solid #5d4037;
}

.card-top {
  position: absolute;
  top: 35px;
  left: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
}

.rating {
  font-size: 42px;
  font-weight: 700;
  line-height: 1;
}

.position {
  font-size: 18px;
  font-weight: 400;
  margin-top: 2px;
  text-transform: uppercase;
}

.nation,
.club {
  margin-top: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nation img,
.club img {
  width: 100%;
  height: auto;
}

.card-image {
  position: absolute;
  top: 45px;
  right: 20px;
  width: 140px;
  height: 140px;
  z-index: 1;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%; /* Or remove for cutout style */
  /* mask-image: linear-gradient(to bottom, black 80%, transparent 100%); */
}

.card-info {
  position: absolute;
  bottom: 40px;
  left: 0;
  width: 100%;
  text-align: center;
}

.name {
  font-size: 24px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 10px;
  letter-spacing: 1px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin: 0 20px 10px 20px;
  padding-bottom: 5px;
}

.special .name {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px 20px;
  padding: 0 35px;
}

.stat-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  font-size: 16px;
}

.stat-val {
  font-weight: 700;
  margin-right: 6px;
  width: 22px;
  text-align: right;
}

.stat-label {
  font-weight: 400;
  font-size: 14px;
  opacity: 0.8;
}

.card-bottom-logo {
  position: absolute;
  bottom: 10px;
  width: 100%;
  text-align: center;
  font-size: 12px;
  opacity: 0.6;
  letter-spacing: 2px;
}
</style>
