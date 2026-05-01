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
            <div class="grid-2 duck-colors">
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
            <button type="submit" class="delete-button">Delete</button>
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
      display.innerHTML = `<div class="card"><p class="muted">Ducks cannot be loaded.</p></div>`;
    } else {
      dropDown.addEventListener("change", function () {
        display.innerHTML = "";
        const value = this.value;
        const results = pending.filter((duck) => duck.name == value);
        results.forEach((duck) => {
          display.innerHTML = renderDuck(duck);
          const preview = document.getElementById("duck-preview");

          const form = document.querySelector("#duck-form");
          form.addEventListener("submit", async (event) => {
            event.preventDefault();
            const statusText = document.querySelector("#form-status");
            statusText.className = "muted";
            statusText.textContent = "Submitting...";

            const data = new FormData(form);
            const adjectivesRaw = String(data.get("adjectives") || "");

            const payload = {
              name: String(data.get("name") || "").trim(),
              assembler: String(data.get("assembler") || "").trim(),
              adjectives: adjectivesRaw
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean),
              body: {
                // ...readBodyColors(data) - changed because we need base color strings
                // this solution is pretty bad but it gets the job done for now
                head: String(data.get("head") || "#f0d35f"),
                frontLeft: String(data.get("frontLeft") || "#e9bc4f"),
                frontRight: String(data.get("frontRight") || "#d88f3d"),
                rearLeft: String(data.get("rearLeft") || "#9f6f2b"),
                rearRight: String(data.get("rearRight") || "#6f4b1f"),
              },
              derpy: data.get("derpy") === "on",
              bio: String(data.get("bio") || "").trim(),
              date: new Date(data.get("date") || ""),
              approved: true,
              stats: {
                strength: Number(data.get("strength") || 1),
                health: Number(data.get("health") || 1),
                focus: Number(data.get("focus") || 1),
                intelligence: Number(data.get("intelligence") || 1),
                kindness: Number(data.get("kindness") || 1),
              },
            };

            try {
              const response = await fetch(`/ducks/${duck._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });

              if (!response.ok) {
                throw new Error("Request failed.");
              }

              statusText.className = "ok";
              statusText.textContent = "Patch Made!";
            } catch (error) {
              statusText.className = "error";
              statusText.textContent =
                "Could not submit request. Check fields and try again.";
            }
          });

          createDuckPreview(preview, {
            colors: duck.body || {},
            derpy: Boolean(duck.derpy),
          })
            .then((handle) => {
              previewHandles.add(handle);
              const colorSelects = document.querySelectorAll(
                "duck.colors label select",
              );
              console.l
              colorSelects.forEach((select) => {
                select.addEventListener("change", () => {
                  handle.updateColors({
                    head: String(data.get("head")),
                    frontLeft: String(data.get("frontLeft")),
                    frontRight: String(data.get("frontRight")),
                    rearLeft: String(data.get("rearLeft")),
                    rearRight: String(data.get("rearRight")),
                  });
                });
              });
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
