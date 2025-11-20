'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, TextInput, Textarea, Button, Group, Paper, Avatar, SimpleGrid, TagsInput, NumberInput, LoadingOverlay, Text, Notification, Modal } from '@mantine/core';
import { useAuth } from '@/components/AuthProvider';
import { IconDeviceFloppy, IconCheck, IconX } from '@tabler/icons-react';
import { deleteUser } from 'firebase/auth';

export default function ProfilePage() {
    const { user, profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        branch: '',
        year: 1,
        bio: '',
        skills: [] as string[],
        interests: [] as string[],
        github: '',
        linkedin: '',
        portfolio: '',
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                branch: profile.branch || '',
                year: profile.year || 1,
                bio: profile.bio || '',
                skills: profile.skills || [],
                interests: profile.interests || [],
                github: profile.socialLinks?.github || '',
                linkedin: profile.socialLinks?.linkedin || '',
                portfolio: profile.socialLinks?.portfolio || '',
            });
        } else if (user) {
            setFormData(prev => ({ ...prev, name: user.displayName || '' }));
        }
    }, [profile, user]);

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        setNotification(null);
        try {
            const res = await fetch(`/api/users/${user.uid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: user.email || undefined,
                    branch: formData.branch,
                    year: formData.year,
                    bio: formData.bio,
                    skills: formData.skills,
                    interests: formData.interests,
                    socialLinks: {
                        github: formData.github,
                        linkedin: formData.linkedin,
                        portfolio: formData.portfolio,
                    }
                }),
            });

            if (res.ok) {
                await refreshProfile();
                setNotification({ type: 'success', message: 'Profile updated successfully!' });
            } else {
                const data = await res.json();
                setNotification({ type: 'error', message: data.error || 'Failed to update profile.' });
            }
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'An error occurred while updating profile.' });
        } finally {
            setLoading(false);
        }
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleDelete = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Delete from MongoDB
            const res = await fetch(`/api/users/${user.uid}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error('Delete API failed:', res.status, errorText);
                throw new Error(`Failed to delete user data: ${res.status} ${errorText}`);
            }

            // 2. Delete from Firebase
            await deleteUser(user);

            // 3. Redirect
            window.location.href = '/';
        } catch (error) {
            console.error('Error deleting account:', error);
            setNotification({ type: 'error', message: 'Failed to delete account. You may need to re-login first.' });
            setLoading(false);
            setDeleteModalOpen(false);
        }
    };

    if (!user) {
        return (
            <>
                <Navbar />
                <Container size="sm" py="xl" ta="center">
                    <Text>Please log in to view your profile.</Text>
                    <Button component="a" href="/login" mt="md">Log in</Button>
                </Container>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <Container size="md" py="xl">
                <Title mb="xl">Your Profile</Title>

                {notification && (
                    <Notification
                        icon={notification.type === 'success' ? <IconCheck size={18} /> : <IconX size={18} />}
                        color={notification.type === 'success' ? 'teal' : 'red'}
                        title={notification.type === 'success' ? 'Success' : 'Error'}
                        onClose={() => setNotification(null)}
                        mb="md"
                    >
                        {notification.message}
                    </Notification>
                )}

                <Paper withBorder shadow="sm" p="xl" radius="md" pos="relative">
                    <LoadingOverlay visible={loading} />

                    <Group mb="xl">
                        <Avatar
                            src={user.photoURL}
                            size={100}
                            radius={100}
                            color="blue"
                        >
                            {formData.name?.[0]}
                        </Avatar>
                        <div>
                            <Title order={3}>{formData.name}</Title>
                            <Text c="dimmed">{user.email}</Text>
                        </div>
                    </Group>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        <TextInput
                            label="Full Name"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />

                        <Group grow>
                            <TextInput
                                label="Branch"
                                placeholder="e.g. CSE"
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                disabled={profile?.profileLocked}
                            />
                            <NumberInput
                                label="Year"
                                min={1}
                                max={5}
                                value={formData.year}
                                onChange={(val) => setFormData({ ...formData, year: Number(val) })}
                                disabled={profile?.profileLocked}
                            />
                        </Group>

                        <TextInput
                            label="GitHub URL"
                            placeholder="https://github.com/..."
                            value={formData.github}
                            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                        />
                        <TextInput
                            label="LinkedIn URL"
                            placeholder="https://linkedin.com/in/..."
                            value={formData.linkedin}
                            onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                        />
                    </SimpleGrid>

                    <TextInput
                        label="Portfolio URL"
                        placeholder="https://..."
                        mt="md"
                        value={formData.portfolio}
                        onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    />

                    <Textarea
                        label="Bio"
                        placeholder="Tell us about yourself..."
                        mt="md"
                        minRows={3}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />

                    <TagsInput
                        label="Skills"
                        placeholder="Type and press Enter to add skills"
                        data={['React', 'Node.js', 'Python', 'Java', 'Photography', 'Design', 'Video Editing']}
                        mt="md"
                        value={formData.skills}
                        onChange={(val) => setFormData({ ...formData, skills: val })}
                    />

                    <TagsInput
                        label="Interests"
                        placeholder="Type and press Enter to add interests"
                        data={['Coding', 'Music', 'Sports', 'Reading', 'Travel']}
                        mt="md"
                        value={formData.interests}
                        onChange={(val) => setFormData({ ...formData, interests: val })}
                    />

                    <Group justify="space-between" mt="xl">
                        <Button color="red" variant="outline" onClick={() => setDeleteModalOpen(true)}>
                            Delete Account
                        </Button>
                        <Button
                            leftSection={<IconDeviceFloppy size={18} />}
                            onClick={handleSubmit}
                        >
                            Save Changes
                        </Button>
                    </Group>
                </Paper>
            </Container>

            <Modal opened={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account" centered>
                <Text size="sm" mb="lg">
                    Are you sure you want to delete your account? This action is irreversible and all your data will be lost.
                </Text>
                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button color="red" onClick={handleDelete} loading={loading}>Delete Account</Button>
                </Group>
            </Modal>
        </>
    );
}
