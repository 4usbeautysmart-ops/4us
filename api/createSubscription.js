import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req) {
  console.log("---- CHEGOU NA API (Route Handler) ----");

  try {
    const { userId, userEmail, planType } = await req.json();

    if (!userId || !userEmail || !planType) {
      return Response.json({ error: "Dados insuficientes." }, { status: 400 });
    }

    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
      console.log("❌ MP_ACCESS_TOKEN não configurado");
      return Response.json(
        { error: "MP_ACCESS_TOKEN não configurado." },
        { status: 500 }
      );
    }

    // Cliente Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken: ACCESS_TOKEN,
    });

    const preference = new Preference(client);

    let planDetails =
      planType === "yearly"
        ? {
            title: "Engenharia de Cortes 5D - Plano Anual",
            unit_price: 2388,
          }
        : {
            title: "Engenharia de Cortes 5D - Plano Mensal",
            unit_price: 249,
          };

    const resposta = await preference.create({
      body: {
        items: [
          {
            title: planDetails.title,
            unit_price: planDetails.unit_price,
            quantity: 1,
          },
        ],
        payer: { email: userEmail },
        external_reference: userId,
        back_urls: {
          success: "https://engenharia-de-cortes-5d.vercel.app/",
          failure: "https://engenharia-de-cortes-5d.vercel.app/",
          pending: "https://engenharia-de-cortes-5d.vercel.app/",
        },
        auto_return: "approved",
        metadata: { planType },
      },
    });

    console.log("Preference criada com sucesso!");

    return Response.json({
      checkoutUrl: resposta.init_point,
    });
  } catch (err) {
    console.error("🔥 Erro Mercado Pago:", err);
    return Response.json(
      { error: "Falha ao criar preferência." },
      { status: 500 }
    );
  }
}
