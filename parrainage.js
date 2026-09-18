const SUPABASE_URL =
  "https://cbxjcwjlhvicurpndoyz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const SESSION_KEY = "rolex_session_token";

const SITE_URL =
  "https://rolex-self.vercel.app/index.html";


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

const backBtn =
  document.getElementById("backBtn");

const referralCode =
  document.getElementById("referralCode");

const invitationLink =
  document.getElementById("invitationLink");

const copyBtn =
  document.getElementById("copyBtn");

const shareBtn =
  document.getElementById("shareBtn");

const message =
  document.getElementById("message");

const totalPeople =
  document.getElementById("totalPeople");


/* =========================
   INITIALISATION
========================= */

document.addEventListener(
  "DOMContentLoaded",
  loadReferralPage
);


/* =========================
   RETOUR
========================= */

backBtn.addEventListener(
  "click",
  () => {
    window.location.href =
      "dashboard.html";
  }
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
   CHARGER LA PAGE
========================= */

async function loadReferralPage() {

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
      "get_my_referral_page",
      {
        p_token: token
      }
    );

    if (error) {

      console.error(
        "Erreur parrainage :",
        error
      );

      showError(
        error.message
      );

      return;
    }

    if (!data) {

      showError(
        "Aucune donnée de parrainage n'a été retournée."
      );

      return;
    }

    /*
     * La fonction SQL retourne normalement
     * un objet JSON.
     *
     * On accepte également un tableau
     * contenant un seul objet.
     */

    const result =
      Array.isArray(data)
        ? (data[0] || {})
        : data;


    /* =========================
       CODE DE PARRAINAGE
    ========================= */

    const code =
      result.referral_code;

    if (!code) {

      showError(
        "Le code de parrainage est absent des données retournées par la base."
      );

      return;
    }

    referralCode.textContent =
      code;


    /* =========================
       LIEN D'INVITATION
    ========================= */

    const link =
      SITE_URL +
      "?ref=" +
      encodeURIComponent(code);

    invitationLink.value =
      link;


    /* =========================
       NIVEAUX
    ========================= */

    const level1 =
      result.level_1 || {};

    const level2 =
      result.level_2 || {};

    const level3 =
      result.level_3 || {};


    /*
     * Les pourcentages viennent
     * de la base de données.
     */

    setText(
      "level1Percent",
      formatPercent(
        level1.percent
      )
    );

    setText(
      "level2Percent",
      formatPercent(
        level2.percent
      )
    );

    setText(
      "level3Percent",
      formatPercent(
        level3.percent
      )
    );


    /*
     * Nombre de personnes
     */

    setText(
      "level1People",
      formatNumber(
        level1.people
      )
    );

    setText(
      "level2People",
      formatNumber(
        level2.people
      )
    );

    setText(
      "level3People",
      formatNumber(
        level3.people
      )
    );


    /*
     * Commissions
     */

    setText(
      "level1Commission",
      formatMoney(
        level1.commission
      )
    );

    setText(
      "level2Commission",
      formatMoney(
        level2.commission
      )
    );

    setText(
      "level3Commission",
      formatMoney(
        level3.commission
      )
    );


    /* =========================
       TOTAL PERSONNES
    ========================= */

    const total =
      result.total_people ??
      (
        Number(level1.people || 0) +
        Number(level2.people || 0) +
        Number(level3.people || 0)
      );

    totalPeople.textContent =
      formatNumber(total);


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
   COPIER LE LIEN
========================= */

copyBtn.addEventListener(
  "click",
  copyInvitationLink
);

async function copyInvitationLink() {

  const link =
    invitationLink.value;

  if (!link) {
    return;
  }

  try {

    await navigator.clipboard.writeText(
      link
    );

    showMessage(
      "Lien d'invitation copié."
    );

  } catch (error) {

    invitationLink.focus();
    invitationLink.select();

    try {

      document.execCommand(
        "copy"
      );

      showMessage(
        "Lien d'invitation copié."
      );

    } catch (copyError) {

      showMessage(
        "Impossible de copier automatiquement le lien."
      );
    }
  }
}


/* =========================
   PARTAGER
========================= */

shareBtn.addEventListener(
  "click",
  shareInvitationLink
);

async function shareInvitationLink() {

  const link =
    invitationLink.value;

  if (!link) {
    return;
  }

  if (
    navigator.share
  ) {

    try {

      await navigator.share({
        title: "ROLEX",
        text:
          "Rejoignez ROLEX avec mon lien d'invitation.",
        url: link
      });

      return;

    } catch (error) {

      if (
        error &&
        error.name === "AbortError"
      ) {
        return;
      }
    }
  }

  await copyInvitationLink();
}


/* =========================
   AFFICHAGE
========================= */

function setText(
  elementId,
  value
) {

  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return;
  }

  element.textContent =
    value;
}


/* =========================
   POURCENTAGE
========================= */

function formatPercent(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `${value}%`;
}


/* =========================
   NOMBRE
========================= */

function formatNumber(value) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return new Intl.NumberFormat(
    "fr-FR"
  ).format(number);
}


/* =========================
   ARGENT
========================= */

function formatMoney(value) {

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0 XOF";
  }

  return (
    new Intl.NumberFormat(
      "fr-FR"
    ).format(number) +
    " XOF"
  );
}


/* =========================
   MESSAGE
========================= */

function showMessage(text) {

  message.textContent =
    text;

  setTimeout(
    () => {
      message.textContent = "";
    },
    2500
  );
}


/* =========================
   ETAT CHARGEMENT
========================= */

function showLoading() {

  loading.style.display =
    "block";

  content.style.display =
    "none";

  errorBox.style.display =
    "none";
}


/* =========================
   AFFICHER CONTENU
========================= */

function showContent() {

  loading.style.display =
    "none";

  errorBox.style.display =
    "none";

  content.style.display =
    "block";
}


/* =========================
   ERREUR
========================= */

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
