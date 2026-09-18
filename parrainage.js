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


/*
|--------------------------------------------------------------------------
| DOM
|--------------------------------------------------------------------------
*/

const backBtn =
  document.getElementById("backBtn");

const loading =
  document.getElementById("loading");

const content =
  document.getElementById("content");

const errorBox =
  document.getElementById("error");

const errorMessage =
  document.getElementById("errorMessage");

const retryBtn =
  document.getElementById("retryBtn");

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


/*
|--------------------------------------------------------------------------
| DOM EVENTS
|--------------------------------------------------------------------------
*/

backBtn.addEventListener(
  "click",
  () => {
    window.location.href =
      "dashboard.html";
  }
);


retryBtn.addEventListener(
  "click",
  loadReferral
);


copyBtn.addEventListener(
  "click",
  copyInvitationLink
);


shareBtn.addEventListener(
  "click",
  shareInvitationLink
);


/*
|--------------------------------------------------------------------------
| INIT
|--------------------------------------------------------------------------
*/

document.addEventListener(
  "DOMContentLoaded",
  loadReferral
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

async function loadReferral() {

  const token =
    getSessionToken();


  if (!token) {

    window.location.href =
      "connexion.html";

    return;
  }


  showLoading();


  try {

    /*
     * get_my_dashboard() existe déjà
     * dans la base ROLEX.
     *
     * On récupère le referral_code
     * directement depuis les données
     * retournées par Supabase.
     */

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
        "Erreur dashboard :",
        error
      );

      showError(
        error.message
      );

      return;
    }


    const dashboard =
      normalizeData(data);


    /*
     * Recherche du vrai code de parrainage.
     *
     * Plusieurs formats sont acceptés
     * pour s'adapter à la structure JSON
     * déjà utilisée par ROLEX.
     */

    const code =
      findReferralCode(
        dashboard
      );


    if (!code) {

      showError(
        "Le code de parrainage n'a pas été retourné par la base de données."
      );

      return;
    }


    /*
     * Affichage du vrai code
     */

    referralCode.textContent =
      code;


    /*
     * Construction du vrai lien
     *
     * Exemple :
     *
     * https://rolex-self.vercel.app/index.html?ref=REF-XXXXXXXX
     */

    const link =
      "https://rolex-self.vercel.app/index.html?ref=" +
      encodeURIComponent(code);


    invitationLink.value =
      link;


    showContent();

  } catch (error) {

    console.error(error);

    showError(
      "Une erreur est survenue lors du chargement."
    );
  }
}


/*
|--------------------------------------------------------------------------
| NORMALISATION
|--------------------------------------------------------------------------
*/

function normalizeData(data) {

  let result =
    data;


  if (
    Array.isArray(result)
  ) {

    result =
      result[0] || {};
  }


  if (
    result &&
    typeof result === "object" &&
    result.data &&
    typeof result.data === "object"
  ) {

    result =
      result.data;
  }


  return (
    result &&
    typeof result === "object"
  )
    ? result
    : {};
}


/*
|--------------------------------------------------------------------------
| RECHERCHE DU CODE
|--------------------------------------------------------------------------
*/

function findReferralCode(data) {

  if (!data) {
    return null;
  }


  /*
   * Cas direct
   */

  if (
    typeof data.referral_code === "string" &&
    data.referral_code.trim()
  ) {

    return data.referral_code.trim();
  }


  /*
   * Cas user
   */

  if (
    data.user &&
    typeof data.user === "object" &&
    typeof data.user.referral_code === "string" &&
    data.user.referral_code.trim()
  ) {

    return data.user.referral_code.trim();
  }


  /*
   * Cas profile
   */

  if (
    data.profile &&
    typeof data.profile === "object" &&
    typeof data.profile.referral_code === "string" &&
    data.profile.referral_code.trim()
  ) {

    return data.profile.referral_code.trim();
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| COPIER
|--------------------------------------------------------------------------
*/

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

    /*
     * Fallback pour certains navigateurs
     * mobiles.
     */

    invitationLink.select();

    invitationLink.setSelectionRange(
      0,
      invitationLink.value.length
    );

    try {

      document.execCommand(
        "copy"
      );

      showMessage(
        "Lien d'invitation copié."
      );

    } catch (copyError) {

      showMessage(
        "Sélectionnez le lien puis copiez-le."
      );
    }
  }
}


/*
|--------------------------------------------------------------------------
| PARTAGER
|--------------------------------------------------------------------------
*/

async function shareInvitationLink() {

  const link =
    invitationLink.value;


  if (!link) {
    return;
  }


  /*
   * Web Share API disponible
   */

  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          "ROLEX",

        text:
          "Rejoignez ROLEX avec mon lien d'invitation.",

        url:
          link

      });

      return;

    } catch (error) {

      /*
       * L'utilisateur peut avoir
       * simplement fermé la fenêtre
       * de partage.
       */

      if (
        error &&
        error.name === "AbortError"
      ) {

        return;
      }
    }
  }


  /*
   * Si le partage natif n'est pas
   * disponible, on copie le lien.
   */

  await copyInvitationLink();
}


/*
|--------------------------------------------------------------------------
| MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(text) {

  message.textContent =
    text;

  setTimeout(
    () => {

      message.textContent =
        "";

    },
    2500
  );
}


/*
|--------------------------------------------------------------------------
| ÉTATS
|--------------------------------------------------------------------------
*/

function showLoading() {

  loading.style.display =
    "block";

  content.style.display =
    "none";

  errorBox.style.display =
    "none";

  loading.innerHTML = `

    <div class="spinner"></div>

    Chargement de vos informations de parrainage...

  `;
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
    text || "Erreur inconnue.";
}
