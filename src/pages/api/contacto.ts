import "dotenv/config";

export const prerender = false;

const rateLimit = new Map<string, { count: number; resetAt: number }>();

const LIMIT = 3;
const WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, {
      count: 1,
      resetAt: now + WINDOW,
    });
    return true;
  }

  if (entry.count >= LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST({
  request,
  clientAddress,
}: {
  request: Request;
  clientAddress: string;
}) {
  const ip = clientAddress ?? "unknown";

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({
        error: "Demasiados intentos. Esperá una hora.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const contentType = request.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return new Response(
      JSON.stringify({
        error: "Formato inválido",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  let data: any;

  try {
    data = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "JSON inválido",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  if (data.website) {
    console.warn("Bot detectado:", ip);

    return new Response(null, {
      status: 204,
    });
  }

  const nombre = data.nombre?.trim();
  const email = data.email?.trim();
  const instagram = data.instagram?.trim();
  const mensaje = data.mensaje?.trim();

  if (
    typeof nombre !== "string" ||
    typeof email !== "string" ||
    typeof mensaje !== "string"
  ) {
    return new Response(
      JSON.stringify({
        error: "Datos inválidos",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  if (!nombre || !email || !mensaje) {
    return new Response(
      JSON.stringify({
        error: "Faltan campos obligatorios",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  if (
    nombre.length > 100 ||
    email.length > 100 ||
    (instagram && instagram.length > 30) ||
    mensaje.length > 1000
  ) {
    return new Response(
      JSON.stringify({
        error: "Campos demasiado largos",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return new Response(
      JSON.stringify({
        error: "Email inválido",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/;

  if (instagram && !instagramRegex.test(instagram)) {
    return new Response(
      JSON.stringify({
        error: "Instagram inválido",
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  const text = `📩 Nuevo contacto de ${nombre} (${email}${instagram ? `, https://instagram.com/${instagram})` : ""}:\n\n${mensaje}`;

  const discordUrl = (import.meta.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || "").trim();
  const botToken = import.meta.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = import.meta.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";

  console.log("[contacto] Env vars:", { discordUrl: !!discordUrl, botToken: !!botToken, chatId: !!chatId });

  const errors: string[] = [];

  if (discordUrl) {
    try {
      const r = await fetch(discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch (e) {
      errors.push(`Discord: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (botToken && chatId) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: Number(chatId), text }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch (e) {
      errors.push(`Telegram: ${e instanceof Error ? e.message : e}`);
    }
  }

  const configured = (!!discordUrl ? 1 : 0) + (!!botToken && !!chatId ? 1 : 0);

  if (errors.length === configured && configured > 0) {
    console.error("Todos los canales fallaron:", errors);
    return new Response(JSON.stringify({ error: "Error al enviar el mensaje" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (errors.length) {
    console.warn("Algún canal falló:", errors);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
