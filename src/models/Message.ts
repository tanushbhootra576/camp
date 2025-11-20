import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMessage extends Document {
    content: string;
    senderId: mongoose.Types.ObjectId;
    senderName: string;
    type: 'universal' | 'branch';
    branch?: string;
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
        enum: ['universal', 'branch'],
        required: true,
    },
    branch: {
        type: String,
        required: function (this: IMessage) {
            return this.type === 'branch';
        },
    },
}, {
    timestamps: true,
});

const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
