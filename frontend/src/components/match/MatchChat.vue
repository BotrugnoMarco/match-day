<template>
  <div class="chat-container">
    <div class="messages-area" ref="messagesContainer">
      <div v-if="!isConnected" class="connection-warning">
        <ion-icon :icon="warningOutline"></ion-icon>
        <span>{{ t("match_chat.connecting") }}</span>
      </div>
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-spinner></ion-spinner>
      </div>
      <div v-else-if="messages.length === 0" class="empty-chat">
        <ion-icon :icon="chatbubblesOutline" class="empty-icon"></ion-icon>
        <p>{{ t("match_chat.no_messages") }}</p>
      </div>

      <div v-else class="messages-list">
        <div v-for="msg in messages" :key="msg.id" class="message-bubble" :class="{ 'my-message': isMyMessage(msg) }">
          <div class="message-avatar" v-if="!isMyMessage(msg)">
            <ion-avatar class="chat-avatar">
              <img :src="msg.avatar_url || '/default-avatar.svg'" />
            </ion-avatar>
          </div>
          <div class="message-content">
            <div class="message-header" v-if="!isMyMessage(msg)">
              <span class="username">{{ msg.username }}</span>
            </div>
            <div class="message-text">{{ msg.message }}</div>
            <div class="message-time">{{ formatTime(msg.created_at) }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <ion-item lines="none" class="input-item">
        <ion-input v-model="newMessage" :placeholder="t('match_chat.placeholder')" @keyup.enter="sendMessage" :disabled="sending"></ion-input>
        <ion-button slot="end" fill="clear" @click="sendMessage" :disabled="!newMessage.trim() || sending">
          <ion-icon slot="icon-only" :icon="send" color="primary"></ion-icon>
        </ion-button>
      </ion-item>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from "vue";
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";
import api from "../../services/api";
import socket from "../../services/socket";
import { IonSpinner, IonIcon, IonAvatar, IonItem, IonInput, IonButton } from "@ionic/vue";
import { chatbubblesOutline, send, warningOutline } from "ionicons/icons";

const props = defineProps({
  matchId: {
    type: [String, Number],
    required: true,
  },
});

const { t } = useI18n();
const store = useStore();
const messages = ref([]);
const newMessage = ref("");
const loading = ref(true);
const sending = ref(false);
const messagesContainer = ref(null);
const isConnected = ref(socket.connected);

const currentUser = computed(() => store.state.user);

const isMyMessage = (msg) => {
  return currentUser.value && msg.user_id === currentUser.value.id;
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const fetchMessages = async () => {
  try {
    loading.value = true;
    const response = await api.get(`/matches/${props.matchId}/chat`);
    messages.value = response.data;
    scrollToBottom();
  } catch (error) {
    console.error("Error fetching messages:", error);
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return;

  const text = newMessage.value;
  newMessage.value = ""; // Optimistic clear
  sending.value = true;

  try {
    const response = await api.post(`/matches/${props.matchId}/chat`, { message: text });
    // Add message immediately from response to ensure sender sees it
    const msg = response.data;
    if (!messages.value.find((m) => m.id === msg.id)) {
      messages.value.push(msg);
      scrollToBottom();
    }
  } catch (error) {
    console.error("Error sending message:", error);
    newMessage.value = text; // Restore on error
  } finally {
    sending.value = false;
  }
};

const onNewMessage = (msg) => {
  // Ensure strict string comparison to avoid type issues
  if (String(msg.match_id) === String(props.matchId)) {
    const exists = messages.value.some((m) => m.id === msg.id);
    if (!exists) {
      messages.value.push(msg);
      scrollToBottom();
    }
  }
};

const joinRoom = () => {
  // Always emit, Socket.IO will buffer if disconnected
  socket.emit("join_match_room", String(props.matchId));
};

const updateConnectionStatus = () => {
  isConnected.value = socket.connected;
  if (socket.connected) {
    joinRoom();
  }
};

onMounted(() => {
  fetchMessages();

  // Join immediately
  joinRoom();

  // Update status
  isConnected.value = socket.connected;

  // Listeners
  socket.on("connect", updateConnectionStatus);
  socket.on("disconnect", updateConnectionStatus);
  socket.on("chat_message", onNewMessage);
});

onUnmounted(() => {
  socket.emit("leave_match_room", props.matchId);
  socket.off("connect", updateConnectionStatus);
  socket.off("disconnect", updateConnectionStatus);
  socket.off("chat_message", onNewMessage);
});

// Watch for matchId changes just in case
watch(
  () => props.matchId,
  (newId, oldId) => {
    if (newId !== oldId) {
      socket.emit("leave_match_room", String(oldId));
      messages.value = [];
      fetchMessages();
      joinRoom();
    }
  }
);
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--ion-card-background);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ion-color-medium);
  opacity: 0.7;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: var(--ion-color-medium-tint);
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-bubble {
  display: flex;
  max-width: 85%;
  align-self: flex-start;
  margin-bottom: 4px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.my-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  margin-right: 8px;
  align-self: flex-end;
  margin-bottom: 4px;
}

.my-message .message-avatar {
  margin-right: 0;
  margin-left: 8px;
}

.chat-avatar {
  width: 28px;
  height: 28px;
  border: 2px solid #fff;
}

.message-content {
  background-color: var(--ion-color-light);
  padding: 8px 12px;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  min-width: 60px;
}

.my-message .message-content {
  background-color: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
  border-radius: 18px;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 18px;
  box-shadow: 0 1px 2px rgba(var(--ion-color-primary-rgb), 0.3);
}

.message-header {
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 2px;
  color: var(--ion-color-medium);
  margin-left: 4px;
}

.my-message .message-header {
  display: none;
}

.message-text {
  word-break: break-word;
  line-height: 1.4;
  font-size: 0.95rem;
}

.message-time {
  font-size: 0.65rem;
  text-align: right;
  margin-top: 2px;
  opacity: 0.7;
  margin-right: -4px;
  margin-bottom: -4px;
}

.my-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.input-area {
  background-color: var(--ion-card-background);
  padding: 8px 10px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  padding-bottom: calc(8px + var(--ion-safe-area-bottom));
}

.input-item {
  --background: var(--ion-color-light);
  border-radius: 24px;
  --padding-start: 16px;
  --inner-padding-end: 8px;
  --min-height: 44px;
}

.connection-warning {
  background-color: var(--ion-color-warning);
  color: var(--ion-color-warning-contrast);
  padding: 8px;
  text-align: center;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  margin-bottom: 8px;
}

ion-input {
  --padding-top: 10px;
  --padding-bottom: 10px;
}
</style>
