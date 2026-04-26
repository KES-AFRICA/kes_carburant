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

    const vehicule = await prisma.vehicule.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vehicule) {
      return NextResponse.json({ success: false, error: 'Véhicule non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: vehicule.id,
        immatriculation: vehicule.immatriculation,
        marque: vehicule.marque,
        modele: vehicule.modele,
        annee: vehicule.annee,
        typeCarburant: vehicule.typeCarburant,
        consommationTheorique: vehicule.consommationTheorique,
        capaciteReservoir: vehicule.capaciteReservoir,
        photoUrl: vehicule.photoUrl,
        statut: vehicule.statut,
        createdAt: vehicule.createdAt.toISOString(),
        updatedAt: vehicule.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('GET vehicle error:', error);
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
    const {
      immatriculation,
      marque,
      modele,
      annee,
      typeCarburant,
      consommationTheorique,
      capaciteReservoir,
      photoUrl,
      statut,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (immatriculation !== undefined) updateData.immatriculation = immatriculation.toUpperCase();
    if (marque !== undefined) updateData.marque = marque;
    if (modele !== undefined) updateData.modele = modele;
    if (annee !== undefined) updateData.annee = annee;
    if (typeCarburant !== undefined) updateData.typeCarburant = typeCarburant;
    if (consommationTheorique !== undefined) updateData.consommationTheorique = consommationTheorique;
    if (capaciteReservoir !== undefined) updateData.capaciteReservoir = capaciteReservoir;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (statut !== undefined) updateData.statut = statut;

    const vehicule = await prisma.vehicule.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: vehicule.id,
        immatriculation: vehicule.immatriculation,
        marque: vehicule.marque,
        modele: vehicule.modele,
        annee: vehicule.annee,
        typeCarburant: vehicule.typeCarburant,
        consommationTheorique: vehicule.consommationTheorique,
        capaciteReservoir: vehicule.capaciteReservoir,
        photoUrl: vehicule.photoUrl,
        statut: vehicule.statut,
        createdAt: vehicule.createdAt.toISOString(),
        updatedAt: vehicule.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('PUT vehicle error:', error);
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

    await prisma.vehicule.update({
      where: { id: parseInt(id) },
      data: { statut: 'ARCHIVE' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE vehicle error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}