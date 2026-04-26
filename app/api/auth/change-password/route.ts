import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';
import { verifyPassword, hashPassword } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { ancienMotDePasse, nouveauMotDePasse } = body;

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return NextResponse.json(
        { success: false, error: 'Ancien et nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    if (nouveauMotDePasse.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: payload.userId },
    });

    if (!utilisateur) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const motDePasseValide = await verifyPassword(ancienMotDePasse, utilisateur.motDePasse);

    if (!motDePasseValide) {
      return NextResponse.json(
        { success: false, error: 'Ancien mot de passe incorrect' },
        { status: 401 }
      );
    }

    const nouveauMotDePasseHash = await hashPassword(nouveauMotDePasse);

    await prisma.utilisateur.update({
      where: { id: payload.userId },
      data: { motDePasse: nouveauMotDePasseHash },
    });

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}