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

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!utilisateur) {
      return NextResponse.json({ success: false, error: 'Utilisateur non trouvé' }, { status: 404 });
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
        createdAt: utilisateur.createdAt.toISOString(),
        derniereConnexion: utilisateur.derniereConnexion?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('GET profile error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const { nom, prenom, email, telephone } = body;

    const updateData: Record<string, unknown> = {};
    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (email !== undefined) updateData.email = email;
    if (telephone !== undefined) updateData.telephone = telephone;

    const utilisateur = await prisma.utilisateur.update({
      where: { id: payload.userId },
      data: updateData,
      include: { role: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        role: utilisateur.role.nom,
        createdAt: utilisateur.createdAt.toISOString(),
        derniereConnexion: utilisateur.derniereConnexion?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('PUT profile error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}