'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Container, Title, Button, Group, Card, Text, SimpleGrid, TextInput, Modal, Textarea, LoadingOverlay, Radio, Stack } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useAuth } from '@/components/AuthProvider';
import { IconPlus, IconBrain } from '@tabler/icons-react';

interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: {
        questionText: string;
        options: string[];
        correctOptionIndex: number;
    }[];
}

export default function QuizzesPage() {
    const { user, profile } = useAuth();
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);

    const [opened, { open, close }] = useDisclosure(false);

    // Form state
    const [newQuiz, setNewQuiz] = useState({
        title: '',
        description: '',
        questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }],
    });

    const fetchQuizzes = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/quizzes');
            const data = await res.json();
            setQuizzes(data.quizzes);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const handleAddQuestion = () => {
        setNewQuiz({
            ...newQuiz,
            questions: [...newQuiz.questions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }],
        });
    };

    const handleQuestionChange = (index: number, field: string, value: any) => {
        const updatedQuestions = [...newQuiz.questions];
        updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
        setNewQuiz({ ...newQuiz, questions: updatedQuestions });
    };

    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const updatedQuestions = [...newQuiz.questions];
        updatedQuestions[qIndex].options[oIndex] = value;
        setNewQuiz({ ...newQuiz, questions: updatedQuestions });
    };

    const handleSubmit = async () => {
        if (!profile) return;

        try {
            await fetch('/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newQuiz,
                    createdBy: profile._id,
                }),
            });
            close();
            fetchQuizzes();
            setNewQuiz({ title: '', description: '', questions: [{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }] });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <Navbar />
            <Container size="lg" py="xl">
                <Group justify="space-between" mb="xl">
                    <Title>Quizzes & Contests</Title>
                    {user && profile?.role === 'admin' && (
                        <Button leftSection={<IconPlus size={14} />} onClick={open}>
                            Create Quiz
                        </Button>
                    )}
                </Group>

                <div style={{ position: 'relative', minHeight: 200 }}>
                    <LoadingOverlay visible={loading} />
                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                        {quizzes.map((quiz) => (
                            <Card key={quiz._id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Group mb="xs">
                                    <IconBrain size={24} color="purple" />
                                    <Text fw={500} size="lg">{quiz.title}</Text>
                                </Group>

                                <Text size="sm" c="dimmed" lineClamp={3}>
                                    {quiz.description}
                                </Text>

                                <Text size="xs" c="dimmed" mt="md">
                                    {quiz.questions.length} Questions
                                </Text>

                                <Button fullWidth mt="md" variant="light" color="purple">
                                    Attempt Quiz
                                </Button>
                            </Card>
                        ))}
                    </SimpleGrid>
                    {!loading && quizzes.length === 0 && (
                        <Text ta="center" c="dimmed" mt="xl">No quizzes available.</Text>
                    )}
                </div>
            </Container>

            <Modal opened={opened} onClose={close} title="Create Quiz" size="lg">
                <TextInput
                    label="Title"
                    required
                    mb="md"
                    value={newQuiz.title}
                    onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                />
                <Textarea
                    label="Description"
                    required
                    mb="xl"
                    value={newQuiz.description}
                    onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                />

                <Text fw={500} mb="md">Questions</Text>

                {newQuiz.questions.map((q, qIndex) => (
                    <Card key={qIndex} withBorder mb="md" p="sm">
                        <TextInput
                            placeholder={`Question ${qIndex + 1}`}
                            mb="sm"
                            value={q.questionText}
                            onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                        />
                        <SimpleGrid cols={2}>
                            {q.options.map((opt, oIndex) => (
                                <TextInput
                                    key={oIndex}
                                    placeholder={`Option ${oIndex + 1}`}
                                    value={opt}
                                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                />
                            ))}
                        </SimpleGrid>
                        <Radio.Group
                            label="Correct Option"
                            mt="sm"
                            value={q.correctOptionIndex.toString()}
                            onChange={(val) => handleQuestionChange(qIndex, 'correctOptionIndex', parseInt(val))}
                        >
                            <Group mt="xs">
                                <Radio value="0" label="1" />
                                <Radio value="1" label="2" />
                                <Radio value="2" label="3" />
                                <Radio value="3" label="4" />
                            </Group>
                        </Radio.Group>
                    </Card>
                ))}

                <Button variant="default" fullWidth mb="xl" onClick={handleAddQuestion}>
                    Add Question
                </Button>

                <Button fullWidth onClick={handleSubmit}>Create Quiz</Button>
            </Modal>
        </>
    );
}
