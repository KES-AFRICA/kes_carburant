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

    const recharge = await prisma.recharge.findUnique({
      where: { id: parseInt(id) },
      include: {
        vehicule: true,
        utilisateur: true,
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
        vehiculeName: `${recharge.vehicule.marque} ${recharge.vehicule.modele}`,
        vehiculeImmatriculation: recharge.vehicule.immatriculation,
        utilisateurId: recharge.utilisateurId,
        utilisateurName: `${recharge.utilisateur.prenom} ${recharge.utilisateur.nom}`,
        utilisateurEmail: recharge.utilisateur.email,
        dateHeure: recharge.dateHeure.toISOString(),
        quantiteLitres: recharge.quantiteLitres,
        montant: recharge.montant,
        prixUnitaire: recharge.prixUnitaire,
        kmActuel: recharge.kmActuel,
        kmPrecedent: recharge.kmPrecedent,
        distanceParcourue: recharge.distanceParcourue,
        consoCalculee: recharge.consoCalculee,
        coutAuKm: recharge.coutAuKm,
        pleinComplet: recharge.pleinComplet,
        notes: recharge.notes,
        createdAt: recharge.createdAt.toISOString(),
        photos: recharge.medias.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
        })),
      },
    });
  } catch (error) {
    console.error('GET admin refuel error:', error);
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

    await prisma.recharge.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE admin refuel error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}