'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { setPasswordAction } from '@/app/sign-in/actions';
import { useTransition } from 'react';

const setPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters').max(25, 'Password must be at most 25 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters').max(25, 'Password must be at most 25 characters'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type SetPasswordFormData = z.infer<typeof setPasswordSchema>;

interface SetPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPasswordSet: () => void;
    userEmail?: string;
}

export function SetPasswordModal({
    isOpen,
    onClose,
    onPasswordSet,
    userEmail,
}: SetPasswordModalProps) {
    const [isPending, startTransition] = useTransition();

    const form = useForm<SetPasswordFormData>({
        resolver: zodResolver(setPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            form.reset();
        }
    }, [isOpen, form]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const onSubmit = (data: SetPasswordFormData) => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append('password', data.password);

            const result = await setPasswordAction(undefined, formData);
            if (result?.error) {
                form.setError('root', {
                    message: result.error,
                });
            } else if (result?.success) {
                onPasswordSet();
                onClose();
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Set Password</DialogTitle>
                    <DialogDescription>
                        {userEmail
                            ? `Please set a password for ${userEmail} to enable email/password login and password changes.`
                            : 'Please set a password to enable email/password login and password changes.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Enter password"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Confirm password"
                                            disabled={isPending}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {form.formState.errors.root && (
                            <div className="text-sm text-destructive">
                                {form.formState.errors.root.message}
                            </div>
                        )}
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Setting...' : 'Set Password'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

