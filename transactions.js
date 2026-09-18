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

const transactionsList =
  document.getElementById(
    "transactionsList"
  );


/* =========================
   FORMAT MONTANT
========================= */

function formatAmount(amount) {

  const number = Number(amount || 0);

  const formatted =
    Math.abs(number).toLocaleString("fr-FR");

  if (number > 0) {
    return "+" + formatted + " XOF";
  }

  if (number < 0) {
    return "-" + formatted + " XOF";
  }

  return formatted + " XOF";
}


/* =========================
   DATE + HEURE
========================= */

function formatDate(dateValue) {

  if (!dateValue) {
    return "Date inconnue";
  }

  const date =
    new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return (
    date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }) +
    " à " +
    date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    })
  );
}


/* =========================
   NOM TRANSACTION
========================= */

function getTransactionName(transaction) {

  const type =
    String(transaction?.type || "")
      .trim()
      .toLowerCase();

  const names = {

    deposit: "Dépôt",

    withdrawal: "Retrait",

    withdraw: "Retrait",

    investment: "Investissement",

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
      "Bonus",

    fee:
      "Frais",

    payment:
      "Paiement"

  };

  if (names[type]) {
    return names[type];
  }

  if (!type) {
    return "Transaction";
  }

  return type
    .replaceAll("_", " ")
    .replace(/\b\w/g, letter =>
      letter.toUpperCase()
    );
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
    case "accepted":

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
    case "validated":
    case "validate":
    case "paid":

      return {
        label: "Validé",
        className: "success"
      };

    case "pending":
    case "waiting":
    case "waiting_payment":

      return {
        label: "En attente",
        className: "pending"
      };

    case "processing":
    case "in_progress":

      return {
        label: "En traitement",
        className: "pending"
      };

    case "rejected":
    case "refused":

      return {
        label: "Rejeté",
        className: "danger"
      };

    case "failed":
    case "failure":

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

    case "expired":

      return {
        label: "Expiré",
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
   COULEUR DU MONTANT
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
   CRÉER UNE TRANSACTION
========================= */

function createTransactionCard(transaction) {

  /*
    IMPORTANT :
    On utilise le code propre à la transaction.

    transactions.transaction_code
  */

  const transactionCode =
    transaction?.transaction_code ||
    "Code indisponible";

  const transactionName =
    getTransactionName(
      transaction
    );

  const status =
    getStatusInfo(
      transaction?.status
    );

  const amountClass =
    getAmountClass(
      transaction
    );

  const amount =
    formatAmount(
      transaction?.amount
    );

  const date =
    formatDate(
      transaction?.created_at
    );

  const card =
    document.createElement("article");

  card.className =
    "transaction";

  card.innerHTML = `

    <div class="transaction-code">
      ${escapeHTML(transactionCode)}
    </div>

    <div class="transaction-name">
      ${escapeHTML(transactionName)}
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
   CHARGEMENT
========================= */

async function loadTransactions() {

  const token =
    localStorage.getItem(
      SESSION_KEY
    );

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

    /*
      IMPORTANT :

      On utilise la fonction originale
      get_my_transactions.

      Elle retourne TOUTES les transactions
      de l'utilisateur sans filtrer le statut.
    */

    const {
      data,
      error
    } =
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

      const message =
        String(
          error.message || ""
        ).toLowerCase();

      if (
        message.includes(
          "session invalide"
        ) ||
        message.includes(
          "session expir"
        )
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


    /*
      NE PAS FILTRER PAR STATUS.

      On garde :
      completed
      pending
      reversed
      rejected
      failed
      etc.
    */

    const transactions =
      Array.isArray(data)
        ? data
        : [];


    /*
      TRI DU PLUS RÉCENT
      AU PLUS ANCIEN
    */

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
       AFFICHAGE DE TOUTES
       LES TRANSACTIONS
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
