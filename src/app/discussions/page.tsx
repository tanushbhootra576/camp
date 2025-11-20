'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Button, Group, Card, Badge, Text, SimpleGrid, TextInput, Select, Modal, Textarea, LoadingOverlay, ActionIcon, Avatar } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconMessage, IconPlus, IconThumbUp } from '@tabler/icons-react';

interface Thread {
    _id: string;
    title: string;
    content: string;
    category: 'BRANCH' | 'YEAR' | 'PLACEMENT' | 'GENERAL';
    tags: string[];
    authorId: {
        name: string;
    };
    createdAt: string;
    upvotes: string[];
}

export default function DiscussionsPage() {
    const { user, profile } = useAuth();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const [opened, { open, close }] = useDisclosure(false);

    // Form state
    const [newThread, setNewThread] = useState({
        title: '',
        content: '',
        category: 'GENERAL',
        tags: '',
    });

    const fetchThreads = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (categoryFilter) params.append('category', categoryFilter);

            const res = await fetch(`/api/discussions?${params.toString()}`);
            const data = await res.json();
            setThreads(data.threads);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, [categoryFilter]);

    const handleSubmit = async () => {
        if (!profile) return;

        try {
            await fetch('/api/discussions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newThread,
                    authorId: profile._id,
                    tags: newThread.tags.split(',').map(t => t.trim()).filter(t => t),
                }),
            });
            close();
            fetchThreads();
            setNewThread({ title: '', content: '', category: 'GENERAL', tags: '' });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <Navbar />
            <Container size="lg" py="xl">
                <Group justify="space-between" mb="xl">
                    <Title>Discussions</Title>
                    {user && (
                        <Button leftSection={<IconPlus size={14} />} onClick={open}>
                            New Discussion
                        </Button>
                    )}
                </Group>

                <Group mb="xl">
                    <Select
                        placeholder="Filter by Category"
                        data={['BRANCH', 'YEAR', 'PLACEMENT', 'GENERAL']}
                        clearable
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                    />
                </Group>

                <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={loading} />
                    <SimpleGrid cols={1} spacing="md">
                        {threads.map((thread) => (
                            <Card key={thread._id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Group gap="xs">
                                        <Avatar radius="xl" color="blue">{thread.authorId.name[0]}</Avatar>
                                        <div>
                                            <Text size="sm" fw={500}>{thread.authorId.name}</Text>
                                            <Text size="xs" c="dimmed">{new Date(thread.createdAt).toLocaleDateString()}</Text>
                                        </div>
                                    </Group>
                                    <Badge>{thread.category}</Badge>
                                </Group>

                                <Text fw={600} size="lg" mt="sm">{thread.title}</Text>
                                <Text size="sm" mt="xs" style={{ whiteSpace: 'pre-wrap' }}>
                                    {thread.content}
                                </Text>

                                <Group mt="md" gap="xs">
                                    {thread.tags.map(tag => (
                                        <Badge key={tag} variant="dot" size="sm" color="gray">{tag}</Badge>
                                    ))}
                                </Group>

                                <Group mt="md">
                                    <Button variant="subtle" size="xs" leftSection={<IconThumbUp size={14} />}>
                                        {thread.upvotes.length} Upvotes
                                    </Button>
                                    <Button variant="subtle" size="xs" leftSection={<IconMessage size={14} />}>
                                        Comment
                                    </Button>
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
                    {!loading && threads.length === 0 && (
                        <Text ta="center" c="dimmed" mt="xl">No discussions found.</Text>
                    )}
                </div>
            </Container>

            <Modal opened={opened} onClose={close} title="Start Discussion">
                <TextInput
                    label="Title"
                    required
                    mb="md"
                    value={newThread.title}
                    onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                />
                <Select
                    label="Category"
                    data={['BRANCH', 'YEAR', 'PLACEMENT', 'GENERAL']}
                    required
                    mb="md"
                    value={newThread.category}
                    onChange={(val) => setNewThread({ ...newThread, category: val as any })}
                />
                <Textarea
                    label="Content"
                    required
                    mb="md"
                    minRows={4}
                    value={newThread.content}
                    onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                />
                <TextInput
                    label="Tags"
                    placeholder="comma, separated"
                    mb="xl"
                    value={newThread.tags}
                    onChange={(e) => setNewThread({ ...newThread, tags: e.target.value })}
                />
                <Button fullWidth onClick={handleSubmit}>Post</Button>
            </Modal>
        </>
    );
}
