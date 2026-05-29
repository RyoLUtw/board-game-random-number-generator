const rowCountInput = document.querySelector("#rowCount");
const columnCountInput = document.querySelector("#columnCount");
const minNumberInput = document.querySelector("#minNumber");
const maxNumberInput = document.querySelector("#maxNumber");
const uniqueNumbersInput = document.querySelector("#uniqueNumbers");
const generateAllButton = document.querySelector("#generateAll");
const drawOneButton = document.querySelector("#drawOne");
const resetLabelsButton = document.querySelector("#resetLabels");
const statusMessage = document.querySelector("#statusMessage");
const tableHead = document.querySelector("#tableHead");
const tableBody = document.querySelector("#tableBody");

const state = {
  rows: 4,
  columns: 4,
  min: 1,
  max: 100,
  unique: false,
  numbers: [],
  rowLabels: ["Row 1", "Row 2", "Row 3", "Row 4"],
  columnLabels: ["Column 1", "Column 2", "Column 3", "Column 4"],
  pickedCell: null
};

function clampInteger(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeSequentialLabels(prefix, amount, existingLabels) {
  return Array.from({ length: amount }, (_, index) => {
    return existingLabels[index] || `${prefix} ${index + 1}`;
  });
}

function syncStateFromControls() {
  state.rows = clampInteger(rowCountInput.value, 1, 20, state.rows);
  state.columns = clampInteger(columnCountInput.value, 1, 20, state.columns);
  state.min = clampInteger(minNumberInput.value, -999999, 999999, state.min);
  state.max = clampInteger(maxNumberInput.value, -999999, 999999, state.max);
  state.unique = uniqueNumbersInput.checked;

  if (state.min > state.max) {
    const previousMin = state.min;
    state.min = state.max;
    state.max = previousMin;
  }

  rowCountInput.value = state.rows;
  columnCountInput.value = state.columns;
  minNumberInput.value = state.min;
  maxNumberInput.value = state.max;

  state.rowLabels = makeSequentialLabels("Row", state.rows, state.rowLabels);
  state.columnLabels = makeSequentialLabels("Column", state.columns, state.columnLabels);
}

function buildNumberPool() {
  const pool = [];
  for (let number = state.min; number <= state.max; number += 1) {
    pool.push(number);
  }
  return pool;
}

function generateNumbers() {
  const totalCells = state.rows * state.columns;
  const rangeSize = state.max - state.min + 1;

  if (state.unique && rangeSize < totalCells) {
    statusMessage.textContent = `Unique mode needs at least ${totalCells} possible numbers. Increase the range or reduce the table size.`;
    return false;
  }

  statusMessage.textContent = "";
  state.pickedCell = null;

  if (state.unique) {
    const pool = buildNumberPool();
    state.numbers = Array.from({ length: state.rows }, () => {
      return Array.from({ length: state.columns }, () => {
        const index = randomInteger(0, pool.length - 1);
        const [number] = pool.splice(index, 1);
        return number;
      });
    });
    return true;
  }

  state.numbers = Array.from({ length: state.rows }, () => {
    return Array.from({ length: state.columns }, () => randomInteger(state.min, state.max));
  });
  return true;
}

function createLabelInput(value, onChange) {
  const input = document.createElement("input");
  input.className = "label-input";
  input.type = "text";
  input.value = value;
  input.addEventListener("input", () => onChange(input.value));
  return input;
}

function renderTable() {
  tableHead.replaceChildren();
  tableBody.replaceChildren();

  const headRow = document.createElement("tr");
  const corner = document.createElement("th");
  corner.textContent = "";
  headRow.append(corner);

  state.columnLabels.forEach((label, columnIndex) => {
    const th = document.createElement("th");
    th.append(createLabelInput(label, value => {
      state.columnLabels[columnIndex] = value;
    }));
    headRow.append(th);
  });

  tableHead.append(headRow);

  state.numbers.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    const rowHeader = document.createElement("th");
    rowHeader.append(createLabelInput(state.rowLabels[rowIndex], value => {
      state.rowLabels[rowIndex] = value;
    }));
    tr.append(rowHeader);

    row.forEach((number, columnIndex) => {
      const td = document.createElement("td");
      const button = document.createElement("button");
      button.className = "cell-button";
      button.type = "button";
      button.textContent = number;
      button.title = "Click to reroll this cell";
      button.setAttribute("aria-label", `Reroll ${state.rowLabels[rowIndex]} ${state.columnLabels[columnIndex]}`);

      if (state.pickedCell?.row === rowIndex && state.pickedCell?.column === columnIndex) {
        button.classList.add("is-picked");
      }

      button.addEventListener("click", () => {
        rerollCell(rowIndex, columnIndex);
      });

      td.append(button);
      tr.append(td);
    });

    tableBody.append(tr);
  });
}

function rerollCell(rowIndex, columnIndex) {
  syncStateFromControls();

  if (state.unique) {
    statusMessage.textContent = "Single-cell reroll is disabled while unique mode is on. Generate the table instead.";
    return;
  }

  state.numbers[rowIndex][columnIndex] = randomInteger(state.min, state.max);
  state.pickedCell = { row: rowIndex, column: columnIndex };
  renderTable();
}

function generateAndRender() {
  syncStateFromControls();
  if (generateNumbers()) {
    renderTable();
  }
}

function hasCurrentTableShape() {
  return state.numbers.length === state.rows
    && state.numbers.every(row => row.length === state.columns);
}

function drawOneCell() {
  syncStateFromControls();

  if (!hasCurrentTableShape() && !generateNumbers()) {
    return;
  }

  const row = randomInteger(0, state.rows - 1);
  const column = randomInteger(0, state.columns - 1);
  state.pickedCell = { row, column };
  statusMessage.textContent = `Draw: ${state.rowLabels[row]} / ${state.columnLabels[column]} = ${state.numbers[row][column]}`;
  renderTable();
}

function resetLabels() {
  state.rowLabels = [];
  state.columnLabels = [];
  syncStateFromControls();
  renderTable();
}

generateAllButton.addEventListener("click", generateAndRender);
drawOneButton.addEventListener("click", drawOneCell);
resetLabelsButton.addEventListener("click", resetLabels);

[rowCountInput, columnCountInput].forEach(input => {
  input.addEventListener("change", generateAndRender);
});

[minNumberInput, maxNumberInput, uniqueNumbersInput].forEach(input => {
  input.addEventListener("change", generateAndRender);
});

generateAndRender();
