// Using REST Countries API (v3)
const API_URL =
  "https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,region,flags,population";

const countriesContainer = document.getElementById("countriesContainer");
const statusText = document.getElementById("statusText");
const searchInput = document.getElementById("searchInput");
const searchType = document.getElementById("searchType");
const clearBtn = document.getElementById("clearBtn");

let allCountries = [];

// Create a fullscreen overlay used to show a smudged/blurred flag background

const flagOverlay = document.createElement('div');
flagOverlay.id = 'flagOverlay';
document.body.appendChild(flagOverlay);

function showFlagOverlay(url){
  if(!url) return;
  // set background image and show overlay
  flagOverlay.style.backgroundImage = `url("${url}")`;

  console.debug('showFlagOverlay:', url);
  flagOverlay.classList.add('active');
}

function hideFlagOverlay(){
  flagOverlay.classList.remove('active');
}

// Fetch all countries on page load
async function loadCountries() {
  try {
    statusText.textContent = "Loading countries...";
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    // Sort by common name
    allCountries = data.sort((a, b) =>
      a.name.common.localeCompare(b.name.common)
    );

    renderCountries(allCountries);
    statusText.textContent = `Showing ${allCountries.length} countries.`;
  } catch (error) {
    console.error(error);
    statusText.textContent = "Failed to load countries. Please try again.";
  }
}

// Modal logic
let modal = null;
let modalContent = null;
let modalCloseBtn = null;

function createModal() {
  if (modal) return;
  modal = document.createElement('div');
  modal.className = 'country-modal';
  modal.innerHTML = `
    <div class="country-modal-content">
      <button class="country-modal-close" aria-label="Close">&times;</button>
      <div class="country-modal-body"></div>
    </div>
  `;
  document.body.appendChild(modal);
  modalContent = modal.querySelector('.country-modal-body');
  modalCloseBtn = modal.querySelector('.country-modal-close');
  modalCloseBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('active') && e.key === 'Escape') closeModal();
  });
}

function openModal(html) {
  createModal();
  modalContent.innerHTML = html;
  modal.classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal() {
  if (modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

// Render list of countries
function renderCountries(list) {
  countriesContainer.innerHTML = "";

  if (!list || list.length === 0) {
    countriesContainer.innerHTML =
      '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted);">No countries found.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();

  list.forEach((country) => {
    const card = document.createElement("article");
    card.className = "country-card";
    card.tabIndex = 0;

    const flagUrl = country.flags?.png || country.flags?.svg || "";
    const name = country.name?.common || "Unknown";
    const officialName = country.name?.official || "";
    const capital = country.capital?.[0] || "N/A";
    const region = country.region || "N/A";
    const cca2 = country.cca2 || "";
    const cca3 = country.cca3 || "";
    const population = country.population?.toLocaleString() || "N/A";

    card.innerHTML = `
      <div class="country-flag-wrapper">
        <img class="country-flag" src="${flagUrl}" alt="Flag of ${name}" />
      </div>
      <div class="country-body">
        <h2 class="country-name">${name}</h2>
        <div class="country-meta">
          <span><strong>Official:</strong> ${officialName}</span>
          <span><strong>Capital:</strong> ${capital}</span>
          <span><strong>Continent (Region):</strong> ${region}</span>
          <span><strong>Codes:</strong> ${cca2} ${cca3 ? `(${cca3})` : ""}</span>
          <span><strong>Population:</strong> ${population}</span>
        </div>
      </div>
    `;

    fragment.appendChild(card);

    // Attach long-hover  behavior: if user hovers for >1s, show smudged flag background.
    // Use a per-card timer so leaving cancels it.
    (function(cardEl, url){
      let hoverTimer = null;
      function startTimer(){
        if(!url) return;
        hoverTimer = setTimeout(()=> {
          showFlagOverlay(url);
        }, 750);
      }
      function clearTimer(){
        if(hoverTimer){
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        hideFlagOverlay();
      }
      cardEl.addEventListener('mouseenter', startTimer);
      cardEl.addEventListener('mouseleave', clearTimer);
      cardEl.addEventListener('focus', startTimer);
      cardEl.addEventListener('blur', clearTimer);
    })(card, flagUrl);

    // Click to open more details
    card.addEventListener('click', async () => {
      // Fetch extra details for this country (independent, languages, capital, currency, demonym, translation, etc.)
      let detailsHtml = `<div style="text-align:center"><img src="${flagUrl}" alt="Flag of ${name}" style="max-width:120px;max-height:80px;margin-bottom:1em;"></div>`;
      detailsHtml += `<h2 style="text-align:center">${name}</h2>`;
      detailsHtml += `<div class="country-modal-meta">
        <p><strong>Official Name:</strong> ${officialName}</p>
        <p><strong>Capital:</strong> ${capital}</p>
        <p><strong>Continent (Region):</strong> ${region}</p>
        <p><strong>Codes:</strong> ${cca2} ${cca3 ? `(${cca3})` : ""}</p>
        <p><strong>Population:</strong> ${population}</p>
      </div>`;

      // Fetch all available details (returns array)
      let extraUrl = `https://restcountries.com/v3.1/alpha/${cca3}`;
      try {
        const resp = await fetch(extraUrl);
        if (resp.ok) {
          const [extra] = await resp.json();
          detailsHtml += `<div class="country-modal-extra">`;
          if (typeof extra.independent !== 'undefined') {
            detailsHtml += `<p><strong>Independent:</strong> ${extra.independent ? 'Yes' : 'No'}</p>`;
          }
          if (extra.languages) {
            detailsHtml += `<p><strong>Languages:</strong> ${Object.values(extra.languages).join(', ')}</p>`;
          }
          if (extra.subregion) {
            detailsHtml += `<p><strong>Subregion:</strong> ${extra.subregion}</p>`;
          }
          if (extra.currencies) {
            const currs = Object.values(extra.currencies).map(c => c.name + (c.symbol ? ` (${c.symbol})` : ''));
            detailsHtml += `<p><strong>Currencies:</strong> ${currs.join(', ')}</p>`;
          }
          if (extra.timezones) {
            detailsHtml += `<p><strong>Timezones:</strong> ${extra.timezones.join(', ')}</p>`;
          }
          if (extra.area) {
            detailsHtml += `<p><strong>Area:</strong> ${extra.area.toLocaleString()} km²</p>`;
          }
          if (extra.demonyms && extra.demonyms.eng) {
            detailsHtml += `<p><strong>Demonym:</strong> ${extra.demonyms.eng.m || ''}${extra.demonyms.eng.f ? ' / ' + extra.demonyms.eng.f : ''}</p>`;
          }
          if (extra.idd && extra.idd.root) {
            let calling = extra.idd.root + (extra.idd.suffixes ? extra.idd.suffixes.join(', ') : '');
            detailsHtml += `<p><strong>Calling Code:</strong> ${calling}</p>`;
          }
          if (extra.region) {
            detailsHtml += `<p><strong>Region:</strong> ${extra.region}</p>`;
          }
          if (extra.subregion) {
            detailsHtml += `<p><strong>Subregion:</strong> ${extra.subregion}</p>`;
          }
          if (extra.translations) {
            const translations = Object.entries(extra.translations).map(([k, v]) => `${k}: ${v.common}`).join('<br>');
            detailsHtml += `<p><strong>Translations:</strong><br>${translations}</p>`;
          }
          if (extra.altSpellings && extra.altSpellings.length > 1) {
            detailsHtml += `<p><strong>Alternative Spellings:</strong> ${extra.altSpellings.join(', ')}</p>`;
          }
          if (extra.borders && extra.borders.length) {
            detailsHtml += `<p><strong>Borders:</strong> ${extra.borders.join(', ')}</p>`;
          }
          if (extra.maps && extra.maps.googleMaps) {
            detailsHtml += `<p><a href="${extra.maps.googleMaps}" target="_blank" rel="noopener">View on Google Maps</a></p>`;
          }
          detailsHtml += `</div>`;
        }
      } catch (e) {
        // ignore to no show error openly
      }
      openModal(detailsHtml);
    });
  });

  countriesContainer.appendChild(fragment);
}

// Filter function based on selected search type(name, code, continent, capital, )
function filterCountries() {
  const query = searchInput.value.trim().toLowerCase();
  const type = searchType.value;

  if (!query) {
    renderCountries(allCountries);
    statusText.textContent = `Showing ${allCountries.length} countries.`;
    return;
  }

  const filtered = allCountries.filter((country) => {
    switch (type) {
      case "name":
        return (
          country.name?.common?.toLowerCase().includes(query) ||
          country.name?.official?.toLowerCase().includes(query)
        );
      case "code":
        return (
          country.cca2?.toLowerCase().includes(query) ||
          country.cca3?.toLowerCase().includes(query)
        );
      case "continent":
        return country.region?.toLowerCase().includes(query);
      case "capital":
        return country.capital?.[0]
          ?.toLowerCase()
          .includes(query);
      default:
        return false;
    }
  });

  renderCountries(filtered);
  statusText.textContent = `Found ${filtered.length} countr${
    filtered.length === 1 ? "y" : "ies"
  } for "${query}".`;
}

// Event listeners

searchInput.addEventListener("input", () => {
  filterCountries();
});

searchType.addEventListener("change", () => {
  filterCountries();
});

clearBtn.addEventListener("click", () => {
  searchInput.value = "";
  renderCountries(allCountries);
  statusText.textContent = `Showing ${allCountries.length} countries.`;
  searchInput.focus();
});

/*Light/Dark Mode Toggle Logic*/
const themeToggleBtn = document.getElementById("themeToggleBtn");

// Check for saved preference
const currentTheme = localStorage.getItem("theme");
if (currentTheme === "light") {
  document.body.classList.add("light-mode");
  themeToggleBtn.checked = false; // Unchecked for light mode
} else {
  // Default to dark mode
  document.body.classList.remove("light-mode");
  themeToggleBtn.checked = true; // Checked for dark mode
}

themeToggleBtn.addEventListener("change", () => {
  document.body.classList.toggle("light-mode");
  
  // Save preference
  if (document.body.classList.contains("light-mode")) {
    localStorage.setItem("theme", "light");
  } else {
    localStorage.setItem("theme", "dark");
  }
});


// load the countries data
loadCountries();