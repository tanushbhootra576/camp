'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Button, Group, Card, Badge, Text, SimpleGrid, TextInput, Select, Modal, Textarea, LoadingOverlay, Avatar, Collapse, Divider, Alert, Pagination } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconMessage, IconPlus, IconThumbUp } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

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
    comments: {
        _id?: string;
        authorId: { name: string };
        content: string;
        createdAt: string;
    }[];
}

export default function DiscussionsPage() {
    const { user, profile } = useAuth();
    const queryClient = useQueryClient();

    // Filters & pagination
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [sort, setSort] = useState<string>('newest');
    const [page, setPage] = useState<number>(1);
    const [pageSize] = useState<number>(10);

    // New thread modal
    const [opened, { open, close }] = useDisclosure(false);
    const [newThread, setNewThread] = useState({
        title: '',
        content: '',
        category: 'GENERAL',
        tags: '',
    });

    // Local UI state for comments
    const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

    const sanitize = (raw: any): Thread => ({
        _id: String(raw._id),
        title: raw.title,
        content: raw.content,
        category: raw.category,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        authorId: raw.authorId || { name: 'Unknown' },
        createdAt: raw.createdAt,
        upvotes: Array.isArray(raw.upvotes) ? raw.upvotes.map((u: any) => String(u)) : [],
        comments: Array.isArray(raw.comments) ? raw.comments.map((c: any) => ({
            _id: c._id,
            authorId: c.authorId || { name: 'Unknown' },
            content: c.content,
            createdAt: c.createdAt,
        })) : []
    });

    // Query: fetch threads
    const threadsQuery = useQuery({
        queryKey: ['threads', { page, pageSize, sort, category: categoryFilter }],
        queryFn: async (): Promise<{ threads: Thread[]; page: number; pageSize: number; total: number; ok: boolean }> => {
            const params = new URLSearchParams();
            params.append('page', String(page));
            params.append('pageSize', String(pageSize));
            params.append('debug', '1');
            if (sort === 'upvotes') params.append('sort', 'upvotes');
            if (categoryFilter) params.append('category', categoryFilter);
            const res = await fetch(`/api/discussions?${params.toString()}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to load discussions');
            return data;
        },
        select: (data) => ({
            ...data,
            threads: Array.isArray(data.threads) ? data.threads.map(sanitize) : [],
        }),
        placeholderData: (prev) => prev,
    });

    // Mutation: create thread
    const createThreadMutation = useMutation({
        mutationFn: async () => {
            if (!profile) throw new Error('Not authenticated');
            const res = await fetch('/api/discussions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newThread,
                    authorId: profile._id,
                    tags: newThread.tags.split(',').map(t => t.trim()).filter(t => t),
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to create discussion');
            return data;
        },
        onSuccess: () => {
            notifications.show({ color: 'green', title: 'Discussion Created', message: 'Your discussion has been posted.' });
            close();
            setNewThread({ title: '', content: '', category: 'GENERAL', tags: '' });
            queryClient.invalidateQueries({ queryKey: ['threads'] });
        },
        onError: (e: any) => {
            notifications.show({ color: 'red', title: 'Create Failed', message: e.message || 'Unable to create discussion.' });
        }
    });

    // Mutation: toggle upvote (optimistic)
    const upvoteMutation = useMutation<{ threadId: string; thread: Thread | null }, any, string, { prev: any | undefined }>({
        mutationFn: async (threadId: string) => {
            if (!profile) throw new Error('Not authenticated');
            const res = await fetch(`/api/discussions/${threadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profile._id })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to toggle upvote');
            return { threadId, thread: data.thread ? sanitize(data.thread) : null };
        },
        onMutate: async (threadId) => {
            if (!profile) return { prev: undefined };
            await queryClient.cancelQueries({ queryKey: ['threads'] });
            const prev = queryClient.getQueryData<any>(['threads', { page, pageSize, sort, category: categoryFilter }]);
            if (prev) {
                const nextThreads = prev.threads.map((t: Thread) => {
                    if (t._id !== threadId) return t;
                    const set = new Set(t.upvotes);
                    const pid = String(profile._id);
                    if (set.has(pid)) set.delete(pid); else set.add(pid);
                    return { ...t, upvotes: Array.from(set) };
                });
                queryClient.setQueryData(['threads', { page, pageSize, sort, category: categoryFilter }], { ...prev, threads: nextThreads });
            }
            return { prev };
        },
        onError: (e, _id, ctx) => {
            if (ctx?.prev) queryClient.setQueryData(['threads', { page, pageSize, sort, category: categoryFilter }], ctx.prev);
            notifications.show({ color: 'red', title: 'Upvote Failed', message: (e as any).message || 'Unable to toggle upvote.' });
        },
        onSuccess: (data) => {
            if (data.thread) {
                queryClient.setQueryData(['threads', { page, pageSize, sort, category: categoryFilter }], (old: any) => {
                    if (!old) return old;
                    return { ...old, threads: old.threads.map((t: Thread) => t._id === data.threadId ? data.thread : t) };
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['threads'] });
            }
        }
    });

    // Mutation: add comment
    const commentMutation = useMutation<{ threadId: string; thread: Thread | null }, any, { threadId: string; content: string }>({
        mutationFn: async ({ threadId, content }) => {
            if (!profile) throw new Error('Not authenticated');
            const res = await fetch(`/api/discussions/${threadId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: profile._id, content })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || data.error || 'Failed to add comment');
            return { threadId, thread: data.thread ? sanitize(data.thread) : null };
        },
        onSuccess: (data) => {
            notifications.show({ color: 'green', title: 'Comment Added', message: 'Your comment is posted.' });
            if (data.thread) {
                queryClient.setQueryData(['threads', { page, pageSize, sort, category: categoryFilter }], (old: any) => {
                    if (!old) return old;
                    return { ...old, threads: old.threads.map((t: Thread) => t._id === data.threadId ? data.thread : t) };
                });
            } else {
                queryClient.invalidateQueries({ queryKey: ['threads'] });
            }
        },
        onError: (e: any) => {
            notifications.show({ color: 'red', title: 'Comment Failed', message: e.message || 'Unable to add comment.' });
        }
    });

    const toggleComments = (id: string) => {
        setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
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

                <Group mb="xl" gap="md" wrap="wrap">
                    <Select
                        placeholder="Filter by Category"
                        data={['BRANCH', 'YEAR', 'PLACEMENT', 'GENERAL']}
                        clearable
                        value={categoryFilter}
                        onChange={(val) => { setPage(1); setCategoryFilter(val); }}
                    />
                    <Select
                        placeholder="Sort"
                        data={[{ value: 'newest', label: 'Newest' }, { value: 'upvotes', label: 'Top Upvotes' }]}
                        value={sort}
                        onChange={(val) => { setPage(1); setSort(val || 'newest'); }}
                    />
                </Group>

                <div style={{ position: 'relative', minHeight: 200 }}>
                    {threadsQuery.isError && !threadsQuery.isLoading && (
                        <Alert title="Error" color="red" mb="md" variant="light">
                            {(threadsQuery.error as any)?.message || 'Failed to load discussions'}
                        </Alert>
                    )}
                    <LoadingOverlay visible={threadsQuery.isLoading || threadsQuery.isFetching} />
                    <SimpleGrid cols={1} spacing="md">
                        {threadsQuery.data?.threads.map((thread) => (
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

                                <Group mt="md" gap="xs">
                                    <Button
                                        variant={profile && thread.upvotes.includes(String(profile._id)) ? 'filled' : 'light'}
                                        size="xs"
                                        leftSection={<IconThumbUp size={14} />}
                                        onClick={() => upvoteMutation.mutate(thread._id)}
                                        disabled={!profile || upvoteMutation.isPending}
                                    >
                                        {thread.upvotes.length} Upvote{thread.upvotes.length === 1 ? '' : 's'}
                                    </Button>
                                    <Button
                                        variant={openComments[thread._id] ? 'filled' : 'light'}
                                        size="xs"
                                        leftSection={<IconMessage size={14} />}
                                        onClick={() => toggleComments(thread._id)}
                                    >
                                        {thread.comments?.length || 0} Comment{(thread.comments?.length || 0) === 1 ? '' : 's'}
                                    </Button>
                                </Group>

                                <Collapse in={!!openComments[thread._id]}>
                                    <Divider my="sm" />
                                    <Group mb="xs" gap={4}>
                                        <Text fw={500} size="sm">Comments</Text>
                                        <Badge color="blue" variant="light">{thread.comments?.length || 0}</Badge>
                                    </Group>
                                    {thread.comments && thread.comments.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                            {thread.comments.map((c) => (
                                                <Card key={c._id || Math.random()} padding="sm" radius="sm" withBorder>
                                                    <Group gap="xs">
                                                        <Avatar size={24} radius="xl" color="cyan">{c.authorId.name[0]}</Avatar>
                                                        <div>
                                                            <Text size="xs" fw={500}>{c.authorId.name}</Text>
                                                            <Text size="xs" c="dimmed">{new Date(c.createdAt).toLocaleString()}</Text>
                                                        </div>
                                                    </Group>
                                                    <Text size="sm" mt={4}>{c.content}</Text>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Text size="xs" c="dimmed" mb="sm">No comments yet.</Text>
                                    )}
                                    {profile && (
                                        <Group align="flex-start" gap="xs">
                                            <Textarea
                                                placeholder="Write a comment..."
                                                autosize
                                                minRows={2}
                                                style={{ flex: 1 }}
                                                value={commentDrafts[thread._id] || ''}
                                                onChange={(e) => setCommentDrafts(prev => ({ ...prev, [thread._id]: e.target.value }))}
                                            />
                                            <Button
                                                size="xs"
                                                loading={commentMutation.isPending}
                                                onClick={() => {
                                                    const content = commentDrafts[thread._id] || '';
                                                    if (!content.trim()) return;
                                                    commentMutation.mutate({ threadId: thread._id, content });
                                                    setCommentDrafts(prev => ({ ...prev, [thread._id]: '' }));
                                                }}
                                            >
                                                Post
                                            </Button>
                                        </Group>
                                    )}
                                </Collapse>
                            </Card>
                        ))}
                    </SimpleGrid>
                    {!threadsQuery.isLoading && threadsQuery.data?.threads.length === 0 && (
                        <Text ta="center" c="dimmed" mt="xl">No discussions found.</Text>
                    )}
                    {threadsQuery.data && threadsQuery.data.total > threadsQuery.data.pageSize && (
                        <Group justify="center" mt="lg">
                            <Pagination
                                total={Math.ceil(threadsQuery.data.total / threadsQuery.data.pageSize)}
                                value={page}
                                onChange={(p) => setPage(p)}
                            />
                        </Group>
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
                <Button fullWidth loading={createThreadMutation.isPending} onClick={() => createThreadMutation.mutate()}>Post</Button>
            </Modal>
        </>
    );
}
