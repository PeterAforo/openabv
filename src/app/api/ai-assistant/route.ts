import { NextRequest, NextResponse } from "next/server";
import { getOpenAI, AI_SYSTEM_PROMPT } from "@/lib/openai";
import prisma from "@/lib/prisma";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// POST: Send a message to the AI assistant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, context } = body as {
      message: string;
      history?: ChatMessage[];
      context?: { branchId?: string; visitorPhone?: string };
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message too long (max 1000 chars)" }, { status: 400 });
    }

    // Build contextual info from the database
    let contextInfo = "";

    // Fetch departments for routing
    try {
      const departments = await prisma.department.findMany({
        select: { name: true, description: true },
        take: 20,
      });
      if (departments.length > 0) {
        contextInfo += "\n\nAvailable departments:\n" +
          departments.map(d => `- ${d.name}${d.description ? `: ${d.description}` : ""}`).join("\n");
      }
    } catch { /* DB not available, continue without context */ }

    // Fetch branches
    try {
      const branches = await prisma.branch.findMany({
        select: { name: true, address: true, city: true, phone: true },
        take: 10,
      });
      if (branches.length > 0) {
        contextInfo += "\n\nBranch locations:\n" +
          branches.map(b => `- ${b.name}: ${b.address || ""}, ${b.city || ""}${b.phone ? ` (${b.phone})` : ""}`).join("\n");
      }
    } catch { /* continue */ }

    // Fetch system settings for working hours
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { key: { in: ["working_hours_start", "working_hours_end", "app_name", "appointment_duration_minutes"] } },
      });
      if (settings.length > 0) {
        contextInfo += "\n\nSystem settings:\n" +
          settings.map(s => `- ${s.key}: ${s.value}`).join("\n");
      }
    } catch { /* continue */ }

    // If visitor phone provided, check their appointments
    if (context?.visitorPhone) {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const appointments = await prisma.appointment.findMany({
          where: {
            visitor: { phone: context.visitorPhone },
            date: { gte: today },
          },
          include: {
            recipient: { select: { firstName: true, lastName: true } },
          },
          take: 5,
          orderBy: { date: "asc" },
        });
        if (appointments.length > 0) {
          contextInfo += "\n\nVisitor's upcoming appointments:\n" +
            appointments.map(a =>
              `- ${a.appointmentCode}: ${a.date.toLocaleDateString()} ${a.startTime.toLocaleTimeString()} with ${a.recipient.firstName} ${a.recipient.lastName} (${a.status})`
            ).join("\n");
        }
      } catch { /* continue */ }
    }

    const systemPrompt = AI_SYSTEM_PROMPT + contextInfo;

    // Build messages array
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (limit to last 10 messages)
    if (history && Array.isArray(history)) {
      const recentHistory = history.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: "user", content: message });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json({
      reply,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
      },
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("OPENAI_API_KEY")) {
      return NextResponse.json({ error: "AI assistant not configured. Please set OPENAI_API_KEY." }, { status: 503 });
    }

    return NextResponse.json({ error: "AI assistant unavailable" }, { status: 500 });
  }
}
