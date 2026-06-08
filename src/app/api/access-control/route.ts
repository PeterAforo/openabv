import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET: List access control devices
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN", "SECURITY"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;

    const devices = await prisma.accessControlDevice.findMany({
      where,
      include: {
        logs: { take: 5, orderBy: { createdAt: "desc" } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: Register a new device
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, type, location, branchId, ipAddress, apiEndpoint, apiKey } = body;

    if (!name || !type) {
      return NextResponse.json({ error: "name and type required" }, { status: 400 });
    }

    const device = await prisma.accessControlDevice.create({
      data: {
        name,
        type,
        location: location || null,
        branchId: branchId || null,
        ipAddress: ipAddress || null,
        apiEndpoint: apiEndpoint || null,
        apiKey: apiKey || null,
      },
    });

    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error("Failed to create device:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
