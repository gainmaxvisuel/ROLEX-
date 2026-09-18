const SUPABASE_URL =
  "https://cbxjcwjlhvicurpndoyz.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_KUd51SQCl10pIgztFFGq9Q_Jp1YCK6o";

const sessionToken =
  localStorage.getItem("rolex_session_token");

const loading =
  document.getElementById("loading");


// ================================
// VÉRIFICATION SESSION
// ================================

if (!sessionToken) {
  window.location.href = "connexion.html";
}


// ================================
// SUPABASE
// ================================

const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ================================
// CHARGEMENT
// ================================

async function startDashboard() {

  try {

    console.log("Session trouvée :", sessionToken);

    const { data, error } =
      await supabaseClient.rpc(
        "get_dashboard_home",
        {
          p_token: sessionToken
        }
      );

    console.log("Réponse Dashboard :", data);
    console.log("Erreur Dashboard :", error);

    if (error) {
      showError(
        "Erreur Supabase : " +
        (error.message || "Erreur inconnue")
      );
      return;
    }

    if (!data) {
      showError(
        "La base de données n'a retourné aucune donnée."
      );
      return;
    }

    if (!data.user) {
      showError(
        "Utilisateur introuvable dans la réponse du Dashboard."
      );
      return;
    }

    displayUser(data.user);

    displayProducts(
      data.products || []
    );

    loading.style.display = "none";

    showTelegram();

  } catch (error) {

    console.error(
      "Erreur complète :",
      error
    );

    showError(
      "Erreur : " +
      (error.message || String(error))
    );
  }
}


// ================================
// AFFICHER ERREUR
// ================================

function showError(message) {

  loading.innerHTML = `
    <div style="
      width:90%;
      max-width:500px;
      background:#071d11;
      border:1px solid rgba(212,163,23,.35);
      border-radius:15px;
      padding:25px;
      text-align:center;
    ">

      <div style="
        color:#f87171;
        font-size:18px;
        font-weight:bold;
        margin-bottom:15px;
      ">
        Impossible de charger le Dashboard
      </div>

      <div style="
        color:#cbd5ce;
        font-size:14px;
        line-height:1.6;
        word-break:break-word;
      ">
        ${escapeHtml(message)}
      </div>

      <button
        onclick="location.reload()"
        style="
          margin-top:20px;
          padding:11px 20px;
          border:0;
          border-radius:8px;
          background:#d4a317;
          color:#03140a;
          font-weight:bold;
          cursor:pointer;
        "
      >
        Réessayer
      </button>

    </div>
  `;
}


// ================================
// UTILISATEUR
// ================================

function displayUser(user) {

  const name =
    user.full_name || "Utilisateur";

  document.getElementById(
    "welcomeName"
  ).textContent = name;

  document.getElementById(
    "topUserName"
  ).textContent = name;

  document.getElementById(
    "cardUserName"
  ).textContent = name;

  document.getElementById(
    "cardPhone"
  ).textContent =
    maskPhone(user.phone);

  document.getElementById(
    "balance"
  ).textContent =
    formatMoney(user.balance);

  document.getElementById(
    "accountStatus"
  ).textContent =
    user.status || "—";

  document.getElementById(
    "avatar"
  ).textContent =
    name.trim().charAt(0).toUpperCase();
}


// ================================
// PRODUITS
// ================================

function displayProducts(products) {

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
          <span>
            ${formatMoney(product.price)}
          </span>
        </div>

        <div class="info-row">
          <span>Revenu</span>
          <span>
            ${formatMoney(product.daily_return)}
          </span>
        </div>

        <div class="info-row">
          <span>Cycle</span>
          <span>
            ${formatCycle(product.cycle_hours)}
          </span>
        </div>

        <div class="info-row">
          <span>Retour total</span>
          <span>
            ${formatMoney(product.total_return)}
          </span>
        </div>

      </div>
    `;

    container.appendChild(card);
  });
}


// ================================
// ARGENT
// ================================

function formatMoney(value) {

  return new Intl.NumberFormat("fr-FR")
    .format(Number(value || 0)) +
    " XOF";
}


// ================================
// TÉLÉPHONE
// ================================

function maskPhone(phone) {

  if (!phone) return "—";

  const value =
    String(phone);

  if (value.length <= 4) {
    return value;
  }

  return "••••••" +
    value.slice(-4);
}


// ================================
// CYCLE
// ================================

function formatCycle(hours) {

  const value =
    Number(hours || 0);

  if (value < 24) {
    return value + " h";
  }

  const days =
    Math.floor(value / 24);

  const remaining =
    value % 24;

  if (remaining === 0) {
    return days +
      (days > 1
        ? " jours"
        : " jour");
  }

  return days +
    " j " +
    remaining +
    " h";
}


// ================================
// PROTECTION HTML
// ================================

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// ================================
// MENU MOBILE
// ================================

document
  .getElementById("menuBtn")
  .addEventListener("click", () => {

    document
      .getElementById("sidebar")
      .classList.toggle("open");

  });


// ================================
// DÉCONNEXION
// ================================

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

    localStorage.removeItem(
      "rolex_session_token"
    );

    localStorage.removeItem(
      "rolex_user_code"
    );

    localStorage.removeItem(
      "rolex_user_name"
    );

    localStorage.removeItem(
      "rolex_show_telegram_popup"
    );

    window.location.href =
      "connexion.html";
  });


// ================================
// TELEGRAM
// ================================

function showTelegram() {

  const show =
    localStorage.getItem(
      "rolex_show_telegram_popup"
    );

  if (show !== "1") {
    return;
  }

  document.getElementById(
    "telegramModal"
  ).style.display = "flex";

  localStorage.removeItem(
    "rolex_show_telegram_popup"
  );
}


document
  .getElementById("laterTelegram")
  .addEventListener("click", () => {

    document.getElementById(
      "telegramModal"
    ).style.display = "none";

  });


document
  .getElementById("joinTelegram")
  .addEventListener("click", () => {

    document.getElementById(
      "telegramModal"
    ).style.display = "none";

  });


// ================================
// DÉMARRAGE
// ================================

startDashboard();
