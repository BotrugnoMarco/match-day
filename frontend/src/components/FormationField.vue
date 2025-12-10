<template>
  <div class="formation-container">
    <div class="field" ref="fieldRef">
      <!-- Field Markings -->
      <div class="field-markings">
        <div class="half-line"></div>
        <div class="center-circle"></div>
        <div class="penalty-area top"></div>
        <div class="penalty-area bottom"></div>
      </div>

      <!-- Players -->
      <div
        v-for="player in localPlayers"
        :key="player.user_id"
        class="player-token"
        :class="{ 'is-dragging': draggedPlayerId === player.user_id, 'team-a': player.team === 'A', 'team-b': player.team === 'B' }"
        :style="{ left: player.x_pos + '%', top: player.y_pos + '%' }"
        @mousedown="startDrag($event, player)"
        @touchstart.prevent="startDrag($event, player)"
      >
        <div class="token-inner">
          <ion-avatar class="token-avatar">
            <img :src="player.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'" />
          </ion-avatar>
          <span class="player-name">{{ getPlayerLabel(player.username) }}</span>
        </div>
      </div>
    </div>

    <div class="controls" v-if="isEditable">
      <ion-button size="small" @click="savePositions" :disabled="!hasChanges">
        <ion-icon :icon="saveOutline" slot="start"></ion-icon>
        Save Formation
      </ion-button>
      <ion-button size="small" fill="outline" @click="resetPositions" v-if="hasChanges"> Reset </ion-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { IonAvatar, IonButton, IonIcon } from "@ionic/vue";
import { saveOutline } from "ionicons/icons";

const props = defineProps({
  players: {
    type: Array,
    required: true,
  },
  isEditable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["save"]);

const fieldRef = ref(null);
const draggedPlayerId = ref(null);
const localPlayers = ref([]);
const hasChanges = ref(false);

const initializePlayers = (sourcePlayers) => {
  const players = JSON.parse(JSON.stringify(sourcePlayers));

  // Group by team to calculate indices for distribution
  const teamAIndices = [];
  const teamBIndices = [];

  players.forEach((p, index) => {
    if (p.team === "A") teamAIndices.push(index);
    else if (p.team === "B") teamBIndices.push(index);
  });

  teamAIndices.forEach((pIndex, i) => {
    const p = players[pIndex];
    // Team A (Bottom)
    if (p.x_pos === null || p.x_pos === undefined) {
      // Distribute horizontally
      p.x_pos = teamAIndices.length > 1 ? 15 + 70 * (i / (teamAIndices.length - 1)) : 50;
    }
    if (p.y_pos === null || p.y_pos === undefined) {
      p.y_pos = 80; // Bottom area
    }
  });

  teamBIndices.forEach((pIndex, i) => {
    const p = players[pIndex];
    // Team B (Top)
    if (p.x_pos === null || p.x_pos === undefined) {
      // Distribute horizontally
      p.x_pos = teamBIndices.length > 1 ? 15 + 70 * (i / (teamBIndices.length - 1)) : 50;
    }
    if (p.y_pos === null || p.y_pos === undefined) {
      p.y_pos = 20; // Top area
    }
  });

  return players;
};

// Initialize local players with props data
watch(
  () => props.players,
  (newPlayers) => {
    // Only update if we are not dragging or if it's a fresh load
    if (!draggedPlayerId.value) {
      localPlayers.value = initializePlayers(newPlayers);
    }
  },
  { immediate: true, deep: true }
);

const getPlayerLabel = (name) => {
  if (!name) return "??";
  // Return full name but truncated if too long
  return name.length > 10 ? name.substring(0, 9) + "." : name;
};

// Drag and Drop Logic
const startDrag = (event, player) => {
  if (!props.isEditable) return;

  draggedPlayerId.value = player.user_id;

  const moveHandler = (e) => {
    if (!draggedPlayerId.value) return;

    const clientX = e.type.includes("touch") ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes("touch") ? e.touches[0].clientY : e.clientY;

    const fieldRect = fieldRef.value.getBoundingClientRect();

    // Calculate percentage position
    let x = ((clientX - fieldRect.left) / fieldRect.width) * 100;
    let y = ((clientY - fieldRect.top) / fieldRect.height) * 100;

    // Clamp values
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    // Update local player position
    const pIndex = localPlayers.value.findIndex((p) => p.user_id === draggedPlayerId.value);
    if (pIndex !== -1) {
      localPlayers.value[pIndex].x_pos = x;
      localPlayers.value[pIndex].y_pos = y;
      hasChanges.value = true;
    }
  };

  const endDrag = () => {
    draggedPlayerId.value = null;
    document.removeEventListener("mousemove", moveHandler);
    document.removeEventListener("mouseup", endDrag);
    document.removeEventListener("touchmove", moveHandler);
    document.removeEventListener("touchend", endDrag);
  };

  document.addEventListener("mousemove", moveHandler);
  document.addEventListener("mouseup", endDrag);
  document.addEventListener("touchmove", moveHandler, { passive: false });
  document.addEventListener("touchend", endDrag);
};

const savePositions = () => {
  const updates = localPlayers.value.map((p) => ({
    userId: p.user_id,
    x: p.x_pos,
    y: p.y_pos,
  }));
  emit("save", updates);
  hasChanges.value = false;
};

const resetPositions = () => {
  localPlayers.value = initializePlayers(props.players);
  hasChanges.value = false;
};
</script>

<style scoped>
.formation-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.field {
  width: 100%;
  aspect-ratio: 0.65; /* Vertical field */
  background-color: #4caf50;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #388e3c;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.2);
}

.field-markings {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.half-line {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-50%);
}

.center-circle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30%;
  padding-bottom: 30%; /* Aspect ratio hack */
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.penalty-area {
  position: absolute;
  left: 20%;
  right: 20%;
  height: 15%;
  border: 2px solid rgba(255, 255, 255, 0.6);
}

.penalty-area.top {
  top: 0;
  border-top: none;
}

.penalty-area.bottom {
  bottom: 0;
  border-bottom: none;
}

.player-token {
  position: absolute;
  width: 40px;
  height: 40px;
  transform: translate(-50%, -50%);
  cursor: grab;
  z-index: 10;
  transition: transform 0.1s;
}

.player-token.is-dragging {
  cursor: grabbing;
  z-index: 20;
  transform: translate(-50%, -50%) scale(1.2);
}

.token-inner {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.token-avatar {
  width: 100%;
  height: 100%;
  border: 2px solid white;
}

.team-a .token-avatar {
  border-color: #3880ff; /* Primary Blue */
}

.team-b .token-avatar {
  border-color: #ffc409; /* Warning Yellow */
}

.player-name {
  position: absolute;
  bottom: -18px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
  white-space: nowrap;
}

.controls {
  display: flex;
  gap: 10px;
}
</style>
