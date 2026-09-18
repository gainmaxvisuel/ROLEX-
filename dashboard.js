const SUPABASE_URL = "https://cbxjcwjlhvicurpndoyz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";

const sessionToken =
  localStorage.getItem("rolex_session_token");

if (!sessionToken) {
  window.location.href = "connexion.html";
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


/* =========================
   OUTILS
========================= */

function formatMoney(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("fr-FR").format(amount) + " XOF";
}


function maskPhone(phone) {
  if (!phone) return "—";

  const value = String(phone);

  if (value.length <= 4) {
    return value;
  }

  return "••••••" + value.slice(-4);
}


/* =========================
   CHARGEMENT DASHBOARD
========================= */

async function loadDashboard() {

  const { data, error } =
    await supabaseClient.rpc(
      "get_dashboard_home",
      {
        p_token: sessionToken
      }
    );

  if (error) {
    console.error(error);

    localStorage.removeItem("rolex_session_token");
    localStorage.removeItem("rolex_user_code");
    localStorage.removeItem("rolex_user_name");

    window.location.href = "connexion.html";
    return;
  }

  if (!data || !data.user) {
    window.location.href = "connexion.html";
    return;
  }

  renderUser(data.user);
  renderProducts(data.products || []);

  document.getElementById("loading").style.display = "none";

  showTelegramPopup();
}


/* =========================
   UTILISATEUR
========================= */

function renderUser(user) {

  const name =
    user.full_name || "Utilisateur";

  document.getElementById("welcomeName").textContent =
    name;

  document.getElementById("topUserName").textContent =
    name;

  document.getElementById("cardUserName").textContent =
    name;

  document.getElementById("cardPhone").textContent =
    maskPhone(user.phone);

  document.getElementById("balance").textContent =
    formatMoney(user.balance);

  document.getElementById("accountStatus").textContent =
    user.status || "—";

  const firstLetter =
    name.trim().charAt(0).toUpperCase();

  document.getElementById("avatar").textContent =
    firstLetter || "R";
}


/* =========================
   PRODUITS
========================= */

function renderProducts(products) {

  const container =
    document.getElementById("products");

  container.innerHTML = "";

  if (!products.length) {

    container.innerHTML = `
      <div class="empty">
        Aucun produit disponible actuellement.
      </div>
    `;

    return;
  }

  products.forEach(product => {

    const card =
      document.createElement("div");

    card.className = "product";

    card.innerHTML = `
      <div class="product-icon">
        <i class="fa-solid fa-chart-line"></i>
      </div>

      <h3>${escapeHtml(product.name)}</h3>

      <div class="product-info">

        <div class="info-row">
          <span>Prix</span>
          <span>${formatMoney(product.price)}</span>
        </div>

        <div class="info-row">
          <span>Revenu</span>
          <span>${formatMoney(product.daily_return)}</span>
        </div>

        <div class="info-row">
          <span>Cycle</span>
          <span>${formatCycle(product.cycle_hours)}</span>
        </div>

        <div class="info-row">
          <span>Retour total</span>
          <span>${formatMoney(product.total_return)}</span>
        </div>

      </div>
    `;

    container.appendChild(card);
  });
}


/* =========================
   CYCLE
========================= */

function formatCycle(hours) {

  const value = Number(hours || 0);

  if (value < 24) {
    return value + " h";
  }

  const days = Math.floor(value / 24);
  const remainingHours = value % 24;

  if (remainingHours === 0) {
    return days + (days > 1 ? " jours" : " jour");
  }

  return (
    days +
    " j " +
    remainingHours +
    " h"
  );
}


/* =========================
   PROTECTION HTML
========================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   MENU MOBILE
========================= */

document
  .getElementById("menuBtn")
  .addEventListener("click", () => {

    document
      .getElementById("sidebar")
      .classList.toggle("open");
  });


/* =========================
   DÉCONNEXION
========================= */

document
  .getElementById("logoutBtn")
  .addEventListener("click", async () => {

    try {

      await supabaseClient.rpc(
        "logout_user",
        {
          p_token: sessionToken
        }
      );

    } catch (error) {
      console.error(error);
    }

    localStorage.removeItem("rolex_session_token");
    localStorage.removeItem("rolex_user_code");
    localStorage.removeItem("rolex_user_name");
    localStorage.removeItem("rolex_show_telegram_popup");

    window.location.href = "connexion.html";
  });


/* =========================
   POPUP TELEGRAM
========================= */

function showTelegramPopup() {

  const shouldShow =
    localStorage.getItem(
      "rolex_show_telegram_popup"
    );

  if (shouldShow !== "1") {
    return;
  }

  const modal =
    document.getElementById("telegramModal");

  modal.style.display = "flex";

  // Le popup est affiché une seule fois
  // pour cette connexion.
  localStorage.removeItem(
    "rolex_show_telegram_popup"
  );
}


document
  .getElementById("laterTelegram")
  .addEventListener("click", () => {

    document
      .getElementById("telegramModal")
      .style.display = "none";
  });


document
  .getElementById("joinTelegram")
  .addEventListener("click", () => {

    document
      .getElementById("telegramModal")
      .style.display = "none";
  });


/* =========================
   DÉMARRAGE
========================= */

loadDashboard();
