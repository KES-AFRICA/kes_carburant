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
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const vehicules = await prisma.vehicule.findMany({
      where: { statut: 'ACTIF' },
      orderBy: { createdAt: 'desc' },
    });

    const vehicles = vehicules.map((v) => ({
      id: v.id,
      immatriculation: v.immatriculation,
      marque: v.marque,
      modele: v.modele,
      annee: v.annee,
      typeCarburant: v.typeCarburant,
      consommationTheorique: v.consommationTheorique,
      capaciteReservoir: v.capaciteReservoir,
      photoUrl: v.photoUrl,
      statut: v.statut,
      createdAt: v.createdAt.toISOString(),
      updatedAt: v.updatedAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: vehicles });
  } catch (error) {
    console.error('GET vehicles error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    } = body;

    if (!immatriculation || !marque || !modele || !annee || !typeCarburant) {
      return NextResponse.json(
        { success: false, error: 'Champs requis: immatriculation, marque, modele, annee, typeCarburant' },
        { status: 400 }
      );
    }

    const existant = await prisma.vehicule.findUnique({
      where: { immatriculation },
    });

    if (existant) {
      return NextResponse.json(
        { success: false, error: 'Immatriculation déjà utilisée' },
        { status: 400 }
      );
    }

    const vehicule = await prisma.vehicule.create({
      data: {
        immatriculation: immatriculation.toUpperCase(),
        marque,
        modele,
        annee,
        typeCarburant,
        consommationTheorique: consommationTheorique || null,
        capaciteReservoir: capaciteReservoir || null,
        photoUrl: photoUrl || null,
      },
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
    console.error('POST vehicle error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}