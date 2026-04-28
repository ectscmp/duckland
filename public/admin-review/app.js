import { createDuckPreview } from "/shared/duckPreview.js";

const display = document.getElementById("pending-list");
const dropDown = document.getElementById("duck-selection");
const refreshBtn = document.getElementById("refresh");
const previewHandles = new Set();

function checkDerpy(duck) {
  if (duck.derpy) {
    return "checked";
  }
}

function chooseDefualtColor(selected_color) {
  const color_list = [
    "red",
    "yellow",
    "green",
    "blue",
    "brown",
    "purple",
    "pink",
  ];
  let options = "";
  color_list.forEach((color) => {
    if (color.toLowerCase() == selected_color.toLowerCase()) {
      options += `<option value="${color.toLowerCase()}" selected>${color.charAt(0).toUpperCase() + color.slice(1)}</option> `;
    } else {
      options += `<option value="${color.toLowerCase()}">${color.charAt(0).toUpperCase() + color.slice(1)}</option> `;
    }
  });
  console.log(options);
  return options;
}

function formatDate(isoString) {
  const date = new Date(isoString);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function renderDuck(duck) {
  let template = `<form id="duck-form">
          <div class="grid-2">
            <label>
              Duck name
              <input name="name" value="${duck.name}" required />
            </label>
            <label>
              Assembler
              <input name="assembler" value="${duck.assembler}" required />
            </label>
          </div>

          <label>
            Adjectives (comma separated)
            <input
              name="adjectives"
              value="${duck.adjectives}"
              required
            />
          </label>

          <label>
            Bio
            <textarea name="bio" required>${duck.bio}</textarea>
          </label>

          <fieldset>
            <legend>Duck Parts Colors</legend>
            <div class="grid-2">
              <label>
                Head
                <select name="head" required>
                  ${chooseDefualtColor(duck.body.head)}
                </select>
              </label>

              <label>
                Front Left
                <select name="frontLeft" required>
                  ${chooseDefualtColor(duck.body.frontLeft)}
                </select>
              </label>

              <label>
                Front Right
                <select name="frontRight" required>
                  ${chooseDefualtColor(duck.body.frontRight)}
                </select>
              </label>

              <label>
                Rear Left
                <select name="rearLeft" required>
                  ${chooseDefualtColor(duck.body.rearLeft)}>
                </select>
              </label>

              <label>
                Rear Right
                <select name="rearRight" required>
                  ${chooseDefualtColor(duck.body.rearRight)}
                </select>
              </label>
            </div>
          </fieldset>

          <label class="inline-check">
            <input type="checkbox" name="derpy" ${checkDerpy(duck)}/>
            Derpy
          </label>

          <section class="preview-shell" aria-label="Duck preview">
            <h2>3D Preview</h2>
            <p class="muted" style="margin-top: 0">
              Updates as you change duck colors.
            </p>
            <div
              id="duck-preview"
              class="duck-preview"
              role="img"
              aria-label="Spinning 3D duck preview"
            ></div>
          </section>

          <label>
            Date
            <input type="date" name="date" value="${formatDate(duck.date)}" required />
          </label>

          <div class="grid-2">
            <label
              >Strength
              <input type="number" name="strength" min="1" value="${duck.stats.strength}" required
            /></label>
            <label
              >Health
              <input type="number" name="health" min="1" value="${duck.stats.health}" required
            /></label>
            <label
              >Focus
              <input type="number" name="focus" min="1" value="${duck.stats.focus}" required
            /></label>
            <label
              >Intelligence
              <input
                type="number"
                name="intelligence"
                min="1"
                value="${duck.stats.intelligence}"
                required
            /></label>
          </div>

          <label>
            Kindness
            <input type="number" name="kindness" min="1" value="${duck.stats.kindness}" required />
          </label>

          <div class="actions">
            <button type="submit">Update</button>
          </div>
          <small id="form-status" class="muted"></small>
        </form>`;

  return template;
}

function createSelect(ducks) {
  ducks.forEach((duck) => {
    const opt = document.createElement("option");
    opt.value = duck.name;
    opt.innerHTML = duck.name;
    dropDown.append(opt);
  });
}

async function loadPending() {
  previewHandles.forEach((handle) => handle.dispose());
  previewHandles.clear();

  display.innerHTML = "";

  try {
    const response = await fetch("/ducks");
    if (!response.ok) {
      throw new Error("Could not load requests.");
    }

    const ducks = await response.json();
    console.log(ducks);
    const pending = ducks.filter((duck) => duck.approved);
    //console.log(pending);
    createSelect(pending);

    if (!pending.length) {
      display.innerHTML = `<div class="card"><p class="muted">Ducks cant be loaded.</p></div>`;
    } else {
      dropDown.addEventListener("change", function () {
        display.innerHTML = "";
        const value = this.value;
        const results = pending.filter((duck) => duck.name == value);
        results.forEach((duck) => {
          display.innerHTML = renderDuck(duck);
          const preview = document.getElementById("duck-preview");

          createDuckPreview(preview, {
            colors: duck.body || {},
            derpy: Boolean(duck.derpy),
          })
            .then((handle) => {
              previewHandles.add(handle);
            })
            .catch(() => {
              preview.textContent = "3D preview unavailable.";
              preview.classList.add("muted");
            });
        });
      });
    }
  } catch (error) {
    display.innerHTML = "";
  }
}

refreshBtn.addEventListener("click", loadPending);
loadPending();
