import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ utilisateurId: string; vehiculeId: string }> }
) {
  try {
    const { utilisateurId, vehiculeId } = await params;
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    await prisma.vehiculeUtilisateur.delete({
      where: {
        vehiculeId_utilisateurId: {
          vehiculeId: parseInt(vehiculeId),
          utilisateurId: parseInt(utilisateurId),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE assignment error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}