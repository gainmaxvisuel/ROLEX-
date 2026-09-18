const SUPABASE_URL =
  "https://cbxjcwjlhvicurpndoyz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const SESSION_KEY =
  "rolex_session_token";


/* =========================
   ÉLÉMENTS
========================= */

const transactionsList =
  document.getElementById("transactionsList");


/* =========================
   FORMATAGE DU MONTANT
========================= */

function formatAmount(amount) {

  const number = Number(amount || 0);

  return number.toLocaleString("fr-FR") + " XOF";
}


/* =========================
   FORMATAGE DATE + HEURE
========================= */

function formatDate(dateValue) {

  if (!dateValue) {
    return "Date inconnue";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }) + " à " +
  date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });
}


/* =========================
   NOM DE LA TRANSACTION
========================= */

function getTransactionName(transaction) {

  const type =
    String(transaction?.type || "").trim();

  if (!type) {
    return "Transaction";
  }

  const names = {

    deposit:
      "Dépôt",

    withdrawal:
      "Retrait",

    investment:
      "Investissement",

    investment_purchase:
      "Achat d'investissement",

    product_purchase:
      "Achat de produit",

    commission:
      "Commission",

    referral:
      "Parrainage",

    referral_bonus:
      "Bonus de parrainage",

    profit:
      "Profit",

    earning:
      "Gain",

    reward:
      "Récompense",

    cashback:
      "Cashback",

    activation:
      "Activation",

    refund:
      "Remboursement",

    bonus:
      "Bonus"

  };

  if (names[type.toLowerCase()]) {
    return names[type.toLowerCase()];
  }

  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter => letter.toUpperCase());
}


/* =========================
   STATUT
========================= */

function getStatusInfo(status) {

  const value =
    String(status || "")
      .trim()
      .toLowerCase();

  switch (value) {

    case "completed":
    case "complete":
      return {
        label: "Terminé",
        className: "success"
      };

    case "approved":
      return {
        label: "Approuvé",
        className: "success"
      };

    case "success":
    case "successful":
      return {
        label: "Réussi",
        className: "success"
      };

    case "verified":
      return {
        label: "Vérifié",
        className: "success"
      };

    case "pending":
      return {
        label: "En attente",
        className: "pending"
      };

    case "processing":
      return {
        label: "En traitement",
        className: "pending"
      };

    case "rejected":
      return {
        label: "Rejeté",
        className: "danger"
      };

    case "failed":
      return {
        label: "Échec",
        className: "danger"
      };

    case "cancelled":
    case "canceled":
      return {
        label: "Annulé",
        className: "danger"
      };

    case "reversed":
      return {
        label: "Inversé",
        className: "danger"
      };

    default:
      return {
        label: status || "Inconnu",
        className: "neutral"
      };
  }
}


/* =========================
   TYPE DE MONTANT
========================= */

function getAmountClass(transaction) {

  const type =
    String(transaction?.type || "")
      .trim()
      .toLowerCase();

  const negativeTypes = [

    "withdrawal",
    "withdraw",
    "investment",
    "investment_purchase",
    "product_purchase",
    "fee",
    "payment",
    "purchase"

  ];

  const positiveTypes = [

    "deposit",
    "commission",
    "referral",
    "referral_bonus",
    "profit",
    "earning",
    "reward",
    "cashback",
    "bonus",
    "refund"

  ];

  if (negativeTypes.includes(type)) {
    return "negative";
  }

  if (positiveTypes.includes(type)) {
    return "positive";
  }

  const amount =
    Number(transaction?.amount || 0);

  if (amount < 0) {
    return "negative";
  }

  if (amount > 0) {
    return "positive";
  }

  return "neutral";
}


/* =========================
   AFFICHAGE D'UNE TRANSACTION
========================= */

function createTransactionCard(transaction) {

  const name =
    getTransactionName(transaction);

  const status =
    getStatusInfo(transaction?.status);

  const amountClass =
    getAmountClass(transaction);

  const amount =
    formatAmount(transaction?.amount);

  const date =
    formatDate(transaction?.created_at);

  const card =
    document.createElement("article");

  card.className =
    "transaction";

  card.innerHTML = `

    <div class="transaction-name">
      ${escapeHTML(name)}
    </div>

    <div class="status ${status.className}">
      ${escapeHTML(status.label)}
    </div>

    <div class="amount ${amountClass}">
      ${escapeHTML(amount)}
    </div>

    <div class="date">
      ${escapeHTML(date)}
    </div>

  `;

  return card;
}


/* =========================
   PROTECTION HTML
========================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   CHARGEMENT
========================= */

async function loadTransactions() {

  const token =
    localStorage.getItem(SESSION_KEY);

  if (!token) {

    window.location.href =
      "login.html";

    return;
  }

  transactionsList.innerHTML = `
    <div class="loading">
      Chargement des transactions...
    </div>
  `;

  try {

    const { data, error } =
      await supabaseClient.rpc(
        "get_my_transactions",
        {
          p_token: token
        }
      );

    if (error) {

      console.error(
        "Erreur transactions :",
        error
      );

      const errorMessage =
        String(error.message || "")
          .toLowerCase();

      if (
        errorMessage.includes("session invalide") ||
        errorMessage.includes("session expir")
      ) {

        localStorage.removeItem(
          SESSION_KEY
        );

        window.location.href =
          "login.html";

        return;
      }

      throw error;
    }


    const transactions =
      Array.isArray(data)
        ? data
        : [];


    /* =========================
       TRI : PLUS RÉCENT D'ABORD
    ========================= */

    const sortedTransactions =
      [...transactions].sort(
        (a, b) => {

          const dateA =
            new Date(
              a?.created_at || 0
            ).getTime();

          const dateB =
            new Date(
              b?.created_at || 0
            ).getTime();

          return dateB - dateA;
        }
      );


    /* =========================
       AUCUNE TRANSACTION
    ========================= */

    if (
      sortedTransactions.length === 0
    ) {

      transactionsList.innerHTML = `

        <div class="empty">

          <div class="empty-title">
            Aucune transaction
          </div>

          <div class="empty-text">
            Vos transactions apparaîtront ici.
          </div>

        </div>

      `;

      return;
    }


    /* =========================
       AFFICHAGE
    ========================= */

    transactionsList.innerHTML = "";

    sortedTransactions.forEach(
      transaction => {

        const card =
          createTransactionCard(
            transaction
          );

        transactionsList.appendChild(
          card
        );

      }
    );

  } catch (error) {

    console.error(
      "Erreur chargement transactions :",
      error
    );

    transactionsList.innerHTML = `

      <div class="error">
        Impossible de charger les transactions.
        Veuillez réessayer.
      </div>

    `;
  }
}


/* =========================
   LANCEMENT
========================= */

document.addEventListener(
  "DOMContentLoaded",
  loadTransactions
);
