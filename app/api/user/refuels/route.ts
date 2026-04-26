// app/api/user/refuels/route.ts
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

    const recharges = await prisma.recharge.findMany({
      where: { utilisateurId: payload.userId },
      include: {
        vehicule: true,
        medias: true,
      },
      orderBy: { dateHeure: 'desc' },
    });

    const refuels = recharges.map((r) => ({
      id: r.id,
      vehiculeId: r.vehiculeId,
      vehicule: {
        id: r.vehicule.id,
        immatriculation: r.vehicule.immatriculation,
        marque: r.vehicule.marque,
        modele: r.vehicule.modele,
      },
      dateHeure: r.dateHeure.toISOString(),
      quantiteLitres: r.quantiteLitres,
      montant: r.montant,
      prixUnitaire: r.prixUnitaire,
      kmActuel: r.kmActuel,
      kmPrecedent: r.kmPrecedent,
      distanceParcourue: r.distanceParcourue,
      consoCalculee: r.consoCalculee,
      ecartConstructeur: r.ecartConstructeur,
      coutAuKm: r.coutAuKm,
      pleinComplet: r.pleinComplet,
      lieuNom: null,
      lieuAdresse: null,
      notes: r.notes,
      statutSync: r.statutSync,
      createdAt: r.createdAt.toISOString(),
      photos: r.medias.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
      })),
    }));

    return NextResponse.json({ success: true, data: refuels });
  } catch (error) {
    console.error('GET refuels error:', error);
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
    if (!payload) {
      return NextResponse.json({ success: false, error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { vehiculeId, dateHeure, quantiteLitres, montant, kmActuel, pleinComplet, lieuNom, lieuAdresse, notes } = body;

    if (!vehiculeId || !dateHeure || !quantiteLitres || !montant || !kmActuel) {
      return NextResponse.json(
        { success: false, error: 'Champs requis: vehiculeId, dateHeure, quantiteLitres, montant, kmActuel' },
        { status: 400 }
      );
    }

    // Vérifier que le véhicule est assigné à l'utilisateur
    const assignment = await prisma.vehiculeUtilisateur.findUnique({
      where: {
        vehiculeId_utilisateurId: {
          vehiculeId,
          utilisateurId: payload.userId,
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Vous n\'avez pas accès à ce véhicule' },
        { status: 403 }
      );
    }

    // Récupérer la dernière recharge du véhicule
    const lastRefuel = await prisma.recharge.findFirst({
      where: { vehiculeId },
      orderBy: { dateHeure: 'desc' },
    });

    const prixUnitaire = montant / quantiteLitres;

    // Calcul du km précédent et de la distance parcourue
    let kmPrecedent: number | null = null;
    let distanceParcourue: number | null = null;
    let consoCalculee: number | null = null;
    let coutAuKm: number | null = null;

    if (lastRefuel) {
      kmPrecedent = lastRefuel.kmActuel;
      distanceParcourue = kmActuel - kmPrecedent;
      
      // Calcul de la consommation et du coût au km (même pour les pleins partiels)
      if (distanceParcourue > 0) {
        consoCalculee = (quantiteLitres / distanceParcourue) * 100;
        coutAuKm = montant / distanceParcourue;
      }
    }

    // Récupérer le véhicule pour calculer l'écart constructeur
    const vehicule = await prisma.vehicule.findUnique({
      where: { id: vehiculeId },
    });

    let ecartConstructeur: number | null = null;
    if (vehicule?.consommationTheorique && consoCalculee) {
      ecartConstructeur = ((consoCalculee - vehicule.consommationTheorique) / vehicule.consommationTheorique) * 100;
    }

    const recharge = await prisma.recharge.create({
      data: {
        vehiculeId,
        utilisateurId: payload.userId,
        dateHeure: new Date(dateHeure),
        quantiteLitres,
        montant,
        prixUnitaire,
        kmActuel,
        kmPrecedent,
        distanceParcourue,
        consoCalculee,
        ecartConstructeur,
        coutAuKm,
        pleinComplet: pleinComplet ?? true,
        notes: notes || null,
      },
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
        photos: [],
      },
    });
  } catch (error) {
    console.error('POST refuel error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}