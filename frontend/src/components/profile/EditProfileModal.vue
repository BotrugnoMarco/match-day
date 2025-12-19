<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ t("profile.edit_profile") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">{{ t("common.close") }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-item>
        <ion-label position="stacked">{{ t("profile.username") }}</ion-label>
        <ion-input v-model="localForm.username" :placeholder="t('profile.username')"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">{{ t("profile.email") }}</ion-label>
        <ion-input v-model="localForm.email" type="email" :placeholder="t('profile.email')"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">{{ t("profile.birth_date") }}</ion-label>
        <ion-datetime-button datetime="birthdate"></ion-datetime-button>
      </ion-item>
      <ion-modal :keep-contents-mounted="true">
        <ion-datetime id="birthdate" v-model="localForm.birth_date" presentation="date" :prefer-wheel="true"></ion-datetime>
      </ion-modal>

      <ion-item>
        <ion-label position="stacked">{{ t("profile.gender") }}</ion-label>
        <ion-select v-model="localForm.gender" interface="popover">
          <ion-select-option value="M">{{ t("profile.male") }}</ion-select-option>
          <ion-select-option value="F">{{ t("profile.female") }}</ion-select-option>
          <ion-select-option value="Other">{{ t("profile.other") }}</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">{{ t("profile.status") }}</ion-label>
        <ion-select v-model="localForm.status" interface="popover">
          <ion-select-option value="available">{{ t("profile.available") }}</ion-select-option>
          <ion-select-option value="injured">{{ t("profile.injured") }}</ion-select-option>
          <ion-select-option value="unavailable">{{ t("profile.unavailable") }}</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">{{ t("profile.jersey_number") }}</ion-label>
        <ion-input type="number" v-model="localForm.preferred_number" :placeholder="t('profile.jersey_placeholder')"></ion-input>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">{{ t("profile.preferred_foot") }}</ion-label>
        <ion-select v-model="localForm.preferred_foot" interface="popover" :placeholder="t('common.select')">
          <ion-select-option value="Right">{{ t("common.right") }}</ion-select-option>
          <ion-select-option value="Left">{{ t("common.left") }}</ion-select-option>
          <ion-select-option value="Both">{{ t("common.both") }}</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">{{ t("profile.preferred_hand") }}</ion-label>
        <ion-select v-model="localForm.preferred_hand" interface="popover" :placeholder="t('common.select')">
          <ion-select-option value="Right">{{ t("common.right") }}</ion-select-option>
          <ion-select-option value="Left">{{ t("common.left") }}</ion-select-option>
          <ion-select-option value="Both">{{ t("common.both") }}</ion-select-option>
        </ion-select>
      </ion-item>

      <!-- Roles Selection -->
      <ion-item>
        <ion-label position="stacked">{{ t("sports.soccer") }} - {{ t("profile.role") }}</ion-label>
        <ion-select v-model="localForm.soccer_role" interface="popover" :placeholder="t('common.select')">
          <ion-select-option value="Goalkeeper">{{ t("roles.soccer.goalkeeper") }}</ion-select-option>
          <ion-select-option value="Defender">{{ t("roles.soccer.defender") }}</ion-select-option>
          <ion-select-option value="Midfielder">{{ t("roles.soccer.midfielder") }}</ion-select-option>
          <ion-select-option value="Forward">{{ t("roles.soccer.forward") }}</ion-select-option>
          <ion-select-option value="None">{{ t("roles.soccer.none") }}</ion-select-option>
        </ion-select>
      </ion-item>

      <ion-item>
        <ion-label position="stacked">{{ t("sports.volleyball") }} - {{ t("profile.role") }}</ion-label>
        <ion-select v-model="localForm.volleyball_role" interface="popover" :placeholder="t('common.select')">
          <ion-select-option value="Setter">{{ t("roles.volleyball.setter") }}</ion-select-option>
          <ion-select-option value="Hitter">{{ t("roles.volleyball.hitter") }}</ion-select-option>
          <ion-select-option value="Libero">{{ t("roles.volleyball.libero") }}</ion-select-option>
          <ion-select-option value="Middle Blocker">{{ t("roles.volleyball.middle_blocker") }}</ion-select-option>
          <ion-select-option value="None">{{ t("roles.volleyball.none") }}</ion-select-option>
        </ion-select>
      </ion-item>

      <div class="ion-padding-top">
        <ion-button expand="block" @click="save">{{ t("profile.save_changes") }}</ion-button>
        <ion-button expand="block" color="secondary" fill="outline" class="ion-margin-top" @click="$emit('export')">
          {{ t("profile.export_data") }}
        </ion-button>
        <ion-button expand="block" color="danger" fill="outline" class="ion-margin-top" @click="$emit('delete')">
          {{ t("profile.delete_account") }}
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonDatetimeButton,
  IonDatetime,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["close", "save", "export", "delete"]);

const { t } = useI18n();
const localForm = ref({});

watch(
  () => props.user,
  (newUser) => {
    if (newUser) {
      const soccerSkill = newUser.skills?.find((s) => s.sport_type === "soccer");
      const volleyballSkill = newUser.skills?.find((s) => s.sport_type === "volleyball");

      localForm.value = {
        username: newUser.username || "",
        email: newUser.email || "",
        birth_date: newUser.birth_date ? new Date(newUser.birth_date).toISOString() : new Date().toISOString(),
        gender: newUser.gender || "",
        status: newUser.status || "available",
        preferred_number: newUser.preferred_number,
        preferred_foot: newUser.preferred_foot || "",
        preferred_hand: newUser.preferred_hand || "",
        soccer_role: soccerSkill?.role || "",
        volleyball_role: volleyballSkill?.role || "",
      };
    }
  },
  { immediate: true, deep: true }
);

const save = () => {
  const skills = [];
  if (localForm.value.soccer_role) {
    skills.push({ sport_type: "soccer", role: localForm.value.soccer_role });
  }
  if (localForm.value.volleyball_role) {
    skills.push({ sport_type: "volleyball", role: localForm.value.volleyball_role });
  }
  const payload = { ...localForm.value, skills };
  emit("save", payload);
};
</script>
