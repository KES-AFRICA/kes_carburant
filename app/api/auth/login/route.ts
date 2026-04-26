import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, motDePasse } = body;

    if (!email || !motDePasse) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!utilisateur) {
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    if (!utilisateur.actif) {
      return NextResponse.json(
        { success: false, error: 'Compte désactivé. Contactez l\'administrateur' },
        { status: 401 }
      );
    }

    const motDePasseValide = await verifyPassword(motDePasse, utilisateur.motDePasse);

    if (!motDePasseValide) {
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    await prisma.utilisateur.update({
      where: { id: utilisateur.id },
      data: { derniereConnexion: new Date() },
    });

    const token = signToken({
      userId: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role.nom,
    });

    const response = NextResponse.json({
      success: true,
      user: {
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
      token,
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}