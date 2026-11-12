// La page où Garmin renvoie le joueur après son accord. Elle remet au serveur de Chiche le code
// reçu, qui le change en liaison, puis dit au joueur ce qu'il en est.

/** La fonction serveur de Chiche (`supabase/functions/api`), route `garmin-retour`. */
const RETURN_URL = "https://hryeuoucwfbmcpfwsxfj.supabase.co/functions/v1/api/garmin-retour";

const MESSAGES = {
  lien_expire:
    "Cette demande a expiré : elle vaut un quart d'heure. Recommence depuis l'app Chiche.",
  accord_refuse: "Garmin n'a pas validé cette demande. Recommence depuis l'app Chiche.",
  montre_prise: "Ce compte Garmin est déjà relié à un autre joueur de Chiche.",
  montre_deja_reliee: "Ta montre est déjà reliée. Tu peux revenir dans l'app Chiche.",
  garmin_indisponible: "Garmin ne répond pas pour l'instant. Recommence dans quelques minutes.",
  partage_refuse:
    "Tu n'as pas coché le partage de tes activités chez Garmin : sans lui, Chiche ne reçoit rien. Recommence depuis l'app et laisse-le coché.",
};
const FAILED = "La liaison n'a pas abouti. Recommence depuis l'app Chiche.";

const title = document.querySelector("[data-title]");
const text = document.querySelector("[data-text]");
const show = (heading, message) => {
  title.textContent = heading;
  text.textContent = message;
};

const query = new URLSearchParams(location.search);
const code = query.get("code");
const state = query.get("state");
// Le code ne sert qu'une fois : on le retire de l'adresse, pour qu'une page rechargée ou
// partagée ne le rejoue pas.
if (code !== null || query.has("error")) history.replaceState(null, "", location.pathname);

if (query.has("error")) {
  show("Pas relié", "Tu n'as pas donné ton accord chez Garmin : rien n'est relié.");
} else if (code !== null && state !== null) {
  show("Un instant", "On termine la liaison de ta montre.");
  fetch(RETURN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, state }),
  })
    .then(async (response) => {
      if (response.ok) {
        show(
          "Montre reliée",
          "Tes prochaines sorties arriveront toutes seules. Tu peux fermer cette page et revenir dans l'app Chiche.",
        );
        return;
      }
      const body = await response.json().catch(() => ({}));
      show("Pas relié", MESSAGES[body.error] ?? FAILED);
    })
    .catch(() => show("Pas relié", "Pas de connexion. Recommence depuis l'app Chiche."));
}
