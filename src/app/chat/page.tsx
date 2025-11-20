'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Paper, Tabs, ScrollArea, TextInput, ActionIcon, Group, Text, Avatar, Loader, Center } from '@mantine/core';
import { useAuth } from '@/components/AuthProvider';
import { IconSend } from '@tabler/icons-react';

interface Message {
    _id: string;
    content: string;
    senderId: string;
    senderName: string;
    type: 'universal' | 'branch';
    branch?: string;
    createdAt: string;
}

export default function ChatPage() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('universal');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const viewport = useRef<HTMLDivElement>(null);

    const isVITStudent = user?.email?.endsWith('@vitstudent.ac.in');

    const fetchMessages = async () => {
        if (!activeTab) return;

        const type = activeTab === 'universal' ? 'universal' : 'branch';
        const branch = activeTab !== 'universal' ? profile?.branch : undefined;

        if (type === 'branch' && !branch) return;

        try {
            const query = new URLSearchParams({ type });
            if (branch) query.append('branch', branch);

            const res = await fetch(`/api/chat?${query.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setMessages(data.messages);
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const scrollToBottom = () => {
        if (viewport.current) {
            viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (user && isVITStudent) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [user, activeTab, profile]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !profile) return;

        const type = activeTab === 'universal' ? 'universal' : 'branch';
        const branch = activeTab !== 'universal' ? profile.branch : undefined;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newMessage,
                    senderId: profile._id,
                    type,
                    branch,
                }),
            });

            if (res.ok) {
                setNewMessage('');
                fetchMessages();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (!user) {
        return (
            <>
                <Navbar />
                <Container size="sm" py="xl" ta="center">
                    <Text>Please log in to access chat.</Text>
                </Container>
            </>
        );
    }

    if (!isVITStudent) {
        return (
            <>
                <Navbar />
                <Container size="sm" py="xl" ta="center">
                    <Title order={2} c="red">Access Denied</Title>
                    <Text mt="md">This chat is restricted to VIT students only (@vitstudent.ac.in).</Text>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container size="md" py="xl" h="calc(100vh - 80px)">
                <Paper withBorder shadow="sm" p="md" radius="md" h="100%" display="flex" style={{ flexDirection: 'column' }}>
                    <Tabs value={activeTab} onChange={setActiveTab} mb="md">
                        <Tabs.List>
                            <Tabs.Tab value="universal">Universal Chat</Tabs.Tab>
                            <Tabs.Tab value="branch" disabled={!profile?.branch}>
                                {profile?.branch ? `${profile.branch} Chat` : 'Branch Chat (Set Branch in Profile)'}
                            </Tabs.Tab>
                        </Tabs.List>
                    </Tabs>

                    <ScrollArea flex={1} viewportRef={viewport} mb="md" type="always" offsetScrollbars>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {messages.map((msg) => (
                                <Paper
                                    key={msg._id}
                                    p="sm"
                                    radius="md"
                                    bg={msg.senderId === profile?._id ? 'blue.1' : 'gray.1'}
                                    style={{
                                        alignSelf: msg.senderId === profile?._id ? 'flex-end' : 'flex-start',
                                        maxWidth: '70%',
                                    }}
                                >
                                    <Group gap="xs" mb={4}>
                                        <Text size="xs" fw={700} c="dimmed">{msg.senderName}</Text>
                                        <Text size="xs" c="dimmed">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </Group>
                                    <Text size="sm" style={{ wordBreak: 'break-word' }}>{msg.content}</Text>
                                </Paper>
                            ))}
                            {messages.length === 0 && (
                                <Center h={200}>
                                    <Text c="dimmed">No messages yet. Start the conversation!</Text>
                                </Center>
                            )}
                        </div>
                    </ScrollArea>

                    <Group gap="xs">
                        <TextInput
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            style={{ flex: 1 }}
                        />
                        <ActionIcon variant="filled" color="blue" size="lg" onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            <IconSend size={18} />
                        </ActionIcon>
                    </Group>
                </Paper>
            </Container>
        </>
    );
}
