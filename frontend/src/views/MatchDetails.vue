<template>
  <ion-page>
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/matches" :text="t('common.back')"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ t("match_details.title") }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="shareMatch">
            <ion-icon slot="icon-only" :icon="shareSocialOutline"></ion-icon>
          </ion-button>
          <ion-button @click="openInviteModal" v-if="match && match.status === 'open'">
            <ion-icon slot="icon-only" :icon="personAddOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="page-content" v-if="match" :scrollY="activeSegment === 'details'">
      <div :style="activeSegment === 'chat' ? 'display: flex; flex-direction: column; height: 100%' : ''">
        <!-- Header Section -->
        <MatchHeader :match="match" />

        <div class="details-wrapper" :style="activeSegment === 'chat' ? 'display: flex; flex-direction: column; flex: 1;' : ''">
          <div class="segment-container ion-padding-horizontal">
            <ion-segment v-model="activeSegment" mode="ios">
              <ion-segment-button value="details" layout="icon-start">
                <ion-label>{{ t("match_details.details") }}</ion-label>
                <ion-icon :icon="informationCircleOutline"></ion-icon>
              </ion-segment-button>
              <ion-segment-button value="chat" layout="icon-start">
                <ion-label>{{ t("match_details.chat") }}</ion-label>
                <ion-icon :icon="chatbubblesOutline"></ion-icon>
              </ion-segment-button>
            </ion-segment>
          </div>

          <div class="details-content" v-show="activeSegment === 'details'">
            <MatchResults :match="match" :results="results" :my-comments="myComments" @go-to-profile="goToProfile" />

            <!-- Main Info Card -->
            <MatchInfoCard
              :match="match"
              :weather="weather"
              :active-participants="activeParticipants"
              :average-age="averageAge"
              :post-match-count="postMatchCount"
              :my-post-match-status="myPostMatchStatus"
              :is-participant="isParticipant"
              @open-maps="openMaps"
              @go-to-profile="goToProfile"
              @toggle-post-match="togglePostMatch"
            />

            <MatchActions
              :match="match"
              :is-participant="isParticipant"
              :is-confirmed="isConfirmed"
              :is-waitlisted="isWaitlisted"
              :is-full="isFull"
              :is-admin="isAdmin"
              :is-creator="isCreator"
              :has-teams="hasTeams"
              :vote-stats="voteStats"
              @join="joinMatch"
              @leave="leaveMatch"
              @generate-teams="generateTeams"
              @change-status="changeStatus"
              @edit="editMatch"
              @delete="deleteMatch"
              @open-score-modal="isScoreModalOpen = true"
            />

            <MatchParticipants
              :match="match"
              :pending-participants="pendingParticipants"
              :waitlist-participants="waitlistParticipants"
              :active-participants="activeParticipants"
              :team-a-participants="teamAParticipants"
              :team-b-participants="teamBParticipants"
              :has-teams="hasTeams"
              :team-a-average-skill="teamAAverageSkill"
              :team-b-average-skill="teamBAverageSkill"
              :is-admin="isAdmin"
              :is-captain="isCaptain"
              :is-confirmed="isConfirmed"
              :current-user="currentUser"
              :my-votes="myVotes"
              @approve-request="approveRequest"
              @reject-request="rejectRequest"
              @go-to-profile="goToProfile"
              @open-vote-modal="openVoteModal"
              @open-player-actions="openPlayerActions"
              @save-formation="saveFormation"
            />
          </div>

          <div class="chat-wrapper" v-if="activeSegment === 'chat'" style="flex: 1; overflow: hidden; border-top: 1px solid var(--ion-border-color)">
            <MatchChat :match-id="match.id" />
          </div>
        </div>
      </div>
    </ion-content>
    <div v-else class="ion-padding">
      <div class="ion-text-center ion-padding-top">
        <ion-spinner></ion-spinner>
        <p>{{ t("match_details.loading") }}</p>
      </div>
    </div>
    <InviteFriendModal
      :is-open="isInviteModalOpen"
      :match-id="match?.id"
      :participants="match?.participants || []"
      @close="isInviteModalOpen = false"
    />
    <ScoreModal :is-open="isScoreModalOpen" :match="match" :participants="activeParticipants" @close="isScoreModalOpen = false" @save="saveScore" />
  </ion-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import { useI18n } from "vue-i18n";
import api from "../services/api";
import socket from "../services/socket";
import { Share } from "@capacitor/share";
import { getWeatherForLocation, getWeatherIcon, getWeatherDescription } from "../services/weather";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonBackButton,
  modalController,
  alertController,
  actionSheetController,
  toastController,
  IonIcon,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from "@ionic/vue";
import {
  cashOutline,
  closeOutline,
  swapHorizontalOutline,
  ribbon,
  shieldCheckmarkOutline,
  shareSocialOutline,
  personAddOutline,
  beerOutline,
  chatbubblesOutline,
  informationCircleOutline,
} from "ionicons/icons";
import VoteModal from "../components/VoteModal.vue";
import InviteFriendModal from "../components/InviteFriendModal.vue";
import ScoreModal from "../components/ScoreModal.vue";
import MatchHeader from "../components/match/MatchHeader.vue";
import MatchInfoCard from "../components/match/MatchInfoCard.vue";
import MatchActions from "../components/match/MatchActions.vue";
import MatchParticipants from "../components/match/MatchParticipants.vue";
import MatchResults from "../components/match/MatchResults.vue";
import MatchChat from "../components/match/MatchChat.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();
const { t, locale } = useI18n();
const match = ref(null);
const weather = ref(null);
const votes = ref([]);
const activeSegment = ref("details");
const myVotes = ref([]);
const myComments = ref([]);
const voteStats = ref(null);
const isInviteModalOpen = ref(false);
const isScoreModalOpen = ref(false);
const currentUser = computed(() => store.getters.currentUser);

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale.value, { weekday: "short", month: "short", day: "numeric" });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const presentToast = async (message, color = "danger") => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    color: color,
    position: "top",
  });
  await toast.present();
};

const isWaitlisted = computed(() => {
  if (!match.value || !match.value.participants || !currentUser.value) return false;
  return match.value.participants.some((p) => p.user_id === currentUser.value.id && p.status === "waitlist");
});

const isConfirmed = computed(() => {
  if (!match.value || !match.value.participants || !currentUser.value) return false;
  return match.value.participants.some((p) => p.user_id === currentUser.value.id && p.status === "confirmed");
});

const waitlistParticipants = computed(() => {
  return match.value?.participants?.filter((p) => p.status === "waitlist") || [];
});

const pendingParticipants = computed(() => {
  return match.value?.participants?.filter((p) => p.status === "pending_approval") || [];
});

const activeParticipants = computed(() => {
  return match.value?.participants?.filter((p) => p.status !== "waitlist" && p.status !== "pending_approval" && p.status !== "declined") || [];
});

const hasTeams = computed(() => {
  return activeParticipants.value.some((p) => p.team);
});

const teamAParticipants = computed(() => {
  return activeParticipants.value.filter((p) => p.team === "A" || p.team === "Team A");
});

const teamBParticipants = computed(() => {
  return activeParticipants.value.filter((p) => p.team === "B" || p.team === "Team B");
});

const teamAAverageSkill = computed(() => {
  if (!teamAParticipants.value || teamAParticipants.value.length === 0) return 0;
  const totalSkill = teamAParticipants.value.reduce((sum, p) => sum + (parseFloat(p.skill_rating) || 0), 0);
  return (totalSkill / teamAParticipants.value.length).toFixed(1);
});

const teamBAverageSkill = computed(() => {
  if (!teamBParticipants.value || teamBParticipants.value.length === 0) return 0;
  const totalSkill = teamBParticipants.value.reduce((sum, p) => sum + (parseFloat(p.skill_rating) || 0), 0);
  return (totalSkill / teamBParticipants.value.length).toFixed(1);
});

const isFull = computed(() => {
  const confirmedCount = match.value?.participants?.filter((p) => p.status === "confirmed").length || 0;
  return confirmedCount >= (match.value?.max_players || 10);
});

const averageAge = computed(() => {
  if (!activeParticipants.value || activeParticipants.value.length === 0) return null;

  const participantsWithAge = activeParticipants.value.filter((p) => p.birth_date);
  if (participantsWithAge.length === 0) return null;

  const totalAge = participantsWithAge.reduce((sum, p) => {
    const birthDate = new Date(p.birth_date);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return sum + Math.abs(ageDate.getUTCFullYear() - 1970);
  }, 0);

  return (totalAge / participantsWithAge.length).toFixed(1);
});

const isParticipant = computed(() => {
  if (!match.value || !match.value.participants || !currentUser.value) return false;
  return match.value.participants.some((p) => p.user_id === currentUser.value.id);
});

const isCreator = computed(() => {
  if (!match.value || !currentUser.value) return false;
  return match.value.creator_id == currentUser.value.id;
});

const isAdmin = computed(() => {
  if (!match.value || !currentUser.value) return false;
  if (currentUser.value.role === "admin") return true;
  if (match.value.creator_id == currentUser.value.id) return true;
  const me = match.value.participants?.find((p) => p.user_id === currentUser.value.id);
  return me && me.is_admin;
});

const isCaptain = computed(() => {
  if (!match.value || !currentUser.value) return false;
  const me = match.value.participants?.find((p) => p.user_id === currentUser.value.id);
  return me && me.is_captain;
});

const postMatchCount = computed(() => {
  return activeParticipants.value.filter((p) => p.post_match).length;
});

const myPostMatchStatus = computed(() => {
  if (!currentUser.value) return false;
  const me = activeParticipants.value.find((p) => p.user_id === currentUser.value.id);
  return me ? !!me.post_match : false;
});

const results = computed(() => {
  if (votes.value.length === 0) return [];

  const grouped = {};
  votes.value.forEach((v) => {
    if (!grouped[v.target_id]) {
      grouped[v.target_id] = {
        target_id: v.target_id,
        target_name: v.target_name,
        totalRating: 0,
        voteCount: 0,
        tags: {},
      };
    }
    grouped[v.target_id].totalRating += Number(v.rating);
    grouped[v.target_id].voteCount++;

    if (v.tags) {
      const tagList = v.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);
      tagList.forEach((tag) => {
        grouped[v.target_id].tags[tag] = (grouped[v.target_id].tags[tag] || 0) + 1;
      });
    }
  });

  return Object.values(grouped)
    .map((g) => ({
      ...g,
      averageRating: g.totalRating / g.voteCount,
      badges: Object.entries(g.tags)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
    }))
    .sort((a, b) => b.averageRating - a.averageRating);
});

const goToProfile = (userId) => {
  router.push(`/profile/${userId}`);
};

const openMaps = (location) => {
  const query = encodeURIComponent(location);
  window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
};

const openInviteModal = () => {
  isInviteModalOpen.value = true;
};

const fetchMatch = async () => {
  try {
    const response = await api.get(`/matches/${route.params.id}`);
    match.value = response.data;

    // Parse set_scores if it's a string
    if (match.value.set_scores && typeof match.value.set_scores === "string") {
      try {
        match.value.set_scores = JSON.parse(match.value.set_scores);
      } catch (e) {
        console.error("Error parsing set_scores", e);
        match.value.set_scores = [];
      }
    }

    if (match.value.location && match.value.date_time) {
      const matchDate = new Date(match.value.date_time);
      const now = new Date();
      // Fetch weather only if match is future or recent (within last 4 hours)
      const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

      if (matchDate > fourHoursAgo) {
        fetchWeather();
      }
    }

    if (match.value.status === "finished") {
      fetchVotes();
      fetchMyReceivedComments();
    }
    if (match.value.status === "voting") {
      fetchMyVotes();
      if (isAdmin.value) {
        fetchVoteStats();
      }
    }
  } catch (error) {
    console.error("Error fetching match:", error);
    presentToast(t("match_details.fetch_error"));
  }
};

const fetchWeather = async () => {
  try {
    const data = await getWeatherForLocation(match.value.location, match.value.date_time);
    if (data) {
      weather.value = data;
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
  }
};

const fetchVotes = async () => {
  try {
    const response = await api.get(`/votes/match/${route.params.id}`);
    votes.value = response.data;
  } catch (error) {
    console.error("Error fetching votes:", error);
  }
};

const fetchMyVotes = async () => {
  try {
    const response = await api.get(`/votes/match/${route.params.id}/mine`);
    myVotes.value = response.data.map((v) => v.target_id);
  } catch (error) {
    console.error("Error fetching my votes:", error);
  }
};

const fetchVoteStats = async () => {
  try {
    const response = await api.get(`/votes/match/${route.params.id}/stats`);
    voteStats.value = response.data;
  } catch (error) {
    console.error("Error fetching vote stats:", error);
  }
};

const fetchMyReceivedComments = async () => {
  try {
    const response = await api.get(`/votes/match/${route.params.id}/comments`);
    myComments.value = response.data;
  } catch (error) {
    console.error("Error fetching my comments:", error);
  }
};

const shareMatch = async () => {
  if (!match.value) return;

  const shareData = {
    title: t("match_details.share_title", { sport: t("sports." + match.value.sport_type) }),
    text: t("match_details.share_text", {
      sport: t("sports." + match.value.sport_type),
      date: formatDate(match.value.date_time),
      time: formatTime(match.value.date_time),
      location: match.value.location,
    }),
    url: `https://matchday.botrugno.dev/matches/${match.value.id}`,
    dialogTitle: t("match_details.share_title", { sport: t("sports." + match.value.sport_type) }),
  };

  try {
    await Share.share(shareData);
  } catch (err) {
    console.error("Error sharing:", err);
    // Fallback: Copy to clipboard if sharing is cancelled or fails (though Share.share might throw on cancellation too, usually we just ignore it)
    // But if it's a real error (like not supported), we might want to fallback.
    // For now, let's keep the clipboard fallback only if Share throws an error indicating lack of support or similar.
    // Actually, simpler to just try/catch and if it fails, maybe show toast.
    // But the user specifically asked for app support.

    // Let's keep the clipboard fallback for web/desktop where Share might not be fully supported or if the user cancels (though we don't want to copy on cancel).
    // A simple check is if we are on a platform where Share is known to work.
    // But Share.share() returns a promise.

    // If we are on web and share fails, we can try clipboard.
    if (err.message !== "Share canceled") {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        presentToast(t("match_details.link_copied"), "success");
      } catch (clipboardErr) {
        console.error("Failed to copy:", clipboardErr);
        presentToast(t("match_details.share_error"), "danger");
      }
    }
  }
};

const joinMatch = async () => {
  try {
    // Confirmation Alert
    const confirmAlert = await alertController.create({
      header: t("match_details.join_confirm_header"),
      message: t("match_details.join_confirm_message"),
      buttons: [
        {
          text: t("common.cancel"),
          role: "cancel",
        },
        {
          text: t("match_details.join_confirm_btn"),
          role: "confirm",
          handler: async () => {
            await performJoinMatch();
          },
        },
      ],
    });
    await confirmAlert.present();
  } catch (error) {
    console.error("Error showing confirmation:", error);
  }
};

const performJoinMatch = async () => {
  try {
    let accessCode = null;
    // Only ask for code if private, not creator, AND NOT FRIEND
    if (match.value.is_private && !isCreator.value && !match.value.is_friend) {
      const alert = await alertController.create({
        header: t("match_details.private_match_alert_header"),
        message: t("match_details.private_match_alert_message"),
        inputs: [
          {
            name: "code",
            type: "text",
            placeholder: t("match_details.private_match_alert_placeholder"),
          },
        ],
        buttons: [
          {
            text: t("common.cancel"),
            role: "cancel",
          },
          {
            text: t("match_details.join"),
            handler: (data) => {
              return data;
            },
          },
        ],
      });
      await alert.present();
      const { role, data } = await alert.onDidDismiss();
      if (role === "cancel") return;
      accessCode = data.values.code;
    }

    const response = await api.post(`/matches/${route.params.id}/join`, { status: "confirmed", access_code: accessCode });
    if (response.data.status === "waitlist") {
      presentToast(t("match_details.full_waitlist"), "warning");
    } else if (response.data.status === "pending_approval") {
      presentToast(t("match_details.request_sent"), "success");
    }
    await fetchMatch(); // Refresh data
  } catch (error) {
    console.error("Error joining match:", error);
    presentToast(t("match_details.join_error") + ": " + (error.response?.data?.error || error.message));
  }
};

const leaveMatch = async () => {
  const isLast = activeParticipants.value.length === 1 && isParticipant.value;
  const message = isLast ? t("match_details.leave_confirm_last") : t("match_details.leave_confirm");

  const alert = await alertController.create({
    header: t("match_details.leave_match"),
    message: message,
    buttons: [
      {
        text: t("common.cancel"),
        role: "cancel",
      },
      {
        text: t("match_details.leave_match"),
        role: "destructive",
        handler: async () => {
          try {
            const response = await api.post(`/matches/${route.params.id}/leave`);
            if (response.data.message === "Match deleted as last participant left") {
              presentToast(t("match_details.match_deleted_toast"), "warning");
              router.push("/matches");
            } else {
              await fetchMatch();
            }
          } catch (error) {
            console.error("Error leaving match:", error);
            presentToast(t("match_details.leave_error") + ": " + (error.response?.data?.error || error.message));
          }
        },
      },
    ],
  });
  await alert.present();
};

const editMatch = () => {
  router.push(`/matches/${match.value.id}/edit`);
};

const deleteMatch = async () => {
  const alert = await alertController.create({
    header: t("match_details.delete_confirm_header"),
    message: t("match_details.delete_confirm_message"),
    buttons: [
      {
        text: t("common.cancel"),
        role: "cancel",
      },
      {
        text: t("common.delete"),
        role: "destructive",
        handler: async () => {
          try {
            await api.delete(`/matches/${route.params.id}`);
            router.push("/matches");
          } catch (error) {
            console.error("Error deleting match:", error);
            // show alert
          }
        },
      },
    ],
  });
  await alert.present();
};

const saveScore = async (data) => {
  try {
    await api.put(`/matches/${route.params.id}/stats`, data);
    isScoreModalOpen.value = false;
    await fetchMatch();
    presentToast(t("match_details.score_updated"), "success");
  } catch (error) {
    console.error("Error saving score:", error);
    presentToast(t("match_details.score_error"), "danger");
  }
};

const changeStatus = async (newStatus) => {
  try {
    let winner = null;
    let scoreA = 0;
    let scoreB = 0;

    if (newStatus === "voting") {
      const alert = await alertController.create({
        header: t("match_details.start_voting_confirm_title"),
        message: t("match_details.start_voting_confirm_message"),
        buttons: [
          {
            text: t("common.cancel"),
            role: "cancel",
          },
          {
            text: t("common.confirm"),
            role: "confirm",
          },
        ],
      });

      await alert.present();
      const { role } = await alert.onDidDismiss();
      if (role !== "confirm") {
        return;
      }
    }

    if (newStatus === "finished") {
      // Check if scores are set
      if (
        match.value.score_team_a === null ||
        match.value.score_team_a === undefined ||
        match.value.score_team_b === null ||
        match.value.score_team_b === undefined
      ) {
        presentToast(t("match_details.score_required_to_finish"), "warning");
        return;
      }

      scoreA = match.value.score_team_a;
      scoreB = match.value.score_team_b;

      if (scoreA > scoreB) winner = "A";
      else if (scoreB > scoreA) winner = "B";
      else winner = "Draw";
    }

    const payload = { status: newStatus };
    if (winner) {
      payload.winner = winner;
      payload.score_team_a = scoreA;
      payload.score_team_b = scoreB;
    }

    await api.put(`/matches/${route.params.id}/status`, payload);
    await fetchMatch();
    presentToast(t("match_details.status_updated"), "success");
  } catch (error) {
    console.error("Error updating status:", error);
    presentToast(t("match_details.status_error"), "danger");
  }
};

const generateTeams = async () => {
  if (hasTeams.value) {
    const alert = await alertController.create({
      header: t("match_details.regenerate_confirm_header"),
      message: t("match_details.regenerate_confirm_message"),
      buttons: [
        {
          text: t("common.cancel"),
          role: "cancel",
        },
        {
          text: t("common.confirm"),
          handler: async () => {
            await performGenerateTeams();
          },
        },
      ],
    });
    await alert.present();
  } else {
    await performGenerateTeams();
  }
};

const performGenerateTeams = async () => {
  try {
    const response = await api.post(`/matches/${route.params.id}/generate-teams`);
    presentToast(t("match_details.teams_generated", { countA: response.data.stats.teamA_count, countB: response.data.stats.teamB_count }), "success");
    await fetchMatch();
  } catch (error) {
    console.error("Error generating teams:", error);
    presentToast(t("match_details.teams_generated_error") + ": " + (error.response?.data?.error || error.message));
  }
};

const togglePostMatch = async () => {
  try {
    const newStatus = !myPostMatchStatus.value;
    await api.put(`/matches/${route.params.id}/post-match`, { post_match: newStatus });
    await fetchMatch();
  } catch (error) {
    console.error("Error updating post-match status:", error);
    presentToast(t("match_details.status_error"));
  }
};

const togglePayment = async (participant) => {
  console.log("Toggling payment for:", participant.user_id);
  if (!isAdmin.value) return;

  // Optimistic update
  const originalStatus = participant.has_paid;
  participant.has_paid = !originalStatus;

  try {
    await api.put(`/matches/${match.value.id}/payment`, { userId: participant.user_id });
    // Fetch manually to update UI immediately while waiting for socket
    await fetchMatch();
  } catch (error) {
    console.error("Error toggling payment:", error);
    // Revert on error
    participant.has_paid = originalStatus;
    presentToast(t("match_details.payment_error"));
  }
};

const movePlayer = async (userId, team) => {
  try {
    await api.put(`/matches/${match.value.id}/move-player`, { userId, team });
    // Fetch manually to update UI immediately while waiting for socket
    await fetchMatch();
  } catch (error) {
    console.error("Error moving player:", error);
    presentToast(t("match_details.move_error"));
  }
};

const openPlayerActions = async (player) => {
  const buttons = [];

  // Admin Toggle
  if (player.user_id !== match.value.creator_id) {
    buttons.push({
      text: player.is_admin ? t("match_details.remove_admin") : t("match_details.make_admin"),
      icon: shieldCheckmarkOutline,
      handler: () => toggleAdmin(player),
    });
  }

  // Captain Toggle
  buttons.push({
    text: player.is_captain ? t("match_details.remove_captain") : t("match_details.make_captain"),
    icon: ribbon, // Keeping ribbon for menu as we can't use custom HTML here easily
    handler: () => toggleCaptain(player),
  });

  // Payment Toggle
  buttons.push({
    text: player.has_paid ? t("match_details.mark_unpaid") : t("match_details.mark_paid"),
    icon: cashOutline,
    handler: () => togglePayment(player),
  });

  // Move Player (only if teams exist)
  if (hasTeams.value) {
    const targetTeam = player.team === "A" || player.team === "Team A" ? "B" : "A";
    buttons.push({
      text: t("match_details.move_to_team", { team: targetTeam }),
      icon: swapHorizontalOutline,
      handler: () => movePlayer(player.user_id, targetTeam),
    });
  }

  // Cancel
  buttons.push({
    text: t("common.cancel"),
    role: "cancel",
    icon: closeOutline,
  });

  const actionSheet = await actionSheetController.create({
    header: t("match_details.manage_player", { name: player.username }),
    buttons: buttons,
  });
  await actionSheet.present();
};

const saveFormation = async (positions) => {
  try {
    await api.put(`/matches/${match.value.id}/positions`, { positions });
    // Socket will update
  } catch (error) {
    console.error("Error saving formation:", error);
    presentToast(t("match_details.formation_error"));
  }
};

const approveRequest = async (userId) => {
  try {
    await api.post(`/matches/${route.params.id}/approve`, { userId });
    await fetchMatch();
  } catch (error) {
    console.error("Error approving request:", error);
    presentToast(t("match_details.approve_error"));
  }
};

const rejectRequest = async (userId) => {
  try {
    await api.post(`/matches/${route.params.id}/reject`, { userId });
    await fetchMatch();
  } catch (error) {
    console.error("Error rejecting request:", error);
    presentToast(t("match_details.reject_error"));
  }
};

const openVoteModal = async (participant) => {
  const modal = await modalController.create({
    component: VoteModal,
    componentProps: {
      matchId: match.value.id,
      targetId: participant.user_id,
      targetName: participant.username,
      sportType: match.value.sport_type,
    },
  });

  modal.onDidDismiss().then((data) => {
    if (data.role === "confirm") {
      console.log("Vote submitted");
      fetchMyVotes();
    }
  });

  await modal.present();
};

const toggleAdmin = async (participant) => {
  try {
    const response = await api.put(`/matches/${match.value.id}/admin`, {
      targetUserId: participant.user_id,
    });
    fetchMatch();
  } catch (error) {
    console.error("Error toggling admin:", error);
    presentToast(t("match_details.admin_error") + ": " + (error.response?.data?.error || error.message));
  }
};

const toggleCaptain = async (player) => {
  try {
    // If already captain, unset (userId = null)
    // If not captain, set (userId = player.user_id)
    const newCaptainId = player.is_captain ? null : player.user_id;

    await api.put(`/matches/${match.value.id}/captain`, {
      userId: newCaptainId,
      team: player.team,
    });

    // Optimistic update or wait for socket
    fetchMatch();
  } catch (error) {
    console.error("Error toggling captain:", error);
    presentToast(t("match_details.captain_error"), "danger");
  }
};

const onMatchUpdated = (data) => {
  if (data.matchId == route.params.id) {
    fetchMatch();
  }
};

const onVoteCast = (data) => {
  if (data.matchId == route.params.id) {
    if (isAdmin.value) {
      fetchVoteStats();
    }
  }
};

const onMatchDeleted = (data) => {
  if (data.matchId == route.params.id) {
    presentToast(t("match_details.match_deleted_toast"), "warning");
    router.push("/home");
  }
};

onMounted(() => {
  fetchMatch();

  socket.on("match_updated", onMatchUpdated);
  socket.on("vote_cast", onVoteCast);
  socket.on("match_deleted", onMatchDeleted);
});

onUnmounted(() => {
  socket.off("match_updated", onMatchUpdated);
  socket.off("vote_cast", onVoteCast);
  socket.off("match_deleted", onMatchDeleted);
});
</script>

<style scoped>
.page-content {
  /* --background: #ffffff; */
  height: 100%;
  overflow-y: auto;
}

.details-wrapper {
  padding: 0;
  height: 100%; /* Ensure it takes full height for chat */
}

.details-content {
  padding: 10px 10px 40px;
}

.info-card {
  background: var(--ion-card-background);
  border-radius: var(--rounded-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  gap: 20px;
}

.info-block {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-block.full-width {
  width: 100%;
}

.info-icon {
  font-size: 1.4rem;
  color: var(--ion-color-primary);
  background: rgba(var(--ion-color-primary-rgb), 0.2);
  padding: 10px;
  border-radius: var(--rounded-sm);
}

.info-text {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.value {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--ion-color-dark);
}

.sub-value {
  font-size: 0.75rem;
  color: var(--ion-color-medium);
}

.organizer-value {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.mini-avatar {
  width: 24px;
  height: 24px;
}

.divider {
  height: 1px;
  background: var(--ion-color-light);
  margin: 16px 0;
}

.features-row {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--ion-color-light);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--rounded-md);
  font-size: 0.8rem;
  color: var(--ion-color-medium);
  font-weight: 500;
}

.actions-section {
  margin-bottom: var(--space-6);
}

.main-action-btn {
  margin-bottom: var(--space-3);
  --border-radius: var(--rounded-md);
  font-weight: 600;
}

.admin-controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.admin-btn {
  margin: 0;
  --border-radius: var(--rounded-sm);
}

.admin-btn.full-width {
  grid-column: span 2;
}

.list-section {
  margin-bottom: var(--space-6);
}

.section-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
  padding: 0 var(--space-1);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: 0;
  padding: 0;
}

.view-segment {
  width: 100px;
  min-height: 32px;
}

.section-title h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.participants-card {
  background: var(--ion-card-background);
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.participants-card ion-item {
  --padding-start: 0.5rem;
  --inner-padding-end: 0.5rem;
}

.teams-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.team-header-label {
  font-size: 0.9rem;
  font-weight: 800;
  padding: 12px 16px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
}

.team-a {
  background-color: var(--ion-color-primary);
  color: white;
}
.team-b {
  background-color: var(--ion-color-danger);
  color: white;
}

.team-a-card {
  border: 2px solid var(--ion-color-primary);
}

.team-b-card {
  border: 2px solid var(--ion-color-danger);
}

.item-actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.status-icon {
  font-size: 1.2rem;
}

.status-text {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.status-text.available {
  color: var(--ion-color-success);
}
.status-text.injured {
  color: var(--ion-color-danger);
}
.status-text.unavailable {
  color: var(--ion-color-medium);
}

.results-section {
  margin-top: var(--space-8);
}

.winner-card {
  background: linear-gradient(135deg, #ffd700 0%, #ffaa00 100%);
  border-radius: var(--rounded-lg);
  padding: var(--space-5);
  text-align: center;
  color: white;
  margin-bottom: var(--space-5);
  box-shadow: 0 4px 15px rgba(255, 170, 0, 0.3);
}

.winner-label {
  font-size: 0.9rem;
  font-weight: 700;
  opacity: 0.9;
  letter-spacing: 1px;
}

.winner-team {
  margin: 5px 0 0;
  font-size: 2rem;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.winner-team.draw {
  color: white;
}

.rank-number {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--ion-color-medium);
  width: 30px;
  text-align: center;
}

.rating-bar-container {
  height: 6px;
  background-color: var(--ion-color-light);
  border-radius: 3px;
  margin: var(--space-2) 0;
  overflow: hidden;
  width: 100px;
}

.rating-bar {
  height: 100%;
  background-color: var(--ion-color-warning);
}

.rating-score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.rating-score .score {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--ion-color-dark);
}

.rating-score .votes {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: var(--space-1);
}

.result-badge-chip {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px var(--space-2);
  border-radius: var(--rounded-sm);
  height: auto;
}

.map-container {
  margin: var(--space-4) 0;
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.weather-value {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
}

.weather-desc {
  font-weight: 600;
  color: var(--ion-color-dark);
}

.weather-temp {
  font-weight: 700;
  color: var(--ion-color-medium-shade);
}

.weather-sub {
  margin-top: 4px;
  font-size: 0.85rem;
  color: var(--ion-color-medium);
}

.vote-stats-container {
  background: var(--ion-color-light);
  padding: 15px;
  border-radius: var(--rounded-md);
  text-align: center;
  border: 1px solid var(--ion-color-medium-shade);
}

.vote-progress-text {
  font-size: 1rem;
  color: var(--ion-color-dark);
  margin-bottom: 5px;
}

.missing-votes-text {
  font-size: 0.9rem;
  color: var(--ion-color-warning);
  font-weight: 600;
}

.missing-voters-list {
  margin-top: 10px;
  text-align: left;
  background: var(--ion-card-background);
  padding: 10px;
  border-radius: var(--rounded-sm);
  border: 1px solid var(--ion-color-light);
}

.missing-voters-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--ion-color-medium);
  margin-bottom: 5px;
  text-transform: uppercase;
}

.missing-voter-item {
  font-size: 0.85rem;
  color: var(--ion-color-dark);
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
}

.missing-count {
  color: var(--ion-color-danger);
  font-weight: 600;
}

.all-voted-text {
  font-size: 0.9rem;
  color: var(--ion-color-success);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.name-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.captain-badge {
  width: 20px;
  height: 20px;
  background-color: #ffc107;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  box-shadow: 0 2px 4px #0000001a;
  border: 2px solid #fff;
}

.feedback-section {
  margin-top: var(--space-4);
}

.feedback-card {
  background: var(--ion-card-background);
  border-radius: var(--rounded-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  padding: var(--space-2);
}

.feedback-item {
  --padding-start: 0;
  --inner-padding-end: 0;
  margin-bottom: var(--space-3);
  border-bottom: 1px solid var(--ion-color-light);
}

.feedback-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.feedback-text {
  font-style: italic;
  color: var(--ion-color-dark);
  margin-bottom: var(--space-2);
  font-size: 0.95rem;
}

.feedback-meta {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.team-avg {
  font-size: 0.85rem;
  font-weight: normal;
  margin-left: 8px;
  opacity: 0.9;
}

.text-team-a {
  color: var(--ion-color-primary);
}

.text-team-b {
  color: var(--ion-color-danger);
}

.avatar-wrapper {
  position: relative;
  margin-inline-end: 16px;
}

.captain-badge-overlay {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 20px;
  height: 20px;
  background-color: #ffc107;
  color: #000;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  border: 2px solid #fff;
  z-index: 10;
}

.jersey-number {
  font-size: 0.7rem;
  color: var(--ion-color-medium);
  font-weight: 600;
  background: #f0f2f5;
  padding: 1px 3px;
  border-radius: 4px;
}

.segment-container {
  background: var(--ion-card-background);
  padding-top: 8px;
  padding-bottom: 8px;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--ion-border-color);
}

ion-segment {
  background: var(--ion-color-light);
  border-radius: 12px;
  padding: 4px;
}

ion-segment-button {
  --indicator-color: var(--ion-background-color);
  --indicator-box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  --border-radius: 8px;
  --color: var(--ion-color-medium);
  --color-checked: var(--ion-color-primary);
  min-height: 36px;
  font-weight: 600;
}
</style>
