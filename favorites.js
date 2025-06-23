document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("favorites-container");
  const mealDetails = document.getElementById("meal-details");
  const mealDetailsContent = document.querySelector(".meal-details-content");
  const backBtn = document.getElementById("back-btn");
  const userInfoDiv = document.getElementById("user-info");

  const loggedInUserRaw = localStorage.getItem("loggedInUser");

  // ===== 1. Check login status =====
  if (!loggedInUserRaw) {
    showLoginPrompt();
    return;
  }

  const user = JSON.parse(loggedInUserRaw);
  if (!user || !user.name) {
    showInvalidSession();
    return;
  }

  // ===== 2. Show user info and logout button =====
  renderUserInfo(user.name);

  // ===== 3. Load favorites =====
  let favorites = getFavoritesForUser(user.name);
  if (favorites.length === 0) {
    showEmptyFavorites();
    return;
  }

  // ===== 4. Render favorites =====
  renderFavorites();

  // ===== 5. Event: Unsave Meal =====
  container.addEventListener("click", (e) => {
    if (e.target.closest(".unsave-btn")) {
      e.stopPropagation();
      const mealId = e.target.closest(".meal").dataset.mealId;
      favorites = favorites.filter(meal => meal.idMeal !== mealId);
      saveFavoritesForUser(user.name, favorites);
      renderFavorites();
    }
  });

  // ===== 6. Event: Back Button =====
  backBtn.addEventListener("click", () => {
    mealDetails.classList.add("hidden");
    container.classList.remove("hidden");
  });

  // ===== Helper: Show login prompt =====
  function showLoginPrompt() {
    container.innerHTML = `
      <div style="text-align:center; margin-top:1rem;">
        <p>You need to <a href="login.html">log in</a> to view your favorite recipes.</p>
      </div>
    `;
    userInfoDiv.innerHTML = `
      <div style="text-align:center; margin-top:1rem;">
        <p>You are not logged in.</p>
        <p><a href="login.html">Log in here</a> or continue browsing.</p>
      </div>
    `;
  }

  // ===== Helper: Show invalid session =====
  function showInvalidSession() {
    container.innerHTML = `
      <p style="padding: 1rem; text-align: center;">
        Invalid session. Please <a href="login.html">log in</a> again.
      </p>
    `;
    userInfoDiv.innerHTML = "";
  }

  // ===== Helper: Render user info & logout =====
  function renderUserInfo(name) {
    userInfoDiv.innerHTML = `
      Logged in as: <strong>${name}</strong>
      <button id="logout-btn" style="margin-left: 1rem; padding: 0.3rem 0.6rem;">Logout</button>
    `;
    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("loggedInUser");
      window.location.href = "login.html";
    });
  }

  // ===== Helper: Show "no favorites" message =====
  function showEmptyFavorites() {
    container.innerHTML = `<p style="padding: 1rem;">You have no saved recipes yet.</p>`;
  }

  // ===== Helper: Load favorites from localStorage =====
  function getFavoritesForUser(username) {
    return JSON.parse(localStorage.getItem(`favorites_${username}`)) || [];
  }

  // ===== Helper: Save updated favorites =====
  function saveFavoritesForUser(username, favorites) {
    localStorage.setItem(`favorites_${username}`, JSON.stringify(favorites));
  }

  // ===== Helper: Render favorite meals =====
  function renderFavorites() {
    if (favorites.length === 0) {
      showEmptyFavorites();
      return;
    }

    container.innerHTML = favorites.map(meal => `
      <div class="meal" data-meal-id="${meal.idMeal}">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-info">
          <h3>${meal.strMeal}</h3>
          ${meal.strCategory ? `<div class="meal-category">${meal.strCategory}</div>` : ""}
          <button class="unsave-btn"><i class="fas fa-star"></i> Unsave</button>
        </div>
      </div>
    `).join("");

    // Add click listeners for meal detail view
    document.querySelectorAll(".meal").forEach(mealDiv => {
      mealDiv.addEventListener("click", async (e) => {
        if (e.target.closest(".unsave-btn")) return;

        const mealId = mealDiv.dataset.mealId;
        try {
          const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
          const data = await response.json();
          const meal = data?.meals?.[0];
          if (!meal) throw new Error("Meal not found");

          const ingredients = [];
          for (let i = 1; i <= 20; i++) {
            const ing = meal[`strIngredient${i}`]?.trim();
            const measure = meal[`strMeasure${i}`]?.trim();
            if (ing) ingredients.push(`${measure} ${ing}`);
          }

          mealDetailsContent.innerHTML = `
            <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-details-img">
            <h2>${meal.strMeal}</h2>
            <div class="meal-details-category"><span>${meal.strCategory || "Uncategorized"}</span></div>
            <div class="meal-details-instructions">
              <h3>Instructions</h3>
              <p>${meal.strInstructions}</p>
            </div>
            <div class="meal-details-ingredients">
              <h3>Ingredients</h3>
              <ul>${ingredients.map(i => `<li><i class="fas fa-check-circle"></i> ${i}</li>`).join("")}</ul>
            </div>
            ${meal.strYoutube ? `<a href="${meal.strYoutube}" target="_blank" class="youtube-link"><i class="fab fa-youtube"></i> Watch Video</a>` : ""}
          `;

          mealDetails.classList.remove("hidden");
          container.classList.add("hidden");
          mealDetails.scrollIntoView({ behavior: "smooth" });

        } catch (err) {
          alert("Could not load recipe details.");
        }
      });
    });
  }
});
