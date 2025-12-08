import { createStore } from 'vuex';
import api from '../services/api';

const store = createStore({
    state() {
        return {
            user: JSON.parse(localStorage.getItem('user')) || null,
            token: localStorage.getItem('token') || null,
            matches: [],
            myMatches: [],
            notifications: [],
            userStats: null,
            viewedUser: null,
            viewedUserStats: null,
            viewedUserHistory: []
        };
    },
    mutations: {
        SET_USER(state, user) {
            state.user = user;
            localStorage.setItem('user', JSON.stringify(user));
        },
        SET_TOKEN(state, token) {
            state.token = token;
            localStorage.setItem('token', token);
        },
        LOGOUT(state) {
            state.user = null;
            state.token = null;
            state.matches = [];
            state.myMatches = [];
            state.notifications = [];
            state.userStats = null;
            state.viewedUser = null;
            state.viewedUserStats = null;
            state.viewedUserHistory = [];
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
        SET_MATCHES(state, matches) {
            state.matches = matches;
        },
        SET_MY_MATCHES(state, matches) {
            state.myMatches = matches;
        },
        SET_NOTIFICATIONS(state, notifications) {
            state.notifications = notifications;
        },
        SET_USER_STATS(state, stats) {
            state.userStats = stats;
        },
        SET_VIEWED_USER(state, user) {
            state.viewedUser = user;
        },
        SET_VIEWED_USER_STATS(state, stats) {
            state.viewedUserStats = stats;
        },
        SET_VIEWED_USER_HISTORY(state, history) {
            state.viewedUserHistory = history;
        },
        UPDATE_USER_STATUS(state, status) {
            if (state.user) {
                state.user.status = status;
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        }
    },
    actions: {
        async login({ commit }, credentials) {
            try {
                const response = await api.post('/auth/login', credentials);
                commit('SET_TOKEN', response.data.token);
                commit('SET_USER', response.data.user);
                return response.data;
            } catch (error) {
                throw error;
            }
        },
        logout({ commit }) {
            commit('LOGOUT');
        },
        async fetchMatches({ commit }) {
            try {
                const response = await api.get('/matches');
                commit('SET_MATCHES', response.data);
            } catch (error) {
                console.error('Error fetching matches:', error);
            }
        },
        async fetchMyMatches({ commit }) {
            try {
                const response = await api.get('/matches/mine');
                commit('SET_MY_MATCHES', response.data);
            } catch (error) {
                console.error('Error fetching my matches:', error);
            }
        },
        async fetchNotifications({ commit }) {
            try {
                const response = await api.get('/notifications');
                commit('SET_NOTIFICATIONS', response.data);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        },
        async markNotificationRead({ dispatch }, id) {
            try {
                await api.put(`/notifications/${id}/read`);
                dispatch('fetchNotifications');
            } catch (error) {
                console.error('Error marking notification read:', error);
            }
        },
        async markAllNotificationsRead({ dispatch }) {
            try {
                await api.put('/notifications/read-all');
                dispatch('fetchNotifications');
            } catch (error) {
                console.error('Error marking all notifications read:', error);
            }
        },
        async fetchUserStats({ commit }) {
            try {
                const response = await api.get('/users/stats');
                commit('SET_USER_STATS', response.data);
            } catch (error) {
                console.error('Error fetching user stats:', error);
            }
        },
        async fetchUserProfile({ commit }) {
            try {
                const response = await api.get('/users/profile');
                commit('SET_USER', response.data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        },
        async fetchUserProfileById({ commit }, id) {
            try {
                const response = await api.get(`/users/${id}/profile`);
                commit('SET_VIEWED_USER', response.data);
            } catch (error) {
                console.error('Error fetching user profile by id:', error);
            }
        },
        async fetchUserStatsById({ commit }, id) {
            try {
                const response = await api.get(`/users/${id}/stats`);
                commit('SET_VIEWED_USER_STATS', response.data);
            } catch (error) {
                console.error('Error fetching user stats by id:', error);
            }
        },
        async fetchUserHistoryById({ commit }, id) {
            try {
                const response = await api.get(`/users/${id}/history`);
                commit('SET_VIEWED_USER_HISTORY', response.data);
            } catch (error) {
                console.error('Error fetching user history by id:', error);
            }
        },
        async updateUserStatus({ commit }, status) {
            try {
                await api.put('/users/status', { status });
                commit('UPDATE_USER_STATUS', status);
            } catch (error) {
                console.error('Error updating user status:', error);
                throw error;
            }
        },
        clearViewedUser({ commit }) {
            commit('SET_VIEWED_USER', null);
            commit('SET_VIEWED_USER_STATS', null);
            commit('SET_VIEWED_USER_HISTORY', []);
        }
    },
    getters: {
        isAuthenticated: state => !!state.token,
        currentUser: state => state.user,
        allMatches: state => state.matches,
        myMatches: state => state.myMatches,
        notifications: state => state.notifications,
        userStats: state => state.userStats,
        unreadNotificationsCount: state => state.notifications.filter(n => !n.is_read).length,
        viewedUser: state => state.viewedUser,
        viewedUserStats: state => state.viewedUserStats,
        viewedUserHistory: state => state.viewedUserHistory
    }
});

export default store;
