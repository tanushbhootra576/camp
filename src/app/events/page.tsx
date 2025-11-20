'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Button, Group, Card, Badge, Text, SimpleGrid, TextInput, Select, Modal, Textarea, LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconCalendar, IconMapPin, IconPlus } from '@tabler/icons-react';

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    venue: string;
    club: string;
    contactNumber: string;
    entryFee: string;
    type: 'WORKSHOP' | 'FEST' | 'TALK' | 'HACKATHON';
    registrationLink?: string;
}

export default function EventsPage() {
    const { user, profile } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const [opened, { open, close }] = useDisclosure(false);

    // Form state
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        club: '',
        contactNumber: '',
        entryFee: 'Free',
        type: 'WORKSHOP',
        registrationLink: '',
    });

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/events');
            const data = await res.json();
            setEvents(data.events);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleSubmit = async () => {
        if (!profile) return;

        try {
            await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newEvent,
                    organizerId: profile._id,
                }),
            });
            close();
            fetchEvents();
            setNewEvent({
                title: '', description: '', date: '', time: '', venue: '',
                club: '', contactNumber: '', entryFee: 'Free',
                type: 'WORKSHOP', registrationLink: ''
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <Navbar />
            <Container size="lg" py="xl">
                <Group justify="space-between" mb="xl">
                    <Title>Upcoming Events</Title>
                    {user && profile?.role === 'admin' && (
                        <Button leftSection={<IconPlus size={14} />} onClick={open}>
                            Create Event
                        </Button>
                    )}
                </Group>

                <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={loading} />
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {events.map((event) => (
                            <Card key={event._id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Group justify="space-between" mb="xs">
                                    <Badge color="grape">{event.type}</Badge>
                                    <Badge variant="light" color={event.entryFee === 'Free' ? 'green' : 'red'}>
                                        {event.entryFee}
                                    </Badge>
                                </Group>

                                <Text fw={700} size="lg" mt="xs">{event.title}</Text>
                                <Text size="sm" c="dimmed" fw={500}>{event.club}</Text>

                                <Group gap="xs" mt="md">
                                    <IconCalendar size={16} color="gray" />
                                    <Text size="sm" c="dimmed">
                                        {new Date(event.date).toLocaleDateString()} at {event.time}
                                    </Text>
                                </Group>

                                <Group gap="xs" mt={4}>
                                    <IconMapPin size={16} color="gray" />
                                    <Text size="sm" c="dimmed">{event.venue}</Text>
                                </Group>

                                <Text size="sm" mt="md" lineClamp={3}>
                                    {event.description}
                                </Text>

                                <Text size="xs" c="dimmed" mt="md">
                                    Contact: {event.contactNumber}
                                </Text>

                                {event.registrationLink && (
                                    <Button
                                        component="a"
                                        href={event.registrationLink}
                                        target="_blank"
                                        fullWidth
                                        mt="md"
                                        variant="light"
                                    >
                                        Register
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </SimpleGrid>
                    {!loading && events.length === 0 && (
                        <Text ta="center" c="dimmed" mt="xl">No upcoming events.</Text>
                    )}
                </div>
            </Container>

            <Modal opened={opened} onClose={close} title="Create Event">
                <TextInput
                    label="Title"
                    required
                    mb="md"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
                <TextInput
                    label="Club / Organizer"
                    placeholder="e.g., Coding Club"
                    required
                    mb="md"
                    value={newEvent.club}
                    onChange={(e) => setNewEvent({ ...newEvent, club: e.target.value })}
                />
                <Select
                    label="Type"
                    data={['WORKSHOP', 'FEST', 'TALK', 'HACKATHON']}
                    required
                    mb="md"
                    value={newEvent.type}
                    onChange={(val) => setNewEvent({ ...newEvent, type: val as any })}
                />
                <SimpleGrid cols={2}>
                    <TextInput
                        label="Date"
                        type="date"
                        required
                        mb="md"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                    <TextInput
                        label="Time"
                        type="time"
                        required
                        mb="md"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                </SimpleGrid>
                <SimpleGrid cols={2}>
                    <TextInput
                        label="Venue"
                        required
                        mb="md"
                        value={newEvent.venue}
                        onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                    />
                    <TextInput
                        label="Entry Fee"
                        placeholder="Free or ₹100"
                        required
                        mb="md"
                        value={newEvent.entryFee}
                        onChange={(e) => setNewEvent({ ...newEvent, entryFee: e.target.value })}
                    />
                </SimpleGrid>
                <TextInput
                    label="Contact Number"
                    placeholder="+91 9876543210"
                    required
                    mb="md"
                    value={newEvent.contactNumber}
                    onChange={(e) => setNewEvent({ ...newEvent, contactNumber: e.target.value })}
                />
                <TextInput
                    label="Registration Link"
                    placeholder="https://..."
                    mb="md"
                    value={newEvent.registrationLink}
                    onChange={(e) => setNewEvent({ ...newEvent, registrationLink: e.target.value })}
                />
                <Textarea
                    label="Description"
                    required
                    mb="xl"
                    minRows={3}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                />
                <Button fullWidth onClick={handleSubmit}>Create Event</Button>
            </Modal>
        </>
    );
}
