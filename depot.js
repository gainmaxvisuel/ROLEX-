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
   VARIABLES
   ========================================================= */

let currentUser = null;
let selectedMethod = null;
let minimumDeposit = 3000;
let createdDepositId = null;
let uploadedProofPath = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const userNameElement =
  document.getElementById("userName");

const balanceElement =
  document.getElementById("balance");

const amountInput =
  document.getElementById("amount");

const payerPhoneInput =
  document.getElementById("payerPhone");

const proofInput =
  document.getElementById("proof");

const depositForm =
  document.getElementById("depositForm");

const submitButton =
  document.getElementById("submitButton");

const paymentButton =
  document.getElementById("paymentButton");

const receiverBox =
  document.getElementById("receiverBox");

const receiverNumber =
  document.getElementById("receiverNumber");

const ussdBox =
  document.getElementById("ussdBox");

const ussdCode =
  document.getElementById("ussdCode");

const paymentMethodsContainer =
  document.getElementById("paymentMethods");

const operatorContainer =
  document.getElementById("operatorContainer");

const loadingOverlay =
  document.getElementById("loadingOverlay");

const toastContainer =
  document.getElementById("toastContainer");


/* =========================================================
   FORMAT ARGENT
   ========================================================= */

function formatMoney(value) {
  const number = Number(value || 0);

  return number.toLocaleString("fr-FR") + " XOF";
}


/* =========================================================
   LOADING
   ========================================================= */

function setLoadingButton(button, loading, text = "") {
  if (!button) return;

  if (loading) {
    button.dataset.originalText =
      button.innerHTML;

    button.disabled = true;

    button.innerHTML =
      `<i class="fas fa-spinner fa-spin"></i> ${text || "Chargement..."}`;
  } else {
    button.disabled = false;

    if (button.dataset.originalText) {
      button.innerHTML =
        button.dataset.originalText;
    }
  }
}


function setPageLoading(show) {
  if (!loadingOverlay) return;

  loadingOverlay.style.display =
    show ? "flex" : "none";
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "error") {
  if (!toastContainer) {
    alert(message);
    return;
  }

  const toast =
    document.createElement("div");

  toast.className =
    `toast toast-${type}`;

  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${
        type === "success"
          ? "fa-check-circle"
          : "fa-exclamation-circle"
      }"></i>
    </div>

    <div class="toast-message">
      ${message}
    </div>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}


/* =========================================================
   ERREURS
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


function getStorageErrorMessage(error) {
  if (!error) {
    return "Erreur lors de l'envoi de la preuve.";
  }

  if (
    error.message &&
    error.message.toLowerCase().includes("payload")
  ) {
    return "Le fichier est trop volumineux.";
  }

  if (
    error.message &&
    error.message.toLowerCase().includes("policy")
  ) {
    return "Vous n'avez pas l'autorisation d'envoyer cette preuve.";
  }

  return (
    error.message ||
    "Erreur lors de l'envoi de la preuve."
  );
}


/* =========================================================
   RANDOM STRING
   ========================================================= */

function randomString(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {
    result +=
      chars.charAt(
        Math.floor(Math.random() * chars.length)
      );
  }

  return result;
}


/* =========================================================
   EXTENSION SECURISEE
   ========================================================= */

function getSafeExtension(file) {
  if (!file) return "bin";

  const type =
    (file.type || "").toLowerCase();

  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "application/pdf") return "pdf";

  const originalName =
    file.name || "";

  const match =
    originalName.match(/\.([a-zA-Z0-9]+)$/);

  return match
    ? match[1].toLowerCase()
    : "bin";
}


/* =========================================================
   VALIDATION PREUVE
   ========================================================= */

function validateProofFile(file) {
  if (!file) {
    showToast(
      "Veuillez sélectionner votre preuve de paiement."
    );

    return false;
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf"
  ];

  if (!allowedTypes.includes(file.type)) {
    showToast(
      "Format de fichier non accepté. Utilisez JPG, PNG, WEBP ou PDF."
    );

    return false;
  }

  const maxSize =
    10 * 1024 * 1024;

  if (file.size > maxSize) {
    showToast(
      "La preuve ne doit pas dépasser 10 Mo."
    );

    return false;
  }

  return true;
}


/* =========================================================
   NUMERO PAYEUR
   ========================================================= */

if (payerPhoneInput) {
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
}


/* =========================================================
   CHARGER DASHBOARD
   ========================================================= */

async function loadUser() {
  const { data, error } =
    await supabaseClient.rpc(
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
      "Impossible de récupérer votre compte."
    );
  }

  currentUser = data;

  if (userNameElement) {
    userNameElement.textContent =
      data.full_name || "Utilisateur";
  }

  if (balanceElement) {
    balanceElement.textContent =
      formatMoney(data.balance);
  }

  return data;
}


/* =========================================================
   CHARGER MINIMUM DEPOT
   ========================================================= */

async function loadMinimumDeposit() {
  const { data, error } =
    await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "deposit_minimum")
      .maybeSingle();

  if (error) {
    console.warn(
      "Impossible de récupérer deposit_minimum:",
      error
    );

    return;
  }

  if (data && data.value) {
    const parsed =
      Number(data.value);

    if (
      Number.isFinite(parsed) &&
      parsed > 0
    ) {
      minimumDeposit = parsed;
    }
  }
}


/* =========================================================
   CHARGER METHODES DE PAIEMENT
   ========================================================= */

async function loadPaymentMethods() {
  const { data, error } =
    await supabaseClient.rpc(
      "get_my_deposit_payment_methods",
      {
        p_token: sessionToken
      }
    );

  if (error) {
    throw error;
  }

  if (!data || !data.length) {
    throw new Error(
      "Aucun moyen de paiement disponible pour votre pays."
    );
  }

  renderPaymentMethods(data);
}


/* =========================================================
   AFFICHER METHODES
   ========================================================= */

function renderPaymentMethods(methods) {
  if (!paymentMethodsContainer) {
    return;
  }

  paymentMethodsContainer.innerHTML = "";

  const country =
    (
      currentUser?.country_code ||
      methods[0]?.country_code ||
      ""
    ).toUpperCase();

  /*
   * Pour BF et CI :
   * plusieurs opérateurs sont affichés.
   *
   * Pour BJ/TG :
   * on utilise directement la première méthode.
   */

  if (
    country === "BF" ||
    country === "CI"
  ) {
    if (operatorContainer) {
      operatorContainer.style.display =
        "block";
    }

    methods.forEach(
      (method, index) => {
        const button =
          document.createElement("button");

        button.type = "button";

        button.className =
          "payment-method";

        button.dataset.index =
          String(index);

        button.innerHTML = `
          <span>
            <i class="fas fa-mobile-alt"></i>
          </span>

          <strong>
            ${method.operator || "Paiement"}
          </strong>
        `;

        button.addEventListener(
          "click",
          () => {
            document
              .querySelectorAll(
                ".payment-method"
              )
              .forEach((item) => {
                item.classList.remove(
                  "active"
                );
              });

            button.classList.add(
              "active"
            );

            selectPaymentMethod(method);
          }
        );

        paymentMethodsContainer.appendChild(
          button
        );
      }
    );

    /*
     * Sélection automatique de la première
     * méthode disponible.
     */
    if (methods[0]) {
      const firstButton =
        paymentMethodsContainer.querySelector(
          ".payment-method"
        );

      if (firstButton) {
        firstButton.classList.add(
          "active"
        );
      }

      selectPaymentMethod(methods[0]);
    }

  } else {
    /*
     * Pour BJ/TG, pas de sélection
     * d'opérateur à afficher.
     */

    if (operatorContainer) {
      operatorContainer.style.display =
        "none";
    }

    selectPaymentMethod(methods[0]);
  }
}


/* =========================================================
   SELECTION METHOD
   ========================================================= */

function selectPaymentMethod(method) {
  selectedMethod = method;

  updatePaymentInformation();
  updateUSSD();
}


/* =========================================================
   INFORMATIONS PAIEMENT
   ========================================================= */

function updatePaymentInformation() {
  if (!selectedMethod) {
    return;
  }

  /*
   * IMPORTANT :
   *
   * Le numéro receveur est affiché UNIQUEMENT
   * si le modèle USSD utilise {receiver}.
   *
   * Exemple Moov :
   * *555*2*1*{receiver}*{amount}#
   *
   * Exemple Orange :
   * *144*4*6*{amount}#
   *
   * Donc Orange n'affiche PAS le numéro receveur.
   */

  const template =
    selectedMethod.ussd_template || "";

  const needsReceiver =
    template.includes(
      "{receiver}"
    );

  if (
    needsReceiver &&
    selectedMethod.receiver
  ) {
    if (receiverBox) {
      receiverBox.style.display =
        "block";
    }

    if (receiverNumber) {
      receiverNumber.textContent =
        selectedMethod.receiver;
    }
  } else {
    if (receiverBox) {
      receiverBox.style.display =
        "none";
    }

    if (receiverNumber) {
      receiverNumber.textContent =
        "";
    }
  }
}


/* =========================================================
   GENERER USSD
   ========================================================= */

function updateUSSD() {
  if (!ussdCode || !ussdBox) {
    return;
  }

  if (!selectedMethod) {
    ussdBox.style.display =
      "none";

    return;
  }

  let template =
    selectedMethod.ussd_template;

  if (!template) {
    ussdCode.textContent =
      "Paiement manuel";

    ussdBox.style.display =
      "block";

    return;
  }

  const rawAmount =
    amountInput
      ? amountInput.value.trim()
      : "";

  const amount =
    Number(rawAmount);

  let code =
    template;

  /*
   * IMPORTANT :
   * On utilise UNIQUEMENT le receiver
   * fourni par la base.
   *
   * Aucune ancienne valeur comme
   * 73234837 ne peut être utilisée.
   */

  if (
    code.includes("{receiver}")
  ) {
    const receiver =
      selectedMethod.receiver || "";

    code =
      code.replaceAll(
        "{receiver}",
        receiver
      );
  }

  if (
    code.includes("{amount}")
  ) {
    code =
      code.replaceAll(
        "{amount}",
        Number.isFinite(amount) &&
        amount > 0
          ? String(amount)
          : "MONTANT"
      );
  }

  ussdCode.textContent =
    code;

  ussdBox.style.display =
    "block";
}


/* =========================================================
   MONTANT CHANGE
   ========================================================= */

if (amountInput) {
  amountInput.addEventListener(
    "input",
    updateUSSD
  );

  amountInput.addEventListener(
    "change",
    updateUSSD
  );
}


/* =========================================================
   ALLER AU PAIEMENT
   ========================================================= */

if (paymentButton) {
  paymentButton.addEventListener(
    "click",
    () => {

      if (!selectedMethod) {
        showToast(
          "Veuillez sélectionner un moyen de paiement."
        );

        return;
      }

      const rawAmount =
        amountInput
          ? amountInput.value.trim()
          : "";

      const amount =
        Number(rawAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        showToast(
          "Veuillez saisir un montant valide."
        );

        if (amountInput) {
          amountInput.focus();
        }

        return;
      }

      if (
        amount < minimumDeposit
      ) {
        showToast(
          `Le montant minimum est de ${formatMoney(minimumDeposit)}.`
        );

        if (amountInput) {
          amountInput.focus();
        }

        return;
      }

      let template =
        selectedMethod.ussd_template;

      if (!template) {
        showToast(
          "Le paiement USSD n'est pas disponible pour ce moyen de paiement."
        );

        return;
      }

      /*
       * Construction du code directement
       * depuis la méthode actuellement
       * sélectionnée.
       */

      let ussd =
        template;

      /*
       * Remplacement du montant.
       */

      ussd =
        ussd.replaceAll(
          "{amount}",
          String(amount)
        );

      /*
       * Remplacement du receveur
       * UNIQUEMENT si le template
       * le demande.
       */

      if (
        ussd.includes(
          "{receiver}"
        )
      ) {
        const receiver =
          selectedMethod.receiver;

        if (!receiver) {
          showToast(
            "Le numéro de réception est introuvable."
          );

          return;
        }

        ussd =
          ussd.replaceAll(
            "{receiver}",
            receiver
          );
      }

      /*
       * Nettoyage final.
       */

      ussd =
        ussd.trim();

      /*
       * Ouverture du composeur
       * avec le code USSD.
       */

      window.location.href =
        `tel:${encodeURIComponent(ussd)}`;
    }
  );
}


/* =========================================================
   ENVOI DU DEPOT
   ========================================================= */

if (depositForm) {
  depositForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();

      if (!selectedMethod) {
        showToast(
          "Veuillez sélectionner un moyen de paiement."
        );

        return;
      }

      const rawAmount =
        amountInput
          ? amountInput.value.trim()
          : "";

      const amount =
        Number(rawAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        showToast(
          "Veuillez saisir un montant valide."
        );

        return;
      }

      if (
        amount < minimumDeposit
      ) {
        showToast(
          `Le montant minimum est de ${formatMoney(minimumDeposit)}.`
        );

        return;
      }

      const payerPhone =
        payerPhoneInput
          ? payerPhoneInput.value.trim()
          : "";

      if (!payerPhone) {
        showToast(
          "Veuillez saisir votre numéro utilisé pour le paiement."
        );

        if (payerPhoneInput) {
          payerPhoneInput.focus();
        }

        return;
      }

      const file =
        proofInput
          ? proofInput.files[0]
          : null;

      if (!validateProofFile(file)) {
        return;
      }

      setLoadingButton(
        submitButton,
        true,
        "Envoi..."
      );

      try {

        /*
         * =====================================================
         * 1. CREATION DU DEPOT
         * =====================================================
         */

        const { data: depositId, error: depositError } =
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

        if (depositError) {
          throw depositError;
        }

        if (!depositId) {
          throw new Error(
            "Le dépôt n'a pas pu être créé."
          );
        }

        createdDepositId =
          depositId;


        /*
         * =====================================================
         * 2. NOM DU FICHIER
         * =====================================================
         */

        const extension =
          getSafeExtension(file);

        const randomPart =
          randomString(16);

        const timestamp =
          Date.now();

        const fileName =
          `${timestamp}-${randomPart}.${extension}`;

        uploadedProofPath =
          `${createdDepositId}/${fileName}`;


        /*
         * =====================================================
         * 3. UPLOAD PREUVE
         * =====================================================
         */

        const {
          error: uploadError
        } =
          await supabaseClient.storage
            .from("payment-proofs")
            .upload(
              uploadedProofPath,
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


        /*
         * =====================================================
         * 4. ATTACHER LA PREUVE AU DEPOT
         * =====================================================
         */

        const {
          data: proofAttached,
          error: proofError
        } =
          await supabaseClient.rpc(
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

        if (proofError) {
          throw proofError;
        }

        if (!proofAttached) {
          throw new Error(
            "La preuve n'a pas pu être associée au dépôt."
          );
        }


        /*
         * =====================================================
         * 5. SUCCES
         * =====================================================
         */

        showToast(
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
          "Erreur dépôt:",
          error
        );


        /*
         * =====================================================
         * SUPPRESSION DU FICHIER EN CAS D'ERREUR
         * =====================================================
         */

        if (uploadedProofPath) {
          try {
            await supabaseClient.storage
              .from("payment-proofs")
              .remove([
                uploadedProofPath
              ]);
          } catch (removeError) {
            console.warn(
              "Impossible de supprimer la preuve orpheline:",
              removeError
            );
          }
        }


        /*
         * =====================================================
         * MESSAGE
         * =====================================================
         */

        let message =
          getErrorMessage(error);

        if (
          error?.message &&
          (
            error.message
              .toLowerCase()
              .includes("storage") ||
            error.message
              .toLowerCase()
              .includes("policy") ||
            error.message
              .toLowerCase()
              .includes("upload")
          )
        ) {
          message =
            getStorageErrorMessage(
              error
            );
        }

        showToast(message);

      } finally {

        setLoadingButton(
          submitButton,
          false
        );

        createdDepositId =
          null;

        uploadedProofPath =
          null;
      }
    }
  );
}


/* =========================================================
   INITIALISATION
   ========================================================= */

async function loadDepositPage() {
  try {

    setPageLoading(true);

    await loadUser();

    await loadMinimumDeposit();

    await loadPaymentMethods();

    updateUSSD();

  } catch (error) {

    console.error(
      "Erreur chargement page dépôt:",
      error
    );

    showToast(
      getErrorMessage(error)
    );

  } finally {

    setPageLoading(false);
  }
}


/* =========================================================
   DEMARRAGE
   ========================================================= */

loadDepositPage();
