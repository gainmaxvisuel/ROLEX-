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
  localStorage.getItem("rolex_session_token");

if (!sessionToken) {
  window.location.href = "connexion.html";
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

const minimumAmount =
  document.getElementById("minimumAmount");

const depositForm =
  document.getElementById("depositForm");

const amountInput =
  document.getElementById("amount");

const payerPhoneInput =
  document.getElementById("payerPhone");

const paymentProof =
  document.getElementById("paymentProof");

const submitButton =
  document.getElementById("submitButton");

const operatorField =
  document.getElementById("operatorField");

const paymentMethods =
  document.getElementById("paymentMethods");

const receiverBox =
  document.getElementById("receiverBox");

const receiverNumber =
  document.getElementById("receiverNumber");

const receiverMessage =
  document.getElementById("receiverMessage");

const ussdBox =
  document.getElementById("ussdBox");

const ussdCode =
  document.getElementById("ussdCode");

const paymentButton =
  document.getElementById("paymentButton");

const beninTogoInfo =
  document.getElementById("beninTogoInfo");

const toast =
  document.getElementById("toast");

const toastTitle =
  document.getElementById("toastTitle");

const toastText =
  document.getElementById("toastText");


/* =========================================================
   VARIABLES
   ========================================================= */

let depositMinimum = null;
let userCountry = null;
let paymentMethodsData = [];
let selectedMethod = null;


/* =========================================================
   FORMAT ARGENT
   ========================================================= */

function formatMoney(value) {
  const number = Number(value || 0);

  return number.toLocaleString("fr-FR") + " XOF";
}


/* =========================================================
   ECHAPPER HTML
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   MESSAGE ERREUR
   ========================================================= */

function getErrorMessage(error) {

  if (!error) {
    return "Une erreur est survenue.";
  }

  return (
    error.message ||
    error.error_description ||
    error.details ||
    "Une erreur est survenue."
  );
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  title,
  message,
  type = "error"
) {

  if (!toast) {
    alert(`${title}\n${message}`);
    return;
  }

  toast.className =
    `toast ${type}`;

  toastTitle.textContent =
    title || "";

  toastText.textContent =
    message || "";

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove(
      "show"
    );
  }, 4000);
}


/* =========================================================
   CHARGER LA PAGE
   ========================================================= */

async function loadDepositPage() {

  try {

    /* =====================================================
       DASHBOARD
       ===================================================== */

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


    /* =====================================================
       PAYS
       ===================================================== */

    userCountry =
      String(
        data.country_code || ""
      )
      .trim()
      .toUpperCase();

    if (!userCountry) {
      throw new Error(
        "Le pays de votre compte n'est pas défini."
      );
    }


    /* =====================================================
       MINIMUM DEPOT
       ===================================================== */

    const {
      data: settingsData,
      error: settingsError
    } =
      await supabaseClient
        .from("settings")
        .select("value")
        .eq(
          "key",
          "deposit_minimum"
        )
        .maybeSingle();

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


    /* =====================================================
       METHODES DE PAIEMENT
       ===================================================== */

    const {
      data: methods,
      error: methodsError
    } =
      await supabaseClient.rpc(
        "get_my_deposit_payment_methods",
        {
          p_token: sessionToken
        }
      );

    if (methodsError) {
      throw methodsError;
    }

    paymentMethodsData =
      Array.isArray(methods)
        ? methods
        : [];

    renderPaymentMethods();

  } catch (error) {

    console.error(
      "Erreur chargement dépôt :",
      error
    );

    showToast(
      "Erreur",
      getErrorMessage(error),
      "error"
    );

  } finally {

    if (loading) {
      loading.classList.add(
        "hide"
      );
    }
  }
}


/* =========================================================
   AFFICHER LES METHODES
   ========================================================= */

function renderPaymentMethods() {

  paymentMethods.innerHTML = "";

  receiverBox.classList.remove(
    "show"
  );

  ussdBox.classList.remove(
    "show"
  );

  paymentButton.classList.remove(
    "show"
  );

  beninTogoInfo.classList.remove(
    "show"
  );

  selectedMethod = null;


  /* =====================================================
     BENIN / TOGO
     ===================================================== */

  if (
    userCountry === "BJ" ||
    userCountry === "TG"
  ) {

    operatorField.style.display =
      "none";

    const method =
      paymentMethodsData[0];

    if (!method) {

      paymentMethods.innerHTML = `
        <div style="
          grid-column:1/-1;
          color:#87938d;
          font-size:13px;
          line-height:1.5;
          padding:10px 0;
        ">
          Aucun moyen de paiement n'est configuré
          pour votre pays.
        </div>
      `;

      return;
    }

    selectedMethod =
      method;

    /*
     * BJ/TG :
     * affichage du numéro de réception.
     */

    if (method.receiver) {

      receiverNumber.textContent =
        method.receiver;

      receiverMessage.textContent =
        method.instructions ||
        "Veuillez effectuer le transfert sur ce numéro.";

      receiverBox.classList.add(
        "show"
      );
    }

    beninTogoInfo.classList.add(
      "show"
    );

    return;
  }


  /* =====================================================
     BURKINA / COTE D'IVOIRE
     ===================================================== */

  operatorField.style.display =
    "block";

  if (!paymentMethodsData.length) {

    paymentMethods.innerHTML = `
      <div style="
        grid-column:1/-1;
        color:#87938d;
        font-size:13px;
        line-height:1.5;
        padding:10px 0;
      ">
        Aucun moyen de paiement n'est actuellement
        disponible pour votre pays.
      </div>
    `;

    return;
  }


  paymentMethodsData.forEach(
    method => {

      const button =
        document.createElement(
          "button"
        );

      button.type =
        "button";

      button.className =
        "method-button";

      button.innerHTML = `
        <i class="fa-solid fa-wallet"></i>
        ${escapeHtml(
          method.operator
        )}
      `;

      button.addEventListener(
        "click",
        () => {

          selectMethod(
            method,
            button
          );
        }
      );

      paymentMethods.appendChild(
        button
      );
    }
  );
}


/* =========================================================
   SELECTION OPERATEUR
   ========================================================= */

function selectMethod(
  method,
  button
) {

  selectedMethod =
    method;


  document
    .querySelectorAll(
      ".method-button"
    )
    .forEach(
      item => {
        item.classList.remove(
          "active"
        );
      }
    );


  button.classList.add(
    "active"
  );


  /*
   * =======================================================
   * IMPORTANT
   *
   * On affiche le numéro de réception
   * SEULEMENT si le template USSD contient
   * {receiver}.
   *
   * Moov :
   * *555*2*1*{receiver}*{amount}#
   *
   * Orange :
   * *144*4*6*{amount}#
   *
   * Donc Orange n'affiche PAS le numéro.
   * =======================================================
   */

  const template =
    String(
      method.ussd_template || ""
    );


  const needsReceiver =
    template.includes(
      "{receiver}"
    );


  if (
    needsReceiver &&
    method.receiver
  ) {

    receiverNumber.textContent =
      method.receiver;

    receiverMessage.textContent =
      method.instructions || "";

    receiverBox.classList.add(
      "show"
    );

  } else {

    /*
     * Orange Money :
     * aucune boîte de numéro.
     */

    receiverNumber.textContent =
      "";

    receiverMessage.textContent =
      "";

    receiverBox.classList.remove(
      "show"
    );
  }


  updateUSSD();
}


/* =========================================================
   GENERER LE CODE USSD
   ========================================================= */

function updateUSSD() {

  if (!selectedMethod) {
    return;
  }


  const template =
    String(
      selectedMethod.ussd_template || ""
    );


  if (!template) {

    ussdBox.classList.remove(
      "show"
    );

    paymentButton.classList.remove(
      "show"
    );

    return;
  }


  const amount =
    Number(
      amountInput.value
    );


  let code =
    template;


  /*
   * =======================================================
   * RECEVEUR
   *
   * On utilise EXCLUSIVEMENT celui retourné
   * par la base.
   *
   * Aucun numéro codé en dur.
   * =======================================================
   */

  if (
    code.includes(
      "{receiver}"
    )
  ) {

    code =
      code.replaceAll(
        "{receiver}",
        selectedMethod.receiver || ""
      );
  }


  /*
   * =======================================================
   * MONTANT
   * =======================================================
   */

  code =
    code.replaceAll(
      "{amount}",
      (
        Number.isInteger(amount) &&
        amount > 0
      )
        ? String(amount)
        : "MONTANT"
    );


  ussdCode.textContent =
    code;


  ussdBox.classList.add(
    "show"
  );

  paymentButton.classList.add(
    "show"
  );
}


/* =========================================================
   CHANGEMENT DU MONTANT
   ========================================================= */

amountInput.addEventListener(
  "input",
  () => {

    updateUSSD();
  }
);


/* =========================================================
   ALLER AU PAIEMENT
   ========================================================= */

paymentButton.addEventListener(
  "click",
  () => {

    if (!selectedMethod) {

      showToast(
        "Paiement",
        "Veuillez sélectionner un moyen de paiement.",
        "error"
      );

      return;
    }


    const amount =
      Number(
        amountInput.value
      );


    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {

      showToast(
        "Montant",
        "Veuillez saisir un montant valide.",
        "error"
      );

      amountInput.focus();

      return;
    }


    if (
      depositMinimum !== null &&
      amount < depositMinimum
    ) {

      showToast(
        "Montant",
        `Le montant minimum est de ${formatMoney(depositMinimum)}.`,
        "error"
      );

      amountInput.focus();

      return;
    }


    let code =
      String(
        selectedMethod.ussd_template || ""
      );


    if (!code) {

      showToast(
        "Paiement",
        "Le code de paiement n'est pas disponible.",
        "error"
      );

      return;
    }


    /*
     * Remplacement du receiver
     * seulement si le template le demande.
     */

    if (
      code.includes(
        "{receiver}"
      )
    ) {

      if (
        !selectedMethod.receiver
      ) {

        showToast(
          "Paiement",
          "Le numéro de réception est introuvable.",
          "error"
        );

        return;
      }

      code =
        code.replaceAll(
          "{receiver}",
          selectedMethod.receiver
        );
    }


    /*
     * Remplacement du montant.
     */

    code =
      code.replaceAll(
        "{amount}",
        String(amount)
      );


    /*
     * =======================================================
     * OUVRIR LE COMPOSEUR TELEPHONIQUE
     * =======================================================
     */

    window.location.href =
      "tel:" +
      encodeURIComponent(code);
  }
);


/* =========================================================
   VALIDATION FICHIER
   ========================================================= */

function validatePaymentProof(file) {

  if (!file) {

    showToast(
      "Preuve de paiement",
      "Veuillez sélectionner la capture de votre paiement.",
      "error"
    );

    return false;
  }


  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
  ];


  if (
    !allowedTypes.includes(
      file.type
    )
  ) {

    showToast(
      "Preuve de paiement",
      "Format accepté : JPG, PNG, WEBP ou PDF.",
      "error"
    );

    return false;
  }


  const maxSize =
    10 * 1024 * 1024;


  if (
    file.size > maxSize
  ) {

    showToast(
      "Preuve de paiement",
      "La taille maximale est de 10 Mo.",
      "error"
    );

    return false;
  }


  return true;
}


/* =========================================================
   NUMERO DU PAYEUR
   ========================================================= */

payerPhoneInput.addEventListener(
  "input",
  () => {

    payerPhoneInput.value =
      payerPhoneInput.value.replace(
        /[^0-9+]/g,
        ""
      );
  }
);


/* =========================================================
   ENVOYER LE DEPOT
   ========================================================= */

depositForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (!selectedMethod) {

      showToast(
        "Dépôt",
        "Veuillez sélectionner un moyen de paiement.",
        "error"
      );

      return;
    }


    const amount =
      Number(
        amountInput.value
      );


    if (
      !Number.isInteger(amount) ||
      amount <= 0
    ) {

      showToast(
        "Montant",
        "Veuillez saisir un montant valide.",
        "error"
      );

      return;
    }


    if (
      depositMinimum !== null &&
      amount < depositMinimum
    ) {

      showToast(
        "Montant",
        `Le montant minimum est de ${formatMoney(depositMinimum)}.`,
        "error"
      );

      return;
    }


    const payerPhone =
      payerPhoneInput.value.trim();


    if (!payerPhone) {

      showToast(
        "Numéro du payeur",
        "Veuillez saisir le numéro utilisé pour effectuer le paiement.",
        "error"
      );

      payerPhoneInput.focus();

      return;
    }


    const file =
      paymentProof.files[0];


    if (
      !validatePaymentProof(file)
    ) {
      return;
    }


    submitButton.disabled =
      true;

    submitButton.innerHTML =
      `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Envoi en cours...
      `;


    let depositId =
      null;

    let proofPath =
      null;


    try {

      /* =====================================================
         CREER LE DEPOT
         ===================================================== */

      const {
        data,
        error
      } =
        await supabaseClient.rpc(
          "request_country_deposit",
          {
            p_token:
              sessionToken,

            p_amount:
              amount,

            p_payer_phone:
              payerPhone,

            p_operator:
              selectedMethod.operator,

            p_receiver:
              selectedMethod.receiver
          }
        );


      if (error) {
        throw error;
      }


      depositId =
        data;


      if (!depositId) {
        throw new Error(
          "Le dépôt n'a pas pu être créé."
        );
      }


      /* =====================================================
         NOM DU FICHIER
         ===================================================== */

      const extension =
        getSafeExtension(file);

      const randomPart =
        Math.random()
          .toString(36)
          .substring(2, 18);

      const fileName =
        `${Date.now()}-${randomPart}.${extension}`;


      proofPath =
        `${depositId}/${fileName}`;


      /* =====================================================
         UPLOAD PREUVE
         ===================================================== */

      const {
        error: uploadError
      } =
        await supabaseClient
          .storage
          .from("payment-proofs")
          .upload(
            proofPath,
            file,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                file.type
            }
          );


      if (uploadError) {
        throw uploadError;
      }


      /* =====================================================
         ASSOCIER LA PREUVE
         ===================================================== */

      const {
        data: attached,
        error: attachError
      } =
        await supabaseClient.rpc(
          "attach_deposit_proof",
          {
            p_token:
              sessionToken,

            p_deposit_id:
              depositId,

            p_proof_path:
              proofPath
          }
        );


      if (attachError) {
        throw attachError;
      }


      if (!attached) {
        throw new Error(
          "La preuve n'a pas pu être associée au dépôt."
        );
      }


      /* =====================================================
         SUCCES
         ===================================================== */

      showToast(
        "Dépôt envoyé",
        "Votre demande de dépôt a été envoyée avec succès.",
        "success"
      );


      setTimeout(
        () => {

          window.location.href =
         "transactions.html";

        },
        1800
      );


    } catch (error) {

      console.error(
        "Erreur dépôt :",
        error
      );


      /*
       * Suppression de la preuve
       * si elle a été envoyée mais que
       * l'association a échoué.
       */

      if (proofPath) {

        try {

          await supabaseClient
            .storage
            .from("payment-proofs")
            .remove([
              proofPath
            ]);

        } catch (removeError) {

          console.error(
            "Erreur suppression fichier :",
            removeError
          );
        }
      }


      showToast(
        "Erreur",
        getErrorMessage(error),
        "error"
      );


      submitButton.disabled =
        false;

      submitButton.innerHTML =
        `
          <i class="fa-solid fa-paper-plane"></i>
          Envoyer la demande de dépôt
        `;
    }
  }
);


/* =========================================================
   EXTENSION FICHIER
   ========================================================= */

function getSafeExtension(file) {

  if (!file) {
    return "bin";
  }


  switch (
    String(
      file.type || ""
    ).toLowerCase()
  ) {

    case "image/jpeg":
      return "jpg";

    case "image/png":
      return "png";

    case "image/webp":
      return "webp";

    case "application/pdf":
      return "pdf";

    default:
      return "bin";
  }
}


/* =========================================================
   INITIALISATION
   ========================================================= */

loadDepositPage();
