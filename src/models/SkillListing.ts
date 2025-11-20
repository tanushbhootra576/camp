import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISkillListing extends Document {
    userId: mongoose.Types.ObjectId;
    type: 'OFFER' | 'REQUEST';
    title: string;
    description: string;
    tags: string[];
    category: 'ACADEMIC' | 'NON_ACADEMIC';
    status: 'OPEN' | 'CLOSED';
    createdAt: Date;
}

const SkillListingSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['OFFER', 'REQUEST'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tags: [{ type: String }],
    category: { type: String, enum: ['ACADEMIC', 'NON_ACADEMIC'], required: true },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    createdAt: { type: Date, default: Date.now },
});

const SkillListing: Model<ISkillListing> = mongoose.models.SkillListing || mongoose.model<ISkillListing>('SkillListing', SkillListingSchema);

export default SkillListing;
