const SUPABASE_URL = "https://cbxjcwjlhvicurpndoyz.supabase.co";
const SUPABASE_KEY = "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const SESSION_KEY = "rolex_session_token";

const professionalIdEl = document.getElementById("professionalId");
const transactionCountEl = document.getElementById("transactionCount");
const transactionsBody = document.getElementById("transactionsBody");
const tableState = document.getElementById("tableState");
const tableWrapper = document.getElementById("tableWrapper");
const backBtn = document.getElementById("backBtn");

let currentTransactions = [];

/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", async () => {
  backBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });

  await loadTransactions();
});


/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
*/

function getSessionToken() {
  const token = localStorage.getItem(SESSION_KEY);

  if (!token || !token.trim()) {
    return null;
  }

  return token.trim();
}


/*
|--------------------------------------------------------------------------
| CHARGEMENT DES TRANSACTIONS
|--------------------------------------------------------------------------
*/

async function loadTransactions() {
  const token = getSessionToken();

  if (!token) {
    window.location.href = "connexion.html";
    return;
  }

  showLoading();

  try {
    /*
     * La fonction PostgreSQL retourne directement SETOF transactions.
     * Aucun montant, statut ou transaction n'est inventé côté JavaScript.
     */
    const { data, error } = await supabaseClient.rpc(
      "get_my_transactions",
      {
        p_token: token
      }
    );

    if (error) {
      console.error("Erreur get_my_transactions :", error);

      if (
        error.message &&
        error.message.toLowerCase().includes("session")
      ) {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "connexion.html";
        return;
      }

      showError(error.message || "Impossible de charger les transactions.");
      return;
    }

    currentTransactions = Array.isArray(data) ? data : [];

    /*
     * L'identifiant professionnel est récupéré depuis la base.
     * On utilise une fonction dédiée si elle existe déjà.
     */
    await loadProfessionalId(token);

    renderTransactions(currentTransactions);

  } catch (error) {
    console.error(error);
    showError("Une erreur est survenue lors du chargement.");
  }
}


/*
|--------------------------------------------------------------------------
| IDENTIFIANT PROFESSIONNEL
|--------------------------------------------------------------------------
|
| On tente de récupérer l'identifiant depuis une fonction serveur existante.
| Si aucune fonction dédiée n'est disponible, on utilise les données déjà
| présentes dans la transaction lorsque possible.
|
*/

async function loadProfessionalId(token) {
  /*
   * La table users n'est pas interrogée directement.
   * On tente les fonctions RPC existantes afin de respecter le modèle
   * de sécurité de la plateforme.
   */

  const possibleFunctions = [
    "get_dashboard_home",
    "get_my_dashboard"
  ];

  for (const functionName of possibleFunctions) {
    try {
      const { data, error } = await supabaseClient.rpc(
        functionName,
        {
          p_token: token
        }
      );

      if (error || !data) {
        continue;
      }

      const profile = extractProfileData(data);

      if (profile.user_code) {
        professionalIdEl.textContent = profile.user_code;
        return;
      }

      if (profile.professional_id) {
        professionalIdEl.textContent = profile.professional_id;
        return;
      }
    } catch (error) {
      console.warn(`RPC ${functionName} indisponible`, error);
    }
  }

  /*
   * Si aucune fonction dashboard ne retourne l'identifiant, on affiche
   * une information neutre plutôt que d'inventer une valeur.
   */
  professionalIdEl.textContent = "Non disponible";
}


/*
|--------------------------------------------------------------------------
| EXTRACTION PROFIL
|--------------------------------------------------------------------------
*/

function extractProfileData(data) {
  let result = data;

  if (Array.isArray(result)) {
    result = result[0] || {};
  }

  if (
    result &&
    typeof result === "object" &&
    result.data &&
    typeof result.data === "object"
  ) {
    result = result.data;
  }

  return result && typeof result === "object"
    ? result
    : {};
}


/*
|--------------------------------------------------------------------------
| AFFICHAGE
|--------------------------------------------------------------------------
*/

function renderTransactions(transactions) {
  transactionCountEl.textContent = String(transactions.length);

  if (!transactions.length) {
    tableWrapper.style.display = "none";

    tableState.style.display = "block";
    tableState.innerHTML = `
      <div class="state-icon">—</div>
      <div class="state-title">Aucune transaction</div>
      <div class="state-text">
        Aucune opération n'est actuellement enregistrée sur votre compte.
      </div>
    `;

    return;
  }

  tableState.style.display = "none";
  tableWrapper.style.display = "block";

  transactionsBody.innerHTML = transactions
    .map(transaction => createTransactionRow(transaction))
    .join("");
}


/*
|--------------------------------------------------------------------------
| LIGNE TRANSACTION
|--------------------------------------------------------------------------
*/

function createTransactionRow(transaction) {
  const transactionCode = safeText(
    transaction.transaction_code || "—"
  );

  const type = formatType(
    transaction.type
  );

  const status = formatStatus(
    transaction.status
  );

  const amount = formatAmount(
    transaction.amount
  );

  const balanceBefore = formatBalance(
    transaction.balance_before
  );

  const balanceAfter = formatBalance(
    transaction.balance_after
  );

  const description = safeText(
    transaction.description || "—"
  );

  const createdAt = formatDate(
    transaction.created_at
  );

  const completedAt = formatDate(
    transaction.completed_at
  );

  return `
    <tr>
      <td>
        <span class="transaction-code">
          ${transactionCode}
        </span>
      </td>

      <td>
        <span class="type">
          ${type}
        </span>
      </td>

      <td>
        ${status}
      </td>

      <td>
        <span class="amount ${getAmountClass(transaction)}">
          ${amount}
        </span>
      </td>

      <td>
        <span class="balance">
          ${balanceBefore}
        </span>
      </td>

      <td>
        <span class="balance">
          ${balanceAfter}
        </span>
      </td>

      <td>
        <span class="description">
          ${description}
        </span>
      </td>

      <td>
        <span class="date">
          ${createdAt}
        </span>
      </td>

      <td>
        <span class="date">
          ${completedAt}
        </span>
      </td>
    </tr>
  `;
}


/*
|--------------------------------------------------------------------------
| STATUT
|--------------------------------------------------------------------------
*/

function formatStatus(status) {
  if (!status) {
    return `
      <span class="status neutral">
        —
      </span>
    `;
  }

  const raw = String(status).trim();
  const normalized = raw.toLowerCase();

  let cssClass = "neutral";
  let label = raw;

  if (
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "approved" ||
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "verified"
  ) {
    cssClass = "success";
  }

  else if (
    normalized === "pending" ||
    normalized === "processing"
  ) {
    cssClass = "pending";
  }

  else if (
    normalized === "rejected" ||
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "canceled"
  ) {
    cssClass = "rejected";
  }

  return `
    <span class="status ${cssClass}">
      ${safeText(label)}
    </span>
  `;
}


/*
|--------------------------------------------------------------------------
| TYPE
|--------------------------------------------------------------------------
*/

function formatType(type) {
  if (!type) {
    return "—";
  }

  const raw = String(type).trim();

  const labels = {
    deposit: "Dépôt",
    withdrawal: "Retrait",
    purchase: "Achat",
    product_purchase: "Achat produit",
    daily_income: "Revenu",
    referral_commission: "Commission",
    commission: "Commission",
    refund: "Remboursement",
    signup_bonus: "Bonus",
    activation: "Activation"
  };

  return safeText(
    labels[raw.toLowerCase()] || raw
  );
}


/*
|--------------------------------------------------------------------------
| MONTANTS
|--------------------------------------------------------------------------
*/

function formatAmount(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  const formatted = new Intl.NumberFormat("fr-FR").format(
    Math.abs(number)
  );

  return `${formatted} XOF`;
}


function formatBalance(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "—";
  }

  return `${new Intl.NumberFormat("fr-FR").format(number)} XOF`;
}


/*
|--------------------------------------------------------------------------
| COULEUR DU MONTANT
|--------------------------------------------------------------------------
*/

function getAmountClass(transaction) {
  const type = String(transaction.type || "").toLowerCase();

  const positiveTypes = [
    "deposit",
    "daily_income",
    "referral_commission",
    "commission",
    "refund",
    "signup_bonus"
  ];

  const negativeTypes = [
    "withdrawal",
    "purchase",
    "product_purchase",
    "activation"
  ];

  if (positiveTypes.includes(type)) {
    return "positive";
  }

  if (negativeTypes.includes(type)) {
    return "negative";
  }

  /*
   * Pour un type inconnu, on ne suppose pas sa nature.
   */
  return "";
}


/*
|--------------------------------------------------------------------------
| DATES
|--------------------------------------------------------------------------
*/

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}


/*
|--------------------------------------------------------------------------
| PROTECTION TEXTE HTML
|--------------------------------------------------------------------------
*/

function safeText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/*
|--------------------------------------------------------------------------
| ÉTATS
|--------------------------------------------------------------------------
*/

function showLoading() {
  tableWrapper.style.display = "none";
  tableState.style.display = "block";

  tableState.innerHTML = `
    <div class="spinner"></div>
    <div class="state-title">
      Chargement des transactions
    </div>
    <div class="state-text">
      Récupération des données...
    </div>
  `;

  transactionCountEl.textContent = "0";
  professionalIdEl.textContent = "Chargement...";
}


function showError(message) {
  tableWrapper.style.display = "none";
  tableState.style.display = "block";

  tableState.innerHTML = `
    <div class="state-icon error-box">!</div>

    <div class="state-title">
      Impossible de charger les transactions
    </div>

    <div class="state-text error-box">
      ${safeText(message)}
    </div>

    <button
      class="retry-btn"
      type="button"
      id="retryTransactions"
    >
      Réessayer
    </button>
  `;

  const retryButton = document.getElementById(
    "retryTransactions"
  );

  if (retryButton) {
    retryButton.addEventListener(
      "click",
      loadTransactions
    );
  }
}
