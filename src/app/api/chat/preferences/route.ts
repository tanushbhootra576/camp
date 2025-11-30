import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Message from '@/models/Message';

const MAX_PINNED = 3;

type Action = 'pin' | 'unpin' | 'delete';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { userId, targetId, action } = body as { userId?: string; targetId?: string; action?: Action };

        if (!userId || !targetId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(targetId)) {
            return NextResponse.json({ error: 'Invalid user or target id' }, { status: 400 });
        }

        if (userId === targetId) {
            return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        switch (action) {
            case 'pin': {
                const pinnedList = (user.pinnedDms || []).map(String);
                if (pinnedList.includes(targetId)) {
                    return NextResponse.json({ success: true, message: 'Already pinned' }, { status: 200 });
                }
                if (pinnedList.length >= MAX_PINNED) {
                    return NextResponse.json({ error: `You can pin up to ${MAX_PINNED} conversations.` }, { status: 400 });
                }
                pinnedList.push(targetId);
                user.pinnedDms = pinnedList;
                await user.save();
                return NextResponse.json({ success: true, message: 'Conversation pinned' }, { status: 200 });
            }
            case 'unpin': {
                const pinnedList = (user.pinnedDms || []).map(String).filter(id => id !== targetId);
                user.pinnedDms = pinnedList;
                await user.save();
                return NextResponse.json({ success: true, message: 'Conversation unpinned' }, { status: 200 });
            }
            case 'delete': {
                const userObjectId = new Types.ObjectId(userId);
                const targetObjectId = new Types.ObjectId(targetId);
                await Message.deleteMany({
                    type: 'dm',
                    $or: [
                        { senderId: userObjectId, recipientId: targetObjectId },
                        { senderId: targetObjectId, recipientId: userObjectId }
                    ]
                });
                await User.findByIdAndUpdate(userId, {
                    $pull: { pinnedDms: targetId },
                    $unset: { [`dmLastRead.${targetId}`]: '' }
                });
                return NextResponse.json({ success: true, message: 'Conversation deleted' }, { status: 200 });
            }
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Chat preference error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
