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


let depositMinimum = null;
let userCountry = null;
let paymentMethodsData = [];
let selectedMethod = null;


/* =========================================================
   CHARGER LA PAGE
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


    /* =====================================================
       PAYS
       ===================================================== */

    userCountry =
      String(
        data.country_code ||
        ""
      )
      .trim()
      .toUpperCase();

    if (!userCountry) {
      throw new Error(
        "Le pays de votre compte n'est pas défini."
      );
    }


    /* =====================================================
       MINIMUM
       ===================================================== */

    const {
      data: settingsData,
      error: settingsError
    } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "deposit_minimum")
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
       MOYENS DE PAIEMENT
       ===================================================== */

    const {
      data: methods,
      error: methodsError
    } = await supabaseClient.rpc(
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
   AFFICHER LES MOYENS
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
          Aucun numéro de réception n'est configuré
          pour votre pays.
        </div>
      `;

      return;
    }

    selectedMethod =
      method;

    receiverNumber.textContent =
      method.receiver || "";

    receiverMessage.textContent =
      method.instructions ||
      "Veuillez effectuer le transfert sur ce numéro.";

    receiverBox.classList.add(
      "show"
    );

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


  receiverNumber.textContent =
    method.receiver || "";

  receiverMessage.textContent =
    method.instructions || "";


  receiverBox.classList.add(
    "show"
  );


  updateUSSD();


  amountInput.dispatchEvent(
    new Event("input")
  );
}


/* =========================================================
   GENERER USSD
   ========================================================= */

function updateUSSD() {

  if (!selectedMethod) {
    return;
  }

  const template =
    selectedMethod.ussd_template;


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


  if (
    !Number.isInteger(amount) ||
    amount <= 0
  ) {

    ussdCode.textContent =
      template.replace(
        "{amount}",
        "MONTANT"
      );

  } else {

    ussdCode.textContent =
      template.replace(
        "{amount}",
        amount
      );

  }


  ussdBox.classList.add(
    "show"
  );

  paymentButton.classList.add(
    "show"
  );
}


/* =========================================================
   MONTANT
   ========================================================= */

amountInput.addEventListener(
  "input",
  () => {

    if (selectedMethod) {
      updateUSSD();
    }

  }
);


/* =========================================================
   ALLER AU PAIEMENT
   ========================================================= */

paymentButton.addEventListener(
  "click",
  () => {

    if (!selectedMethod) {
      return;
    }

    const template =
      selectedMethod.ussd_template;

    if (!template) {
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
        "Montant requis",
        "Saisissez d'abord le montant du dépôt.",
        "error"
      );

      amountInput.focus();

      return;
    }

    const code =
      template.replace(
        "{amount}",
        amount
      );


    window.location.href =
      "tel:" +
      encodeURIComponent(
        code
      );

  }
);


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

    const file =
      paymentProof &&
      paymentProof.files
        ? paymentProof.files[0]
        : null;


    /* =====================================================
       VALIDATION MONTANT
       ===================================================== */

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


    /* =====================================================
       VALIDATION OPERATEUR
       ===================================================== */

    if (!selectedMethod) {

      showToast(
        "Paiement requis",
        "Veuillez sélectionner votre moyen de paiement.",
        "error"
      );

      return;
    }


    /* =====================================================
       VALIDATION TELEPHONE
       ===================================================== */

    if (!payerPhone) {

      showToast(
        "Numéro requis",
        "Veuillez saisir le numéro utilisé pour le paiement.",
        "error"
      );

      payerPhoneInput.focus();

      return;
    }


    /* =====================================================
       VALIDATION PREUVE
       ===================================================== */

    if (!file) {

      showToast(
        "Preuve requise",
        "Veuillez sélectionner la capture d'écran du paiement.",
        "error"
      );

      return;
    }


    const maxSize =
      10 * 1024 * 1024;


    if (file.size > maxSize) {

      showToast(
        "Fichier trop volumineux",
        "La preuve de paiement ne doit pas dépasser 10 Mo.",
        "error"
      );

      return;
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
        "Format invalide",
        "Utilisez JPG, PNG, WEBP ou PDF.",
        "error"
      );

      return;
    }


    setLoadingButton(
      true
    );


    let createdDepositId =
      null;

    let uploadedProofPath =
      null;


    try {

      /* ===================================================
         ETAPE 1
         CREATION DU DEPOT
         =================================================== */

      console.log(
        "[ROLEX] Création du dépôt..."
      );


      const {
        data: depositId,
        error: depositError
      } = await supabaseClient.rpc(
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


      if (depositError) {

        console.error(
          "[ROLEX] Erreur création dépôt:",
          depositError
        );

        throw depositError;
      }


      if (!depositId) {

        throw new Error(
          "Le serveur n'a retourné aucun identifiant de dépôt."
        );

      }


      createdDepositId =
        String(
          depositId
        );


      console.log(
        "[ROLEX] Dépôt créé:",
        createdDepositId
      );


      /* ===================================================
         ETAPE 2
         CONSTRUCTION DU NOM
         =================================================== */

      const extension =
        getSafeExtension(
          file
        );


      const randomPart =
        randomString(
          16
        );


      const timestamp =
        Date.now();


      /*
        IMPORTANT :
        Le nom doit respecter exactement :

        UUID/filename

        et filename doit être uniquement :
        A-Z a-z 0-9 . _ -
      */

      const fileName =
        `${timestamp}-${randomPart}.${extension}`;


      uploadedProofPath =
        `${createdDepositId}/${fileName}`;


      console.log(
        "[ROLEX] Chemin preuve:",
        uploadedProofPath
      );


      /* ===================================================
         ETAPE 3
         UPLOAD STORAGE
         =================================================== */

      console.log(
        "[ROLEX] Upload de la preuve..."
      );


      const {
        data: uploadData,
        error: uploadError
      } = await supabaseClient.storage
        .from(
          "payment-proofs"
        )
        .upload(
          uploadedProofPath,
          file,
          {
            cacheControl:
              "3600",

            upsert:
              false,

            contentType:
              file.type
          }
        );


      if (uploadError) {

        console.error(
          "[ROLEX] ERREUR STORAGE:",
          uploadError
        );


        /*
          On donne maintenant
          l'erreur réelle.
        */

        throw new Error(
          "Upload Storage : " +
          getStorageErrorMessage(
            uploadError
          )
        );
      }


      console.log(
        "[ROLEX] Upload réussi:",
        uploadData
      );


      /* ===================================================
         ETAPE 4
         ASSOCIER LA PREUVE
         =================================================== */

      console.log(
        "[ROLEX] Association de la preuve..."
      );


      const {
        data: attached,
        error: attachError
      } = await supabaseClient.rpc(
        "attach_deposit_proof",
        {
          p_token:
            sessionToken,

          p_deposit_id:
            createdDepositId,

          p_proof_path:
            uploadedProofPath
        }
      );


      if (attachError) {

        console.error(
          "[ROLEX] Erreur association:",
          attachError
        );

        throw new Error(
          "Association de la preuve : " +
          getErrorMessage(
            attachError
          )
        );
      }


      if (!attached) {

        throw new Error(
          "La preuve a été envoyée mais n'a pas pu être associée au dépôt."
        );
      }


      console.log(
        "[ROLEX] Preuve associée avec succès."
      );


      /* ===================================================
         SUCCES
         =================================================== */

      showToast(
        "Demande envoyée",
        "Votre dépôt est en attente de validation par l'administration.",
        "success"
      );


      depositForm.reset();

      selectedMethod =
        null;


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


      receiverBox.classList.remove(
        "show"
      );

      ussdBox.classList.remove(
        "show"
      );

      paymentButton.classList.remove(
        "show"
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
        "[ROLEX] ERREUR COMPLETE DEPOT:",
        error
      );


      /*
        Si l'upload a réussi mais que
        l'association échoue, on supprime
        le fichier orphelin.
      */

      if (
        uploadedProofPath &&
        createdDepositId
      ) {

        try {

          const {
            error: removeError
          } = await supabaseClient.storage
            .from(
              "payment-proofs"
            )
            .remove([
              uploadedProofPath
            ]);


          if (removeError) {

            console.warn(
              "[ROLEX] Impossible de supprimer le fichier orphelin:",
              removeError
            );

          } else {

            console.log(
              "[ROLEX] Fichier orphelin supprimé."
            );

          }

        } catch (
          cleanupError
        ) {

          console.warn(
            "[ROLEX] Erreur nettoyage:",
            cleanupError
          );

        }

      }


      showToast(
        "Dépôt non effectué",
        getErrorMessage(
          error
        ),
        "error"
      );


    } finally {

      setLoadingButton(
        false
      );

    }

  }
);


/* =========================================================
   BOUTON CHARGEMENT
   ========================================================= */

function setLoadingButton(
  state
) {

  submitButton.disabled =
    state;


  if (state) {

    submitButton.innerHTML = `
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      Envoi de la demande...
    `;

  } else {

    submitButton.innerHTML = `
      <i class="fa-solid fa-paper-plane"></i>
      Envoyer la demande de dépôt
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
      Number(
        value || 0
      )
    ) +
    " XOF"
  );
}


/* =========================================================
   EXTENSION SECURISEE
   ========================================================= */

function getSafeExtension(
  file
) {

  const mimeExtensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf"
  };


  if (
    mimeExtensions[
      file.type
    ]
  ) {

    return mimeExtensions[
      file.type
    ];

  }


  const name =
    String(
      file.name || ""
    );


  const match =
    name.match(
      /\.([a-zA-Z0-9]+)$/
    );


  if (
    match &&
    match[1]
  ) {

    const extension =
      match[1]
        .toLowerCase()
        .replace(
          /[^a-z0-9]/g,
          ""
        );


    if (
      [
        "jpg",
        "jpeg",
        "png",
        "webp",
        "pdf"
      ].includes(
        extension
      )
    ) {

      return extension;
    }

  }


  return "jpg";
}


/* =========================================================
   RANDOM
   ========================================================= */

function randomString(
  length
) {

  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";


  let result = "";


  for (
    let i = 0;
    i < length;
    i++
  ) {

    result +=
      chars.charAt(
        Math.floor(
          Math.random() *
          chars.length
        )
      );

  }


  return result;
}


/* =========================================================
   ERREUR STORAGE
   ========================================================= */

function getStorageErrorMessage(
  error
) {

  if (!error) {

    return (
      "Erreur inconnue pendant l'envoi du fichier."
    );

  }


  const parts = [];


  if (error.message) {
    parts.push(
      error.message
    );
  }

  if (
    error.statusCode
  ) {
    parts.push(
      "HTTP " +
      error.statusCode
    );
  }

  if (
    error.error
  ) {
    parts.push(
      String(
        error.error
      )
    );
  }


  const message =
    parts.join(
      " — "
    );


  if (message) {
    return message;
  }


  return String(
    error
  );
}


/* =========================================================
   ERREUR GENERALE
   ========================================================= */

function getErrorMessage(
  error
) {

  if (!error) {
    return "Une erreur est survenue.";
  }


  if (
    typeof error === "string"
  ) {

    return error;

  }


  const message =
    error.message ||
    error.error_description ||
    error.details ||
    error.hint ||
    String(
      error
    );


  return String(
    message
  )
  .replace(
    /^Error:\s*/i,
    ""
  )
  .trim();
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer =
  null;


function showToast(
  title,
  message,
  type = "error"
) {

  if (!toast) {
    return;
  }


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
      7000
    );
}


/* =========================================================
   SECURITE AFFICHAGE
   ========================================================= */

function escapeHtml(
  value
) {

  return String(
    value ?? ""
  )
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


/* =========================================================
   DEMARRAGE
   ========================================================= */

loadDepositPage();
