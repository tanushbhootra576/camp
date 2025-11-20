'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Button, Group, Card, Badge, Text, SimpleGrid, TextInput, Select, Modal, Textarea, LoadingOverlay, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconSearch, IconUpload, IconDownload, IconExternalLink } from '@tabler/icons-react';

interface Resource {
    _id: string;
    title: string;
    description: string;
    type: 'PYQ' | 'NOTES' | 'LINK' | 'OTHER';
    branch: string;
    courseCode: string;
    fileUrl?: string;
    linkUrl?: string;
    uploaderId: {
        name: string;
    };
    createdAt: string;
}

export default function ResourcesPage() {
    const { user, profile } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [branchFilter, setBranchFilter] = useState<string | null>(null);

    const [opened, { open, close }] = useDisclosure(false);

    // Form state
    const [newResource, setNewResource] = useState({
        title: '',
        description: '',
        type: 'NOTES',
        branch: 'CSE',
        courseCode: '',
        linkUrl: '',
    });

    const fetchResources = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (typeFilter) params.append('type', typeFilter);
            if (branchFilter) params.append('branch', branchFilter);

            const res = await fetch(`/api/resources?${params.toString()}`);
            const data = await res.json();
            setResources(data.resources);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, [search, typeFilter, branchFilter]);

    const handleSubmit = async () => {
        if (!profile) return;

        try {
            await fetch('/api/resources', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newResource,
                    uploaderId: profile._id,
                }),
            });
            close();
            fetchResources();
            setNewResource({ title: '', description: '', type: 'NOTES', branch: 'CSE', courseCode: '', linkUrl: '' });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <Navbar />
            <Container size="lg" py="xl">
                <Group justify="space-between" mb="xl">
                    <Title>Academic Resources</Title>
                    {user && (
                        <Button leftSection={<IconUpload size={14} />} onClick={open}>
                            Upload Resource
                        </Button>
                    )}
                </Group>

                <Group mb="xl">
                    <TextInput
                        placeholder="Search resources..."
                        leftSection={<IconSearch size={14} />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Select
                        placeholder="Type"
                        data={['PYQ', 'NOTES', 'LINK', 'OTHER']}
                        clearable
                        value={typeFilter}
                        onChange={setTypeFilter}
                        w={150}
                    />
                    <Select
                        placeholder="Branch"
                        data={['CSE', 'ECE', 'ME', 'CE', 'EE']}
                        clearable
                        value={branchFilter}
                        onChange={setBranchFilter}
                        w={150}
                    />
                </Group>

                <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={loading} />
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {resources.map((resource) => (
                            <Card key={resource._id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Badge color="teal">{resource.type}</Badge>
                                    <Text size="xs" c="dimmed">{resource.courseCode}</Text>
                                </Group>

                                <Text fw={500}>{resource.title}</Text>
                                <Text size="sm" c="dimmed" lineClamp={2} mt="xs">
                                    {resource.description}
                                </Text>

                                <Group mt="md" justify="space-between">
                                    <Text size="xs" c="dimmed">
                                        By {resource.uploaderId.name}
                                    </Text>
                                    {resource.linkUrl && (
                                        <Button
                                            component="a"
                                            href={resource.linkUrl}
                                            target="_blank"
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconExternalLink size={14} />}
                                        >
                                            Open
                                        </Button>
                                    )}
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
                    {!loading && resources.length === 0 && (
                        <Text ta="center" c="dimmed" mt="xl">No resources found.</Text>
                    )}
                </div>
            </Container>

            <Modal opened={opened} onClose={close} title="Upload Resource">
                <TextInput
                    label="Title"
                    placeholder="e.g., Data Structures Notes Unit 1"
                    required
                    mb="md"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                />
                <Group grow mb="md">
                    <Select
                        label="Type"
                        data={['PYQ', 'NOTES', 'LINK', 'OTHER']}
                        required
                        value={newResource.type}
                        onChange={(val) => setNewResource({ ...newResource, type: val as any })}
                    />
                    <Select
                        label="Branch"
                        data={['CSE', 'ECE', 'ME', 'CE', 'EE']}
                        required
                        value={newResource.branch}
                        onChange={(val) => setNewResource({ ...newResource, branch: val as any })}
                    />
                </Group>
                <TextInput
                    label="Course Code"
                    placeholder="e.g., CS201"
                    mb="md"
                    value={newResource.courseCode}
                    onChange={(e) => setNewResource({ ...newResource, courseCode: e.target.value })}
                />
                <TextInput
                    label="Link URL"
                    placeholder="https://drive.google.com/..."
                    required
                    mb="md"
                    value={newResource.linkUrl}
                    onChange={(e) => setNewResource({ ...newResource, linkUrl: e.target.value })}
                />
                <Textarea
                    label="Description"
                    placeholder="Brief description..."
                    mb="xl"
                    minRows={3}
                    value={newResource.description}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                />
                <Button fullWidth onClick={handleSubmit}>Upload</Button>
            </Modal>
        </>
    );
}
