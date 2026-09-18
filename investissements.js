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


const sessionToken =
  localStorage.getItem(
    "rolex_session_token"
  );


if (!sessionToken) {

  window.location.href =
    "connexion.html";

}


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


/* =========================================================
   CHARGER LES DONNÉES
   ========================================================= */

async function loadInvestments() {

  try {

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


    const {
      data,
      error
    } =
      await supabaseClient.rpc(
        "get_my_investments",
        {
          p_token: sessionToken
        }
      );


    if (error) {
      throw error;
    }


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
      "Erreur stock :",
      error
    );


    investmentsContainer.innerHTML = `
      <div class="empty">
        Impossible de charger votre stock.
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
   AFFICHAGE
   ========================================================= */

function renderInvestments(list) {

  clearInterval(
    countdownTimer
  );


  investmentsContainer.innerHTML = "";


  if (!list.length) {

    investmentsContainer.innerHTML = `
      <div class="empty">
        Vous ne possédez actuellement aucun produit.
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


    const statusClass =
      String(item.status || "")
        .toLowerCase();


    card.innerHTML = `

      <div class="investment-main">

        <div class="product-image">

          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(item.product_name)}"
            loading="lazy"
          >

        </div>


        <div class="investment-content">

          <div class="investment-top">

            <div class="product-name">
              ${escapeHtml(item.product_name)}
            </div>

            <div class="status ${statusClass}">
              ${formatStatus(item.status)}
            </div>

          </div>


          <div class="details">

            <div class="detail">

              <div class="detail-label">
                Prix d'achat
              </div>

              <div class="detail-value">
                ${formatMoney(item.price)}
              </div>

            </div>


            <div class="detail">

              <div class="detail-label">
                Revenu quotidien
              </div>

              <div class="detail-value">
                ${formatMoney(item.daily_return)}
              </div>

            </div>


            <div class="detail">

              <div class="detail-label">
                Revenu généré
              </div>

              <div class="detail-value">
                ${formatMoney(item.generated_total)}
              </div>

            </div>


            <div class="detail">

              <div class="detail-label">
                Revenus reçus
              </div>

              <div class="detail-value">
                ${Number(item.income_count || 0)}
              </div>

            </div>


            <div class="detail">

              <div class="detail-label">
                Retour total
              </div>

              <div class="detail-value">
                ${formatMoney(item.total_return)}
              </div>

            </div>


            <div class="detail">

              <div class="detail-label">
                Fin du cycle
              </div>

              <div class="detail-value">
                ${formatDate(item.end_at)}
              </div>

            </div>

          </div>

        </div>

      </div>


      <div class="countdown-box">

        <div class="countdown-label">
          Prochain revenu
        </div>

        <div
          class="countdown"
          data-countdown="${escapeHtml(item.next_income_at || "")}"
        >
          —
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
        "Non disponible";

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
        "Non disponible";

      return;

    }


    const difference =
      target - now;


    if (
      difference <= 0
    ) {

      element.textContent =
        "Traitement du prochain revenu";

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


    element.textContent =
      formatCountdown(
        days,
        hours,
        minutes,
        seconds
      );

  });
}


/* =========================================================
   FORMAT COMPTE À REBOURS
   ========================================================= */

function formatCountdown(
  days,
  hours,
  minutes,
  seconds
) {

  const parts = [];


  if (days > 0) {

    parts.push(
      days +
      (
        days > 1
          ? " jours"
          : " jour"
      )
    );

  }


  parts.push(
    String(hours).padStart(2, "0") +
    " h"
  );


  parts.push(
    String(minutes).padStart(2, "0") +
    " min"
  );


  parts.push(
    String(seconds).padStart(2, "0") +
    " s"
  );


  return parts.join(" ");
}


/* =========================================================
   IMAGE
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
    String(status || "")
      .toLowerCase();


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
   DÉMARRAGE
   ========================================================= */

loadInvestments();
