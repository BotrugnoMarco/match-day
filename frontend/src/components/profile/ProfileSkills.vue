<template>
  <div class="section-container ion-padding-horizontal">
    <div class="section-title">
      <ion-icon :icon="trophy" color="warning"></ion-icon>
      <h3>{{ t("profile.skills") }}</h3>
    </div>
    <ion-card class="skills-card">
      <ion-card-content>
        <ion-list lines="none">
          <ion-item v-for="skill in skills" :key="skill.sport_type">
            <ion-icon :icon="getSportIcon(skill.sport_type)" slot="start" class="sport-icon"></ion-icon>
            <ion-label>
              <div class="skill-header">
                <h3>{{ t("sports." + skill.sport_type) }}</h3>
                <span class="skill-rating">{{ skill.rating }}</span>
              </div>
              <ion-progress-bar :value="skill.rating / 10" :color="getSkillColor(skill.rating)"></ion-progress-bar>
            </ion-label>
          </ion-item>
        </ion-list>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { IonCard, IonCardContent, IonList, IonItem, IonIcon, IonLabel, IonProgressBar } from "@ionic/vue";
import { trophy, football, tennisballOutline, baseballOutline } from "ionicons/icons";

defineProps({
  skills: {
    type: Array,
    default: () => [],
  },
});

const { t } = useI18n();

const getSportIcon = (sport) => {
  switch (sport) {
    case "soccer":
      return football;
    case "tennis":
      return tennisballOutline;
    case "padel":
      return tennisballOutline;
    case "volleyball":
      return baseballOutline;
    default:
      return trophy;
  }
};

const getSkillColor = (rating) => {
  if (rating >= 8) return "success";
  if (rating >= 6) return "primary";
  if (rating >= 4) return "warning";
  return "danger";
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

.skills-card {
  margin: 0;
  border-radius: var(--rounded-md);
  box-shadow: var(--shadow-sm);
}

.skill-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-1);
}

.skill-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
}

.skill-rating {
  font-weight: bold;
  color: var(--ion-color-medium);
}

.sport-icon {
  font-size: 1.4rem;
  color: var(--ion-color-medium);
}
</style>
