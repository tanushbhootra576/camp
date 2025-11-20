'use client';

import { Navbar } from '@/components/Navbar';
import { Container, Title, Text, Button, Group, SimpleGrid, Card, ThemeIcon, rem, Overlay, BackgroundImage, Box, Stack } from '@mantine/core';
import { IconSchool, IconBooks, IconUsers, IconTrophy, IconArrowRight, IconRocket } from '@tabler/icons-react';
import classes from './page.module.css'; // We will need to create this if we want custom CSS, but for now inline styles or global css might be easier or we can use Mantine's sx/style props.

// Let's use standard Mantine components for now to avoid creating a new CSS file immediately if not needed, 
// or we can add a simple style block.

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <Box style={{ position: 'relative', overflow: 'hidden', paddingBottom: 80, paddingTop: 80 }}>
        <Container size="lg">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Group justify="center">
              <Stack align="center" gap="xl">
                <ThemeIcon size={60} radius="xl" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
                  <IconRocket style={{ width: rem(32), height: rem(32) }} stroke={2} />
                </ThemeIcon>

                <Title
                  order={1}
                  style={{
                    fontSize: rem(62),
                    fontWeight: 900,
                    lineHeight: 1.1,
                    textAlign: 'center',
                  }}
                >
                  Welcome to <Text span variant="gradient" gradient={{ from: 'violet', to: 'blue' }} inherit>CollegeConnect</Text>
                </Title>

                <Text size="xl" c="dimmed" ta="center" maw={600}>
                  The ultimate platform for students to share skills, access resources, and collaborate on projects.
                  Join your campus community today and start building your future.
                </Text>

                <Group>
                  <Button size="xl" radius="xl" variant="gradient" gradient={{ from: 'violet', to: 'blue' }} rightSection={<IconArrowRight size={18} />}>
                    Get Started
                  </Button>
                  <Button size="xl" radius="xl" variant="default">
                    Browse Projects
                  </Button>
                </Group>
              </Stack>
            </Group>
          </div>
        </Container>
      </Box>

      {/* Features Section */}
      <Container size="lg" py="xl">
        <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} spacing={30}>
          <Feature
            icon={<IconSchool style={{ width: rem(30), height: rem(30) }} stroke={2} />}
            title="Skill Sharing"
            description="Offer your expertise or find someone to help you with photography, coding, or music."
            color="blue"
          />
          <Feature
            icon={<IconBooks style={{ width: rem(30), height: rem(30) }} stroke={2} />}
            title="Academic Resources"
            description="Access previous year question papers, notes, and study materials shared by seniors."
            color="teal"
          />
          <Feature
            icon={<IconUsers style={{ width: rem(30), height: rem(30) }} stroke={2} />}
            title="Community"
            description="Join discussion groups, find project teammates, and connect with alumni."
            color="grape"
          />
          <Feature
            icon={<IconTrophy style={{ width: rem(30), height: rem(30) }} stroke={2} />}
            title="Events & Contests"
            description="Participate in hackathons, quizzes, and college fests. Win prizes and recognition."
            color="orange"
          />
        </SimpleGrid>
      </Container>
    </>
  );
}

function Feature({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string, color: string }) {
  return (
    <Card shadow="sm" padding="xl" radius="md" withBorder style={{ height: '100%' }}>
      <ThemeIcon size={50} radius="md" variant="light" color={color}>
        {icon}
      </ThemeIcon>
      <Text size="lg" fw={700} mt="md" mb="xs">
        {title}
      </Text>
      <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
        {description}
      </Text>
    </Card>
  );
}
