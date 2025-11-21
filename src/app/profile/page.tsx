'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, TextInput, Textarea, Button, Group, Paper, Avatar, SimpleGrid, TagsInput, NumberInput, LoadingOverlay, Text, Notification, Modal, Badge, Card, Divider } from '@mantine/core';
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

    // Added: user assets (projects, skill requests, resources count)
    const [myProjects, setMyProjects] = useState<any[]>([]);
    const [mySkillRequests, setMySkillRequests] = useState<any[]>([]);
    const [myResourcesCount, setMyResourcesCount] = useState<number>(0);
    const [fetchingAssets, setFetchingAssets] = useState(false);

    // Edit project modal state
    const [editProjectModal, setEditProjectModal] = useState<{ open: boolean; project: any | null }>({ open: false, project: null });
    const [editProjectData, setEditProjectData] = useState({
        title: '',
        description: '',
        techStack: '' as any,
        demoLink: '',
        repoLink: '',
        isFeatured: false,
    });
    interface Contributor { _id: string; name?: string }
    const [contributors, setContributors] = useState<Contributor[]>([]); // store user objects for display
    const [contributorSearch, setContributorSearch] = useState('');
    const [contributorResults, setContributorResults] = useState<any[]>([]);
    const [searchingContrib, setSearchingContrib] = useState(false);

    useEffect(() => {
        if (profile?._id) {
            const load = async () => {
                setFetchingAssets(true);
                try {
                    const pid = profile._id;
                    // Fetch projects where user is member
                    const pRes = await fetch(`/api/projects?memberId=${pid}`);
                    const pData = await pRes.json();
                    setMyProjects(Array.isArray(pData.projects) ? pData.projects : []);
                    // Fetch skill requests by user
                    const sRes = await fetch(`/api/skills?userId=${pid}&type=REQUEST`);
                    const sData = await sRes.json();
                    setMySkillRequests(Array.isArray(sData.skills) ? sData.skills : []);
                    // Fetch resources count
                    const rRes = await fetch(`/api/resources?uploaderId=${pid}`);
                    const rData = await rRes.json();
                    setMyResourcesCount(Array.isArray(rData.resources) ? rData.resources.length : 0);
                } catch (e) {
                    console.error('Failed loading user assets', e);
                } finally {
                    setFetchingAssets(false);
                }
            };
            load();
        }
    }, [profile?._id]);

    const openEditProject = (project: any) => {
        setEditProjectData({
            title: project.title || '',
            description: project.description || '',
            techStack: (project.techStack || []).join(', '),
            demoLink: project.demoLink || '',
            repoLink: project.repoLink || '',
            isFeatured: !!project.isFeatured,
        });
        // initialize contributors with teamMembers objects (fallback to id only)
        const members: Contributor[] = Array.isArray(project.teamMembers)
            ? project.teamMembers.map((m: any) => (typeof m === 'object'
                ? { _id: String(m._id), name: m.name }
                : { _id: String(m) }))
            : [];
        if (profile?._id && !members.some(m => String(m._id) === String(profile._id))) {
            members.push({ _id: String(profile._id), name: profile.name });
        }
        setContributors(members);
        setEditProjectModal({ open: true, project });
    };

    const submitProjectEdit = async () => {
        if (!editProjectModal.project || !profile?._id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${editProjectModal.project._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: String(profile._id),
                    title: editProjectData.title,
                    description: editProjectData.description,
                    techStack: String(editProjectData.techStack).split(',').map((t: string) => t.trim()).filter(Boolean),
                    demoLink: editProjectData.demoLink,
                    repoLink: editProjectData.repoLink,
                    isFeatured: editProjectData.isFeatured,
                    teamMembers: contributors.map(c => String(c._id)),
                })
            });
            const data = await res.json();
            if (res.ok && data.project) {
                setMyProjects(prev => prev.map(p => p._id === data.project._id ? data.project : p));
                setNotification({ type: 'success', message: 'Project updated.' });
                setEditProjectModal({ open: false, project: null });
            } else {
                setNotification({ type: 'error', message: data.error || 'Failed to update project.' });
            }
        } catch (e) {
            setNotification({ type: 'error', message: 'Error updating project.' });
        } finally {
            setLoading(false);
        }
    };

    // contributor search effect
    useEffect(() => {
        const q = contributorSearch.trim();
        if (q.length < 2) {
            setContributorResults([]);
            return;
        }
        const handle = setTimeout(async () => {
            setSearchingContrib(true);
            try {
                const res = await fetch(`/api/users?search=${encodeURIComponent(q)}&limit=6`);
                const data = await res.json();
                if (res.ok && Array.isArray(data.users)) {
                    // filter out already selected contributors
                    setContributorResults(data.users.filter((u: any) => !contributors.some(c => String(c._id) === String(u._id))));
                }
            } catch (e) {
                console.error('Search contributors failed', e);
            } finally {
                setSearchingContrib(false);
            }
        }, 300);
        return () => clearTimeout(handle);
    }, [contributorSearch, contributors]);

    const addContributor = (u: any) => {
        const id = String(u._id);
        setContributors(prev => prev.some(c => String(c._id) === id) ? prev : [...prev, u]);
        setContributorSearch('');
        setContributorResults([]);
    };
    const removeContributor = (id: string) => {
        if (id === String(profile?._id)) return; // prevent removing self
        setContributors(prev => prev.filter(c => String(c._id) !== id));
    };

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
                {/* User assets summary */}
                <Paper withBorder shadow="sm" p="xl" radius="md" mt="xl" pos="relative">
                    <LoadingOverlay visible={fetchingAssets} />
                    <Title order={4} mb="md">Your Contributions</Title>
                    <Group mb="md" gap="lg">
                        <Badge color="grape" size="lg">Projects: {myProjects.length}</Badge>
                        <Badge color="cyan" size="lg">Skill Requests: {mySkillRequests.length}</Badge>
                        <Badge color="pink" size="lg">Resources Uploaded: {myResourcesCount}</Badge>
                    </Group>
                    <Divider mb="sm" label="Projects" labelPosition="center" />
                    {myProjects.length === 0 && <Text size="sm" c="dimmed">No projects yet.</Text>}
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="lg">
                        {myProjects.map(p => (
                            <Card key={p._id} withBorder padding="md" radius="md" shadow="xs">
                                <Group justify="space-between" mb={4}>
                                    <Text fw={600}>{p.title}</Text>
                                    <Button size="xs" variant="light" onClick={() => openEditProject(p)}>Edit</Button>
                                </Group>
                                <Text size="xs" c="dimmed" lineClamp={3}>{p.description}</Text>
                                <Group mt="xs" gap={4} wrap="wrap">
                                    {(p.techStack || []).slice(0,6).map((t: string) => <Badge key={t} color="blue" variant="light" size="sm">{t}</Badge>)}
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
                    <Divider mb="sm" label="Skill Requests" labelPosition="center" />
                    {mySkillRequests.length === 0 && <Text size="sm" c="dimmed">No skill requests posted.</Text>}
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        {mySkillRequests.map(s => (
                            <Card key={s._id} withBorder padding="md" radius="md" shadow="xs">
                                <Group justify="space-between" mb={4}>
                                    <Text fw={600}>{s.title}</Text>
                                    <Badge color={s.status === 'OPEN' ? 'green' : 'gray'}>{s.status}</Badge>
                                </Group>
                                <Text size="xs" c="dimmed" lineClamp={3}>{s.description}</Text>
                                <Group mt="xs" gap={4} wrap="wrap">
                                    {(s.tags || []).slice(0,6).map((t: string) => <Badge key={t} color="violet" variant="light" size="sm">{t}</Badge>)}
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
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
            <Modal opened={editProjectModal.open} onClose={() => setEditProjectModal({ open: false, project: null })} title="Edit Project" centered>
                <TextInput label="Title" mb="md" value={editProjectData.title} onChange={(e) => setEditProjectData(d => ({ ...d, title: e.target.value }))} />
                <Textarea label="Description" mb="md" minRows={3} value={editProjectData.description} onChange={(e) => setEditProjectData(d => ({ ...d, description: e.target.value }))} />
                <TextInput label="Tech Stack (comma separated)" mb="md" value={editProjectData.techStack} onChange={(e) => setEditProjectData(d => ({ ...d, techStack: e.target.value }))} />
                <TextInput label="Demo Link" mb="md" value={editProjectData.demoLink} onChange={(e) => setEditProjectData(d => ({ ...d, demoLink: e.target.value }))} />
                <TextInput label="Repo Link" mb="md" value={editProjectData.repoLink} onChange={(e) => setEditProjectData(d => ({ ...d, repoLink: e.target.value }))} />
                <Divider my="sm" label="Contributors" labelPosition="center" />
                <Group gap={6} mb="sm" wrap="wrap">
                    {contributors.map((c: Contributor) => {
                        const id = String(c._id);
                        const display = c.name || (id === String(profile?._id) ? 'You' : id.substring(0,6));
                        return (
                            <Badge key={id} color={id === String(profile?._id) ? 'teal' : 'blue'} rightSection={id !== String(profile?._id) ? <Button size="xs" variant="subtle" color="red" onClick={() => removeContributor(id)}>x</Button> : undefined}>
                                {display}
                            </Badge>
                        );
                    })}
                    {contributors.length === 0 && <Text size="xs" c="dimmed">No contributors yet.</Text>}
                </Group>
                <TextInput placeholder="Search users to add" value={contributorSearch} onChange={(e) => setContributorSearch(e.target.value)} mb="xs" />
                {searchingContrib && <Text size="xs" c="dimmed" mb="xs">Searching...</Text>}
                <Group gap={6} mb="md" wrap="wrap">
                    {contributorResults.map(u => (
                        <Badge key={u._id} variant="outline" color="gray" style={{ cursor: 'pointer' }} onClick={() => addContributor(u)}>{u.name}</Badge>
                    ))}
                </Group>
                <Group justify="flex-end" mt="md">
                    <Button variant="default" onClick={() => setEditProjectModal({ open: false, project: null })}>Cancel</Button>
                    <Button onClick={submitProjectEdit} loading={loading}>Save</Button>
                </Group>
            </Modal>
        </>
    );
}
