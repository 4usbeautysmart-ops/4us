import mercadopago from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { userId, userEmail, planType } = req.body;

  if (!userId || !userEmail || !planType) {
    return res.status(400).json({ error: "Dados insuficientes." });
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

  if (!ACCESS_TOKEN) {
    return res
      .status(500)
      .json({ error: "Variável MP_ACCESS_TOKEN não configurada." });
  }

  mercadopago.configure({ access_token: ACCESS_TOKEN });

  let planDetails;

  if (planType === "yearly") {
    planDetails = {
      title: "Engenharia de Cortes 5D - Plano Anual",
      unit_price: 2388,
    };
  } else {
    planDetails = {
      title: "Engenharia de Cortes 5D - Plano Mensal",
      unit_price: 249,
    };
  }

  try {
    const preference = await mercadopago.preferences.create({
      items: [{ ...planDetails, quantity: 1, currency_id: "BRL" }],
      payer: { email: userEmail },
      external_reference: userId,
      back_urls: {
        success: "https://engenharia-de-cortes-5d.vercel.app/",
        failure: "https://engenharia-de-cortes-5d.vercel.app/",
        pending: "https://engenharia-de-cortes-5d.vercel.app/",
      },
      auto_return: "approved",
      metadata: { planType },
    });

    return res.status(200).json({ checkoutUrl: preference.body.init_point });
  } catch (err) {
    console.error("Erro Mercado Pago:", err);
    res.status(500).json({ error: "Falha ao criar preferência." });
  }
}
