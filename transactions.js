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

const SESSION_KEY = "rolex_session_token";


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

const backBtn =
  document.getElementById("backBtn");

const transactionCount =
  document.getElementById("transactionCount");

const transactionsBody =
  document.getElementById("transactionsBody");

const tableState =
  document.getElementById("tableState");

const tableWrapper =
  document.getElementById("tableWrapper");


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
| TOKEN
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


  /*
   * Pas de session
   */
  if (!token) {

    window.location.href =
      "connexion.html";

    return;
  }


  showLoading();


  try {

    /*
     * Toutes les transactions
     * viennent directement de PostgreSQL.
     *
     * La fonction retourne :
     *
     * id
     * transaction_code
     * user_id
     * type
     * status
     * amount
     * balance_before
     * balance_after
     * reference_id
     * description
     * created_at
     * completed_at
     */

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_my_transactions",
      {
        p_token: token
      }
    );


    /*
     * Erreur Supabase
     */

    if (error) {

      console.error(
        "get_my_transactions :",
        error
      );


      if (
        error.message &&
        error.message
          .toLowerCase()
          .includes("session")
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
     * Sécurité :
     * on attend un tableau.
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

  /*
   * Nombre réel de transactions
   */

  transactionCount.textContent =
    String(transactions.length);


  /*
   * Aucune transaction
   */

  if (
    transactions.length === 0
  ) {

    tableWrapper.style.display =
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


  /*
   * Transactions disponibles
   */

  tableState.style.display =
    "none";

  tableWrapper.style.display =
    "block";


  transactionsBody.innerHTML =
    transactions
      .map(
        transaction =>
          createTransactionRow(
            transaction
          )
      )
      .join("");
}


/*
|--------------------------------------------------------------------------
| LIGNE DU TABLEAU
|--------------------------------------------------------------------------
*/

function createTransactionRow(
  transaction
) {

  /*
   * IMPORTANT :
   *
   * L'identifiant professionnel
   * de chaque transaction vient
   * directement de :
   *
   * transactions.transaction_code
   */

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


  const createdAt =
    formatDate(
      transaction.created_at
    );


  const completedAt =
    formatDate(
      transaction.completed_at
    );


  return `

    <tr>

      <!-- IDENTIFIANT PROFESSIONNEL -->
      <td>

        <span class="transaction-code">
          ${safeText(transactionCode)}
        </span>

      </td>


      <!-- TYPE -->
      <td>

        <span class="transaction-type">
          ${safeText(type)}
        </span>

      </td>


      <!-- STATUT -->
      <td>

        ${status}

      </td>


      <!-- MONTANT -->
      <td>

        <span class="amount ${amountClass}">
          ${safeText(amount)}
        </span>

      </td>


      <!-- SOLDE AVANT -->
      <td>

        <span class="balance">
          ${safeText(balanceBefore)}
        </span>

      </td>


      <!-- SOLDE APRÈS -->
      <td>

        <span class="balance">
          ${safeText(balanceAfter)}
        </span>

      </td>


      <!-- DESCRIPTION -->
      <td>

        <span class="description">
          ${safeText(description)}
        </span>

      </td>


      <!-- DATE -->
      <td>

        <span class="date">
          ${safeText(createdAt)}
        </span>

      </td>


      <!-- DATE DE FIN -->
      <td>

        <span class="date">
          ${safeText(completedAt)}
        </span>

      </td>

    </tr>

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


  /*
   * On traduit seulement
   * les types connus.
   *
   * Si un nouveau type existe
   * dans la DB, son vrai nom
   * sera affiché.
   */

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
      "Commission",

    commission:
      "Commission",

    refund:
      "Remboursement",

    signup_bonus:
      "Bonus",

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
        —
      </span>
    `;
  }


  const raw =
    String(status).trim();


  const normalized =
    raw.toLowerCase();


  let cssClass =
    "status-neutral";


  /*
   * Statuts positifs
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
  }


  /*
   * Statuts en cours
   */

  else if (

    normalized === "pending" ||

    normalized === "processing"

  ) {

    cssClass =
      "status-pending";
  }


  /*
   * Statuts négatifs
   */

  else if (

    normalized === "rejected" ||

    normalized === "failed" ||

    normalized === "cancelled" ||

    normalized === "canceled"

  ) {

    cssClass =
      "status-danger";
  }


  return `

    <span class="status ${cssClass}">
      ${safeText(raw)}
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
| COULEUR DU MONTANT
|--------------------------------------------------------------------------
*/

function getAmountClass(
  transaction
) {

  const type =
    String(
      transaction.type || ""
    ).toLowerCase();


  /*
   * Entrées
   */

  const positiveTypes = [

    "deposit",

    "daily_income",

    "referral_commission",

    "commission",

    "refund",

    "signup_bonus"

  ];


  /*
   * Sorties
   */

  const negativeTypes = [

    "withdrawal",

    "purchase",

    "product_purchase",

    "activation"

  ];


  if (
    positiveTypes.includes(type)
  ) {

    return "amount-positive";
  }


  if (
    negativeTypes.includes(type)
  ) {

    return "amount-negative";
  }


  /*
   * Type inconnu :
   * aucune supposition.
   */

  return "amount-neutral";
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

  tableWrapper.style.display =
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

  tableWrapper.style.display =
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
