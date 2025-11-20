'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button, Paper, Title, Container, Text, Notification } from '@mantine/core';
import { Navbar } from '@/components/Navbar';
import { IconBrandGoogle, IconX } from '@tabler/icons-react';

export default function LoginPage() {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            const email = result.user.email;
            if (!email || !email.endsWith('@vitstudent.ac.in')) {
                await auth.signOut();
                setError('Access restricted to @vitstudent.ac.in emails only.');
                setLoading(false);
                return;
            }

            // Sync user to MongoDB
            await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firebaseUid: result.user.uid,
                    email: result.user.email,
                    name: result.user.displayName,
                }),
            });
            router.push('/');
        } catch (err: any) {
            setError('Failed to log in with Google.');
            console.error(err);
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <Container size="xs" py="xl" mt="xl">
                <Paper radius="md" p="xl" withBorder>
                    <Title order={2} ta="center" mt="md" mb={50}>
                        Welcome back to Campus Connect
                    </Title>

                    {error && (
                        <Notification icon={<IconX size={18} />} color="red" onClose={() => setError('')} mb="md">
                            {error}
                        </Notification>
                    )}

                    <Text c="dimmed" size="sm" ta="center" mb="md">
                        Please sign in with your VIT student email (@vitstudent.ac.in)
                    </Text>

                    <Button
                        fullWidth
                        variant="default"
                        leftSection={<IconBrandGoogle size={18} />}
                        onClick={handleGoogleSignIn}
                        loading={loading}
                    >
                        Sign in with Google
                    </Button>
                </Paper>
            </Container>
        </>
    );
}
