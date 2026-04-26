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

    const { searchParams } = new URL(request.url);
    const utilisateurId = searchParams.get('utilisateurId');
    const vehiculeId = searchParams.get('vehiculeId');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');

    // Route pour les options de filtres
    if (searchParams.has('filters')) {
      const utilisateurs = await prisma.utilisateur.findMany({
        where: { actif: true },
        select: { id: true, nom: true, prenom: true },
      });
      const vehicules = await prisma.vehicule.findMany({
        where: { statut: 'ACTIF' },
        select: { id: true, marque: true, modele: true, immatriculation: true },
      });

      return NextResponse.json({
        success: true,
        data: {
          utilisateurs: utilisateurs.map(u => ({ id: u.id, name: `${u.prenom} ${u.nom}` })),
          vehicules: vehicules.map(v => ({ id: v.id, name: `${v.marque} ${v.modele} - ${v.immatriculation}` })),
        },
      });
    }

    // Construction des filtres
    const where: Record<string, unknown> = { statutSync: 'SYNCHRONISE' };
    if (utilisateurId) where.utilisateurId = parseInt(utilisateurId);
    if (vehiculeId) where.vehiculeId = parseInt(vehiculeId);
    if (dateDebut) where.dateHeure = { gte: new Date(dateDebut) };
    if (dateFin) where.dateHeure = { ...(where.dateHeure as object || {}), lte: new Date(dateFin) };

    const recharges = await prisma.recharge.findMany({
      where,
      include: {
        vehicule: true,
        utilisateur: true,
        medias: true,
      },
      orderBy: { dateHeure: 'desc' },
    });

    const refuels = recharges.map((r) => ({
      id: r.id,
      vehiculeId: r.vehiculeId,
      vehiculeName: `${r.vehicule.marque} ${r.vehicule.modele}`,
      vehiculeImmatriculation: r.vehicule.immatriculation,
      utilisateurId: r.utilisateurId,
      utilisateurName: `${r.utilisateur.prenom} ${r.utilisateur.nom}`,
      utilisateurEmail: r.utilisateur.email,
      dateHeure: r.dateHeure.toISOString(),
      quantiteLitres: r.quantiteLitres,
      montant: r.montant,
      prixUnitaire: r.prixUnitaire,
      kmActuel: r.kmActuel,
      kmPrecedent: r.kmPrecedent,
      distanceParcourue: r.distanceParcourue,
      consoCalculee: r.consoCalculee,
      coutAuKm: r.coutAuKm,
      pleinComplet: r.pleinComplet,
      lieuNom: null,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      photos: r.medias.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
      })),
    }));

    return NextResponse.json({ success: true, data: refuels });
  } catch (error) {
    console.error('GET admin refuels error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: 'Non authentifié' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Accès refusé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID requis' }, { status: 400 });
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