'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Loader, Center, Text } from '@mantine/core';
import { Navbar } from '@/components/Navbar';

export default function SignupPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/login');
    }, [router]);

    return (
        <>
            <Navbar />
            <Container size="xs" py="xl" mt="xl">
                <Center h={200} style={{ flexDirection: 'column', gap: '1rem' }}>
                    <Loader size="lg" />
                    <Text>Redirecting to login...</Text>
                </Center>
            </Container>
        </>
    );
}
