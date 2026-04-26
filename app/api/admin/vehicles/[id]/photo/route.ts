import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';
import { minioClient, BUCKET_NAME } from '@/lib/minio/client';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
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

    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'Aucune photo fournie' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Le fichier doit être une image' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const compressedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const extension = file.type.split('/')[1];
    const fileName = `vehicles/${uuidv4()}.${extension === 'jpeg' ? 'jpg' : extension}`;

    await minioClient.putObject(BUCKET_NAME, fileName, compressedBuffer, compressedBuffer.length, {
      'Content-Type': file.type,
    });

    const photoUrl = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET_NAME}/${fileName}`;

    await prisma.vehicule.update({
      where: { id: parseInt(id) },
      data: { photoUrl },
    });

    return NextResponse.json({
      success: true,
      data: { photoUrl },
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}