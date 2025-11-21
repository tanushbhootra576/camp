import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SkillListing from '@/models/SkillListing';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const body = await req.json();

        // In a real app, verify user ownership here
        const skill = await SkillListing.findByIdAndUpdate(
            id,
            { $set: body },
            { new: true }
        );

        if (!skill) {
            return NextResponse.json({ error: 'Skill listing not found' }, { status: 404 });
        }

        return NextResponse.json({ skill });
    } catch (error) {
        console.error('Error updating skill:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;

        // In a real app, verify user ownership here
        const skill = await SkillListing.findByIdAndDelete(id);

        if (!skill) {
            return NextResponse.json({ error: 'Skill listing not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Skill listing deleted successfully' });
    } catch (error) {
        console.error('Error deleting skill:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
