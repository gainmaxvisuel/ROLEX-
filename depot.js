/* =========================================================
   ROLEX — DÉPÔT
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
   ÉLÉMENTS
   ========================================================= */

const loading =
  document.getElementById("loading");

const userName =
  document.getElementById("userName");

const balance =
  document.getElementById("balance");

const minimumAmount =
  document.getElementById("minimumAmount");

const depositForm =
  document.getElementById("depositForm");

const amountInput =
  document.getElementById("amount");

const payerPhoneInput =
  document.getElementById("payerPhone");

const submitButton =
  document.getElementById("submitButton");

const toast =
  document.getElementById("toast");

const toastTitle =
  document.getElementById("toastTitle");

const toastText =
  document.getElementById("toastText");


let depositMinimum = null;


/* =========================================================
   CHARGER LE DASHBOARD + MINIMUM
   ========================================================= */

async function loadDepositPage() {

  try {

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_my_dashboard",
      {
        p_token: sessionToken
      }
    );


    if (error) {
      throw error;
    }


    if (!data) {
      throw new Error(
        "Session invalide."
      );
    }


    userName.textContent =
      data.full_name ||
      "Utilisateur";


    balance.textContent =
      formatMoney(
        data.balance
      );


    /*
      Le minimum vient de la table settings.
      On ne met pas de montant financier
      inventé dans le frontend.
    */

    const {
      data: settingsData,
      error: settingsError
    } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "deposit_minimum")
      .maybeSingle();


    /*
      Si RLS empêche la lecture directe,
      on utilise la valeur déjà définie côté
      fonction request_deposit comme garde-fou.

      L'interface affiche alors "Minimum requis"
      et la DB reste l'autorité finale.
    */

    if (
      !settingsError &&
      settingsData &&
      settingsData.value !== null
    ) {

      depositMinimum =
        Number(
          settingsData.value
        );

      minimumAmount.textContent =
        formatMoney(
          depositMinimum
        );

      amountInput.min =
        depositMinimum;

    } else {

      minimumAmount.textContent =
        "Minimum requis";

    }


  } catch (error) {

    console.error(
      "Erreur chargement dépôt :",
      error
    );


    showToast(
      "Erreur",
      error.message ||
      "Impossible de charger la page.",
      "error"
    );


  } finally {

    loading.classList.add(
      "hide"
    );

  }
}


/* =========================================================
   SOUMISSION
   ========================================================= */

depositForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const amount =
      Number(
        amountInput.value
      );


    const payerPhone =
      payerPhoneInput.value.trim();


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


    if (!payerPhone) {

      showToast(
        "Numéro requis",
        "Veuillez saisir le numéro utilisé pour le paiement.",
        "error"
      );

      return;

    }


    /*
      Contrôle visuel uniquement.
      La fonction request_deposit()
      vérifie également le minimum
      directement dans PostgreSQL.
    */

    if (
      depositMinimum !== null &&
      amount < depositMinimum
    ) {

      showToast(
        "Montant insuffisant",
        "Le montant est inférieur au minimum autorisé.",
        "error"
      );

      return;

    }


    setLoading(
      true
    );


    try {

      /*
        L'Edge Function crée le dépôt
        puis génère l'URL WestPay.
      */

      const response =
        await fetch(
          SUPABASE_URL +
          "/functions/v1/westpay-create-deposit",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              token:
                sessionToken,

              amount:
                amount,

              payer_phone:
                payerPhone
            })
          }
        );


      const result =
        await response.json();


      if (
        !response.ok ||
        result.error
      ) {

        throw new Error(
          result.error ||
          "Impossible de créer le dépôt."
        );

      }


      if (
        !result.payment_url
      ) {

        throw new Error(
          "L'adresse de paiement n'a pas été générée."
        );

      }


      showToast(
        "Dépôt créé",
        "Votre demande a été créée. Redirection vers WestPay...",
        "success"
      );


      /*
        Petite pause pour laisser
        apparaître le message professionnel.
      */

      setTimeout(
        () => {

          window.location.href =
            result.payment_url;

        },
        700
      );


    } catch (error) {

      console.error(
        "Erreur dépôt :",
        error
      );


      showToast(
        "Dépôt non effectué",
        error.message ||
        "Impossible de créer le dépôt.",
        "error"
      );


      setLoading(
        false
      );

    }

  }
);


/* =========================================================
   BOUTON
   ========================================================= */

function setLoading(
  state
) {

  submitButton.disabled =
    state;


  if (state) {

    submitButton.innerHTML = `
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      Préparation du paiement...
    `;

  } else {

    submitButton.innerHTML = `
      <i class="fa-solid fa-arrow-right"></i>
      Continuer vers le paiement
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

loadDepositPage();
