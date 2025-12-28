<template>
  <div class="chat-container">
    <div class="messages-area" ref="messagesContainer">
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
import { chatbubblesOutline, send } from "ionicons/icons";

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
    await api.post(`/matches/${props.matchId}/chat`, { message: text });
    // Message will be added via socket event
  } catch (error) {
    console.error("Error sending message:", error);
    newMessage.value = text; // Restore on error
  } finally {
    sending.value = false;
  }
};

const onNewMessage = (msg) => {
  if (msg.match_id == props.matchId) {
    if (!messages.value.find((m) => m.id === msg.id)) {
      messages.value.push(msg);
      scrollToBottom();
    }
  }
};

onMounted(() => {
  fetchMessages();
  socket.emit("join_match_room", props.matchId);
  socket.on("chat_message", onNewMessage);
});

onUnmounted(() => {
  socket.emit("leave_match_room", props.matchId);
  socket.off("chat_message", onNewMessage);
});
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--ion-background-color);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-bubble {
  display: flex;
  max-width: 80%;
  align-self: flex-start;
  margin-bottom: 8px;
}

.my-message {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-avatar {
  margin-right: 8px;
  align-self: flex-end;
}

.my-message .message-avatar {
  margin-right: 0;
  margin-left: 8px;
}

.chat-avatar {
  width: 32px;
  height: 32px;
}

.message-content {
  background-color: var(--ion-color-light);
  padding: 8px 12px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  position: relative;
}

.my-message .message-content {
  background-color: var(--ion-color-primary);
  color: var(--ion-color-primary-contrast);
  border-radius: 16px;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 16px;
}

.message-header {
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 2px;
  color: var(--ion-color-medium);
}

.message-text {
  word-break: break-word;
  line-height: 1.4;
}

.message-time {
  font-size: 0.65rem;
  text-align: right;
  margin-top: 4px;
  opacity: 0.7;
}

.input-area {
  border-top: 1px solid var(--ion-border-color);
  background-color: var(--ion-item-background, #fff);
  padding: 5px;
}

.input-item {
  --background: transparent;
  --padding-start: 0;
  --inner-padding-end: 0;
}
</style>
