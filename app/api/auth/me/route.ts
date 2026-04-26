import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      );
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!utilisateur || !utilisateur.actif) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé ou désactivé' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        role: utilisateur.role.nom,
        actif: utilisateur.actif,
        derniereConnexion: utilisateur.derniereConnexion?.toISOString() || null,
        createdAt: utilisateur.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}