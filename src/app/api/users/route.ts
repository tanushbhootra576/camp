import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const { firebaseUid, email, name } = body;

        if (!firebaseUid || !email || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        let user = await User.findOne({ firebaseUid });

        if (!user) {
            user = await User.create({
                firebaseUid,
                email,
                name,
                role: 'student', // Default role
                skills: [],
                interests: [],
            });
        }

        return NextResponse.json({ user }, { status: 201 });
    } catch (error) {
        console.error('Error syncing user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
