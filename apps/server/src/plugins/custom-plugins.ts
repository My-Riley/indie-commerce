import 'dotenv/config';
import { GoogleAuthPlugin } from './google-auth/google-auth-plugin';

/**
 * Custom Plugin Collection
 * Unify management of all custom Vendure plugins
 */
export const customPlugins = [
    GoogleAuthPlugin.init({ googleClientId: process.env.GOOGLE_CLIENT_ID! }),
];

