import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillListing from '@/models/SkillListing';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        let query: any = { status: 'OPEN' };

        if (type) query.type = type;
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
            ];
        }

        const skills = await SkillListing.find(query).populate('userId', 'name email branch year').sort({ createdAt: -1 });
        return NextResponse.json({ skills });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        // In a real app, we would verify the user from the session/token here.
        // For this prototype, we'll assume the client sends the correct userId or we'd use a middleware.
        // To keep it simple and fast, we will trust the client-sent userId for now, 
        // BUT strictly we should verify the Firebase token. 
        // Let's implement basic token verification later if needed.

        const skill = await SkillListing.create(body);
        return NextResponse.json({ skill }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
