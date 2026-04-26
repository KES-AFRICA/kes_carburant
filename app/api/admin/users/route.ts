/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';
import { hashPassword, generateRandomPassword } from '@/lib/auth/password';

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

    // 👇 Récupérer le paramètre role
    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');

    // Construire le where en fonction du filtre
    const whereCondition: any = { actif: true };
    
    if (roleFilter === 'non-admin') {
      // Récupérer l'id du rôle USER
      const userRole = await prisma.role.findUnique({
        where: { nom: 'USER' },
      });
      if (userRole) {
        whereCondition.roleId = userRole.id;
      }
    }

    const utilisateurs = await prisma.utilisateur.findMany({
      where: whereCondition,
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });

    const users = utilisateurs.map((u) => ({
      id: u.id,
      nom: u.nom,
      prenom: u.prenom,
      email: u.email,
      telephone: u.telephone,
      role: u.role.nom,
      actif: u.actif,
      derniereConnexion: u.derniereConnexion?.toISOString() || null,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('GET users error:', error);
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
    const { nom, prenom, email, telephone, role } = body;

    if (!nom || !prenom || !email || !role) {
      return NextResponse.json(
        { success: false, error: 'Champs requis: nom, prenom, email, role' },
        { status: 400 }
      );
    }

    const existant = await prisma.utilisateur.findUnique({ where: { email } });
    if (existant) {
      return NextResponse.json({ success: false, error: 'Email déjà utilisé' }, { status: 400 });
    }

    const motDePasseGenere = generateRandomPassword(10);
    const motDePasseHash = await hashPassword(motDePasseGenere);

    const roleDb = await prisma.role.findUnique({
      where: { nom: role === 'ADMIN' ? 'ADMIN' : 'USER' },
    });

    if (!roleDb) {
      return NextResponse.json({ success: false, error: 'Rôle invalide' }, { status: 400 });
    }

    const utilisateur = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        telephone: telephone || null,
        motDePasse: motDePasseHash,
        roleId: roleDb.id,
      },
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
        motDePasseGenere,
      },
    });
  } catch (error) {
    console.error('POST user error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}