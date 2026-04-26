import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';
import { hashPassword, generateRandomPassword } from '@/lib/auth/password';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const motDePasseGenere = generateRandomPassword(10);
    const motDePasseHash = await hashPassword(motDePasseGenere);

    await prisma.utilisateur.update({
      where: { id: parseInt(id) },
      data: { motDePasse: motDePasseHash },
    });

    return NextResponse.json({
      success: true,
      data: { motDePasse: motDePasseGenere },
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}