import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Message from '@/models/Message';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        
        // In a real app, we should verify that the requester is the author of the message.
        // Since we don't have session-based auth in the API route easily accessible without middleware,
        // we will assume the client is honest for this prototype, OR we could pass a userId in the body/query to verify.
        // Let's try to get userId from query to verify ownership.
        
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const message = await Message.findById(id);
        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 });
        }

        if (message.senderId.toString() !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await Message.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Message deleted' });
    } catch (error) {
        console.error('Error deleting message:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
