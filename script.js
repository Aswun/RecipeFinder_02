// DOM Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const mealsContainer = document.getElementById("meals");
const resultHeading = document.getElementById("result-heading");
const errorContainer = document.getElementById("error-container");
const mealDetails = document.getElementById("meal-details");
const mealDetailsContent = document.querySelector(".meal-details-content");
const backBtn = document.getElementById("back-btn");

const BASE_URL = "https://www.themealdb.com/api/json/v1/1/";
const SEARCH_URL = `${BASE_URL}search.php?s=`;
const LOOKUP_URL = `${BASE_URL}lookup.php?i=`;

searchBtn.addEventListener("click", searchMeals);

mealsContainer.addEventListener("click", handleMealClick);

backBtn.addEventListener("click", () => {
  mealDetails.classList.add("hidden");
  mealDetailsContent.innerHTML = ""; // Clear details on back
});

searchInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchMeals();
});

async function searchMeals() {
  const searchTerm = searchInput.value.trim();

  if (!searchTerm) {
    errorContainer.textContent = "Please enter a search term";
    errorContainer.classList.remove("hidden");
    resultHeading.textContent = "";
    mealsContainer.innerHTML = "";
    return;
  }

  try {
    resultHeading.textContent = `Searching for "${searchTerm}"...`;
    mealsContainer.innerHTML = "";
    errorContainer.classList.add("hidden");

    const response = await fetch(`${SEARCH_URL}${searchTerm}`);
    const data = await response.json();

    if (data.meals === null) {
      resultHeading.textContent = "";
      mealsContainer.innerHTML = "";
      errorContainer.textContent = `No recipes found for "${searchTerm}". Try another search term!`;
      errorContainer.classList.remove("hidden");
    } else {
      resultHeading.textContent = `Search results for "${searchTerm}":`;
      displayMeals(data.meals);
      searchInput.value = "";
    }
  } catch (error) {
    errorContainer.textContent = "Something went wrong. Please try again later.";
    errorContainer.classList.remove("hidden");
    resultHeading.textContent = "";
    mealsContainer.innerHTML = "";
  }
}

function displayMeals(meals) {
  mealsContainer.innerHTML = "";

  meals.forEach((meal) => {
    mealsContainer.innerHTML += `
      <div class="meal" data-meal-id="${meal.idMeal}">
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
        <div class="meal-info">
          <h3 class="meal-title">${meal.strMeal}</h3>
          ${meal.strCategory ? `<div class="meal-category">${meal.strCategory}</div>` : ""}
          <button class="bookmark-btn" data-meal='${encodeURIComponent(JSON.stringify(meal))}'>
            <i class="fas fa-star"></i> Save
          </button>
        </div>
      </div>
    `;
  });

  // Add click listeners for bookmark buttons
  document.querySelectorAll(".bookmark-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();

      const loggedInUserRaw = localStorage.getItem("loggedInUser");
      if (!loggedInUserRaw) {
        alert("Please log in to save recipes!");
        window.location.href = "login.html";
        return;
      }

      const user = JSON.parse(loggedInUserRaw);
      if (!user || !user.name) {
        alert("Invalid user session. Please log in again.");
        window.location.href = "login.html";
        return;
      }

      const meal = JSON.parse(decodeURIComponent(this.dataset.meal));
      saveToFavorites(user.name, meal);
    });
  });
}

async function handleMealClick(e) {
  const mealEl = e.target.closest(".meal");
  if (!mealEl) return;

  const mealId = mealEl.getAttribute("data-meal-id");

  try {
    const response = await fetch(`${LOOKUP_URL}${mealId}`);
    const data = await response.json();

    if (data.meals && data.meals[0]) {
      const meal = data.meals[0];
      const ingredients = [];

      for (let i = 1; i <= 20; i++) {
        if (meal[`strIngredient${i}`] && meal[`strIngredient${i}`].trim() !== "") {
          ingredients.push({
            ingredient: meal[`strIngredient${i}`],
            measure: meal[`strMeasure${i}`],
          });
        }
      }

      mealDetailsContent.innerHTML = `
        <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-details-img">
        <h2 class="meal-details-title">${meal.strMeal}</h2>
        <div class="meal-details-category">
          <span>${meal.strCategory || "Uncategorized"}</span>
        </div>
        <div class="meal-details-instructions">
          <h3>Instructions</h3>
          <p>${meal.strInstructions}</p>
        </div>
        <div class="meal-details-ingredients">
          <h3>Ingredients</h3>
          <ul class="ingredients-list">
            ${ingredients
              .map(
                (item) => `
              <li><i class="fas fa-check-circle"></i> ${item.measure} ${item.ingredient}</li>
            `
              )
              .join("")}
          </ul>
        </div>
        ${
          meal.strYoutube
            ? `
          <a href="${meal.strYoutube}" target="_blank" class="youtube-link">
            <i class="fab fa-youtube"></i> Watch Video
          </a>
        `
            : ""
        }
      `;

      // Check if user is logged in
      const loggedInUserRaw = localStorage.getItem("loggedInUser");
      if (!loggedInUserRaw) {
        // If not logged in, no favorite button
        mealDetails.classList.remove("hidden");
        mealDetails.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const user = JSON.parse(loggedInUserRaw);
      if (!user || !user.name) {
        mealDetails.classList.remove("hidden");
        mealDetails.scrollIntoView({ behavior: "smooth" });
        return;
      }

      // Get user favorites
      let favorites = JSON.parse(localStorage.getItem(`favorites_${user.name}`)) || [];
      const isFavorite = favorites.some((fav) => fav.idMeal === meal.idMeal);

      // Append the favorite toggle button
      mealDetailsContent.innerHTML += `
        <button id="favorite-btn" class="favorite-btn">
          <i class="fas ${isFavorite ? "fa-star" : "fa-star-o"}"></i> ${isFavorite ? "Unsave" : "Save"}
        </button>
      `;

      // Add event listener to favorite button
      const favoriteBtn = document.getElementById("favorite-btn");
      favoriteBtn.addEventListener("click", () => {
        let favorites = JSON.parse(localStorage.getItem(`favorites_${user.name}`)) || [];
        const alreadyFavorite = favorites.some((fav) => fav.idMeal === meal.idMeal);

        if (alreadyFavorite) {
          // Remove from favorites
          favorites = favorites.filter((fav) => fav.idMeal !== meal.idMeal);
          favoriteBtn.innerHTML = `<i class="fas fa-star-o"></i> Save`;
          alert(`"${meal.strMeal}" has been removed from your favorites.`);
        } else {
          // Add to favorites
          favorites.push({
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb,
            strCategory: meal.strCategory,
          });
          favoriteBtn.innerHTML = `<i class="fas fa-star"></i> Unsave`;
          alert(`"${meal.strMeal}" has been saved to your favorites!`);
        }

        localStorage.setItem(`favorites_${user.name}`, JSON.stringify(favorites));
      });

      mealDetails.classList.remove("hidden");
      mealDetails.scrollIntoView({ behavior: "smooth" });
    }
  } catch (error) {
    errorContainer.textContent = "Could not load recipe details. Please try again later.";
    errorContainer.classList.remove("hidden");
  }
}

// Save meal to favorites per user
function saveToFavorites(username, meal) {
  let favorites = JSON.parse(localStorage.getItem(`favorites_${username}`)) || [];
  const exists = favorites.some((fav) => fav.idMeal === meal.idMeal);

  if (!exists) {
    favorites.push(meal);
    localStorage.setItem(`favorites_${username}`, JSON.stringify(favorites));
    alert(`"${meal.strMeal}" has been saved to favorites!`);
  } else {
    alert(`"${meal.strMeal}" is already in your favorites.`);
  }
}



// Dynamic sidebar login/logout logic
document.addEventListener("DOMContentLoaded", () => {
  const userAuthLink = document.getElementById("user-auth-link");
  const welcomeMessage = document.getElementById("welcome-message");
  const loggedInUserRaw = localStorage.getItem("loggedInUser");

  if (loggedInUserRaw) {
    const user = JSON.parse(loggedInUserRaw);

    // Optional: show personalized welcome message
    if (welcomeMessage) {
      welcomeMessage.textContent = `Welcome to Recipe Finder, ${user.name}!`;
    }

    // Update sidebar link to logout
    if (userAuthLink) {
      userAuthLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout (${user.name})`;
      userAuthLink.href = "#";
      userAuthLink.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("loggedInUser");
        alert("You have been logged out.");
        window.location.reload();
      });
    }
  } else {
    // Not logged in: show login link
    if (userAuthLink) {
      userAuthLink.innerHTML = `<i class="fas fa-user"></i> Login`;
      userAuthLink.href = "login.html";
    }
  }
});
