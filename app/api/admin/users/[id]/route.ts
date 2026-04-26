import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(
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

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: parseInt(id) },
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
        actif: utilisateur.actif,
        derniereConnexion: utilisateur.derniereConnexion?.toISOString() || null,
        createdAt: utilisateur.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { nom, prenom, email, telephone, actif, role } = body;

    const updateData: Record<string, unknown> = {};
    if (nom !== undefined) updateData.nom = nom;
    if (prenom !== undefined) updateData.prenom = prenom;
    if (email !== undefined) updateData.email = email;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (actif !== undefined) updateData.actif = actif;

    if (role !== undefined) {
      const roleDb = await prisma.role.findUnique({
        where: { nom: role === 'ADMIN' ? 'ADMIN' : 'USER' },
      });
      if (roleDb) updateData.roleId = roleDb.id;
    }

    const utilisateur = await prisma.utilisateur.update({
      where: { id: parseInt(id) },
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
        actif: utilisateur.actif,
        derniereConnexion: utilisateur.derniereConnexion?.toISOString() || null,
        createdAt: utilisateur.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('PUT user error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
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

    await prisma.utilisateur.update({
      where: { id: parseInt(id) },
      data: { actif: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}