'use client';

import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Paper, Tabs, ScrollArea, TextInput, ActionIcon, Group, Text, Avatar, Center, Tooltip, Badge, Menu, Button, Box } from '@mantine/core';
import { useAuth } from '@/components/AuthProvider';
import { IconSend, IconTrash, IconRefresh, IconMoodSmile, IconArrowBackUp, IconX, IconSticker, IconThumbUp, IconHeart, IconMoodHappy, IconMoodSurprised, IconMoodSad, IconFlame, IconSearch, IconArrowDown } from '@tabler/icons-react';
import { showError } from '@/lib/error-handling';
import { getAuthHeaders } from '@/lib/api';

interface Reaction {
    userId: string;
    emoji: string;
}

interface Message {
    _id: string;
    content: string;
    senderId: string;
    senderName: string;
    type: 'universal' | 'branch' | 'year';
    branch?: string;
    year?: number;
    createdAt: string;
    replyTo?: {
        _id: string;
        content: string;
        senderName: string;
    };
    reactions: Reaction[];
    sticker?: string;
}

const REACTION_ICONS: Record<string, any> = {
    '👍': IconThumbUp,
    '❤️': IconHeart,
    '😂': IconMoodHappy,
    '😮': IconMoodSurprised,
    '😢': IconMoodSad,
    '🔥': IconFlame,
};

const STICKERS = [
    'https://cdn-icons-png.flaticon.com/512/742/742751.png', // Smile
    'https://cdn-icons-png.flaticon.com/512/742/742752.png', // Laugh
    'https://cdn-icons-png.flaticon.com/512/742/742920.png', // Cool
    'https://cdn-icons-png.flaticon.com/512/742/742760.png', // Sad
    'https://cdn-icons-png.flaticon.com/512/742/742822.png', // Angry
    'https://cdn-icons-png.flaticon.com/512/742/742745.png', // Love
    'https://cdn-icons-png.flaticon.com/512/4712/4712109.png', // Thumbs Up
    'https://cdn-icons-png.flaticon.com/512/4712/4712139.png', // Party
    'https://cdn-icons-png.flaticon.com/512/4712/4712009.png', // Thinking
    'https://cdn-icons-png.flaticon.com/512/4712/4712128.png', // Sleepy
    'https://cdn-icons-png.flaticon.com/512/4712/4712038.png', // Confused
    'https://cdn-icons-png.flaticon.com/512/1651/1651623.png', // Study
    'https://cdn-icons-png.flaticon.com/512/2936/2936886.png', // Coffee
    'https://cdn-icons-png.flaticon.com/512/1651/1651586.png', // Laptop
];

export default function ChatPage() {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<string | null>('universal');
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const viewport = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [onlineCount, setOnlineCount] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalMessages, setTotalMessages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const isVITStudent = user?.email?.endsWith('@vitstudent.ac.in');

    const fetchMessages = async () => {
        if (!activeTab) return;

        const type = activeTab;
        const branch = profile?.branch;
        const year = profile?.year;

        if (type === 'branch' && !branch) return;
        if (type === 'year' && !year) return;

        try {
            const query = new URLSearchParams({ type });
            if (type === 'branch' && branch) query.append('branch', branch);
            if (type === 'year' && year) query.append('year', String(year));
            if (profile?._id) query.append('userId', String(profile._id));

            const res = await fetch(`/api/chat?${query.toString()}`, { headers: getAuthHeaders() });
            const data = await res.json();
            if (res.ok) {
                setOnlineCount(data.onlineCount || 0);
                setTotalUsers(data.totalUsers || 0);
                setTotalMessages(data.totalMessages || 0);
                setMessages(prev => {
                    // Simple check to see if we have new messages to decide on scrolling
                    if (data.messages.length > prev.length && autoScroll) {
                        setTimeout(scrollToBottom, 100);
                    }
                    return data.messages;
                });
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const scrollToBottom = () => {
        if (viewport.current) {
            viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
            setShowScrollButton(false);
        }
    };

    // Handle scroll to detect if user scrolled up
    const onScrollPositionChange = (position: { x: number; y: number }) => {
        if (viewport.current) {
            const { scrollTop, scrollHeight, clientHeight } = viewport.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
            setAutoScroll(isAtBottom);
            setShowScrollButton(!isAtBottom);
        }
    };

    const filteredMessages = messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        if (user && isVITStudent) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
            return () => clearInterval(interval);
        }
    }, [user, activeTab, profile]);

    // Initial scroll on tab change
    useEffect(() => {
        setAutoScroll(true);
        scrollToBottom();
    }, [activeTab]);

    const handleSendMessage = async (stickerUrl?: string) => {
        if ((!newMessage.trim() && !stickerUrl) || !user || !profile) return;

        const type = activeTab;
        const branch = profile.branch;
        const year = profile.year;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    ...getAuthHeaders()
                },
                body: JSON.stringify({
                    content: newMessage,
                    senderId: profile._id,
                    type,
                    branch: type === 'branch' ? branch : undefined,
                    year: type === 'year' ? Number(year) : undefined,
                    replyTo: replyingTo ? {
                        _id: replyingTo._id,
                        content: replyingTo.content,
                        senderName: replyingTo.senderName
                    } : undefined,
                    sticker: stickerUrl
                }),
            });

            if (res.ok) {
                setNewMessage('');
                setReplyingTo(null);
                setAutoScroll(true); // Force scroll on own message
                fetchMessages();
            } else {
                const data = await res.json();
                showError({ message: data.error || 'Failed to send message' }, 'Message Failed');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showError(error, 'Message Failed');
        }
    };

    const handleReaction = async (msgId: string, emoji: string) => {
        if (!profile) return;
        try {
            const res = await fetch(`/api/chat/${msgId}`, {
                method: 'PATCH',
                headers: { ...getAuthHeaders() },
                body: JSON.stringify({
                    action: 'react',
                    userId: profile._id,
                    emoji
                })
            });
            if (res.ok) {
                fetchMessages();
            }
        } catch (error) {
            console.error('Error reacting:', error);
        }
    };

    const handleDeleteMessage = async (msgId: string) => {
        if (!confirm('Delete this message?')) return;
        try {
            const res = await fetch(`/api/chat/${msgId}?userId=${profile?._id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (res.ok) {
                fetchMessages();
            }
        } catch (error) {
            console.error('Error deleting message:', error);
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
                        <Tabs.List grow>
                            <Tabs.Tab value="universal">Universal</Tabs.Tab>
                            <Tabs.Tab value="branch" disabled={!profile?.branch}>
                                {profile?.branch ? `${profile.branch}` : 'Branch (Set in Profile)'}
                            </Tabs.Tab>
                            <Tabs.Tab value="year" disabled={!profile?.year}>
                                {profile?.year ? `Year ${profile.year}` : 'Year (Set in Profile)'}
                            </Tabs.Tab>
                            <Tooltip label="Refresh Messages">
                                <ActionIcon variant="subtle" color="gray" onClick={fetchMessages} ml="auto" my="auto" mr="xs">
                                    <IconRefresh size={16} />
                                </ActionIcon>
                            </Tooltip>
                        </Tabs.List>
                    </Tabs>

                    <Group justify="space-between" mb="xs" px="xs" align="center">
                        <Group gap="xs">
                            <Badge color="green" variant="dot">
                                {onlineCount} Online
                            </Badge>
                            <Badge color="blue" variant="light">
                                {totalUsers} Total Users
                            </Badge>
                            <Badge color="gray" variant="outline">
                                {totalMessages} Msgs
                            </Badge>
                        </Group>
                        <TextInput 
                            placeholder="Search..." 
                            size="xs" 
                            leftSection={<IconSearch size={12} />}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: 150 }}
                        />
                    </Group>

                    <ScrollArea 
                        flex={1} 
                        viewportRef={viewport} 
                        mb="md" 
                        type="always" 
                        offsetScrollbars
                        onScrollPositionChange={onScrollPositionChange}
                        style={{ position: 'relative' }}
                    >
                        {showScrollButton && (
                            <ActionIcon 
                                variant="filled" 
                                color="blue" 
                                radius="xl" 
                                size="lg"
                                style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}
                                onClick={scrollToBottom}
                            >
                                <IconArrowDown size={20} />
                            </ActionIcon>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: 10 }}>
                            {filteredMessages.map((msg) => {
                                const myId = String(profile?._id ?? '');
                                const isMe = msg.senderId === myId;
                                return (
                                    <Group key={msg._id} align="flex-start" justify={isMe ? 'flex-end' : 'flex-start'} gap="xs" wrap="nowrap">
                                        {!isMe && (
                                            <Avatar radius="xl" size="sm" color="blue">{msg.senderName?.[0]}</Avatar>
                                        )}
                                        <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                                            <Group gap={6} mb={2}>
                                                {!isMe && <Text size="xs" fw={700} c="dimmed">{msg.senderName}</Text>}
                                                <Text size="xs" c="dimmed" style={{ fontSize: 10 }}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </Text>
                                            </Group>
                                            
                                            {msg.replyTo && (
                                                <Paper 
                                                    p="xs" 
                                                    mb={4} 
                                                    bg="gray.1" 
                                                    radius="sm" 
                                                    style={{ borderLeft: '3px solid #228be6', opacity: 0.8, fontSize: '0.85rem', cursor: 'pointer' }}
                                                >
                                                    <Text size="xs" fw={700}>{msg.replyTo.senderName}</Text>
                                                    <Text size="xs" lineClamp={1}>{msg.replyTo.content}</Text>
                                                </Paper>
                                            )}

                                            {msg.sticker ? (
                                                <img src={msg.sticker} alt="sticker" style={{ width: 100, height: 100, objectFit: 'contain' }} />
                                            ) : (
                                                <Paper
                                                    p="sm"
                                                    radius="md"
                                                    bg={isMe ? 'blue.6' : 'gray.1'}
                                                    c={isMe ? 'white' : 'black'}
                                                    style={{
                                                        borderTopRightRadius: isMe ? 0 : undefined,
                                                        borderTopLeftRadius: !isMe ? 0 : undefined,
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <Text size="sm" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
                                                </Paper>
                                            )}

                                            {/* Reactions Display */}
                                            {msg.reactions && msg.reactions.length > 0 && (
                                                <Group gap={4} mt={4}>
                                                    {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                                                        const count = msg.reactions.filter(r => r.emoji === emoji).length;
                                                        const userReacted = msg.reactions.some(r => r.emoji === emoji && r.userId === myId);
                                                        const Icon = REACTION_ICONS[emoji];
                                                        return (
                                                            <Badge 
                                                                key={emoji} 
                                                                size="xs" 
                                                                variant={userReacted ? "filled" : "light"} 
                                                                color="gray"
                                                                style={{ cursor: 'pointer', textTransform: 'none', paddingLeft: 6, paddingRight: 6 }}
                                                                onClick={() => handleReaction(msg._id, emoji)}
                                                            >
                                                                <Group gap={4} align="center">
                                                                    {Icon ? <Icon size={12} /> : emoji}
                                                                    <span>{count}</span>
                                                                </Group>
                                                            </Badge>
                                                        );
                                                    })}
                                                </Group>
                                            )}

                                            <Group gap={4} mt={2} style={{ opacity: 0.5 }}>
                                                <ActionIcon 
                                                    variant="subtle" 
                                                    color="gray" 
                                                    size="xs" 
                                                    onClick={() => setReplyingTo(msg)}
                                                >
                                                    <IconArrowBackUp size={12} />
                                                </ActionIcon>
                                                
                                                <Menu shadow="md" width={200}>
                                                    <Menu.Target>
                                                        <ActionIcon variant="subtle" color="gray" size="xs">
                                                            <IconMoodSmile size={12} />
                                                        </ActionIcon>
                                                    </Menu.Target>
                                                    <Menu.Dropdown>
                                                        <Group gap={4} p={4} justify="center">
                                                            {Object.entries(REACTION_ICONS).map(([emoji, Icon]) => (
                                                                <ActionIcon 
                                                                    key={emoji} 
                                                                    variant="subtle" 
                                                                    onClick={() => handleReaction(msg._id, emoji)}
                                                                >
                                                                    <Icon size={18} />
                                                                </ActionIcon>
                                                            ))}
                                                        </Group>
                                                    </Menu.Dropdown>
                                                </Menu>

                                                {isMe && (
                                                    <ActionIcon 
                                                        variant="subtle" 
                                                        color="gray" 
                                                        size="xs" 
                                                        onClick={() => handleDeleteMessage(msg._id)}
                                                    >
                                                        <IconTrash size={12} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                        </div>
                                        {isMe && (
                                            <Avatar radius="xl" size="sm" color="blue" src={user.photoURL}>{msg.senderName?.[0]}</Avatar>
                                        )}
                                    </Group>
                                );
                            })}
                            {messages.length === 0 && (
                                <Center h={200}>
                                    <Text c="dimmed">No messages yet. Start the conversation!</Text>
                                </Center>
                            )}
                        </div>
                    </ScrollArea>

                    {replyingTo && (
                        <Paper p="xs" mb="xs" bg="gray.0" withBorder style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Text size="xs" fw={700}>Replying to {replyingTo.senderName}</Text>
                                <Text size="xs" lineClamp={1} c="dimmed">{replyingTo.content}</Text>
                            </Box>
                            <ActionIcon variant="subtle" color="gray" onClick={() => setReplyingTo(null)}>
                                <IconX size={16} />
                            </ActionIcon>
                        </Paper>
                    )}

                    <Group gap="xs" align="flex-end">
                        <Menu shadow="md" width={200} position="top-start">
                            <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="lg" radius="xl" mb={4}>
                                    <IconSticker size={24} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Text size="xs" c="dimmed" p="xs">Send a sticker</Text>
                                <Group gap="xs" p="xs" style={{ maxWidth: 300 }}>
                                    {STICKERS.map((sticker, index) => (
                                        <ActionIcon 
                                            key={index} 
                                            variant="subtle" 
                                            size="xl" 
                                            onClick={() => handleSendMessage(sticker)}
                                        >
                                            <img src={sticker} alt="sticker" style={{ width: 30, height: 30 }} />
                                        </ActionIcon>
                                    ))}
                                </Group>
                            </Menu.Dropdown>
                        </Menu>

                        <TextInput
                            placeholder={`Message ${activeTab} chat...`}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            style={{ flex: 1 }}
                            size="md"
                            radius="xl"
                        />
                        <ActionIcon 
                            variant="filled" 
                            color="blue" 
                            size={42} 
                            radius="xl" 
                            onClick={() => handleSendMessage()} 
                            disabled={!newMessage.trim()}
                        >
                            <IconSend size={20} />
                        </ActionIcon>
                    </Group>
                </Paper>
            </Container>
        </>
    );
}
