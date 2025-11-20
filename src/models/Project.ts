import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
    teamMembers: mongoose.Types.ObjectId[];
    title: string;
    description: string;
    techStack: string[];
    demoLink?: string;
    repoLink?: string;
    images: string[];
    isFeatured: boolean;
    createdAt: Date;
}

const ProjectSchema: Schema = new Schema({
    teamMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    title: { type: String, required: true },
    description: { type: String, required: true },
    techStack: [{ type: String }],
    demoLink: { type: String },
    repoLink: { type: String },
    images: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
