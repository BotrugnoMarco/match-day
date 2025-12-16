<template>
  <ion-modal :is-open="isOpen" @didDismiss="cancel" class="cropper-modal">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t("profile.crop_image") }}</ion-title>
        <ion-buttons slot="start">
          <ion-button @click="cancel">{{ t("common.cancel") }}</ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button @click="crop" strong>{{ t("common.save") }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding cropper-content">
      <div class="img-container">
        <img ref="image" :src="imageSrc" v-if="imageSrc" style="max-width: 100%; display: block" />
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent } from "@ionic/vue";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  imageSrc: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["cancel", "crop"]);
const { t } = useI18n();
const image = ref(null);
let cropper = null;

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal && props.imageSrc) {
      // Wait for modal animation
      setTimeout(async () => {
        if (cropper) {
          cropper.destroy();
        }
        if (image.value) {
          cropper = new Cropper(image.value, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: "move",
            autoCropArea: 1,
            restore: false,
            guides: true,
            center: true,
            highlight: false,
            cropBoxMovable: false,
            cropBoxResizable: false,
            toggleDragModeOnDblclick: false,
            background: false, // Disable default background pattern
          });
        }
      }, 300); // Delay to ensure modal is visible
    } else {
      if (cropper) {
        cropper.destroy();
        cropper = null;
      }
    }
  }
);

const cancel = () => {
  emit("cancel");
};

const crop = () => {
  if (cropper) {
    cropper
      .getCroppedCanvas({
        width: 300,
        height: 300,
      })
      .toBlob((blob) => {
        emit("crop", blob);
      });
  }
};

onUnmounted(() => {
  if (cropper) {
    cropper.destroy();
  }
});
</script>

<style scoped>
.cropper-content {
  --background: #000;
}

.img-container {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #000;
  overflow: hidden;
}

/* Ensure the image fits within the container */
.img-container img {
  max-height: 80vh;
  max-width: 100%;
  display: block;
}
</style>
