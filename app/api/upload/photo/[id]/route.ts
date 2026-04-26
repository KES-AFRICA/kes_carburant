import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma/client';
import { verifyToken } from '@/lib/auth/jwt';
import { minioClient, BUCKET_NAME } from '@/lib/minio/client';

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

    const media = await prisma.media.findFirst({
      where: {
        id: parseInt(id),
        recharge: {
          utilisateurId: payload.userId,
        },
      },
    });

    if (!media) {
      return NextResponse.json({ success: false, error: 'Photo non trouvée' }, { status: 404 });
    }

    await minioClient.removeObject(BUCKET_NAME, media.key);

    await prisma.media.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete photo error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}