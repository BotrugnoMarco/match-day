<template>
  <div class="map-wrapper">
    <div id="map" class="map"></div>
    <div class="map-overlay" v-if="!mapReady">
      <ion-spinner></ion-spinner>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, onUnmounted } from "vue";
import { IonSpinner } from "@ionic/vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Vite/Webpack
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const props = defineProps({
  initialLat: { type: Number, default: 41.9028 }, // Default Rome
  initialLng: { type: Number, default: 12.4964 },
});

const emit = defineEmits(["location-selected"]);

let map = null;
let marker = null;
const mapReady = ref(false);

onMounted(() => {
  setTimeout(() => {
    initMap();
  }, 500); // Delay to ensure container is rendered
});

onUnmounted(() => {
  if (map) {
    map.remove();
  }
});

const initMap = () => {
  if (map) return;

  map = L.map("map").setView([props.initialLat, props.initialLng], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Add initial marker if we have valid coordinates different from default or if explicitly requested
  // For now, just put marker at center
  marker = L.marker([props.initialLat, props.initialLng], { draggable: true }).addTo(map);

  marker.on("dragend", (event) => {
    const position = marker.getLatLng();
    emit("location-selected", { lat: position.lat, lng: position.lng });
  });

  map.on("click", (e) => {
    const { lat, lng } = e.latlng;
    marker.setLatLng([lat, lng]);
    emit("location-selected", { lat, lng });
  });

  mapReady.value = true;

  // Invalidate size after a short delay to fix rendering issues in modals/tabs
  setTimeout(() => {
    map.invalidateSize();
  }, 100);
};

// Watch for prop changes to update map view
watch(
  () => [props.initialLat, props.initialLng],
  ([newLat, newLng]) => {
    if (map && newLat && newLng) {
      map.setView([newLat, newLng], 13);
      if (marker) {
        marker.setLatLng([newLat, newLng]);
      } else {
        marker = L.marker([newLat, newLng], { draggable: true }).addTo(map);
      }
    }
  }
);
</script>

<style scoped>
.map-wrapper {
  position: relative;
  height: 300px;
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  z-index: 1;
}

.map {
  height: 100%;
  width: 100%;
  z-index: 1;
}

.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
</style>
