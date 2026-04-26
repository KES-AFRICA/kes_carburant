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
    const view = searchParams.get('view');

    if (view === 'users') {
      const utilisateurs = await prisma.utilisateur.findMany({
        where: { actif: true },
        include: {
          vehicules: {
            include: {
              vehicule: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const usersWithVehicles = utilisateurs.map((u) => ({
        id: u.id,
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        vehicles: u.vehicules.map((v) => ({
          id: v.vehicule.id,
          immatriculation: v.vehicule.immatriculation,
          marque: v.vehicule.marque,
          modele: v.vehicule.modele,
        })),
      }));

      return NextResponse.json({ success: true, data: usersWithVehicles });
    }

    if (view === 'vehicles') {
      const vehicules = await prisma.vehicule.findMany({
        where: { statut: 'ACTIF' },
        include: {
          utilisateurs: {
            include: {
              utilisateur: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const vehiclesWithUsers = vehicules.map((v) => ({
        id: v.id,
        immatriculation: v.immatriculation,
        marque: v.marque,
        modele: v.modele,
        users: v.utilisateurs.map((u) => ({
          id: u.utilisateur.id,
          nom: u.utilisateur.nom,
          prenom: u.utilisateur.prenom,
          email: u.utilisateur.email,
        })),
      }));

      return NextResponse.json({ success: true, data: vehiclesWithUsers });
    }

    // Vue par défaut: toutes les assignations
    const assignments = await prisma.vehiculeUtilisateur.findMany({
      include: {
        vehicule: true,
        utilisateur: true,
      },
      orderBy: { assignedAt: 'desc' },
    });

    const result = assignments.map((a) => ({
      vehiculeId: a.vehiculeId,
      utilisateurId: a.utilisateurId,
      assignedAt: a.assignedAt.toISOString(),
      vehicule: {
        id: a.vehicule.id,
        immatriculation: a.vehicule.immatriculation,
        marque: a.vehicule.marque,
        modele: a.vehicule.modele,
      },
      utilisateur: {
        id: a.utilisateur.id,
        nom: a.utilisateur.nom,
        prenom: a.utilisateur.prenom,
        email: a.utilisateur.email,
      },
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('GET assignments error:', error);
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
    const { utilisateurId, vehiculeId } = body;

    if (!utilisateurId || !vehiculeId) {
      return NextResponse.json(
        { success: false, error: 'utilisateurId et vehiculeId requis' },
        { status: 400 }
      );
    }

    const existant = await prisma.vehiculeUtilisateur.findUnique({
      where: {
        vehiculeId_utilisateurId: {
          vehiculeId,
          utilisateurId,
        },
      },
    });

    if (existant) {
      return NextResponse.json(
        { success: false, error: 'Ce véhicule est déjà assigné à cet utilisateur' },
        { status: 400 }
      );
    }

    const assignment = await prisma.vehiculeUtilisateur.create({
      data: {
        vehiculeId,
        utilisateurId,
      },
      include: {
        vehicule: true,
        utilisateur: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        vehiculeId: assignment.vehiculeId,
        utilisateurId: assignment.utilisateurId,
        assignedAt: assignment.assignedAt.toISOString(),
        vehicule: {
          id: assignment.vehicule.id,
          immatriculation: assignment.vehicule.immatriculation,
          marque: assignment.vehicule.marque,
          modele: assignment.vehicule.modele,
        },
        utilisateur: {
          id: assignment.utilisateur.id,
          nom: assignment.utilisateur.nom,
          prenom: assignment.utilisateur.prenom,
          email: assignment.utilisateur.email,
        },
      },
    });
  } catch (error) {
    console.error('POST assignment error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}