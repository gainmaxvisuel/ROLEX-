const SUPABASE_URL =
  "https://cbxjcwjlhvicurpndoyz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


const token =
  localStorage.getItem("rolex_session_token");


const loading =
  document.getElementById("loading");

const content =
  document.getElementById("content");

const message =
  document.getElementById("message");

const countryEl =
  document.getElementById("country");

const ownerNameEl =
  document.getElementById("ownerName");

const phoneEl =
  document.getElementById("phone");

const transactionPasswordEl =
  document.getElementById("transactionPassword");

const transactionPasswordConfirmEl =
  document.getElementById("transactionPasswordConfirm");

const submitBtn =
  document.getElementById("submitBtn");

const operatorsGrid =
  document.getElementById("operatorsGrid");


let selectedOperator = null;


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(text, type = "error") {

  message.textContent = text;

  message.className =
    `message show ${type}`;
}


function hideMessage() {

  message.textContent = "";

  message.className =
    "message";
}


/* =====================================================
   TEXT
===================================================== */

function safeText(value) {

  return String(value ?? "");
}


/* =====================================================
   SELECTION OPERATEUR
===================================================== */

function selectOperator(card) {

  const cards =
    document.querySelectorAll(".operator-card");

  cards.forEach(item => {
    item.classList.remove("selected");
    item.setAttribute("aria-selected", "false");
  });


  card.classList.add("selected");

  card.setAttribute("aria-selected", "true");


  selectedOperator =
    card.dataset.operator || null;
}


const operatorCards =
  document.querySelectorAll(".operator-card");


operatorCards.forEach(card => {

  card.setAttribute(
    "role",
    "radio"
  );

  card.setAttribute(
    "aria-selected",
    "false"
  );


  card.addEventListener("click", () => {

    selectOperator(card);

  });


  card.addEventListener("keydown", event => {

    if (
      event.key === "Enter" ||
      event.key === " "
    ) {

      event.preventDefault();

      selectOperator(card);

    }

  });

});


/* =====================================================
   CHARGEMENT
===================================================== */

async function loadPage() {

  if (!token) {

    window.location.href =
      "connexion.html";

    return;
  }


  try {

    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_withdrawal_page",
      {
        p_token: token
      }
    );


    if (error) {
      throw error;
    }


    if (!data) {

      throw new Error(
        "Impossible de charger les informations."
      );

    }


    countryEl.textContent =
      safeText(
        data.country_code || "—"
      );


    const account =
      data.account;


    if (account) {

      ownerNameEl.value =
        safeText(
          account.owner_name
        );


      phoneEl.value =
        safeText(
          account.phone
        );


      /*
       * L'ancienne version pouvait contenir
       * un opérateur déjà enregistré.
       *
       * On sélectionne automatiquement
       * la carte correspondante.
       */
      if (account.operator) {

        const existingCard =
          Array.from(operatorCards)
            .find(card =>
              card.dataset.operator ===
              account.operator
            );


        if (existingCard) {

          selectOperator(
            existingCard
          );

        }

      }


      submitBtn.textContent =
        "Mettre à jour le compte";

    } else {

      submitBtn.textContent =
        "Enregistrer le compte";

    }


    loading.classList.add(
      "hidden"
    );

    content.classList.remove(
      "hidden"
    );

  } catch (error) {

    console.error(error);

    loading.textContent =
      error?.message ||
      "Impossible de charger les informations.";

  }

}


/* =====================================================
   ENREGISTREMENT
===================================================== */

submitBtn.addEventListener(
  "click",
  async () => {

    hideMessage();


    const ownerName =
      ownerNameEl.value.trim();


    const phone =
      phoneEl.value.trim();


    const transactionPassword =
      transactionPasswordEl.value.trim();


    const transactionPasswordConfirm =
      transactionPasswordConfirmEl.value.trim();


    /* ---------------------------------------------
       VALIDATION NOM
    --------------------------------------------- */

    if (!ownerName) {

      showMessage(
        "Veuillez renseigner le nom du bénéficiaire."
      );

      return;
    }


    /* ---------------------------------------------
       VALIDATION TELEPHONE
    --------------------------------------------- */

    if (!phone) {

      showMessage(
        "Veuillez renseigner le numéro de téléphone."
      );

      return;
    }


    /* ---------------------------------------------
       VALIDATION OPERATEUR
    --------------------------------------------- */

    if (!selectedOperator) {

      showMessage(
        "Veuillez sélectionner un opérateur de retrait."
      );

      return;
    }


    /* ---------------------------------------------
       VALIDATION MOT DE PASSE
    --------------------------------------------- */

    if (!transactionPassword) {

      showMessage(
        "Veuillez renseigner le mot de passe de transaction."
      );

      return;
    }


    if (!/^[0-9]+$/.test(
      transactionPassword
    )) {

      showMessage(
        "Le mot de passe de transaction doit contenir uniquement des chiffres."
      );

      return;
    }


    if (
      transactionPassword.length < 6
    ) {

      showMessage(
        "Le mot de passe de transaction doit contenir au moins 6 chiffres."
      );

      return;
    }


    if (
      transactionPassword !==
      transactionPasswordConfirm
    ) {

      showMessage(
        "Les deux mots de passe de transaction ne correspondent pas."
      );

      return;
    }


    /* ---------------------------------------------
       ENREGISTREMENT
    --------------------------------------------- */

    submitBtn.disabled = true;

    submitBtn.textContent =
      "Enregistrement...";


    try {

      const {
        error
      } = await supabaseClient.rpc(
        "create_withdrawal_account",
        {
          p_token: token,

          p_owner_name:
            ownerName,

          p_phone:
            phone,

          p_operator:
            selectedOperator,

          p_transaction_password:
            transactionPassword
        }
      );


      if (error) {
        throw error;
      }


      showMessage(
        "Votre compte de retrait a été enregistré avec succès.",
        "success"
      );


      transactionPasswordEl.value = "";

      transactionPasswordConfirmEl.value = "";


      submitBtn.textContent =
        "Compte enregistré";


      setTimeout(() => {

        window.location.href =
          "retrait.html";

      }, 1200);


    } catch (error) {

      console.error(error);


      showMessage(
        error?.message ||
        "Impossible d'enregistrer le compte de retrait."
      );


      submitBtn.disabled = false;

      submitBtn.textContent =
        "Enregistrer le compte";

    }

  }
);


/* =====================================================
   DEMARRAGE
===================================================== */

loadPage();
