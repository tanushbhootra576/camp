import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const branch = searchParams.get('branch');

        if (!type || (type === 'branch' && !branch)) {
            return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 });
        }

        const query: any = { type };
        if (type === 'branch') {
            query.branch = branch;
        }

        const messages = await Message.find(query)
            .sort({ createdAt: 1 }) // Oldest first
            .limit(100); // Limit to last 100 messages

        return NextResponse.json({ messages }, { status: 200 });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { content, senderId, type, branch } = body;

        if (!content || !senderId || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify sender exists and get name
        const sender = await User.findById(senderId);
        if (!sender) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify branch match if type is branch
        if (type === 'branch') {
            if (!branch) {
                return NextResponse.json({ error: 'Branch is required for branch chat' }, { status: 400 });
            }
            if (sender.branch !== branch) {
                return NextResponse.json({ error: 'You can only post in your own branch chat' }, { status: 403 });
            }
        }

        const message = await Message.create({
            content,
            senderId,
            senderName: sender.name,
            type,
            branch: type === 'branch' ? branch : undefined,
        });

        return NextResponse.json({ message }, { status: 201 });
    } catch (error) {
        console.error('Error creating message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
