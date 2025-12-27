<template>
  <div class="map-wrapper">
    <div :id="mapId" class="map"></div>
    <div class="map-overlay" v-if="!mapReady">
      <ion-spinner></ion-spinner>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { IonSpinner } from "@ionic/vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

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
  matches: { type: Array, default: () => [] },
  userLocation: { type: Object, default: null }, // { lat, lng }
});

const router = useRouter();
const mapId = `map-${Math.random().toString(36).substr(2, 9)}`;
let map = null;
let markerClusterGroup = null;
const mapReady = ref(false);
const markers = [];
let userMarker = null;

onMounted(() => {
  setTimeout(() => {
    initMap();
  }, 500);
});

onUnmounted(() => {
  if (map) {
    map.remove();
  }
});

const initMap = () => {
  if (map) return;

  try {
    const mapElement = document.getElementById(mapId);
    if (!mapElement) {
      console.warn("Map element not found, retrying...");
      setTimeout(initMap, 500);
      return;
    }

    // Default center (Rome) if no user location
    const center = props.userLocation ? [props.userLocation.lat, props.userLocation.lng] : [41.9028, 12.4964];

    map = L.map(mapId).setView(center, 11);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    markerClusterGroup = L.markerClusterGroup();
    map.addLayer(markerClusterGroup);

    // User location marker (if available)
    if (props.userLocation) {
      addUserMarker(props.userLocation);
    }

    updateMarkers();
    mapReady.value = true;

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 100);
  } catch (error) {
    console.error("Error initializing map:", error);
    // Stop spinner even if map fails
    mapReady.value = true;
  }
};

const addUserMarker = (loc) => {
  if (!map) return;
  if (userMarker) map.removeLayer(userMarker);

  userMarker = L.circleMarker([loc.lat, loc.lng], {
    radius: 8,
    fillColor: "#3880ff",
    color: "#fff",
    weight: 2,
    opacity: 1,
    fillOpacity: 0.8,
  })
    .addTo(map)
    .bindPopup("Tu sei qui");
};

const createSportMarker = (sport) => {
  let color = "#3880ff";
  let emoji = "🏆";

  switch (sport?.toLowerCase()) {
    case "soccer":
      color = "#2dd36f";
      emoji = "⚽";
      break;
    case "basketball":
      color = "#ffc409";
      emoji = "🏀";
      break;
    case "tennis":
      color = "#d7d728";
      emoji = "🎾";
      break;
    case "padel":
      color = "#3dc2ff";
      emoji = "🎾";
      break;
    case "volleyball":
      color = "#eb445a";
      emoji = "🏐";
      break;
  }

  const html = `
    <div style="
      background-color: ${color};
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    ">
      ${emoji}
    </div>
  `;

  return L.divIcon({
    className: "sport-marker-icon",
    html: html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
};

const updateMarkers = () => {
  if (!map || !markerClusterGroup) return;

  // Clear existing markers
  markerClusterGroup.clearLayers();
  markers.length = 0;

  props.matches.forEach((match) => {
    if (match.latitude && match.longitude) {
      const marker = L.marker([match.latitude, match.longitude], {
        icon: createSportMarker(match.sport_type),
      }).bindPopup(`
          <div style="text-align: center; min-width: 120px;">
            <strong style="color: #3880ff;">${match.sport_type.toUpperCase()}</strong><br>
            <span style="font-size: 0.9em;">${new Date(match.date_time).toLocaleDateString()}</span><br>
            <span style="font-size: 0.9em;">${new Date(match.date_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><br>
            <span style="font-size: 0.9em; font-weight: bold; color: #555;">
              <i class="icon ion-md-people"></i> ${match.participants_count || 0} / ${match.max_players}
            </span><br>
            <button id="btn-match-${
              match.id
            }" style="margin-top: 8px; background: #3880ff; color: white; border: none; padding: 6px 12px; border-radius: 12px; cursor: pointer; font-size: 0.9em;">Vedi Partita</button>
          </div>
        `);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-match-${match.id}`);
        if (btn) {
          btn.onclick = () => router.push(`/matches/${match.id}`);
        }
      });

      markerClusterGroup.addLayer(marker);
      markers.push(marker);
    }
  });
};

watch(() => props.matches, updateMarkers, { deep: true });
watch(
  () => props.userLocation,
  (newLoc) => {
    if (map && newLoc) {
      map.setView([newLoc.lat, newLoc.lng], 11);
      addUserMarker(newLoc);
    }
  }
);
</script>

<style scoped>
.map-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: #eee;
}
.map {
  width: 100%;
  height: 100%;
  z-index: 1;
}
.map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}
</style>
