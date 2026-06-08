import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get("visitorId");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (visitorId) where.visitorId = visitorId;
    if (type) where.type = type;

    const documents = await prisma.visitorDocument.findMany({
      where,
      include: {
        visitor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { visitorId, type, fileName, fileUrl, fileSize, mimeType, expiresAt } = body;

    if (!visitorId || !type || !fileName || !fileUrl) {
      return NextResponse.json({ error: "visitorId, type, fileName, fileUrl required" }, { status: 400 });
    }

    // Validate MIME type
    const allowedMimes = [
      "image/jpeg", "image/png", "image/webp",
      "application/pdf",
      "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (mimeType && !allowedMimes.includes(mimeType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (fileSize && fileSize > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const doc = await prisma.visitorDocument.create({
      data: {
        visitorId,
        type,
        fileName,
        fileUrl,
        fileSize: fileSize || null,
        mimeType: mimeType || null,
        uploadedBy: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("Document upload failed:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
