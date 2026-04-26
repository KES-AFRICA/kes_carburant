import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 });
    }

    const assignments = await prisma.vehiculeUtilisateur.findMany({
      where: { utilisateurId: payload.userId },
      include: {
        vehicule: true,
      },
    });

    const vehicles = assignments.map((a) => ({
      id: a.vehicule.id,
      immatriculation: a.vehicule.immatriculation,
      marque: a.vehicule.marque,
      modele: a.vehicule.modele,
      consommationTheorique: a.vehicule.consommationTheorique,
    }));

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('GET vehicles error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}