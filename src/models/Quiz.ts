import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuiz extends Document {
    title: string;
    description: string;
    questions: {
        questionText: string;
        options: string[];
        correctOptionIndex: number;
    }[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
}

const QuizSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    questions: [{
        questionText: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctOptionIndex: { type: Number, required: true },
    }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
});

const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);

export default Quiz;
