import { MercadoPagoConfig, Preference } from "mercadopago";

export default async function handler(req, res) {
  console.log("---- CHEGOU NA API ----");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { userId, userEmail, planType } = req.body;

  if (!userId || !userEmail || !planType) {
    return res.status(400).json({ error: "Dados insuficientes." });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!ACCESS_TOKEN) {
    console.log("❌ MP_ACCESS_TOKEN não configurado");
    return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado." });
  }

  try {
    // Cliente Mercado Pago (SDK nova)
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

    return res.status(200).json({
      checkoutUrl: resposta.init_point,
    });
  } catch (err) {
    console.error("🔥 Erro Mercado Pago:", err);
    return res.status(500).json({ error: "Falha ao criar preferência." });
  }
}
