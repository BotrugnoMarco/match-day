import { createRouter, createWebHistory } from '@ionic/vue-router';

const routes = [
    {
        path: '/',
        redirect: '/home'
    },
    {
        path: '/home',
        name: 'Home',
        component: () => import('../views/Home.vue')
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue')
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/Register.vue')
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../views/ForgotPassword.vue')
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('../views/ResetPassword.vue')
    },
    {
        path: '/matches',
        name: 'Matches',
        component: () => import('../views/Matches.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/calendar',
        name: 'Calendar',
        component: () => import('../views/Calendar.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/matches/create',
        name: 'CreateMatch',
        component: () => import('../views/CreateMatch.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/matches/:id/edit',
        name: 'EditMatch',
        component: () => import('../views/EditMatch.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/matches/:id',
        name: 'MatchDetails',
        component: () => import('../views/MatchDetails.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/profile/:id',
        name: 'UserProfile',
        component: () => import('../views/Profile.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/profile/:id/history',
        name: 'UserHistory',
        component: () => import('../views/UserHistory.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/friends',
        name: 'Friends',
        component: () => import('../views/Friends.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/notifications',
        name: 'Notifications',
        component: () => import('../views/Notifications.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/support',
        name: 'Support',
        component: () => import('../views/Support.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin/support',
        name: 'AdminSupport',
        component: () => import('../views/AdminSupport.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin',
        name: 'AdminDashboard',
        component: () => import('../views/AdminDashboard.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/users',
        name: 'AdminUsers',
        component: () => import('../views/AdminUsers.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/admin/matches',
        name: 'AdminMatches',
        component: () => import('../views/AdminMatches.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/privacy',
        name: 'PrivacyPolicy',
        component: () => import('../views/PrivacyPolicy.vue')
    },
    {
        path: '/terms',
        name: 'Terms',
        component: () => import('../views/Terms.vue')
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
        next('/login');
    } else if (to.matched.some(record => record.meta.requiresAdmin) && user.role !== 'admin') {
        next('/home');
    } else if ((to.name === 'Login' || to.name === 'Register') && isAuthenticated) {
        next('/matches');
    } else {
        next();
    }
});

export default router;