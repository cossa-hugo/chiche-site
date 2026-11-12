// Le formulaire « être prévenu de la sortie ». Il envoie l'adresse à la fonction serveur de
// Chiche (route `liste-attente`), qui la range dans la liste d'attente.

/** La fonction serveur de Chiche (`supabase/functions/api`), route `liste-attente`. */
const SIGNUP_URL = "https://hryeuoucwfbmcpfwsxfj.supabase.co/functions/v1/api/liste-attente";

const MESSAGES = {
  email_invalide: "Cette adresse e-mail ne semble pas complète.",
  plateforme_invalide: "Choisis ton téléphone.",
  trop_de_tentatives: "Trop d'inscriptions d'un coup. Réessaie dans un moment.",
};
const FAILED = "L'inscription n'a pas abouti. Réessaie dans un instant.";

const form = document.querySelector("[data-signup]");
const status = form.querySelector("[data-signup-status]");
const go = form.querySelector("[data-signup-go]");
const email = form.querySelector("#email");
let platform = "iphone";

// D'où vient la visite : `?src=story` dans le lien d'une story, d'un post. Un mot court, rien d'autre.
const query = new URLSearchParams(location.search);
const rawSource = (query.get("src") ?? query.get("utm_source") ?? "").toLowerCase();
const source = /^[a-z0-9-]{1,30}$/.test(rawSource) ? rawSource : null;

status.textContent = "";
for (const button of form.querySelectorAll("[data-platform]")) {
  button.addEventListener("click", () => {
    platform = button.dataset.platform;
    for (const other of form.querySelectorAll("[data-platform]")) {
      other.setAttribute("aria-pressed", String(other === button));
    }
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const address = email.value.trim();
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(address)) {
    status.textContent = MESSAGES.email_invalide;
    email.focus();
    return;
  }
  go.disabled = true;
  status.textContent = "Un instant…";
  fetch(SIGNUP_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: address,
      platform,
      source,
      site_web: form.querySelector("#site_web").value,
    }),
  })
    .then(async (response) => {
      if (response.ok) {
        form.reset();
        form.classList.add("signup__form--done");
        status.textContent =
          "C'est noté. On t'écrit le jour de la sortie. En attendant, parle de Chiche à ceux que tu veux défier.";
        return;
      }
      const body = await response.json().catch(() => ({}));
      status.textContent = MESSAGES[body.error] ?? FAILED;
    })
    .catch(() => {
      status.textContent = "Pas de connexion. Réessaie dans un instant.";
    })
    .finally(() => {
      go.disabled = false;
    });
});
