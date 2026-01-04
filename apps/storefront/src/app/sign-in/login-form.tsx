'use client';

import {useState, useTransition, useEffect} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {loginAction, googleLoginAction} from './actions';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardFooter} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {Separator} from '@/components/ui/separator';
import Link from 'next/link';
import {GoogleSignInButton} from '@/components/auth/google-sign-in-button';
import {SetPasswordModal} from '@/components/auth/set-password-modal';
import {useRouter} from 'next/navigation';

const loginSchema = z.object({
    username: z.email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
    redirectTo?: string;
}

export function LoginForm({redirectTo}: LoginFormProps) {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);
    const [isSetPasswordModalOpen, setIsSetPasswordModalOpen] = useState(false);
    const [firstTimeUserEmail, setFirstTimeUserEmail] = useState<string>('');
    const router = useRouter();

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            username: '',
            password: '',
        },
    });

    // Handle Google OAuth callback
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check for hash parameters (Google returns id_token in the hash)
        if (window.location.hash) {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const idToken = hashParams.get('id_token');
            const state = hashParams.get('state');
            const error = hashParams.get('error');

            // Clear hash to avoid reprocessing on refresh
            if (idToken || error) {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }

            if (error) {
                setServerError('Google authentication failed. Please try again.');
                return;
            }

            if (idToken && state) {
                // Verify state to prevent CSRF attacks
                const storedState = sessionStorage.getItem('google_oauth_state');
                sessionStorage.removeItem('google_oauth_state');

                if (state !== storedState) {
                    setServerError('Invalid authentication state. Please try again.');
                    return;
                }

                // Authenticate with Vendure
                startTransition(async () => {
                    const result = await googleLoginAction(idToken);
                    
                    if (!result.success) {
                        setServerError(result.error || 'Google authentication failed');
                        return;
                    }

                    // Extract email from token for password setting modal
                    try {
                        const payload = JSON.parse(atob(idToken.split('.')[1]));
                        const email = payload.email || '';
                        
                        // Check if user needs to set password
                        if (!result.hasPassword) {
                            setFirstTimeUserEmail(email);
                            setIsSetPasswordModalOpen(true);
                        } else {
                            // User already has password, redirect
                            const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
                                ? redirectTo
                                : '/';
                            router.push(safeRedirect);
                            router.refresh();
                        }
                    } catch (e) {
                        console.error('Error parsing ID token:', e);
                        setServerError('Failed to process authentication. Please try again.');
                    }
                });
            }
        }
    }, [router, redirectTo]);

    const onSubmit = (data: LoginFormData) => {
        setServerError(null);

        startTransition(async () => {
            const formData = new FormData();
            formData.append('username', data.username);
            formData.append('password', data.password);
            if (redirectTo) {
                formData.append('redirectTo', redirectTo);
            }

            const result = await loginAction(undefined, formData);
            if (result?.error) {
                setServerError(result.error);
            }
        });
    };

    const handleGoogleSignIn = () => {
        const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const REDIRECT_URI = typeof window !== 'undefined' 
            ? `${window.location.origin}/sign-in` 
            : '';

        if (!GOOGLE_CLIENT_ID) {
            setServerError('Google authentication is not configured');
            return;
        }

        // Generate a random state for security
        const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        // Store state in sessionStorage for verification later
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('google_oauth_state', state);

            // Construct the Google OAuth URL
            const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
            authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
            authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
            authUrl.searchParams.append('response_type', 'id_token');
            authUrl.searchParams.append('scope', 'openid email profile');
            authUrl.searchParams.append('state', state);
            authUrl.searchParams.append('nonce', Math.random().toString(36).substring(2, 15));

            // Redirect to Google OAuth in the same window (no popup)
            window.location.href = authUrl.toString();
        }
    };

    const handlePasswordSet = () => {
        setIsSetPasswordModalOpen(false);
        const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
            ? redirectTo
            : '/';
        router.push(safeRedirect);
        router.refresh();
    };

    const registerHref = redirectTo
        ? `/register?redirectTo=${encodeURIComponent(redirectTo)}`
        : '/register';

    return (
        <Card>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="username"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="you@example.com"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({field}) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Link
                                            href="/forgot-password"
                                            className="text-muted-foreground hover:text-primary text-sm"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>

                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        {serverError && (
                            <div className="text-sm text-destructive">
                                {serverError}
                            </div>
                        )}
                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 mt-2">
                        <div className="w-full">
                            <div className="relative flex items-center py-4">
                                <Separator className="flex-1" />
                                <span className="px-4 text-sm text-muted-foreground">or</span>
                                <Separator className="flex-1" />
                            </div>
                            <GoogleSignInButton onClick={handleGoogleSignIn} />
                        </div>
                        <div className="text-muted-foreground text-sm text-center">
                            Don&apos;t have an account?{' '}
                            <Link href={registerHref} className="hover:text-primary underline">
                                Register
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Form>
            <SetPasswordModal
                isOpen={isSetPasswordModalOpen}
                onClose={() => setIsSetPasswordModalOpen(false)}
                onPasswordSet={handlePasswordSet}
                userEmail={firstTimeUserEmail}
            />
        </Card>
    );
}
