<template>
  <div class="language-switcher-wrapper">
    <div class="language-switcher-container">
      <div class="lang-option" :class="{ active: locale === 'it' }" @click="setLanguage('it')">
        <span class="flag">🇮🇹</span>
        <span class="code">IT</span>
      </div>
      <div class="divider"></div>
      <div class="lang-option" :class="{ active: locale === 'en' }" @click="setLanguage('en')">
        <span class="flag">🇬🇧</span>
        <span class="code">EN</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { locale } = useI18n();

const setLanguage = (lang) => {
  locale.value = lang;
  localStorage.setItem("user-locale", lang);
};
</script>

<style scoped>
.language-switcher-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

.language-switcher-container {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--ion-color-light);
  border-radius: 24px;
  padding: 4px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.lang-option:hover {
  opacity: 0.8;
}

.lang-option.active {
  background: var(--ion-color-white);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  opacity: 1;
  transform: scale(1.02);
}

.flag {
  font-size: 1.4em;
  line-height: 1;
}

.code {
  font-weight: 700;
  font-size: 0.9em;
  color: var(--ion-text-color);
  letter-spacing: 0.5px;
}

.divider {
  width: 1px;
  height: 16px;
  background: var(--ion-color-medium);
  opacity: 0.2;
  margin: 0 2px;
}
</style>
