import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import DiscussionThread from '@/models/DiscussionThread';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');

        let query: any = {};
        if (category) query.category = category;

        const threads = await DiscussionThread.find(query)
            .populate('authorId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json({ threads });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const thread = await DiscussionThread.create(body);
        return NextResponse.json({ thread }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
