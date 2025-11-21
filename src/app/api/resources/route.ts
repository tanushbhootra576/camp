import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';
import User from '@/models/User';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');
        const branch = searchParams.get('branch');
        const search = searchParams.get('search');
        const uploaderId = searchParams.get('uploaderId');

        let query: any = {};

        if (type) query.type = type;
        if (branch) query.branch = branch;
        if (uploaderId && /^[a-fA-F0-9]{24}$/.test(uploaderId)) query.uploaderId = uploaderId;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { courseCode: { $regex: search, $options: 'i' } },
            ];
        }

        const resources = await Resource.find(query).populate('uploaderId', 'name').sort({ createdAt: -1 }).lean();
        return NextResponse.json({ resources });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await dbConnect();
        const body = await req.json();
        // Again, assuming client sends valid userId for prototype speed.

        const resource = await Resource.create(body);
        return NextResponse.json({ resource }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
