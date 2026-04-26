// app/api/user/stats/route.ts
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = payload.userId;

    // Statistiques générales de l'utilisateur
    if (type === 'stats') {
      const recharges = await prisma.recharge.findMany({
        where: { 
          utilisateurId: userId,
          statutSync: 'SYNCHRONISE' 
        },
        orderBy: { dateHeure: 'asc' },
      });

      if (recharges.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            totalDepenses: 0,
            totalLitres: 0,
            totalKm: 0,
            consommationMoyenneGenerale: 0,
            nombreRecharges: 0,
          },
        });
      }

      const totalDepenses = recharges.reduce((sum, r) => sum + r.montant, 0);
      const totalLitres = recharges.reduce((sum, r) => sum + r.quantiteLitres, 0);
      
      const premierKm = recharges[0].kmActuel;
      const dernierKm = recharges[recharges.length - 1].kmActuel;
      const totalKm = dernierKm - premierKm;
      
      const consoMoyenne = totalKm > 0 ? (totalLitres / totalKm) * 100 : 0;

      return NextResponse.json({
        success: true,
        data: {
          totalDepenses,
          totalLitres,
          totalKm,
          consommationMoyenneGenerale: parseFloat(consoMoyenne.toFixed(2)),
          nombreRecharges: recharges.length,
        },
      });
    }

    // Consommation par véhicule de l'utilisateur
    if (type === 'consumption') {
      const vehicules = await prisma.vehicule.findMany({
        where: {
          utilisateurs: {
            some: { utilisateurId: userId }
          },
          statut: 'ACTIF'
        },
        include: {
          recharges: {
            where: { 
              utilisateurId: userId,
              statutSync: 'SYNCHRONISE'
            },
            orderBy: { dateHeure: 'asc' },
          },
        },
      });

      const consumptionData = vehicules.map((v) => {
        if (v.recharges.length === 0) {
          return {
            vehiculeId: v.id,
            vehiculeName: `${v.marque} ${v.modele} - ${v.immatriculation}`,
            consommationMoyenne: 0,
            totalLitres: 0,
            totalKm: 0,
            totalMontant: 0,
            nombreRecharges: 0,
          };
        }

        const totalLitres = v.recharges.reduce((sum, r) => sum + r.quantiteLitres, 0);
        const totalMontant = v.recharges.reduce((sum, r) => sum + r.montant, 0);
        
        const premierKm = v.recharges[0].kmActuel;
        const dernierKm = v.recharges[v.recharges.length - 1].kmActuel;
        const totalKm = dernierKm - premierKm;
        
        const consoMoyenne = totalKm > 0 ? (totalLitres / totalKm) * 100 : 0;

        return {
          vehiculeId: v.id,
          vehiculeName: `${v.marque} ${v.modele} - ${v.immatriculation}`,
          consommationMoyenne: parseFloat(consoMoyenne.toFixed(2)),
          totalLitres: parseFloat(totalLitres.toFixed(1)),
          totalKm: Math.round(totalKm),
          totalMontant: parseFloat(totalMontant.toFixed(0)),
          nombreRecharges: v.recharges.length,
        };
      });

      return NextResponse.json({ success: true, data: consumptionData });
    }

    // Dépenses mensuelles de l'utilisateur
    if (type === 'monthly') {
      const sixMoisAgo = new Date();
      sixMoisAgo.setMonth(sixMoisAgo.getMonth() - 5);
      sixMoisAgo.setDate(1);
      sixMoisAgo.setHours(0, 0, 0, 0);

      const recharges = await prisma.recharge.findMany({
        where: {
          utilisateurId: userId,
          statutSync: 'SYNCHRONISE',
          dateHeure: { gte: sixMoisAgo },
        },
        orderBy: { dateHeure: 'asc' },
      });

      const monthlyMap = new Map<string, { montant: number; litres: number; km: number }>();

      recharges.forEach((r) => {
        const mois = r.dateHeure.toISOString().slice(0, 7);
        const existing = monthlyMap.get(mois) || { montant: 0, litres: 0, km: 0 };
        monthlyMap.set(mois, {
          montant: existing.montant + r.montant,
          litres: existing.litres + r.quantiteLitres,
          km: existing.km + (r.distanceParcourue || 0),
        });
      });

      const monthlyExpenses = Array.from(monthlyMap.entries()).map(([mois, data]) => ({
        mois,
        montant: parseFloat(data.montant.toFixed(2)),
        litres: parseFloat(data.litres.toFixed(2)),
        kmParcourus: Math.round(data.km),
      }));

      return NextResponse.json({ success: true, data: monthlyExpenses });
    }

    // Évolution des consommations de l'utilisateur - CORRIGÉ
    if (type === 'evolution') {
      const troisMoisAgo = new Date();
      troisMoisAgo.setMonth(troisMoisAgo.getMonth() - 2);
      troisMoisAgo.setDate(1);
      troisMoisAgo.setHours(0, 0, 0, 0);

      const recharges = await prisma.recharge.findMany({
        where: {
          utilisateurId: userId,
          statutSync: 'SYNCHRONISE',
          dateHeure: { gte: troisMoisAgo },
        },
        include: { vehicule: true },
        orderBy: { dateHeure: 'asc' },
      });

      if (recharges.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      // Calcul de la consommation cumulée pour chaque recharge
      let cumulLitres = 0;
      const premierKm = recharges[0].kmActuel;

      const evolution = recharges.map((r, index) => {
        cumulLitres += r.quantiteLitres;
        
        if (index === 0) {
          return {
            date: r.dateHeure.toISOString(),
            consommation: 0,
            vehiculeId: r.vehiculeId,
            vehiculeName: `${r.vehicule.marque} ${r.vehicule.modele}`,
            montant: r.montant,
            quantiteLitres: r.quantiteLitres,
            distanceParcourue: 0,
          };
        }
        
        const cumulKm = r.kmActuel - premierKm;
        const consoCumulee = cumulKm > 0 ? (cumulLitres / cumulKm) * 100 : 0;
        
        return {
          date: r.dateHeure.toISOString(),
          consommation: parseFloat(consoCumulee.toFixed(2)),
          vehiculeId: r.vehiculeId,
          vehiculeName: `${r.vehicule.marque} ${r.vehicule.modele}`,
          montant: r.montant,
          quantiteLitres: r.quantiteLitres,
          distanceParcourue: cumulKm,
        };
      });

      return NextResponse.json({ success: true, data: evolution });
    }

    // Alertes consommation anormale
    if (type === 'alerts') {
      const recharges = await prisma.recharge.findMany({
        where: {
          utilisateurId: userId,
          statutSync: 'SYNCHRONISE',
          consoCalculee: { not: null },
          vehicule: {
            consommationTheorique: { not: null },
          },
        },
        include: { vehicule: true },
        orderBy: { dateHeure: 'desc' },
        take: 20,
      });

      const alerts = recharges
        .filter((r) => {
          const ecart = ((r.consoCalculee || 0) - (r.vehicule.consommationTheorique || 0)) / (r.vehicule.consommationTheorique || 1) * 100;
          return ecart > 15;
        })
        .map((r) => {
          const ecart = ((r.consoCalculee || 0) - (r.vehicule.consommationTheorique || 0)) / (r.vehicule.consommationTheorique || 1) * 100;
          return {
            id: r.id,
            vehiculeId: r.vehiculeId,
            vehiculeName: `${r.vehicule.marque} ${r.vehicule.modele} - ${r.vehicule.immatriculation}`,
            date: r.dateHeure.toISOString(),
            consoCalculee: r.consoCalculee || 0,
            consommationTheorique: r.vehicule.consommationTheorique || 0,
            ecart: parseFloat(ecart.toFixed(1)),
            message: `Consommation ${ecart.toFixed(1)}% supérieure à la théorie`,
          };
        });

      return NextResponse.json({ success: true, data: alerts });
    }

    return NextResponse.json({ success: false, error: 'Type de statistique invalide' }, { status: 400 });
  } catch (error) {
    console.error('User stats error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}