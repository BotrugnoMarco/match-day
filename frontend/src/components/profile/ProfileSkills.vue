<template>
  <div class="section-container ion-padding-horizontal" v-if="filteredSkills.length > 0">
    <div class="section-title">
      <ion-icon :icon="trophy" color="warning"></ion-icon>
      <h3>{{ t("profile.skills") }}</h3>
    </div>
    <ion-card class="skills-card">
      <ion-card-content>
        <ion-list lines="none">
          <ion-item v-for="skill in filteredSkills" :key="skill.sport_type">
            <ion-icon :icon="getSportIcon(skill.sport_type)" slot="start" class="sport-icon"></ion-icon>
            <ion-label>
              <div class="skill-header">
                <h3>{{ t("sports." + skill.sport_type) }}</h3>
                <span class="skill-rating" v-if="!zenMode">{{ skill.rating }}</span>
              </div>
              <ion-progress-bar :value="skill.rating / 10" :color="getSkillColor(skill.rating)" v-if="!zenMode"></ion-progress-bar>

              <div class="skill-stats" v-if="getSportStats(skill.sport_type)">
                <span>{{ getSportStats(skill.sport_type).matchesPlayed }} {{ t("profile.matches") }}</span>
                <span class="dot">•</span>
                <span>{{ calculateWinRate(getSportStats(skill.sport_type)) }}% Win</span>
                <template v-if="getSportStats(skill.sport_type).goals > 0">
                  <span class="dot">•</span>
                  <span>{{ getSportStats(skill.sport_type).goals }} Goal</span>
                </template>
                <template v-if="getSportStats(skill.sport_type).assists > 0">
                  <span class="dot">•</span>
                  <span>{{ getSportStats(skill.sport_type).assists }} Assist</span>
                </template>
              </div>
            </ion-label>
          </ion-item>
        </ion-list>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { IonCard, IonCardContent, IonList, IonItem, IonIcon, IonLabel, IonProgressBar } from "@ionic/vue";
import { trophy, football, tennisballOutline, baseballOutline } from "ionicons/icons";

const props = defineProps({
  skills: {
    type: Array,
    default: () => [],
  },
  stats: {
    type: Object,
    default: () => ({}),
  },
  zenMode: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();

const filteredSkills = computed(() => {
  if (!props.skills) return [];
  return props.skills.filter((skill) => {
    if (!props.stats || !props.stats.statsBySport) return false;
    const data = props.stats.statsBySport[skill.sport_type];
    return data && data.matchesPlayed > 0;
  });
});

const getSportStats = (sport) => {
  if (!props.stats || !props.stats.statsBySport) return null;
  const data = props.stats.statsBySport[sport];
  if (data && data.matchesPlayed > 0) return data;
  return null;
};

const calculateWinRate = (data) => {
  if (!data.matchesPlayed) return 0;
  return Math.round((data.matchesWon / data.matchesPlayed) * 100);
};

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
  background: var(--ion-item-background);
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

.skill-stats {
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--ion-color-medium);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.dot {
  margin: 0 6px;
  font-size: 0.6rem;
  opacity: 0.7;
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
