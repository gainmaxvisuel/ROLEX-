const SUPABASE_URL = "https://cbxjcwjlhvicurpndoyz.supabase.co";
const SUPABASE_KEY = "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const SESSION_KEY = "rolex_session_token";

let countdownTimer = null;
let currentInvestments = [];

document.addEventListener("DOMContentLoaded", () => {
  loadInvestments();

  setInterval(() => {
    loadInvestments();
  }, 60000);
});


/* =========================
   UTILITAIRES
========================= */

function getSessionToken() {
  return localStorage.getItem(SESSION_KEY);
}


function formatXOF(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("fr-FR").format(amount) + " XOF";
}


function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit"
  }).format(date);
}


function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function showToast(message, error = false) {
  const toast = document.getElementById("toast");

  toast.textContent = message;
  toast.className = "toast show" + (error ? " error" : "");

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}


/* =========================
   CHARGEMENT
========================= */

async function loadInvestments() {

  const token = getSessionToken();

  if (!token) {
    window.location.href = "connexion.html";
    return;
  }

  try {

    const { data, error } = await supabaseClient.rpc(
      "get_my_investments",
      {
        p_token: token
      }
    );

    if (error) {
      throw error;
    }

    currentInvestments = Array.isArray(data)
      ? data
      : [];

    renderSummary(currentInvestments);
    renderInvestments(currentInvestments);

  } catch (error) {

    console.error("Erreur investissements :", error);

    document.getElementById("investmentsList").innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <h3>Impossible de charger vos investissements</h3>
        <p>Veuillez actualiser la page.</p>
      </div>
    `;

    showToast("Erreur de chargement", true);
  }
}


/* =========================
   RESUME
========================= */

function renderSummary(items) {

  let totalInvested = 0;
  let totalGenerated = 0;

  for (const item of items) {

    totalInvested += Number(item.price || 0);
    totalGenerated += Number(item.generated_total || 0);

  }

  document.getElementById("totalProducts").textContent =
    items.length;

  document.getElementById("totalInvested").textContent =
    formatXOF(totalInvested);

  document.getElementById("totalGenerated").textContent =
    formatXOF(totalGenerated);
}


/* =========================
   CARTES
========================= */

function renderInvestments(items) {

  const container = document.getElementById("investmentsList");

  if (!items.length) {

    container.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-box-open"></i>
        <h3>Aucun investissement</h3>
        <p>Vous n'avez encore aucun produit actif.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = items.map((item, index) => {

    const status = String(item.status || "").toLowerCase();

    let statusLabel = "Actif";
    let statusClass = "";

    if (status === "completed") {
      statusLabel = "Terminé";
      statusClass = "completed";
    } else if (status !== "active") {
      statusLabel = item.status || "Indisponible";
      statusClass = "inactive";
    }

    /*
      L'image vient directement de products.image_url.
      Aucun chemin d'image inventé.
    */
    const imageHTML = item.image_url
      ? `
        <img
          src="${escapeHTML(item.image_url)}"
          alt="${escapeHTML(item.product_name || "Produit")}"
          loading="lazy"
          onerror="this.style.display='none'"
        >
      `
      : `
        <div style="
          width:100%;
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#d4a317;
          font-size:22px;
        ">
          <i class="fa-solid fa-box"></i>
        </div>
      `;

    return `
      <article class="investment-card">

        <div class="card-main">

          <div class="product-image">
            ${imageHTML}
          </div>

          <div class="product-info">

            <div class="product-head">

              <div class="product-name">
                ${escapeHTML(item.product_name || "Produit")}
              </div>

              <div class="status ${statusClass}">
                <i class="fa-solid fa-circle"></i>
                ${escapeHTML(statusLabel)}
              </div>

            </div>

            <div class="values">

              <div class="value-item">
                <div class="value-label">
                  Investissement
                </div>

                <div class="value-number">
                  ${formatXOF(item.price)}
                </div>
              </div>

              <div class="value-item">
                <div class="value-label">
                  Revenu / 24h
                </div>

                <div class="value-number">
                  ${formatXOF(item.daily_return)}
                </div>
              </div>

              <div class="value-item">
                <div class="value-label">
                  Généré
                </div>

                <div class="value-number">
                  ${formatXOF(item.generated_total)}
                </div>
              </div>

              <div class="value-item">
                <div class="value-label">
                  Total prévu
                </div>

                <div class="value-number">
                  ${formatXOF(item.total_return)}
                </div>
              </div>

            </div>

          </div>

        </div>

        <div class="card-bottom">

          <div class="bottom-item">

            <div class="bottom-label">
              Début
            </div>

            <div class="bottom-value">
              ${formatDate(item.start_at)}
            </div>

          </div>

          <div class="bottom-item center">

            <div class="bottom-label">
              Prochain revenu
            </div>

            <div
              class="bottom-value countdown"
              id="countdown-${index}"
              data-next-income="${escapeHTML(item.next_income_at || "")}"
            >
              Calcul...
            </div>

          </div>

          <div class="bottom-item right">

            <div class="bottom-label">
              Fin
            </div>

            <div class="bottom-value">
              ${formatDate(item.end_at)}
            </div>

          </div>

        </div>

      </article>
    `;

  }).join("");

  startCountdowns();
}


/* =========================
   COMPTE À REBOURS
========================= */

function startCountdowns() {

  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

  updateCountdowns();

  countdownTimer = setInterval(() => {
    updateCountdowns();
  }, 1000);
}


function updateCountdowns() {

  const countdowns =
    document.querySelectorAll(".countdown");

  countdowns.forEach(element => {

    const nextIncome =
      element.dataset.nextIncome;

    if (!nextIncome) {

      element.textContent = "Terminé";
      element.classList.add("done");

      return;
    }

    const target =
      new Date(nextIncome).getTime();

    if (Number.isNaN(target)) {

      element.textContent = "—";

      return;
    }

    const now = Date.now();

    let difference =
      target - now;

    if (difference <= 0) {

      element.textContent =
        "Traitement en cours";

      element.classList.remove("done");

      return;
    }

    const totalSeconds =
      Math.floor(difference / 1000);

    const hours =
      Math.floor(totalSeconds / 3600);

    const minutes =
      Math.floor((totalSeconds % 3600) / 60);

    const seconds =
      totalSeconds % 60;

    element.textContent =
      `${hours}h ${String(minutes).padStart(2, "0")}min ${String(seconds).padStart(2, "0")}s`;

  });
}


/* =========================
   NETTOYAGE
========================= */

window.addEventListener("beforeunload", () => {

  if (countdownTimer) {
    clearInterval(countdownTimer);
  }

});
