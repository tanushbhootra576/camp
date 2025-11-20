import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IResource extends Document {
    uploaderId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    type: 'PYQ' | 'NOTES' | 'LINK' | 'OTHER';
    courseCode?: string;
    branch?: string;
    semester?: number;
    fileUrl?: string;
    linkUrl?: string;
    downloads: number;
    createdAt: Date;
}

const ResourceSchema: Schema = new Schema({
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ['PYQ', 'NOTES', 'LINK', 'OTHER'], required: true },
    courseCode: { type: String },
    branch: { type: String },
    semester: { type: Number },
    fileUrl: { type: String },
    linkUrl: { type: String },
    downloads: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const Resource: Model<IResource> = mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);

export default Resource;
