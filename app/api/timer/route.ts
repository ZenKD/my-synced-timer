import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const redis = Redis.fromEnv();

// Fetch current shared timers
export async function GET() {
  const timers = await redis.get('shared-timers') || [];
  return NextResponse.json(timers);
}

// Update shared timers (Start, Pause, Delete)
export async function POST(req: Request) {
  const body = await req.json();
  await redis.set('shared-timers', body.timers);
  return NextResponse.json({ success: true });
}