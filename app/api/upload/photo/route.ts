/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';
import { minioClient, BUCKET_NAME } from '@/lib/minio/client';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

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

    const formData = await request.formData();
    const rechargeId = parseInt(formData.get('rechargeId') as string);
    const type = formData.get('type') as string;
    const file = formData.get('photo') as File;

    if (!rechargeId || !type || !file) {
      return NextResponse.json(
        { success: false, error: 'rechargeId, type et photo requis' },
        { status: 400 }
      );
    }

    if (type !== 'TABLEAU_BORD' && type !== 'POMPE' && type !== 'VEHICULE') {
      return NextResponse.json(
        { success: false, error: 'Type invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la recharge appartient à l'utilisateur
    const recharge = await prisma.recharge.findFirst({
      where: {
        id: rechargeId,
        utilisateurId: payload.userId,
      },
    });

    if (!recharge) {
      return NextResponse.json(
        { success: false, error: 'Recharge non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si une photo du même type existe déjà
    const existingPhoto = await prisma.media.findFirst({
      where: {
        rechargeId,
        type: type as any,
      },
    });

    if (existingPhoto) {
      return NextResponse.json(
        { success: false, error: `Une photo ${type === 'TABLEAU_BORD' ? 'tableau de bord' : 'pompe'} existe déjà` },
        { status: 400 }
      );
    }

    // Traitement de l'image
    const buffer = Buffer.from(await file.arrayBuffer());
    const compressedBuffer = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const extension = file.type.split('/')[1];
    const fileName = `refuels/${rechargeId}/${uuidv4()}.${extension === 'jpeg' ? 'jpg' : extension}`;

    await minioClient.putObject(BUCKET_NAME, fileName, compressedBuffer, compressedBuffer.length, {
      'Content-Type': 'image/jpeg',
    });

    const photoUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;

    const media = await prisma.media.create({
      data: {
        rechargeId,
        type: type as any,
        url: photoUrl,
        bucket: BUCKET_NAME,
        key: fileName,
        taille: compressedBuffer.length,
        mimeType: 'image/jpeg',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: media.id,
        rechargeId: media.rechargeId,
        type: media.type,
        url: media.url,
        taille: media.taille,
        mimeType: media.mimeType,
        createdAt: media.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}