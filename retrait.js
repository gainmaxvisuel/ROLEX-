/* =========================================================
   ROLEX — RETRAIT
   ========================================================= */

const SUPABASE_URL =
  "https://cbxjcwjlhvicurpndoyz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================================================
   SESSION
   ========================================================= */

const sessionToken =
  localStorage.getItem(
    "rolex_session_token"
  );


if (!sessionToken) {

  window.location.href =
    "connexion.html";

}


/* =========================================================
   ELEMENTS
   ========================================================= */

const loading =
  document.getElementById("loading");

const userName =
  document.getElementById("userName");

const balance =
  document.getElementById("balance");

const accountContent =
  document.getElementById("accountContent");

const withdrawalCard =
  document.getElementById("withdrawalCard");

const withdrawalForm =
  document.getElementById("withdrawalForm");

const amountInput =
  document.getElementById("amount");

const transactionPassword =
  document.getElementById(
    "transactionPassword"
  );

const submitButton =
  document.getElementById(
    "submitButton"
  );

const availabilityTitle =
  document.getElementById(
    "availabilityTitle"
  );

const availabilityText =
  document.getElementById(
    "availabilityText"
  );

const minimumHint =
  document.getElementById(
    "minimumHint"
  );

const summary =
  document.getElementById(
    "summary"
  );

const summaryRequested =
  document.getElementById(
    "summaryRequested"
  );

const summaryFee =
  document.getElementById(
    "summaryFee"
  );

const summaryNet =
  document.getElementById(
    "summaryNet"
  );

const toast =
  document.getElementById("toast");

const toastTitle =
  document.getElementById(
    "toastTitle"
  );

const toastText =
  document.getElementById(
    "toastText"
  );


let pageData = null;


/* =========================================================
   CHARGEMENT
   ========================================================= */

async function loadWithdrawalPage() {

  try {

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_withdrawal_page",
      {
        p_token:
          sessionToken
      }
    );


    if (error) {
      throw error;
    }


    if (!data) {
      throw new Error(
        "Impossible de récupérer les informations."
      );
    }


    pageData = data;


    renderPage();


  } catch (error) {

    console.error(
      "Erreur retrait :",
      error
    );


    showToast(
      "Erreur",
      error.message ||
      "Impossible de charger la page.",
      "error"
    );


    withdrawalCard.style.display =
      "none";


  } finally {

    loading.classList.add(
      "hide"
    );

  }
}


/* =========================================================
   AFFICHAGE
   ========================================================= */

function renderPage() {

  userName.textContent =
    pageData.full_name ||
    "Utilisateur";


  balance.textContent =
    formatMoney(
      pageData.balance
    );


  const minimum =
    Number(
      pageData.withdrawal_minimum
    );


  const feePercent =
    Number(
      pageData.withdrawal_fee_percent
    );


  const startHour =
    Number(
      pageData.withdrawal_start_hour
    );


  const endHour =
    Number(
      pageData.withdrawal_end_hour
    );


  const dailyLimit =
    Number(
      pageData.withdrawals_per_day
    );


  const todayCount =
    Number(
      pageData.today_withdrawals || 0
    );


  minimumHint.textContent =
    `Minimum : ${formatMoney(minimum)}`;


  amountInput.min =
    minimum;


  availabilityText.textContent =
    `Retraits disponibles de ${formatHour(startHour)} à ${formatHour(endHour)}. ` +
    `Limite quotidienne : ${dailyLimit} demande(s). ` +
    `Aujourd’hui : ${todayCount}/${dailyLimit}.`;


  renderAccount(
    pageData.account
  );


  /*
    On ne désactive pas arbitrairement le formulaire
    en JavaScript.

    La fonction request_withdrawal() reste l'autorité
    finale pour les horaires, dimanche, solde,
    limite quotidienne, compte et mot de passe.
  */

  withdrawalCard.style.display =
    "block";
}


/* =========================================================
   COMPTE DE RETRAIT
   ========================================================= */

function renderAccount(account) {

  if (!account) {

    accountContent.innerHTML = `

      <div class="empty-account">

        <i class="fa-solid fa-wallet"></i>

        <h3>
          Aucun compte enregistré
        </h3>

        <p>
          Vous devez enregistrer un compte de retrait
          avant de pouvoir effectuer une demande.
        </p>

        <a
          href="compte-retrait.html"
          class="account-button"
        >
          <i class="fa-solid fa-plus"></i>
          Enregistrer un compte
        </a>

      </div>

    `;

    withdrawalCard.style.display =
      "none";

    return;
  }


  accountContent.innerHTML = `

    <span class="account-status">
      ACTIF
    </span>

    <div class="account-grid">

      <div class="account-item">

        <small>
          Titulaire
        </small>

        <strong>
          ${escapeHtml(
            account.owner_name
          )}
        </strong>

      </div>


      <div class="account-item">

        <small>
          Opérateur
        </small>

        <strong>
          ${escapeHtml(
            account.operator
          )}
        </strong>

      </div>


      <div class="account-item">

        <small>
          Téléphone
        </small>

        <strong>
          ${escapeHtml(
            account.phone
          )}
        </strong>

      </div>


      <div class="account-item">

        <small>
          Pays
        </small>

        <strong>
          ${escapeHtml(
            pageData.country_code || "—"
          )}
        </strong>

      </div>

    </div>

    <a
      href="compte-retrait.html"
      class="account-link"
    >
      <i class="fa-solid fa-pen"></i>
      Gérer mon compte de retrait
    </a>

  `;
}


/* =========================================================
   CALCUL VISUEL DU RÉCAPITULATIF
   ========================================================= */

amountInput.addEventListener(
  "input",
  updateSummary
);


function updateSummary() {

  const amount =
    Number(
      amountInput.value
    );


  if (
    !pageData ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {

    summary.classList.remove(
      "show"
    );

    return;
  }


  const feePercent =
    Number(
      pageData.withdrawal_fee_percent
    );


  /*
    Le calcul affiché ici est uniquement
    un aperçu visuel.

    Le montant officiel des frais et du net
    est recalculé par PostgreSQL dans
    request_withdrawal().
  */

  const fee =
    Math.floor(
      amount *
      feePercent /
      100
    );


  const net =
    amount - fee;


  summaryRequested.textContent =
    formatMoney(amount);


  summaryFee.textContent =
    formatMoney(fee);


  summaryNet.textContent =
    formatMoney(net);


  summary.classList.add(
    "show"
  );
}


/* =========================================================
   DEMANDE DE RETRAIT
   ========================================================= */

withdrawalForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const amount =
      Number(
        amountInput.value
      );


    const password =
      transactionPassword.value;


    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {

      showToast(
        "Montant invalide",
        "Veuillez saisir un montant valide.",
        "error"
      );

      return;
    }


    if (!password) {

      showToast(
        "Mot de passe requis",
        "Veuillez saisir votre mot de passe de transaction.",
        "error"
      );

      return;
    }


    if (
      pageData &&
      amount <
      Number(
        pageData.withdrawal_minimum
      )
    ) {

      showToast(
        "Montant insuffisant",
        `Le minimum de retrait est ${formatMoney(
          pageData.withdrawal_minimum
        )}.`,
        "error"
      );

      return;
    }


    setLoading(
      true
    );


    try {

      const {
        data,
        error
      } = await supabaseClient.rpc(
        "request_withdrawal",
        {
          p_token:
            sessionToken,

          p_amount:
            amount,

          p_transaction_password:
            password
        }
      );


      if (error) {
        throw error;
      }


      if (!data) {
        throw new Error(
          "La demande n'a pas pu être créée."
        );
      }


      transactionPassword.value =
        "";


      summary.classList.remove(
        "show"
      );


      showToast(
        "Demande envoyée",
        "Votre demande de retrait a été enregistrée avec succès.",
        "success"
      );


      /*
        Le solde est relu depuis la DB
        après création du retrait.
      */

      await reloadBalance();


    } catch (error) {

      console.error(
        "Erreur demande retrait :",
        error
      );


      showToast(
        "Retrait refusé",
        cleanDatabaseError(
          error.message
        ),
        "error"
      );


    } finally {

      setLoading(
        false
      );

    }

  }
);


/* =========================================================
   RECHARGER LE SOLDE
   ========================================================= */

async function reloadBalance() {

  const {
    data,
    error
  } = await supabaseClient.rpc(
    "get_my_dashboard",
    {
      p_token:
        sessionToken
    }
  );


  if (
    !error &&
    data
  ) {

    balance.textContent =
      formatMoney(
        data.balance
      );

  }
}


/* =========================================================
   LOADING BUTTON
   ========================================================= */

function setLoading(
  state
) {

  submitButton.disabled =
    state;


  if (state) {

    submitButton.innerHTML = `
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      Traitement en cours...
    `;

  } else {

    submitButton.innerHTML = `
      <i class="fa-solid fa-paper-plane"></i>
      Demander le retrait
    `;

  }
}


/* =========================================================
   FORMAT ARGENT
   ========================================================= */

function formatMoney(
  value
) {

  return (
    new Intl.NumberFormat(
      "fr-FR"
    ).format(
      Number(value || 0)
    ) +
    " XOF"
  );
}


/* =========================================================
   HEURE
   ========================================================= */

function formatHour(
  hour
) {

  return String(
    hour
  ).padStart(
    2,
    "0"
  ) + "h00";
}


/* =========================================================
   ERREURS DB
   ========================================================= */

function cleanDatabaseError(
  message
) {

  if (!message) {
    return "Une erreur est survenue.";
  }

  return message
    .replace(
      /^Error:\s*/i,
      ""
    )
    .trim();
}


/* =========================================================
   PROTECTION HTML
   ========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


function showToast(
  title,
  message,
  type = "error"
) {

  toastTitle.textContent =
    title;

  toastText.textContent =
    message;

  toast.className =
    "toast " +
    type +
    " show";


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      5000
    );
}


/* =========================================================
   DÉMARRAGE
   ========================================================= */

loadWithdrawalPage();
