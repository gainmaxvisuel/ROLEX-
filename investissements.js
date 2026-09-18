/* =========================================================
   ROLEX — MON STOCK
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
   ÉLÉMENTS
   ========================================================= */

const loading =
  document.getElementById("loading");

const userName =
  document.getElementById("userName");

const investmentsContainer =
  document.getElementById("investments");

const totalInvestments =
  document.getElementById("totalInvestments");

const totalInvested =
  document.getElementById("totalInvested");

const totalGenerated =
  document.getElementById("totalGenerated");

const toast =
  document.getElementById("toast");

const toastTitle =
  document.getElementById("toastTitle");

const toastText =
  document.getElementById("toastText");


let investments = [];

let countdownTimer = null;

let reloadTimer = null;


/* =========================================================
   CHARGEMENT PRINCIPAL
   ========================================================= */

async function loadInvestments() {

  try {

    const {
      data: dashboard,
      error: dashboardError
    } = await supabaseClient.rpc(
      "get_my_dashboard",
      {
        p_token: sessionToken
      }
    );


    if (dashboardError) {
      throw dashboardError;
    }


    if (!dashboard) {
      throw new Error("Session invalide.");
    }


    userName.textContent =
      dashboard.full_name ||
      "Utilisateur";


    const {
      data,
      error
    } = await supabaseClient.rpc(
      "get_my_investments",
      {
        p_token: sessionToken
      }
    );


    if (error) {
      throw error;
    }


    /*
      La fonction SQL retourne directement
      un tableau JSON.
    */

    investments =
      Array.isArray(data)
        ? data
        : [];


    renderSummary(
      investments
    );


    renderInvestments(
      investments
    );


  } catch (error) {

    console.error(
      "Erreur Mon stock :",
      error
    );


    investmentsContainer.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-triangle-exclamation"></i>

        <strong>
          Impossible de charger votre stock
        </strong>

        <span>
          ${escapeHtml(
            error.message ||
            "Une erreur est survenue."
          )}
        </span>
      </div>
    `;


    showToast(
      "Erreur",
      error.message ||
      "Impossible de charger les données.",
      "error"
    );


  } finally {

    loading.classList.add("hide");

  }
}


/* =========================================================
   RÉSUMÉ
   ========================================================= */

function renderSummary(list) {

  totalInvestments.textContent =
    list.length;


  let invested = 0;

  let generated = 0;


  list.forEach(item => {

    invested +=
      Number(item.price || 0);

    generated +=
      Number(item.generated_total || 0);

  });


  totalInvested.textContent =
    formatMoney(invested);


  totalGenerated.textContent =
    formatMoney(generated);
}


/* =========================================================
   AFFICHAGE DES INVESTISSEMENTS
   ========================================================= */

function renderInvestments(list) {

  clearInterval(
    countdownTimer
  );


  investmentsContainer.innerHTML = "";


  if (!list.length) {

    investmentsContainer.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-box-open"></i>

        <strong>
          Aucun produit
        </strong>

        <span>
          Vous ne possédez actuellement aucun produit.
        </span>

        <a href="produits.html">
          Voir les produits
        </a>
      </div>
    `;

    return;
  }


  list.forEach(item => {

    const card =
      document.createElement("article");


    card.className =
      "investment";


    const imageUrl =
      getProductImage(item);


    const status =
      String(
        item.status || ""
      ).toLowerCase();


    const generated =
      Number(
        item.generated_total || 0
      );


    const totalReturn =
      Number(
        item.total_return || 0
      );


    /*
      Progression visuelle basée sur les
      données déjà calculées par la DB.
    */

    let progress = 0;

    if (totalReturn > 0) {

      progress =
        Math.min(
          100,
          Math.max(
            0,
            (generated / totalReturn) * 100
          )
        );

    }


    card.innerHTML = `

      <div class="investment-card">

        <!-- IMAGE -->

        <div class="product-image">

          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(item.product_name)}"
            loading="lazy"
          >

        </div>


        <!-- CONTENU -->

        <div class="investment-body">

          <div class="investment-header">

            <div>

              <div class="product-name">
                ${escapeHtml(item.product_name)}
              </div>

              <div class="purchase-date">
                Acheté le
                ${formatDate(item.start_at)}
              </div>

            </div>


            <div class="status ${status}">
              ${formatStatus(item.status)}
            </div>

          </div>


          <!-- INFORMATIONS -->

          <div class="mini-grid">

            <div class="mini-info">

              <span>
                Investissement
              </span>

              <strong>
                ${formatMoney(item.price)}
              </strong>

            </div>


            <div class="mini-info">

              <span>
                Revenu / cycle
              </span>

              <strong>
                ${formatMoney(item.daily_return)}
              </strong>

            </div>


            <div class="mini-info">

              <span>
                Revenus reçus
              </span>

              <strong>
                ${Number(item.income_count || 0)}
              </strong>

            </div>


            <div class="mini-info">

              <span>
                Généré
              </span>

              <strong>
                ${formatMoney(generated)}
              </strong>

            </div>

          </div>


          <!-- PROGRESSION -->

          <div class="progress-section">

            <div class="progress-top">

              <span>
                Progression
              </span>

              <strong>
                ${progress.toFixed(0)}%
              </strong>

            </div>

            <div class="progress-bar">

              <div
                class="progress-fill"
                style="width:${progress}%"
              ></div>

            </div>

          </div>


          <!-- COMPTE À REBOURS -->

          <div class="next-income-card">

            <div class="next-income-icon">

              <i class="fa-solid fa-clock"></i>

            </div>


            <div class="next-income-content">

              <span>
                Prochain revenu dans
              </span>

              <strong
                class="countdown"
                data-countdown="${escapeHtml(
                  item.next_income_at || ""
                )}"
              >
                Calcul...
              </strong>

            </div>

          </div>


          <!-- INFOS BAS -->

          <div class="bottom-info">

            <div>

              <span>
                Revenu total prévu
              </span>

              <strong>
                ${formatMoney(item.total_return)}
              </strong>

            </div>


            <div>

              <span>
                Fin du cycle
              </span>

              <strong>
                ${formatDate(item.end_at)}
              </strong>

            </div>

          </div>

        </div>

      </div>

    `;


    const image =
      card.querySelector("img");


    image.addEventListener(
      "error",
      () => {

        image.parentElement.innerHTML = `
          <div class="placeholder">
            <i class="fa-solid fa-box"></i>
          </div>
        `;

      }
    );


    investmentsContainer.appendChild(
      card
    );

  });


  /*
    Le compte à rebours est uniquement
    un affichage temporel.

    La prochaine date vient de la DB.
  */

  updateCountdowns();


  countdownTimer =
    setInterval(
      updateCountdowns,
      1000
    );
}


/* =========================================================
   COMPTE À REBOURS
   ========================================================= */

function updateCountdowns() {

  const elements =
    document.querySelectorAll(
      "[data-countdown]"
    );


  const now =
    Date.now();


  elements.forEach(element => {

    const targetString =
      element.dataset.countdown;


    if (!targetString) {

      element.textContent =
        "Date indisponible";

      return;

    }


    const target =
      new Date(
        targetString
      ).getTime();


    if (
      Number.isNaN(target)
    ) {

      element.textContent =
        "Date indisponible";

      return;

    }


    const difference =
      target - now;


    /*
      Lorsque l'heure du prochain revenu
      est atteinte.
    */

    if (difference <= 0) {

      element.textContent =
        "Traitement en cours...";

      element.classList.add(
        "finished"
      );

      return;

    }


    element.classList.remove(
      "finished"
    );


    const totalSeconds =
      Math.floor(
        difference / 1000
      );


    const days =
      Math.floor(
        totalSeconds / 86400
      );


    const hours =
      Math.floor(
        (totalSeconds % 86400) / 3600
      );


    const minutes =
      Math.floor(
        (totalSeconds % 3600) / 60
      );


    const seconds =
      totalSeconds % 60;


    /*
      Affichage professionnel :

      Plus d'un jour :
      1j 08h 24min 32s

      Moins d'un jour :
      08h 24min 32s
    */

    let result = "";


    if (days > 0) {

      result +=
        days +
        (days > 1 ? "j " : "j ");

    }


    result +=
      String(hours).padStart(2, "0") +
      "h ";


    result +=
      String(minutes).padStart(2, "0") +
      "min ";


    result +=
      String(seconds).padStart(2, "0") +
      "s";


    element.textContent =
      result.trim();

  });
}


/* =========================================================
   IMAGE PRODUIT
   ========================================================= */

function getProductImage(item) {

  if (
    item.image_url &&
    String(item.image_url).trim()
  ) {

    return String(
      item.image_url
    ).trim();

  }


  return (
    SUPABASE_URL +
    "/storage/v1/object/public/product-images/" +
    item.product_id +
    ".jpg"
  );
}


/* =========================================================
   STATUT
   ========================================================= */

function formatStatus(status) {

  const value =
    String(
      status || ""
    ).toLowerCase();


  switch (value) {

    case "active":
      return "Actif";

    case "completed":
      return "Terminé";

    case "cancelled":
      return "Annulé";

    case "pending":
      return "En attente";

    default:
      return status || "—";

  }
}


/* =========================================================
   DATE
   ========================================================= */

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


/* =========================================================
   ARGENT
   ========================================================= */

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


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;


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
      5000
    );
}


/* =========================================================
   PROTECTION HTML
   ========================================================= */

function escapeHtml(value) {

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
   ACTUALISATION DB
   ========================================================= */

/*
  Le compte à rebours tourne chaque seconde.

  Mais les données financières sont régulièrement
  relues depuis PostgreSQL afin que l'affichage
  reflète les traitements effectués par la DB.
*/

reloadTimer =
  setInterval(
    loadInvestments,
    60000
  );


/* =========================================================
   DÉMARRAGE
   ========================================================= */

loadInvestments();
