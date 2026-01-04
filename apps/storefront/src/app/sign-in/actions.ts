'use server';

import {mutate} from '@/lib/vendure/api';
import {LoginMutation, LogoutMutation, AuthenticateMutation, SetPasswordForGoogleUserMutation} from '@/lib/vendure/mutations';
import {removeAuthToken, setAuthToken} from '@/lib/auth';
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    const result = await mutate(LoginMutation, {
        username,
        password,
    });

    const loginResult = result.data.login;

    if (loginResult.__typename !== 'CurrentUser') {
        if (loginResult.__typename === 'NotVerifiedError') {
            return { error: 'Please verify your email address before signing in.' };
        }
        return { error: 'Invalid email or password.' };
    }

    // Store the token in a cookie if returned
    if (result.token) {
        await setAuthToken(result.token);
    }

    revalidatePath('/', 'layout');

    // Validate redirectTo is a safe internal path
    const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/';

    redirect(safeRedirect);

}

export async function logoutAction() {
    await mutate(LogoutMutation);
    await removeAuthToken();

    redirect('/')
}

export async function setPasswordAction(
    prevState: { error?: string; success?: boolean } | undefined,
    formData: FormData
) {
    const password = formData.get('password') as string;

    if (!password) {
        return { error: 'Password is required' };
    }

    try {
        const result = await mutate(SetPasswordForGoogleUserMutation, {
            password,
        }, {
            useAuthToken: true,
        });

        if (result.data.setPasswordForGoogleUser) {
            revalidatePath('/', 'layout');
            return { success: true };
        } else {
            return { error: 'Failed to set password. You may already have a password set.' };
        }
    } catch (error: unknown) {
        console.error('Error setting password:', error);
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}

export async function googleLoginAction(idToken: string) {
    try {
        const result = await mutate(AuthenticateMutation, {
            input: {
                google: {
                    token: idToken,
                },
            } as any,
        });

        const authResult = result.data.authenticate;

        if (authResult.__typename !== 'CurrentUser') {
            return {
                success: false,
                error: authResult.message || 'Google authentication failed',
                hasPassword: false,
            };
        }

        // Store the token in a cookie if returned
        if (result.token) {
            await setAuthToken(result.token);
        }

        revalidatePath('/', 'layout');

        return {
            success: true,
            hasPassword: authResult.hasPassword ?? false,
            userId: authResult.id,
            identifier: authResult.identifier,
        };
    } catch (error: unknown) {
        console.error('Error during Google authentication:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred',
            hasPassword: false,
        };
    }
}
