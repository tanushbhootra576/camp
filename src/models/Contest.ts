import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContest extends Document {
    title: string;
    problemStatement: string;
    testCases: { input: string; output: string }[];
    startDate: Date;
    endDate: Date;
}

const ContestSchema: Schema = new Schema({
    title: { type: String, required: true },
    problemStatement: { type: String, required: true },
    testCases: [{
        input: { type: String, required: true },
        output: { type: String, required: true },
    }],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
});

const Contest: Model<IContest> = mongoose.models.Contest || mongoose.model<IContest>('Contest', ContestSchema);

export default Contest;
