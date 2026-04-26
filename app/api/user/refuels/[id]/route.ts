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
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 });
    }

    const recharge = await prisma.recharge.findFirst({
      where: {
        id: parseInt(id),
        utilisateurId: payload.userId,
      },
      include: {
        vehicule: true,
        medias: true,
      },
    });

    if (!recharge) {
      return NextResponse.json({ success: false, error: 'Recharge non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: recharge.id,
        vehiculeId: recharge.vehiculeId,
        vehicule: {
          id: recharge.vehicule.id,
          immatriculation: recharge.vehicule.immatriculation,
          marque: recharge.vehicule.marque,
          modele: recharge.vehicule.modele,
        },
        dateHeure: recharge.dateHeure.toISOString(),
        quantiteLitres: recharge.quantiteLitres,
        montant: recharge.montant,
        prixUnitaire: recharge.prixUnitaire,
        kmActuel: recharge.kmActuel,
        kmPrecedent: recharge.kmPrecedent,
        distanceParcourue: recharge.distanceParcourue,
        consoCalculee: recharge.consoCalculee,
        ecartConstructeur: recharge.ecartConstructeur,
        coutAuKm: recharge.coutAuKm,
        pleinComplet: recharge.pleinComplet,
        notes: recharge.notes,
        statutSync: recharge.statutSync,
        createdAt: recharge.createdAt.toISOString(),
        photos: recharge.medias.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
        })),
      },
    });
  } catch (error) {
    console.error('GET refuel error:', error);
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
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 });
    }

    const existing = await prisma.recharge.findFirst({
      where: {
        id: parseInt(id),
        utilisateurId: payload.userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Recharge non trouvée' }, { status: 404 });
    }

    const body = await request.json();
    const { dateHeure, quantiteLitres, montant, kmActuel, pleinComplet, notes } = body;

    const updateData: Record<string, unknown> = {};
    if (dateHeure !== undefined) updateData.dateHeure = new Date(dateHeure);
    if (quantiteLitres !== undefined) updateData.quantiteLitres = quantiteLitres;
    if (montant !== undefined) updateData.montant = montant;
    if (kmActuel !== undefined) updateData.kmActuel = kmActuel;
    if (pleinComplet !== undefined) updateData.pleinComplet = pleinComplet;
    if (notes !== undefined) updateData.notes = notes;

    if (quantiteLitres !== undefined && montant !== undefined) {
      updateData.prixUnitaire = montant / quantiteLitres;
    }

    const recharge = await prisma.recharge.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        vehicule: true,
        medias: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: recharge.id,
        vehiculeId: recharge.vehiculeId,
        vehicule: {
          id: recharge.vehicule.id,
          immatriculation: recharge.vehicule.immatriculation,
          marque: recharge.vehicule.marque,
          modele: recharge.vehicule.modele,
        },
        dateHeure: recharge.dateHeure.toISOString(),
        quantiteLitres: recharge.quantiteLitres,
        montant: recharge.montant,
        prixUnitaire: recharge.prixUnitaire,
        kmActuel: recharge.kmActuel,
        kmPrecedent: recharge.kmPrecedent,
        distanceParcourue: recharge.distanceParcourue,
        consoCalculee: recharge.consoCalculee,
        ecartConstructeur: recharge.ecartConstructeur,
        coutAuKm: recharge.coutAuKm,
        pleinComplet: recharge.pleinComplet,
        notes: recharge.notes,
        statutSync: recharge.statutSync,
        createdAt: recharge.createdAt.toISOString(),
        photos: recharge.medias.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
        })),
      },
    });
  } catch (error) {
    console.error('PUT refuel error:', error);
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
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 });
    }

    const existing = await prisma.recharge.findFirst({
      where: {
        id: parseInt(id),
        utilisateurId: payload.userId,
      },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Recharge non trouvée' }, { status: 404 });
    }

    await prisma.recharge.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE refuel error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}