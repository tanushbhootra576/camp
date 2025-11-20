import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
    organizerId: mongoose.Types.ObjectId;
    title: string;
    description: string;
    date: Date;
    time: string;
    venue: string;
    club: string;
    contactNumber: string;
    entryFee: string;
    type: 'WORKSHOP' | 'FEST' | 'TALK' | 'HACKATHON';
    registrationLink?: string;
    createdAt: Date;
}

const EventSchema: Schema = new Schema({
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true },
    club: { type: String, required: true },
    contactNumber: { type: String, required: true },
    entryFee: { type: String, required: true },
    type: { type: String, enum: ['WORKSHOP', 'FEST', 'TALK', 'HACKATHON'], required: true },
    registrationLink: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
