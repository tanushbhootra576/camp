import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Project from '@/models/Project';
import DiscussionThread from '@/models/DiscussionThread';

export async function GET() {
  try {
    await dbConnect();
  } catch (e: any) {
    return NextResponse.json({ error: 'db connection failed', detail: e?.message }, { status: 500 });
  }
  try {
    // Run counts in parallel
    const [users, resources, projects, discussions] = await Promise.all([
      User.countDocuments(),
      Resource.countDocuments(),
      Project.countDocuments(),
      DiscussionThread.countDocuments(),
    ]);

    return NextResponse.json({ users, resources, projects, discussions });
  } catch (e: any) {
    return NextResponse.json({ error: 'stats query failed', detail: e?.message }, { status: 500 });
  }
}
