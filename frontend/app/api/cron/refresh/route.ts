import { NextResponse } from 'next/server';

// Render worker URL - update this after deploying to Render
const WORKER_URL = process.env.RENDER_WORKER_URL || 'https://klyx-worker.onrender.com';

export async function GET(request: Request) {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow if no CRON_SECRET is set (for testing)
        if (process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        console.log('Triggering daily price refresh...');

        const response = await fetch(`${WORKER_URL}/worker/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        console.log('Refresh response:', data);

        return NextResponse.json({
            success: true,
            message: 'Daily refresh triggered',
            workerResponse: data,
        });
    } catch (error: any) {
        console.error('Cron refresh failed:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
