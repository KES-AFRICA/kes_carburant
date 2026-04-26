// app/api/admin/stats/route.ts
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
    const type = searchParams.get('type');

    // Statistiques générales
    if (type === 'stats') {
      const recharges = await prisma.recharge.findMany({
        where: { statutSync: 'SYNCHRONISE' },
        orderBy: { dateHeure: 'asc' },
      });

      const vehiculesActifs = await prisma.vehicule.count({
        where: { statut: 'ACTIF' },
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
            vehiculesActifs,
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
          vehiculesActifs,
        },
      });
    }

    // Consommation par véhicule
    if (type === 'consumption') {
      const vehicules = await prisma.vehicule.findMany({
        where: { statut: 'ACTIF' },
        include: {
          recharges: {
            where: { statutSync: 'SYNCHRONISE' },
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

    // Dépenses mensuelles
    if (type === 'monthly') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const recharges = await prisma.recharge.findMany({
        where: {
          statutSync: 'SYNCHRONISE',
          dateHeure: { gte: sixMonthsAgo },
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

    // Évolution des consommations - CORRIGÉ avec calcul cumulé
    if (type === 'evolution') {
      const troisMoisAgo = new Date();
      troisMoisAgo.setMonth(troisMoisAgo.getMonth() - 2);
      troisMoisAgo.setDate(1);
      troisMoisAgo.setHours(0, 0, 0, 0);

      const recharges = await prisma.recharge.findMany({
        where: {
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

    // ✅ Consommation par utilisateur (admin) - AJOUTÉ
    if (type === 'user-consumption') {
      const users = await prisma.utilisateur.findMany({
        where: { actif: true },
        include: {
          recharges: {
            where: { statutSync: 'SYNCHRONISE' },
            orderBy: { dateHeure: 'asc' },
          },
        },
      });

      const consumptionByUser = users
        .filter(user => user.recharges.length > 0)
        .map(user => {
          const totalLitres = user.recharges.reduce((sum, r) => sum + r.quantiteLitres, 0);
          const totalMontant = user.recharges.reduce((sum, r) => sum + r.montant, 0);
          
          const premierKm = user.recharges[0].kmActuel;
          const dernierKm = user.recharges[user.recharges.length - 1].kmActuel;
          const totalKm = dernierKm - premierKm;
          
          const consoMoyennePar100km = totalKm > 0 ? (totalLitres / totalKm) * 100 : 0;

          return {
            userId: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            totalLitres: parseFloat(totalLitres.toFixed(1)),
            totalKm: Math.round(totalKm),
            totalMontant: parseFloat(totalMontant.toFixed(0)),
            consoMoyennePar100km: parseFloat(consoMoyennePar100km.toFixed(1)),
            nombreRecharges: user.recharges.length,
            vehiculesParcourt: [...new Set(user.recharges.map(r => r.vehiculeId))].length,
          };
        });

      return NextResponse.json({ success: true, data: consumptionByUser });
    }

    return NextResponse.json({ success: false, error: 'Type de statistique invalide' }, { status: 400 });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}