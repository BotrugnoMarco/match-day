import { createRouter, createWebHistory } from '@ionic/vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Matches from '../views/Matches.vue';
import CreateMatch from '../views/CreateMatch.vue';
import MatchDetails from '../views/MatchDetails.vue';
import Profile from '../views/Profile.vue';
import Notifications from '../views/Notifications.vue';

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'Home',
        component: Home
    },
    {
        path: '/login',
        name: 'Login',
        component: Login
    },
    {
        path: '/register',
        name: 'Register',
        component: Register
    },
    {
        path: '/matches',
        name: 'Matches',
        component: Matches
    },
    {
        path: '/matches/create',
        name: 'CreateMatch',
        component: CreateMatch
    },
    {
        path: '/matches/:id',
        name: 'MatchDetails',
        component: MatchDetails
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile
    },
    {
        path: '/notifications',
        name: 'Notifications',
        component: Notifications
    }
]; const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

export default router;