import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const projects = await Project.find()
            .sort({ isFeatured: -1, createdAt: -1 })
            .populate('teamMembers', 'firebaseUid name email');
        return NextResponse.json({ projects });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        const project = await Project.create(body);
        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
