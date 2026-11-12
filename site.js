// Chiche — le site. Un réglage à remplir, puis l'invitation et la démonstration du pari.

/**
 * L'adresse de l'app sur l'App Store (https://apps.apple.com/…). Tant qu'elle est vide, les
 * boutons annoncent la sortie au lieu de mener nulle part.
 */
const APP_STORE_URL = "";

// --- Boutons de téléchargement ---------------------------------------------------------------
for (const node of document.querySelectorAll("[data-store]")) {
  const long = node.hasAttribute("data-store-long");
  if (!APP_STORE_URL) {
    // Pas encore publiée : les boutons mènent à l'inscription pour être prévenu de la sortie.
    const link = document.createElement("a");
    link.className = node.className;
    link.href = "inscription.html";
    link.textContent = long ? "Être prévenu de la sortie" : "Me prévenir";
    node.replaceWith(link);
    continue;
  }
  // L'app est publiée : la mention devient un vrai lien vers l'App Store.
  const link = document.createElement("a");
  link.className = node.className;
  link.href = APP_STORE_URL;
  link.textContent = long ? "Télécharger sur l'App Store" : "Télécharger";
  node.replaceWith(link);
}

// --- Invitation : le lien partagé depuis l'app porte le code de la ligue ----------------------
const invite = document.querySelector("[data-invite]");
const inviteCode = (new URLSearchParams(location.search).get("code") ?? "").toLowerCase();
// Un code de ligue fait 12 caractères ; tout autre contenu de l'adresse est ignoré.
if (invite && /^[a-z0-9]{6,12}$/.test(inviteCode)) {
  invite.querySelector("[data-invite-code]").textContent = inviteCode;
  const copy = invite.querySelector("[data-invite-copy]");
  if (navigator.clipboard) {
    copy.addEventListener("click", () => {
      navigator.clipboard.writeText(inviteCode).then(
        () => {
          copy.textContent = "Code copié";
        },
        () => {},
      );
    });
  } else {
    copy.hidden = true;
  }
  invite.hidden = false;
}

// --- La démonstration : le contrat de Léa ----------------------------------------------------
const demo = document.querySelector("#demo");
if (demo) {
  const ALGO = 0.27;
  // Les mises déjà posées par les amis de Léa, comme sur les visuels de la marque.
  const BETS = [
    { side: "pour", stake: 100 },
    { side: "pour", stake: 70 },
    { side: "pour", stake: 240 },
    { side: "contre", stake: 300 },
    { side: "contre", stake: 200 },
    { side: "contre", stake: 90 },
  ];
  const state = { side: "contre", stake: 50 };

  const fr = (n) => n.toFixed(2).replace(".", ",");
  const pts = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const $ = (selector) => demo.querySelector(selector);

  /** Le pari mutuel de l'app : tout le pot aux gagnants, en points entiers, au plus fort reste. */
  function settle(bets, winner) {
    const total = bets.reduce((sum, b) => sum + b.stake, 0);
    const winners = bets.filter((b) => b.side === winner);
    const sideTotal = winners.reduce((sum, b) => sum + b.stake, 0);
    const exact = winners.map((b) => (b.stake * total) / sideTotal);
    const payouts = exact.map(Math.floor);
    let left = total - payouts.reduce((a, b) => a + b, 0);
    const order = exact.map((v, i) => [v - Math.floor(v), i]).sort((a, b) => b[0] - a[0]);
    for (const [, i] of order) {
      if (left <= 0) break;
      payouts[i] += 1;
      left -= 1;
    }
    return new Map(winners.map((b, i) => [b, payouts[i]]));
  }

  function render() {
    const mine = { side: state.side, stake: state.stake, me: true };
    const bets = [...BETS, mine];
    const total = bets.reduce((sum, b) => sum + b.stake, 0);
    const pour = bets.filter((b) => b.side === "pour").reduce((sum, b) => sum + b.stake, 0);
    const contre = total - pour;
    $("[data-market]").textContent = `${Math.round((pour / total) * 100)} %`;
    $("[data-split] .split__pour").style.width = `${(pour / total) * 100}%`;
    $("[data-odds-pour]").textContent = `Pour ×${fr(total / pour)}`;
    $("[data-odds-contre]").textContent = `Contre ×${fr(total / contre)}`;
    $("[data-pts-pour]").textContent = `${pts(pour)} pts`;
    $("[data-pts-contre]").textContent = `${pts(contre)} pts`;
    const payout = settle(bets, state.side).get(mine);
    $("[data-preview]").textContent =
      state.side === "pour"
        ? `Tu mises ${state.stake} points pour Léa. Si elle tient, tu encaisses ${pts(payout)} points.`
        : `Tu mises ${state.stake} points contre Léa. Si elle rate, tu encaisses ${pts(payout)} points.`;
    for (const button of demo.querySelectorAll("[data-side]")) {
      button.setAttribute("aria-pressed", String(button.dataset.side === state.side));
    }
    for (const button of demo.querySelectorAll("[data-stake]")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.stake) === state.stake));
    }
    return { bets, mine };
  }

  for (const button of demo.querySelectorAll("[data-side]")) {
    button.addEventListener("click", () => {
      state.side = button.dataset.side;
      render();
    });
  }
  for (const button of demo.querySelectorAll("[data-stake]")) {
    button.addEventListener("click", () => {
      state.stake = Number(button.dataset.stake);
      render();
    });
  }

  const verdict = $("[data-verdict]");
  $("[data-go]").addEventListener("click", () => {
    const { bets, mine } = render();
    const held = Math.random() < ALGO;
    const won = (state.side === "pour") === held;
    const payout = won ? settle(bets, state.side).get(mine) : 0;
    verdict.dataset.result = held ? "tenu" : "rate";
    $("[data-verdict-stamp]").src = held ? "assets/tampon-tenu.svg" : "assets/tampon-rate.svg";
    $("[data-verdict-stamp]").alt = held ? "Tenu" : "Raté";
    $("[data-verdict-time]").textContent = held ? "47:41" : "48:07";
    $("[data-verdict-text]").textContent = won
      ? `Léa ${held ? "tient son contrat, 19 secondes d'avance" : "rate de 7 secondes"}. Tu encaisses ${pts(payout)} points.`
      : `Léa ${held ? "tient son contrat, 19 secondes d'avance" : "rate de 7 secondes"}. Tes ${state.stake} points partent chez ceux d'en face.`;
    verdict.hidden = false;
    $("[data-again]").focus();
  });
  $("[data-again]").addEventListener("click", () => {
    verdict.hidden = true;
    $("[data-go]").focus();
  });

  render();
}
