import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Quiz from '@/models/Quiz';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const quizzes = await Quiz.find().sort({ createdAt: -1 });
        return NextResponse.json({ quizzes });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();

        // RBAC Check
        const user = await User.findById(body.createdBy);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        const quiz = await Quiz.create(body);
        return NextResponse.json({ quiz }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
