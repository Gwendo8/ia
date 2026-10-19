// Permet de vérifier que l'API répond (utilisé par le front et par l'hébergeur).
export function getHealth(req, res) {
  res.json({ status: 'ok' });
}
