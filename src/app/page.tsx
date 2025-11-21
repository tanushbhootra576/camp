'use client';

import Link from 'next/link';
import React from 'react';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/components/AuthProvider';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  SimpleGrid,
  Card,
  ThemeIcon,
  rem,
  Stack,
  Badge,
  Grid,
  Center,
} from '@mantine/core';
import {
  IconSchool,
  IconBooks,
  IconUsers,
  IconTrophy,
  IconArrowRight,
  IconRocket,
  IconMessage,
  IconBolt,
  IconNotes,
} from '@tabler/icons-react';
import classes from './page.module.css';

interface StatsData {
  users: number;
  resources: number;
  projects: number;
  discussions: number;
}

export default function Home() {
  const { user } = useAuth();
  const [stats, setStats] = React.useState<StatsData | null>(null);
  const [statsError, setStatsError] = React.useState<string | null>(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || err.error || 'Failed stats');
        }
        const data = await res.json();
        if (mounted) setStats(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        if (mounted) setStatsError(msg);
      }
    })();
    return () => { mounted = false; };
  }, []);
  return (
    <>
      <Navbar />
      <section className={classes.hero}>
        <div className={classes.spotlight} />
        <div className={classes.glow} />
        <Container size="lg">
          <Center>
            <Stack align="center" gap="xl" ta="center">
          
<br /><br />
              <Title order={1} className={classes.headline}>
                Build, Learn and Shine with
                <Text span variant="gradient" gradient={{ from: 'violet', to: 'blue' }} inherit> CollegeConnect</Text>
              </Title>

              <Text size="lg" c="dimmed" maw={680}>
                Your campus hub for projects, resources, discussions, events and peer-to-peer skill sharing.
              </Text>

              <Group>
                {!user ? (
                  <Button
                    component={Link}
                    href="/signup"
                    size="lg"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'blue' }}
                    rightSection={<IconArrowRight size={18} />}
                  >
                    Get Started
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href="/profile"
                    size="lg"
                    radius="xl"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'blue' }}
                    rightSection={<IconArrowRight size={18} />}
                  >
                    Go to Profile
                  </Button>
                )}
                <Button component={Link} href="/skills" size="lg" radius="xl" variant="default">
                  Browse Skills
                </Button>
              </Group>

              <Group gap="xl" className={classes.stats}>
                <Stat value={formatStat(stats?.users, '1,200+')} label="Students" />
                <Stat value={formatStat(stats?.resources, '350+')} label="Resources" />
                <Stat value={formatStat(stats?.projects, '90+')} label="Active Projects" />
              </Group>
              {statsError && (
                <Text size="xs" c="red" mt={-8}>Stats unavailable: {statsError}</Text>
              )}
            </Stack>
          </Center>
        </Container>
      </section>

      {/* Features */}
      <section className={classes.section}>
        <Container size="lg" >
          <SectionHeader title="Everything to level-up" subtitle="All-in-one campus platform" />
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing={24} mt="lg">
            <Feature
              icon={<IconSchool style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Skill Sharing"
              description="Offer your expertise or get help in coding, design, arts and more."
              color="blue"
              href="/skills"
            />
            <Feature
              icon={<IconBooks style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Study Resources"
              description="Notes, previous papers and curated references from seniors."
              color="teal"
              href="/resources"
            />
            <Feature
              icon={<IconUsers style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Discussions"
              description="Ask questions, brainstorm ideas and grow together."
              color="grape"
              href="/discussions"
            />
            <Feature
              icon={<IconTrophy style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Events & Contests"
              description="Hackathons, quizzes and opportunities across campus."
              color="orange"
              href="/events"
            />
            <Feature
              icon={<IconNotes style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Quizzes"
              description="Challenge yourself and track your progress."
              color="cyan"
              href="/quizzes"
            />
            <Feature
              icon={<IconBolt style={{ width: rem(28), height: rem(28) }} stroke={2} />}
              title="Projects"
              description="Find teammates, build cool stuff and showcase work."
              color="yellow"
              href="/projects"
            />
          </SimpleGrid>
        </Container>
      </section>

      {/* Highlight Cards */}
      <section className={classes.sectionAlt}>
        <Container size="lg" >
          <SectionHeader title="Jump in now" subtitle="Popular destinations" />
          <Grid mt="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <HighlightCard
                title="Start a discussion"
                description="Get quick answers, feedback and connect with peers."
                badge="Community"
                href="/discussions"
                icon={<IconMessage size={18} />}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <HighlightCard
                title="Share a resource"
                description="Help juniors by sharing notes and references."
                badge="Academics"
                href="/resources"
                icon={<IconBooks size={18} />}
              />
            </Grid.Col>
          </Grid>
        </Container>
      </section>

      {/* CTA */}
      <section className={classes.ctaWrap}>
        <Container size="lg">
          <Card className={classes.cta} radius="lg" p="xl" withBorder>
            <Group justify="space-between" align="center" wrap="wrap">
              <div>
                <Title order={3}>Ready to make your mark?</Title>
                <Text c="dimmed">Create your profile and join the college builder community today.</Text>
              </div>
              <Group>
                {!user ? (
                  <>
                    <Button component={Link} href="/signup" radius="xl" size="md" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
                      Create account
                    </Button>
                    <Button component={Link} href="/login" radius="xl" size="md" variant="default">
                      I already have one
                    </Button>
                  </>
                ) : (
                  <Button component={Link} href="/profile" radius="xl" size="md" variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>
                    Go to Profile
                  </Button>
                )}
              </Group>
            </Group>
          </Card>
        </Container>
      </section>
    </>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Stack gap={4} align="center" ta="center">
      {subtitle && (
        <Badge variant="light" color="gray" size="sm">{subtitle}</Badge>
      )}
      <Title order={2}>{title}</Title>
    </Stack>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Stack gap={4} align="center">
      <Title order={2}>{value}</Title>
      <Text c="dimmed" size="sm">{label}</Text>
    </Stack>
  );
}

function formatStat(actual: number | undefined, fallback: string): string {
  if (typeof actual === 'number') {
    if (actual >= 1000) {
      const rounded = (actual / 1000).toFixed(actual % 1000 === 0 ? 0 : 1);
      return `${rounded}k+`;
    }
    return `${actual}+`;
  }
  return fallback;
}

function Feature({ icon, title, description, color, href }: { icon: React.ReactNode; title: string; description: string; color: string; href: string }) {
  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group align="flex-start" gap="md">
        <ThemeIcon size={44} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
        <div>
          <Text size="lg" fw={700}>{title}</Text>
          <Text size="sm" c="dimmed" mt={4}>{description}</Text>
          <Button component={Link} href={href} variant="subtle" mt="sm" rightSection={<IconArrowRight size={16} />}>Explore</Button>
        </div>
      </Group>
    </Card>
  );
}

function HighlightCard({ title, description, badge, href, icon }: { title: string; description: string; badge: string; href: string; icon: React.ReactNode }) {
  return (
    <Card withBorder padding="lg" radius="lg" className={classes.highlight}>
      <Group justify="space-between" align="flex-start">
        <div>
          <Badge variant="gradient" gradient={{ from: 'violet', to: 'blue' }}>{badge}</Badge>
          <Title order={3} mt={8}>{title}</Title>
          <Text c="dimmed" mt={6}>{description}</Text>
        </div>
        <ThemeIcon size={44} radius="md" variant="light" color="violet">{icon}</ThemeIcon>
      </Group>
      <Button component={Link} href={href} mt="md" variant="light" rightSection={<IconArrowRight size={16} />}>Go</Button>
    </Card>
  );
}
