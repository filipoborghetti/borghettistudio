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

  const embed = {
    embeds: [
      {
        title: "📩 Nuevo contacto — Borghetti Studio",
        color: 0xe8213b,
        fields: [
          {
            name: "👤 Nombre",
            value: nombre,
            inline: true,
          },
          {
            name: "📧 Email",
            value: email,
            inline: true,
          },
          {
            name: "📸 Instagram",
            value: instagram || "No especificado",
            inline: true,
          },
          {
            name: "💬 Mensaje",
            value: mensaje,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    const res = await fetch(import.meta.env.DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(embed),
    });

    if (!res.ok) {
      throw new Error("Discord webhook error");
    }
  } catch (error) {
    console.error("Error enviando a Discord:", error);

    return new Response(
      JSON.stringify({
        error: "Error al enviar el formulario",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}
