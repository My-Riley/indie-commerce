'use server';

import {mutate} from '@/lib/vendure/api';
import {RegisterCustomerAccountMutation, LoginMutation} from '@/lib/vendure/mutations';
import {redirect} from 'next/navigation';

export async function registerAction(prevState: { error?: string } | undefined, formData: FormData) {
    const emailAddress = formData.get('emailAddress') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    if (!emailAddress || !password) {
        return {error: 'Email address and password are required'};
    }


    const result = await mutate(RegisterCustomerAccountMutation, {
        input: {
            emailAddress,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phoneNumber: phoneNumber || undefined,
            password,
        }
    });

    const registerResult = result.data.registerCustomerAccount;

    if (registerResult.__typename !== 'Success') {
        // Check for email address conflict error by errorCode
        if (registerResult.errorCode === 'EMAIL_ADDRESS_CONFLICT_ERROR') {
            return {
                error: 'This email address is already registered. If you already have an account, please sign in instead.',
                errorCode: 'EMAIL_ADDRESS_CONFLICT_ERROR'
            };
        }
        
        // Also check error message for email conflict indicators (fallback)
        const errorMessage = registerResult.message?.toLowerCase() || '';
        if (errorMessage.includes('email') && (
            errorMessage.includes('already') || 
            errorMessage.includes('exists') || 
            errorMessage.includes('registered') ||
            errorMessage.includes('conflict')
        )) {
            return {
                error: 'This email address is already registered. If you already have an account, please sign in instead.',
                errorCode: 'EMAIL_ADDRESS_CONFLICT_ERROR'
            };
        }
        
        return {error: registerResult.message};
    }

    // If registration succeeds, try to login to check if account already exists
    // This handles the case where Vendure allows re-registration but account already exists
    try {
        const loginResult = await mutate(LoginMutation, {
            username: emailAddress,
            password: password,
        });

        // If login succeeds immediately after registration, it means the account already existed
        if (loginResult.data.login.__typename === 'CurrentUser') {
            return {
                error: 'This email address is already registered. If you already have an account, please sign in instead.',
                errorCode: 'EMAIL_ADDRESS_CONFLICT_ERROR'
            };
        }
    } catch (error) {
        // Login failed, which is expected for new registrations
        // Continue with normal registration flow
    }

    // Redirect to verification pending page, preserving redirectTo if present
    const verifyUrl = redirectTo
        ? `/verify-pending?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/verify-pending';

    redirect(verifyUrl);

}
