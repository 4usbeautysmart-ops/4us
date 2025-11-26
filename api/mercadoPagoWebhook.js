export default async function handler(req, res) {
  console.log("Webhook recebido:", req.body);

  // MP exige resposta 200 SEM FALHAR
  res.status(200).send("OK");
}
