import type {Metadata} from 'next';
import { getActiveCustomer } from '@/lib/vendure/actions';

export const metadata: Metadata = {
    title: 'Profile',
};
import { ChangePasswordForm } from './change-password-form';
import { EditProfileForm } from './edit-profile-form';
import { EditEmailForm } from './edit-email-form';

/**
 * Check if the user is authenticated via Google
 */
function isGoogleUser(customer: Awaited<ReturnType<typeof getActiveCustomer>>): boolean {
    if (!customer?.user?.authenticationMethods) {
        return false;
    }
    return customer.user.authenticationMethods.some(
        (method) => method.strategy === 'google'
    );
}

export default async function ProfilePage(_props: PageProps<'/account/profile'>) {
    const customer = await getActiveCustomer();
    const isGoogle = isGoogleUser(customer);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Profile</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account information
                </p>
            </div>

            <EditProfileForm customer={customer} />

            {/* Only show Email Address module for non-Google users */}
            {!isGoogle && (
                <EditEmailForm currentEmail={customer?.emailAddress || ''} />
            )}

            <ChangePasswordForm />
        </div>
    );
}
