'use client';

import {use, useEffect, useState, useRef} from 'react';
import {VerifyResult} from './verify-result';
import {verifyAccountAction} from './actions';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import Link from 'next/link';
import {XCircle, Loader2} from 'lucide-react';

interface VerifyContentProps {
    searchParams: Promise<{ token?: string }>;
}

type VerifyResultType = {success: boolean; error?: undefined} | {error: string; success?: undefined};

export function VerifyContent({searchParams}: VerifyContentProps) {
    const params = use(searchParams);
    const token = params.token;
    const [result, setResult] = useState<VerifyResultType | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const hasVerified = useRef(false);

    useEffect(() => {
        // Only verify once when component mounts and token is available
        if (!token || hasVerified.current) {
            return;
        }

        hasVerified.current = true;
        setIsVerifying(true);

        verifyAccountAction(token)
            .then((verifyResult) => {
                setResult(verifyResult);
            })
            .catch(() => {
                setResult({error: 'An unexpected error occurred. Please try again.'});
            })
            .finally(() => {
                setIsVerifying(false);
            });
    }, [token]);

    if (!token) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-center">
                        <XCircle className="h-16 w-16 text-destructive"/>
                    </div>
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold">Invalid Verification Link</h1>
                        <p className="text-muted-foreground">
                            The verification link is invalid or missing a token.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Link href="/register" className="block">
                            <Button variant="outline" className="w-full">
                                Create New Account
                            </Button>
                        </Link>
                        <Link href="/sign-in" className="block">
                            <Button variant="ghost" className="w-full">
                                Back to Sign In
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isVerifying || !result) {
        return (
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="flex justify-center">
                        <Loader2 className="h-16 w-16 text-primary animate-spin"/>
                    </div>
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-bold">Verifying Your Account</h1>
                        <p className="text-muted-foreground">
                            Please wait while we verify your email address...
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return <VerifyResult result={result}/>;
}
