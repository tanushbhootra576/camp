import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
    try {
        await dbConnect();
        const { uid } = await params;
        const user = await User.findOne({ firebaseUid: uid });

        if (!user) {
            return NextResponse.json({ user: null }, { status: 200 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ uid: string }> }) {
    try {
        await dbConnect();
        const body = await req.json();
        const { uid } = await params;

        let user = await User.findOne({ firebaseUid: uid });

        if (user) {
            // Update existing user
            if (user.profileLocked) {
                // Prevent updating branch and year if locked
                delete body.branch;
                delete body.year;
            } else if (body.branch && body.year) {
                // Lock profile if branch and year are being set
                body.profileLocked = true;
            }

            delete body.firebaseUid;
            delete body.email; // Usually email is managed by Auth provider

            Object.assign(user, body);
            await user.save();
        } else {
            // Create new user
            if (!body.email) {
                return NextResponse.json({ error: 'Email is required for creating a profile' }, { status: 400 });
            }

            // Lock profile if branch and year are provided on creation
            if (body.branch && body.year) {
                body.profileLocked = true;
            }

            user = await User.create({
                ...body,
                firebaseUid: uid,
            });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.errors
        }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    try {
        await dbConnect();
        const { uid } = await params;
        console.log('Attempting to delete user with firebaseUid:', uid);

        const deletedUser = await User.findOneAndDelete({ firebaseUid: uid });
        console.log('Delete result:', deletedUser);

        if (!deletedUser) {
            console.log('User not found for deletion');
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
