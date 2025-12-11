import { createRouter, createWebHistory } from '@ionic/vue-router';
import Home from '../views/Home.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Matches from '../views/Matches.vue';
import CreateMatch from '../views/CreateMatch.vue';
import EditMatch from '../views/EditMatch.vue';
import MatchDetails from '../views/MatchDetails.vue';
import Profile from '../views/Profile.vue';
import Friends from '../views/Friends.vue';
import Notifications from '../views/Notifications.vue';
import Support from '../views/Support.vue';
import AdminSupport from '../views/AdminSupport.vue';

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
        component: Matches,
        meta: { requiresAuth: true }
    },
    {
        path: '/matches/create',
        name: 'CreateMatch',
        component: CreateMatch,
        meta: { requiresAuth: true }
    },
    {
        path: '/matches/:id/edit',
        name: 'EditMatch',
        component: EditMatch,
        meta: { requiresAuth: true }
    },
    {
        path: '/matches/:id',
        name: 'MatchDetails',
        component: MatchDetails,
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: Profile,
        meta: { requiresAuth: true }
    },
    {
        path: '/friends',
        name: 'Friends',
        component: Friends,
        meta: { requiresAuth: true }
    },
    {
        path: '/notifications',
        name: 'Notifications',
        component: Notifications,
        meta: { requiresAuth: true }
    },
    {
        path: '/support',
        name: 'Support',
        component: Support,
        meta: { requiresAuth: true }
    },
    {
        path: '/admin/support',
        name: 'AdminSupport',
        component: AdminSupport,
        meta: { requiresAuth: true }
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token');

    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
        next('/login');
    } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
        next('/matches');
    } else {
        next();
    }
});

export default router;