import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    content: string;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    type: 'universal' | 'branch' | 'year';
    branch?: string;
    year?: number;
    replyTo?: {
        _id: mongoose.Types.ObjectId;
        content: string;
        senderName: string;
    };
    reactions: {
        userId: mongoose.Types.ObjectId;
        emoji: string;
    }[];
    sticker?: string;
    createdAt: Date;
}

const MessageSchema: Schema<IMessage> = new Schema({
    content: {
        type: String,
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
    replyTo: {
        _id: { type: Schema.Types.ObjectId, ref: 'Message' },
        content: String,
        senderName: String
    },
    reactions: [{
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        emoji: String
    }],
    sticker: String
}, {
    timestamps: true,
});

// Delete the model if it exists to prevent hot-reload errors with schema changes
if (mongoose.models.Message) {
    delete mongoose.models.Message;
}

const Message: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
