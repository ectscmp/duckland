import { createDuckPreview } from "/shared/duckPreview.js";

const display = document.getElementById("pending-list");
const dropDown = document.getElementById("duck-selection");
const refreshBtn = document.getElementById("refresh");
const previewHandles = new Set();

function chooseDefualtColor(color) {
  //template = `<select name="head" required>
  //                <option value="red">Red</option>
  //                <option value="yellow">Yellow</option>
  //                <option value="green">Green</option>
  //                <option value="blue">Blue</option>
  //                <option value="brown">Brown</option>
  //                <option value="purple">Purple</option>
  //                <option value="pink">Pink</option>
  //              </select>`;
  template = `<select name="head" required></select>`;
  color_list = ["red", "yellow", "green", "blue", "brown", "purple", "pink"]
  options = ""
  color_list.forEach(color=>{
    options += `<option value="red">Red</option>`
  })
  
  
}

function renderDuck(duck) {
  let template = `<form id="duck-form">
          <div class="grid-2">
            <label>
              Duck name
              <input name="name" value=${duck.name} required />
            </label>
            <label>
              Assembler
              <input name="assembler" value=${duck.assembler} required />
            </label>
          </div>

          <label>
            Adjectives (comma separated)
            <input
              name="adjectives"
              value=${duck.adjectives}
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
                  <option value="red">Red</option>
                  <option value="yellow" selected>Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="brown">Brown</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                </select>
              </label>

              <label>
                Front Left
                <select name="frontLeft" required>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="brown" selected>Brown</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                </select>
              </label>

              <label>
                Front Right
                <select name="frontRight" required>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="brown">Brown</option>
                  <option value="purple" selected>Purple</option>
                  <option value="pink">Pink</option>
                </select>
              </label>

              <label>
                Rear Left
                <select name="rearLeft" required>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="brown" selected>Brown</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                </select>
              </label>

              <label>
                Rear Right
                <select name="rearRight" required>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="green">Green</option>
                  <option value="blue">Blue</option>
                  <option value="brown" selected>Brown</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                </select>
              </label>
            </div>
          </fieldset>

          <label class="inline-check">
            <input type="checkbox" name="derpy" />
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
            <input type="date" name="date" required />
          </label>

          <div class="grid-2">
            <label
              >Strength
              <input type="number" name="strength" min="1" value="1" required
            /></label>
            <label
              >Health
              <input type="number" name="health" min="1" value="1" required
            /></label>
            <label
              >Focus
              <input type="number" name="focus" min="1" value="1" required
            /></label>
            <label
              >Intelligence
              <input
                type="number"
                name="intelligence"
                min="1"
                value="1"
                required
            /></label>
          </div>

          <label>
            Kindness
            <input type="number" name="kindness" min="1" value="1" required />
          </label>

          <div class="actions">
            <button type="submit">Submit Request</button>
          </div>
          <small id="form-status" class="muted"></small>
        </form>`;

  const preview = document.getElementById("duck-preview");

  let previewHandle = null;
  createDuckPreview(preview, {
    colors: duck.body || {},
    derpy: Boolean(duck.derpy),
  })
    .then((handle) => {
      previewHandle = handle;
      previewHandles.add(handle);
    })
    .catch(() => {
      preview.textContent = "3D preview unavailable.";
      preview.classList.add("muted");
    });

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
    const pending = ducks.filter((duck) => duck.approved);
    console.log(pending);
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
        });
      });
    }
  } catch (error) {
    display.innerHTML = "";
  }
}

refreshBtn.addEventListener("click", loadPending);
loadPending();
