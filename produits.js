/* =========================================================
   ROLEX — PRODUITS
   ========================================================= */


/* =========================
   SUPABASE
========================= */

const SUPABASE_URL =
  "https://cbxjcwjlhvicurpndoyz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


/* =========================
   SESSION
========================= */

const sessionToken =
  localStorage.getItem(
    "rolex_session_token"
  );


if (!sessionToken) {

  window.location.href =
    "connexion.html";

}


/* =========================
   VARIABLES
========================= */

let selectedProduct = null;


/* =========================
   ELEMENTS
========================= */

const loading =
  document.getElementById("loading");

const productsContainer =
  document.getElementById("products");

const productCount =
  document.getElementById("productCount");

const userName =
  document.getElementById("userName");

const purchaseModal =
  document.getElementById("purchaseModal");

const confirmationName =
  document.getElementById("confirmationName");

const confirmationPrice =
  document.getElementById("confirmationPrice");

const confirmationImage =
  document.getElementById("confirmationImage");

const confirmPurchase =
  document.getElementById("confirmPurchase");

const cancelPurchase =
  document.getElementById("cancelPurchase");

const closeModal =
  document.getElementById("closeModal");

const toast =
  document.getElementById("toast");

const toastTitle =
  document.getElementById("toastTitle");

const toastText =
  document.getElementById("toastText");


/* =========================
   CHARGER LES PRODUITS
========================= */

async function loadProducts() {

  try {

    /*
      Récupération des informations
      utilisateur depuis PostgreSQL.
    */

    const {
      data: dashboard,
      error: dashboardError
    } =
      await supabaseClient.rpc(
        "get_my_dashboard",
        {
          p_token: sessionToken
        }
      );


    if (dashboardError) {
      throw dashboardError;
    }


    if (!dashboard) {
      throw new Error(
        "Session invalide."
      );
    }


    userName.textContent =
      dashboard.full_name ||
      "Utilisateur";


    /*
      Récupération des 10 produits.

      IMPORTANT :
      La fonction retourne maintenant
      les produits actifs ET inactifs.

      active = true  → achetable
      active = false → affiché mais bloqué
    */

    const {
      data: products,
      error: productsError
    } =
      await supabaseClient.rpc(
        "get_available_products",
        {
          p_token: sessionToken
        }
      );


    if (productsError) {
      throw productsError;
    }


    const list =
      Array.isArray(products)
        ? products
        : [];


    renderProducts(list);


  } catch (error) {

    console.error(
      "Erreur produits :",
      error
    );


    productsContainer.innerHTML = `
      <div class="empty">
        Impossible de charger les produits.
      </div>
    `;


    showToast(
      "Erreur",
      error.message ||
      "Impossible de charger les produits.",
      "error"
    );

  } finally {

    loading.classList.add("hide");

  }
}


/* =========================
   AFFICHAGE
========================= */

function renderProducts(products) {

  productCount.textContent =
    products.length;


  productsContainer.innerHTML = "";


  if (!products.length) {

    productsContainer.innerHTML = `
      <div class="empty">
        Aucun produit disponible actuellement.
      </div>
    `;

    return;
  }


  products.forEach(product => {

    const card =
      document.createElement("article");


    card.className =
      "product-card";


    /*
      IMAGE

      Priorité :
      1. image_url enregistré dans DB
      2. sinon ID du produit
    */

    const imageUrl =
      getProductImage(product);


    /*
      Le statut d'achat vient
      directement de la base.

      active = true
      → achat possible

      active = false
      → produit affiché mais bloqué
    */

    const isAvailable =
      product.active === true;


    const buttonText =
      isAvailable
        ? "Acheter ce produit"
        : "Bientôt disponible";


    const buttonClass =
      isAvailable
        ? "buy-button"
        : "buy-button disabled";


    card.innerHTML = `

      <div class="product-main">

        <div class="product-image">

          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(product.name)}"
            loading="lazy"
          >

        </div>


        <div class="product-content">

          <div class="product-name">
            ${escapeHtml(product.name)}
          </div>


          <div class="product-info">

            <div class="info-row">

              <span class="info-label">
                Prix
              </span>

              <span class="info-value">
                ${formatMoney(product.price)}
              </span>

            </div>


            <div class="info-row">

              <span class="info-label">
                Revenu quotidien
              </span>

              <span class="info-value">
                ${formatMoney(product.daily_return)}
              </span>

            </div>


            <div class="info-row">

              <span class="info-label">
                Cycle
              </span>

              <span class="info-value">
                ${formatCycle(product.cycle_hours)}
              </span>

            </div>


            <div class="info-row">

              <span class="info-label">
                Retour total
              </span>

              <span class="info-value">
                ${formatMoney(product.total_return)}
              </span>

            </div>

          </div>

        </div>

      </div>


      <div class="buy-area">

        <button
          type="button"
          class="${buttonClass}"
          ${isAvailable ? "" : "disabled"}
        >

          ${buttonText}

        </button>

      </div>

    `;


    /* =========================
       IMAGE
    ========================= */

    const image =
      card.querySelector("img");


    image.addEventListener(
      "error",
      () => {

        const wrapper =
          image.parentElement;


        wrapper.innerHTML = `
          <div class="image-placeholder">
            <i class="fa-solid fa-box"></i>
          </div>
        `;

      }
    );


    /* =========================
       BOUTON
    ========================= */

    const button =
      card.querySelector(".buy-button");


    /*
      IMPORTANT :

      On ajoute l'événement
      uniquement aux produits
      réellement actifs.

      Les produits désactivés
      restent visibles mais ne
      peuvent pas ouvrir la fenêtre
      d'achat.
    */

    if (isAvailable) {

      button.addEventListener(
        "click",
        () => openPurchaseModal(product)
      );

    }


    productsContainer.appendChild(card);

  });
}


/* =========================
   IMAGE PRODUIT
========================= */

function getProductImage(product) {

  /*
    image_url vient de la base.

    Pour les 10 produits :

    Pack 1  → pack-1.jpg
    Pack 2  → pack-2.jpg
    ...
    Pack 10 → pack-10.jpg
  */

  if (
    product.image_url &&
    String(product.image_url).trim()
  ) {

    return String(
      product.image_url
    ).trim();

  }


  /*
    Fallback automatique avec
    l'ID du produit.
  */

  return (
    SUPABASE_URL +
    "/storage/v1/object/public/product-images/" +
    product.id +
    ".jpg"
  );
}


/* =========================
   MODAL
========================= */

function openPurchaseModal(product) {

  /*
    Double sécurité côté interface.

    Même si un produit inactif
    arrivait ici par erreur,
    aucun achat ne serait proposé.
  */

  if (
    !product ||
    product.active !== true
  ) {

    showToast(
      "Produit indisponible",
      "Ce produit n'est actuellement pas disponible.",
      "error"
    );

    return;
  }


  selectedProduct =
    product;


  confirmationName.textContent =
    product.name;


  confirmationPrice.textContent =
    formatMoney(product.price);


  const imageUrl =
    getProductImage(product);


  confirmationImage.innerHTML = `
    <img
      src="${escapeHtml(imageUrl)}"
      alt="${escapeHtml(product.name)}"
    >
  `;


  const modalImage =
    confirmationImage.querySelector("img");


  modalImage.addEventListener(
    "error",
    () => {

      confirmationImage.innerHTML = `
        <div class="image-placeholder">
          <i class="fa-solid fa-box"></i>
        </div>
      `;

    }
  );


  purchaseModal.classList.add("show");
}


/* =========================
   FERMER MODAL
========================= */

function closePurchaseModal() {

  selectedProduct =
    null;

  purchaseModal.classList.remove(
    "show"
  );

}


cancelPurchase.addEventListener(
  "click",
  closePurchaseModal
);


closeModal.addEventListener(
  "click",
  closePurchaseModal
);


purchaseModal.addEventListener(
  "click",
  event => {

    if (
      event.target ===
      purchaseModal
    ) {

      closePurchaseModal();

    }

  }
);


/* =========================
   CONFIRMER ACHAT
========================= */

confirmPurchase.addEventListener(
  "click",
  async () => {

    if (!selectedProduct) {
      return;
    }


    /*
      Sécurité supplémentaire.

      L'achat n'est envoyé à
      PostgreSQL que si le produit
      est actif.
    */

    if (
      selectedProduct.active !== true
    ) {

      showToast(
        "Produit indisponible",
        "Ce produit n'est actuellement pas disponible.",
        "error"
      );

      closePurchaseModal();

      return;
    }


    const product =
      selectedProduct;


    confirmPurchase.disabled =
      true;


    confirmPurchase.textContent =
      "Traitement en cours...";


    try {

      /*
        Aucun calcul financier
        côté navigateur.

        PostgreSQL vérifie :
        - session
        - produit actif
        - solde
        - achat
        - investissement
        - transaction
        - commissions
      */

      const {
        data,
        error
      } =
        await supabaseClient.rpc(
          "purchase_product",
          {
            p_token: sessionToken,
            p_product_id: product.id
          }
        );


      if (error) {
        throw error;
      }


      closePurchaseModal();


      const message =
        extractPurchaseMessage(data);


      showToast(
        "Achat confirmé",
        message,
        "success"
      );


      /*
        Recharge les données
        depuis PostgreSQL.
      */

      setTimeout(
        loadProducts,
        1200
      );


    } catch (error) {

      console.error(
        "Erreur achat :",
        error
      );


      showToast(
        "Achat non effectué",
        getProfessionalErrorMessage(
          error
        ),
        "error"
      );

    } finally {

      confirmPurchase.disabled =
        false;

      confirmPurchase.textContent =
        "Confirmer l'achat";

    }

  }
);


/* =========================
   MESSAGE ACHAT
========================= */

function extractPurchaseMessage(data) {

  if (!data) {

    return "Votre achat a été enregistré avec succès.";

  }


  if (
    typeof data === "string"
  ) {

    return data;

  }


  if (data.message) {

    return String(
      data.message
    );

  }


  if (data.status) {

    return (
      "L'opération a été enregistrée. Statut : " +
      String(data.status)
    );

  }


  return (
    "Votre achat a été enregistré avec succès."
  );
}


/* =========================
   MESSAGE ERREUR
========================= */

function getProfessionalErrorMessage(
  error
) {

  const raw =
    String(
      error?.message ||
      ""
    );


  if (
    raw.toLowerCase().includes(
      "solde"
    )
  ) {

    return (
      "L'achat n'a pas pu être effectué. " +
      "Veuillez vérifier votre solde disponible."
    );

  }


  if (
    raw.toLowerCase().includes(
      "session"
    )
  ) {

    return (
      "Votre session n'est plus valide. " +
      "Veuillez vous reconnecter."
    );

  }


  if (
    raw.toLowerCase().includes(
      "produit"
    )
  ) {

    return (
      "Ce produit n'est actuellement pas disponible."
    );

  }


  return (
    raw ||
    "L'achat n'a pas pu être effectué. Veuillez réessayer."
  );
}


/* =========================
   TOAST
========================= */

let toastTimer = null;


function showToast(
  title,
  message,
  type
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


/* =========================
   ARGENT
========================= */

function formatMoney(value) {

  return (
    new Intl.NumberFormat(
      "fr-FR"
    ).format(
      Number(value || 0)
    ) +
    " XOF"
  );
}


/* =========================
   CYCLE
========================= */

function formatCycle(hours) {

  const value =
    Number(hours || 0);


  if (value < 24) {

    return (
      value +
      " h"
    );

  }


  const days =
    Math.floor(
      value / 24
    );


  const remaining =
    value % 24;


  if (
    remaining === 0
  ) {

    return (
      days +
      (
        days > 1
          ? " jours"
          : " jour"
      )
    );

  }


  return (
    days +
    " j " +
    remaining +
    " h"
  );
}


/* =========================
   SECURITE HTML
========================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


/* =========================
   DEMARRAGE
========================= */

loadProducts();
