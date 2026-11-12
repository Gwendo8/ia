---
description: Bilan de santé d'un serveur Linux joignable en SSH (services, disque, mémoire, mises à jour), en lecture seule
argument-hint: [hôte-ssh]
---

Fais le **bilan de santé** d'un serveur et présente-le en tableau. Arguments : $ARGUMENTS
Tout se fait en français, avec des mots simples (l'utilisateur apprend en même temps).

**Règle absolue : lecture seule.** Tu ne modifies rien sur le serveur, tu ne lances aucun `sudo`, tu ne relances aucun programme. Si quelque chose ne va pas, tu l'expliques et tu proposes la commande de réparation : c'est l'utilisateur qui décide et qui la lance.

## 1. Trouver le serveur

- Si un argument est donné, c'est l'hôte SSH (`maison`, `gwen@100.x.y.z`…).
- Sinon, utilise l'hôte `maison`.
- Si le projet ou la mémoire indique un fichier de notes du serveur, lis-le d'abord : il dit ce qui tourne dessus et ce qui est normal.

Si la connexion échoue, ne réessaie pas en boucle. Dis-le simplement et donne les causes probables, dans l'ordre : le réseau privé (Tailscale ou autre VPN) est éteint sur ce poste ; le serveur est éteint ou débranché ; l'hôte n'est pas connu (il manque un bloc `Host` dans `~/.ssh/config`, ou l'adresse en argument).

## 2. Relever les mesures, en une seule connexion

Lance cette commande telle quelle, en remplaçant `HOTE` (une seule connexion, pour aller vite et consommer peu) :

```bash
ssh -o BatchMode=yes -o ConnectTimeout=10 HOTE 'bash -s' <<'BILAN'
echo "## allume_depuis"; uptime -p
echo "## services"
for s in ssh ufw tailscaled postgresql caddy nginx traefik docker unattended-upgrades; do
  systemctl list-unit-files "$s.service" --no-legend 2>/dev/null | grep -q . && echo "$s $(systemctl is-active "$s")"
done
echo "## services_maison"
for f in /etc/systemd/system/*.service; do
  [ -f "$f" ] && [ ! -L "$f" ] && n=$(basename "$f" .service) && [ "${n#snap.}" = "$n" ] && echo "$n $(systemctl is-active "$n")"
done
echo "## en_echec"; systemctl --failed --no-legend | awk '{print $1}'
echo "## disque"; df -h --output=target,size,used,pcent -x tmpfs -x devtmpfs -x efivarfs | tail -n +2
echo "## memoire"; free -h | awk '/^Mem/{print $3" utilisés sur "$2}'
echo "## temperature"; awk '{printf "%.0f\n", $1/1000}' /sys/class/thermal/thermal_zone0/temp 2>/dev/null
echo "## redemarrage_en_attente"; [ -f /var/run/reboot-required ] && echo oui || echo non
echo "## mises_a_jour_en_attente"; apt list --upgradable 2>/dev/null | grep -c upgradable
echo "## erreurs_24h"
for f in /etc/systemd/system/*.service; do
  [ -f "$f" ] && [ ! -L "$f" ] && n=$(basename "$f" .service) && [ "${n#snap.}" = "$n" ] && echo "$n $(journalctl -u "$n" -p err --since "-24h" --no-pager -q 2>/dev/null | wc -l)"
done
echo "## conteneurs"; command -v docker >/dev/null 2>&1 && docker ps -a --format '{{.Names}} {{.Status}}' 2>/dev/null
echo "## porte_publique"; command -v tailscale >/dev/null 2>&1 && tailscale funnel status 2>/dev/null | grep -o 'https://[^ ]*' | sort -u
BILAN
```

Si une adresse publique apparaît dans `porte_publique`, vérifie depuis ce poste qu'elle répond : `curl -s -o /dev/null -m 10 -w '%{http_code}' <adresse>`.

`services_maison` liste les programmes installés à la main sur le serveur (les applications), reconnus à leur fichier dans `/etc/systemd/system/` ; ceux créés par `snap` sont ignorés.

## 3. Présenter le bilan

Un tableau : **Contrôle | Résultat | Verdict**. Une ligne par contrôle, sans jargon. Laisse de côté les services qui n'existent pas sur ce serveur.

Repères pour le verdict :

| Contrôle | Bon | À surveiller | Problème |
| --- | --- | --- | --- |
| Services | tous `active` | — | un service `inactive` ou `failed` |
| Programmes en échec | aucun | — | au moins un |
| Disque | moins de 70 % | 70 à 85 % | plus de 85 % |
| Température | moins de 60 °C | 60 à 75 °C | plus de 75 °C |
| Mises à jour en attente | 0 | quelques-unes (normal entre deux passages automatiques) | des dizaines depuis longtemps |
| Redémarrage en attente | non | oui (se fera la nuit si le redémarrage automatique est réglé) | — |
| Erreurs sur 24 h | 0 | quelques-unes | beaucoup, ou un service qui redémarre en boucle |
| Adresse publique | répond (200 à 399) | — | ne répond pas |

Ensuite, en deux ou trois phrases : ce qui va bien, et ce qui mérite attention. Pour chaque problème, explique-le simplement et donne **la** commande à lancer pour regarder de plus près ou réparer (par exemple `journalctl -u <service> -n 50`, `sudo systemctl restart <service>`), sans la lancer.

Si tout va bien, dis-le en une phrase : pas de remplissage.
