// app/api/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { pendingRefuels } = body;

    // Cette API n'est pas utilisée car ton syncService appelle directement /api/user/refuels
    // Tu n'as probablement PAS besoin de cette API du tout !

    return NextResponse.json({ success: true, data: { successCount: 0, failedCount: 0 } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}