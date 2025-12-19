<template>
  <div class="player-card-wrapper" ref="cardRef">
    <div class="fut-card" :class="rarityClass">
      <div class="card-top">
        <div class="rating">{{ rating }}</div>
        <div class="position">{{ position }}</div>
        <div class="nation">
          <ion-icon :icon="sportIcon"></ion-icon>
        </div>
        <div class="side-icon" v-if="preferredSide">
          <ion-icon :icon="sideIcon" v-if="sideIcon"></ion-icon>
          <span v-else class="side-text">{{ sideText }}</span>
        </div>
        <div class="club">
          <img src="/icon.png" alt="MatchDay" />
        </div>
      </div>

      <div class="card-date" v-if="matchDate">
        {{ matchDate }}
      </div>

      <div class="card-image">
        <img :src="avatarUrl || '/default-avatar.svg'" alt="Player" crossorigin="anonymous" />
        <div class="mvp-badge" v-if="isMvp">
          <ion-icon :icon="trophy"></ion-icon>
        </div>
      </div>

      <div class="card-info">
        <div class="name">{{ name }}</div>
        <div class="stats-grid">
          <div class="stat-item" v-for="(value, label) in stats" :key="label">
            <span class="stat-val">{{ value }}</span>
            <span class="stat-label">{{ label }}</span>
          </div>
          <div class="stat-item" v-for="tag in tags" :key="tag">
            <span class="stat-val" style="font-size: 14px; line-height: 1.2; white-space: normal">{{ tag }}</span>
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
import { football, basketball, tennisball, baseballOutline, trophy, handLeft, handRight, footsteps } from "ionicons/icons";

const props = defineProps({
  name: { type: String, default: "Player" },
  rating: { type: [Number, String], default: 99 },
  position: { type: String, default: "AT" },
  avatarUrl: { type: String, default: "" },
  sport: { type: String, default: "soccer" },
  isMvp: { type: Boolean, default: false },
  matchDate: { type: String, default: "" },
  preferredSide: { type: String, default: "" },
  stats: {
    type: Object,
    default: () => ({
      GOL: 0,
      AST: 0,
      VOT: 0,
      // Add more if needed
    }),
  },
  tags: {
    type: Array,
    default: () => [],
  },
  rarity: { type: String, default: "gold" }, // gold, silver, bronze, special
});

const cardRef = ref(null);

const sportIcon = computed(() => {
  switch (props.sport) {
    case "basketball":
      return basketball;
    case "volleyball":
      return baseballOutline;
    case "tennis":
    case "padel":
      return tennisball;
    case "soccer":
    default:
      return football;
  }
});

const sideIcon = computed(() => {
  if (!props.preferredSide) return null;
  const side = props.preferredSide; // Right, Left, Both
  const isHand = ["volleyball", "tennis", "padel"].includes(props.sport);

  if (isHand) {
    if (side === "Right" || side === "R") return handRight;
    if (side === "Left" || side === "L") return handLeft;
    // For Both, maybe return null and use text? Or just handRight
    return handRight;
  } else {
    // Soccer - Foot
    // footsteps is usually two feet.
    return footsteps;
  }
});

const sideText = computed(() => {
  if (!props.preferredSide) return "";
  const side = props.preferredSide;
  if (side === "Right" || side === "R") return "DX";
  if (side === "Left" || side === "L") return "SX";
  if (side === "Both") return "LR";
  return side;
});

const rarityClass = computed(() => {
  if (props.rating >= 80) return "special";
  if (props.rating >= 70) return "gold";
  if (props.rating >= 60) return "silver";
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
  /* background-image: url("/assets/card-bg-gold.png"); Fallback removed */
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
.side-icon,
.club {
  margin-top: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.side-icon {
  font-size: 20px;
}

.side-text {
  font-size: 14px;
  font-weight: bold;
}

.nation img,
.club img {
  width: 100%;
  height: auto;
}

.card-date {
  position: absolute;
  top: 35px;
  right: 30px;
  font-size: 14px;
  font-weight: bold;
  opacity: 0.8;
  z-index: 2;
  letter-spacing: 1px;
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
  min-width: 25px;
  text-align: right;
  white-space: nowrap;
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

.match-date {
  font-size: 10px;
  margin-top: 2px;
  opacity: 0.8;
  letter-spacing: 1px;
}

.mvp-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #ffd700 0%, #fdb931 100%);
  color: #000;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  z-index: 10;
  font-size: 18px;
  border: 2px solid #fff;
}
</style>
