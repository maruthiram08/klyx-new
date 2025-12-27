import { NextResponse } from 'next/server';

const WORKER_URL = process.env.RENDER_WORKER_URL || 'https://klyx-worker.onrender.com';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('Triggering fundamentals sync...');

        const response = await fetch(`${WORKER_URL}/worker/sync-fundamentals`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        console.log('Sync response:', data);

        return NextResponse.json({
            success: true,
            message: 'Fundamentals sync triggered',
            workerResponse: data,
        });
    } catch (error: any) {
        console.error('Cron sync failed:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
