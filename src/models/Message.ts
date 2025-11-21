import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    content: string;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    type: 'universal' | 'branch' | 'year';
    branch?: string;
    year?: number;
    createdAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema({
    content: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    senderName: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['universal', 'branch', 'year'],
        required: true,
    },
    branch: {
        type: String,
    },
    year: {
        type: Number,
    },
}, {
    timestamps: true,
});

// Delete the model if it exists to prevent hot-reload errors with schema changes
if (mongoose.models.Message) {
    delete mongoose.models.Message;
}

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
