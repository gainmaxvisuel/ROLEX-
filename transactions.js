const SUPABASE_URL =
  "https://cbxjcwjlhvicurpndoyz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
*/

const SESSION_KEY =
  "rolex_session_token";


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

const backBtn =
  document.getElementById("backBtn");

const transactionCount =
  document.getElementById("transactionCount");

const transactionsList =
  document.getElementById("transactionsList");

const tableState =
  document.getElementById("tableState");


/*
|--------------------------------------------------------------------------
| INITIALISATION
|--------------------------------------------------------------------------
*/

document.addEventListener(
  "DOMContentLoaded",
  () => {

    backBtn.addEventListener(
      "click",
      () => {
        window.location.href =
          "dashboard.html";
      }
    );

    loadTransactions();
  }
);


/*
|--------------------------------------------------------------------------
| SESSION
|--------------------------------------------------------------------------
*/

function getSessionToken() {

  const token =
    localStorage.getItem(
      SESSION_KEY
    );

  if (!token) {
    return null;
  }

  return token.trim();
}


/*
|--------------------------------------------------------------------------
| CHARGEMENT
|--------------------------------------------------------------------------
*/

async function loadTransactions() {

  const token =
    getSessionToken();


  if (!token) {

    window.location.href =
      "connexion.html";

    return;
  }


  showLoading();


  try {

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_my_transactions",
      {
        p_token: token
      }
    );


    if (error) {

      console.error(
        "get_my_transactions :",
        error
      );


      /*
       * On ne détruit la session
       * que si PostgreSQL indique
       * réellement que la session
       * est invalide.
       */

      if (
        error.message &&
        (
          error.message
            .toLowerCase()
            .includes("session invalide")
          ||
          error.message
            .toLowerCase()
            .includes("session expir")
        )
      ) {

        localStorage.removeItem(
          SESSION_KEY
        );

        window.location.href =
          "connexion.html";

        return;
      }


      showError(
        error.message ||
        "Impossible de charger les transactions."
      );

      return;
    }


    /*
     * La fonction SQL retourne
     * directement toutes les
     * transactions de l'utilisateur.
     */

    const transactions =
      Array.isArray(data)
        ? data
        : [];


    renderTransactions(
      transactions
    );

  } catch (error) {

    console.error(error);

    showError(
      "Une erreur est survenue lors du chargement."
    );
  }
}


/*
|--------------------------------------------------------------------------
| AFFICHAGE
|--------------------------------------------------------------------------
*/

function renderTransactions(
  transactions
) {

  transactionCount.textContent =
    String(
      transactions.length
    );


  if (
    transactions.length === 0
  ) {

    transactionsList.style.display =
      "none";

    tableState.style.display =
      "block";

    tableState.innerHTML = `

      <div class="state-icon">
        —
      </div>

      <div class="state-title">
        Aucune transaction
      </div>

      <div class="state-text">
        Aucune opération n'est actuellement enregistrée sur votre compte.
      </div>

    `;

    return;
  }


  tableState.style.display =
    "none";

  transactionsList.style.display =
    "flex";


  /*
   * Sécurité supplémentaire :
   * affichage de la plus récente
   * vers la plus ancienne.
   */

  const sortedTransactions =
    [...transactions].sort(
      (a, b) => {

        const dateA =
          new Date(
            a.created_at || 0
          ).getTime();

        const dateB =
          new Date(
            b.created_at || 0
          ).getTime();

        return dateB - dateA;
      }
    );


  transactionsList.innerHTML =
    sortedTransactions
      .map(
        transaction =>
          createTransactionCard(
            transaction
          )
      )
      .join("");
}


/*
|--------------------------------------------------------------------------
| CARTE TRANSACTION
|--------------------------------------------------------------------------
*/

function createTransactionCard(
  transaction
) {

  const transactionCode =
    transaction.transaction_code
      ? transaction.transaction_code
      : "—";


  const type =
    formatType(
      transaction.type
    );


  const status =
    formatStatus(
      transaction.status
    );


  const amount =
    formatAmount(
      transaction.amount
    );


  const amountClass =
    getAmountClass(
      transaction
    );


  const balanceBefore =
    formatBalance(
      transaction.balance_before
    );


  const balanceAfter =
    formatBalance(
      transaction.balance_after
    );


  const description =
    transaction.description
      ? transaction.description
      : "—";


  const reference =
    transaction.reference_id
      ? transaction.reference_id
      : "—";


  const createdAt =
    formatDate(
      transaction.created_at
    );


  const completedAt =
    formatDate(
      transaction.completed_at
    );


  return `

    <article class="transaction-card">

      <!-- STATUT ÉPINGLÉ -->
      <div class="transaction-status">
        ${status}
      </div>


      <!-- EN-TÊTE -->
      <div class="transaction-top">

        <div>

          <div class="transaction-type">
            ${safeText(type)}
          </div>

          <span class="transaction-code">
            ${safeText(transactionCode)}
          </span>

        </div>


        <div class="transaction-amount ${amountClass}">
          ${safeText(amount)}
        </div>

      </div>


      <!-- TABLEAU DE LA TRANSACTION -->
      <div class="details-table">


        <div class="detail-row">

          <div class="detail-label">
            Identifiant
          </div>

          <div class="detail-value">
            ${safeText(transactionCode)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Type
          </div>

          <div class="detail-value">
            ${safeText(type)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Montant
          </div>

          <div class="detail-value amount-value">
            ${safeText(amount)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Solde avant
          </div>

          <div class="detail-value balance-value">
            ${safeText(balanceBefore)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Solde après
          </div>

          <div class="detail-value balance-value">
            ${safeText(balanceAfter)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Description
          </div>

          <div class="detail-value description-value">
            ${safeText(description)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Référence
          </div>

          <div class="detail-value">
            ${safeText(reference)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Date
          </div>

          <div class="detail-value">
            ${safeText(createdAt)}
          </div>

        </div>


        <div class="detail-row">

          <div class="detail-label">
            Terminé le
          </div>

          <div class="detail-value">
            ${safeText(completedAt)}
          </div>

        </div>


      </div>

    </article>

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


  const raw =
    String(type).trim();


  const labels = {

    deposit:
      "Dépôt",

    withdrawal:
      "Retrait",

    purchase:
      "Achat",

    product_purchase:
      "Achat produit",

    daily_income:
      "Revenu",

    referral_commission:
      "Commission de parrainage",

    commission:
      "Commission",

    refund:
      "Remboursement",

    signup_bonus:
      "Bonus d'inscription",

    activation:
      "Activation"
  };


  return (
    labels[
      raw.toLowerCase()
    ] || raw
  );
}


/*
|--------------------------------------------------------------------------
| STATUT
|--------------------------------------------------------------------------
*/

function formatStatus(status) {

  if (!status) {

    return `
      <span class="status status-neutral">
        Inconnu
      </span>
    `;
  }


  const raw =
    String(status).trim();


  const normalized =
    raw.toLowerCase();


  let cssClass =
    "status-neutral";


  let label =
    raw;


  /*
   * STATUTS VALIDÉS
   */

  if (
    normalized === "approved" ||
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "success" ||
    normalized === "successful" ||
    normalized === "verified"
  ) {

    cssClass =
      "status-success";

    const labels = {
      approved: "Approuvé",
      completed: "Terminé",
      complete: "Terminé",
      success: "Succès",
      successful: "Réussi",
      verified: "Vérifié"
    };

    label =
      labels[normalized] || raw;
  }


  /*
   * STATUTS EN ATTENTE
   */

  else if (
    normalized === "pending" ||
    normalized === "processing"
  ) {

    cssClass =
      "status-pending";

    const labels = {
      pending: "En attente",
      processing: "En traitement"
    };

    label =
      labels[normalized] || raw;
  }


  /*
   * STATUTS REFUSÉS / ANNULÉS
   */

  else if (
    normalized === "rejected" ||
    normalized === "failed" ||
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "reversed"
  ) {

    cssClass =
      "status-danger";

    const labels = {
      rejected: "Rejeté",
      failed: "Échec",
      cancelled: "Annulé",
      canceled: "Annulé",
      reversed: "Annulé / Inversé"
    };

    label =
      labels[normalized] || raw;
  }


  return `

    <span class="status ${cssClass}">
      ${safeText(label)}
    </span>

  `;
}


/*
|--------------------------------------------------------------------------
| MONTANT
|--------------------------------------------------------------------------
*/

function formatAmount(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }


  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {
    return "—";
  }


  const formatted =
    new Intl.NumberFormat(
      "fr-FR"
    ).format(
      Math.abs(number)
    );


  return `${formatted} XOF`;
}


/*
|--------------------------------------------------------------------------
| SOLDE
|--------------------------------------------------------------------------
*/

function formatBalance(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }


  const number =
    Number(value);


  if (
    !Number.isFinite(number)
  ) {
    return "—";
  }


  return `${new Intl.NumberFormat(
    "fr-FR"
  ).format(number)} XOF`;
}


/*
|--------------------------------------------------------------------------
| COULEUR MONTANT
|--------------------------------------------------------------------------
*/

function getAmountClass(
  transaction
) {

  const type =
    String(
      transaction.type || ""
    ).toLowerCase();


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


  if (
    positiveTypes.includes(type)
  ) {

    return "";
  }


  if (
    negativeTypes.includes(type)
  ) {

    return "negative";
  }


  return "neutral";
}


/*
|--------------------------------------------------------------------------
| DATE
|--------------------------------------------------------------------------
*/

function formatDate(value) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "—";
  }


  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  ).format(date);
}


/*
|--------------------------------------------------------------------------
| PROTECTION HTML
|--------------------------------------------------------------------------
*/

function safeText(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );
}


/*
|--------------------------------------------------------------------------
| CHARGEMENT
|--------------------------------------------------------------------------
*/

function showLoading() {

  transactionsList.style.display =
    "none";

  tableState.style.display =
    "block";

  transactionCount.textContent =
    "0";


  tableState.innerHTML = `

    <div class="spinner"></div>

    <div class="state-title">
      Chargement des transactions
    </div>

    <div class="state-text">
      Récupération des données...
    </div>

  `;
}


/*
|--------------------------------------------------------------------------
| ERREUR
|--------------------------------------------------------------------------
*/

function showError(message) {

  transactionsList.style.display =
    "none";

  tableState.style.display =
    "block";


  tableState.innerHTML = `

    <div class="state-icon">
      !
    </div>

    <div class="state-title">
      Impossible de charger les transactions
    </div>

    <div class="state-text">
      ${safeText(message)}
    </div>

    <button
      type="button"
      class="retry-btn"
      id="retryTransactions"
    >
      Réessayer
    </button>

  `;


  const retryButton =
    document.getElementById(
      "retryTransactions"
    );


  if (retryButton) {

    retryButton.addEventListener(
      "click",
      loadTransactions
    );
  }
      }
