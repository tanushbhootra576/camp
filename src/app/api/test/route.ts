import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
    try {
        await dbConnect();
        return NextResponse.json({ status: 'success', message: 'Connected to MongoDB' });
    } catch (error) {
        console.error('Database connection error:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to connect to MongoDB' }, { status: 500 });
    }
}
