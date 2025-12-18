<template>
  <ion-page>
    <ion-content class="auth-content">
      <div class="auth-container">
        <div class="auth-card">
          <h2>{{ t("auth.reset_password_title") }}</h2>
          <p class="description">{{ t("auth.reset_password_desc") }}</p>

          <form @submit.prevent="handleResetPassword">
            <div class="form-group">
              <label for="password">{{ t("auth.new_password_placeholder") }}</label>
              <input type="password" id="password" v-model="password" required :placeholder="t('auth.min_chars')" minlength="6" />
            </div>

            <div class="form-group">
              <label for="confirmPassword">{{ t("auth.confirm_password_placeholder") }}</label>
              <input type="password" id="confirmPassword" v-model="confirmPassword" required :placeholder="t('auth.repeat_password_placeholder')" />
            </div>

            <div v-if="message" class="success-message">
              {{ message }}
            </div>
            <div v-if="error" class="error-message">
              {{ error }}
            </div>

            <button type="submit" :disabled="loading" class="submit-btn">
              {{ loading ? t("auth.saving") : t("auth.set_password_btn") }}
            </button>

            <div class="auth-links">
              <router-link to="/login">{{ t("auth.back_to_login") }}</router-link>
            </div>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { IonPage, IonContent } from "@ionic/vue";
import api from "../services/api";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const password = ref("");
const confirmPassword = ref("");
const token = ref("");
const loading = ref(false);
const message = ref("");
const error = ref("");

onMounted(() => {
  token.value = route.query.token;
  if (!token.value) {
    error.value = t("auth.token_missing");
  }
});

const handleResetPassword = async () => {
  if (password.value !== confirmPassword.value) {
    error.value = t("auth.passwords_mismatch");
    return;
  }

  if (!token.value) {
    error.value = t("auth.token_invalid");
    return;
  }

  loading.value = true;
  message.value = "";
  error.value = "";

  try {
    const response = await api.post("/auth/reset-password", {
      token: token.value,
      newPassword: password.value,
    });
    message.value = response.data.message;

    // Redirect to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  } catch (err) {
    error.value = err.response?.data?.error || "Si è verificato un errore. Riprova.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.auth-card {
  background: var(--ion-card-background);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
  width: 100%;
  max-width: 400px;
}

h2 {
  text-align: center;
  color: var(--ion-color-dark);
  margin-bottom: 0.5rem;
}

.description {
  text-align: center;
  color: var(--ion-color-medium);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus {
  border-color: #4caf50;
  outline: none;
}

.submit-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.auth-links {
  margin-top: 1rem;
  text-align: center;
}

.auth-links a {
  color: #4caf50;
  text-decoration: none;
  font-size: 0.9rem;
}

.auth-links a:hover {
  text-decoration: underline;
}

.success-message {
  background-color: #dff0d8;
  color: #3c763d;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}

.error-message {
  background-color: #f2dede;
  color: #a94442;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 1rem;
  text-align: center;
}
</style>
