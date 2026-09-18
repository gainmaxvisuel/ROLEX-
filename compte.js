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
   ELEMENTS
========================= */

const loading =
  document.getElementById("loading");

const content =
  document.getElementById("content");

const errorBox =
  document.getElementById("error");

const errorMessage =
  document.getElementById("errorMessage");


/* =========================
   INITIALISATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  loadAccount
);


/* =========================
   RETOUR
========================= */

document
  .getElementById("backBtn")
  .addEventListener(
    "click",
    () => {
      window.location.href =
        "dashboard.html";
    }
  );


/* =========================
   DECONNEXION
========================= */

document
  .getElementById("logoutBtn")
  .addEventListener(
    "click",
    logout
  );


/* =========================
   SESSION
========================= */

function getToken() {

  const token =
    localStorage.getItem(
      SESSION_KEY
    );

  if (!token) {
    return null;
  }

  return token.trim();
}


/* =========================
   CHARGEMENT
========================= */

async function loadAccount() {

  const token =
    getToken();

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
      "get_my_dashboard",
      {
        p_token: token
      }
    );

    if (error) {

      console.error(
        "Erreur compte :",
        error
      );

      showError(
        error.message
      );

      return;
    }

    const result =
      normalizeData(data);

    /*
     * On recherche les données
     * dans le JSON retourné par la
     * fonction existante.
     */

    const user =
      result.user ||
      result.profile ||
      result;


    /* =========================
       INFORMATIONS
    ========================= */

    const name =
      firstValue(
        user.full_name,
        result.full_name
      );

    const phone =
      firstValue(
        user.phone,
        result.phone
      );

    const userCode =
      firstValue(
        user.user_code,
        result.user_code
      );

    const referralCode =
      firstValue(
        user.referral_code,
        result.referral_code
      );

    const country =
      firstValue(
        user.country_name,
        result.country_name,
        user.country_code,
        result.country_code
      );

    const status =
      firstValue(
        user.status,
        result.status
      );

    const createdAt =
      firstValue(
        user.created_at,
        result.created_at
      );


    setText(
      "fullName",
      name
    );

    setText(
      "infoName",
      name
    );

    setText(
      "phone",
      phone
    );

    setText(
      "infoPhone",
      phone
    );

    setText(
      "userCode",
      userCode
    );

    setText(
      "referralCode",
      referralCode
    );

    setText(
      "country",
      country
    );

    setText(
      "status",
      formatStatus(status)
    );

    setText(
      "createdAt",
      formatDate(createdAt)
    );


    /* =========================
       AVATAR
    ========================= */

    if (name) {

      document.getElementById(
        "avatar"
      ).textContent =
        getInitials(name);

    }


    /* =========================
       FINANCES
    ========================= */

    const balance =
      firstValue(
        user.balance,
        result.balance
      );

    const totalProfit =
      firstValue(
        user.total_profit,
        result.total_profit
      );

    const totalDeposits =
      firstValue(
        user.total_deposits,
        result.total_deposits
      );

    const totalWithdrawals =
      firstValue(
        user.total_withdrawals,
        result.total_withdrawals
      );

    const totalCommissions =
      firstValue(
        user.total_commissions,
        result.total_commissions
      );


    setText(
      "balance",
      formatMoney(balance)
    );

    setText(
      "totalProfit",
      formatMoney(totalProfit)
    );

    setText(
      "totalDeposits",
      formatMoney(totalDeposits)
    );

    setText(
      "totalWithdrawals",
      formatMoney(totalWithdrawals)
    );

    setText(
      "totalCommissions",
      formatMoney(totalCommissions)
    );


    showContent();

  } catch (err) {

    console.error(
      "Erreur inattendue :",
      err
    );

    showError(
      err.message ||
      "Une erreur est survenue."
    );
  }
}


/* =========================
   NORMALISATION JSON
========================= */

function normalizeData(data) {

  if (
    Array.isArray(data)
  ) {
    return data[0] || {};
  }

  if (
    data &&
    typeof data === "object" &&
    data.data &&
    typeof data.data === "object"
  ) {
    return data.data;
  }

  return data || {};
}


/* =========================
   PREMIERE VALEUR DISPONIBLE
========================= */

function firstValue(...values) {

  for (const value of values) {

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}


/* =========================
   TEXTE
========================= */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    element.textContent =
      "—";

    return;
  }

  element.textContent =
    value;
}


/* =========================
   ARGENT
========================= */

function formatMoney(value) {

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

  return (
    new Intl.NumberFormat(
      "fr-FR"
    ).format(number) +
    " XOF"
  );
}


/* =========================
   DATE
========================= */

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
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }
  ).format(date);
}


/* =========================
   STATUT
========================= */

function formatStatus(status) {

  if (!status) {
    return "—";
  }

  const labels = {
    active: "Actif",
    inactive: "Inactif",
    pending: "En attente",
    pending_activation: "En attente d'activation",
    suspended: "Suspendu",
    blocked: "Bloqué"
  };

  return (
    labels[status] ||
    status
  );
}


/* =========================
   INITIALES
========================= */

function getInitials(name) {

  const parts =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (!parts.length) {
    return "R";
  }

  if (parts.length === 1) {
    return parts[0]
      .substring(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}


/* =========================
   DECONNEXION
========================= */

async function logout() {

  const token =
    getToken();

  if (token) {

    try {

      await supabaseClient.rpc(
        "logout_user",
        {
          p_token: token
        }
      );

    } catch (error) {

      console.error(
        "Erreur déconnexion :",
        error
      );
    }
  }

  localStorage.removeItem(
    SESSION_KEY
  );

  window.location.href =
    "connexion.html";
}


/* =========================
   ETATS
========================= */

function showLoading() {

  loading.style.display =
    "block";

  content.style.display =
    "none";

  errorBox.style.display =
    "none";
}


function showContent() {

  loading.style.display =
    "none";

  errorBox.style.display =
    "none";

  content.style.display =
    "block";
}


function showError(text) {

  loading.style.display =
    "none";

  content.style.display =
    "none";

  errorBox.style.display =
    "block";

  errorMessage.textContent =
    text ||
    "Erreur inconnue.";
}
