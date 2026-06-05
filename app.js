const rowCountInput = document.querySelector("#rowCount");
const columnCountInput = document.querySelector("#columnCount");
const minNumberInput = document.querySelector("#minNumber");
const maxNumberInput = document.querySelector("#maxNumber");
const numbersPerCellInput = document.querySelector("#numbersPerCell");
const uniqueNumbersInput = document.querySelector("#uniqueNumbers");
const transposeTableButton = document.querySelector("#transposeTable");
const prefixOptionButtons = document.querySelectorAll(".prefix-option[data-prefix-target]");
const presetOptionButtons = document.querySelectorAll(".preset-option");
const customRowPrefixInput = document.querySelector("#customRowPrefix");
const customColumnPrefixInput = document.querySelector("#customColumnPrefix");
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
  numbersPerCell: 1,
  unique: false,
  rowPrefix: null,
  columnPrefix: null,
  columnPreset: null,
  customRowPrefix: "",
  customColumnPrefix: "",
  numbers: [],
  rowLabels: ["Row 1", "Row 2", "Row 3", "Row 4"],
  columnLabels: ["Column 1", "Column 2", "Column 3", "Column 4"],
  pickedCell: null
};

const columnPresets = {
  superfight: {
    columns: 3,
    labels: ["Character", "Good attribute", "Bad attribute"]
  }
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

function getActivePrefix(target) {
  const selectedPrefix = target === "row" ? state.rowPrefix : state.columnPrefix;
  const customPrefix = target === "row" ? state.customRowPrefix : state.customColumnPrefix;
  const fallbackPrefix = target === "row" ? "Row" : "Column";

  if (selectedPrefix === "custom") {
    return customPrefix.trim() || fallbackPrefix;
  }

  return selectedPrefix || fallbackPrefix;
}

function syncPrefixButtons() {
  prefixOptionButtons.forEach(button => {
    const selectedPrefix = button.dataset.prefixTarget === "row" ? state.rowPrefix : state.columnPrefix;
    const isSelected = selectedPrefix === button.dataset.prefixValue;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  customRowPrefixInput.hidden = state.rowPrefix !== "custom";
  customColumnPrefixInput.hidden = state.columnPrefix !== "custom";
}

function syncPresetButtons() {
  presetOptionButtons.forEach(button => {
    const isSelected = state.columnPreset === button.dataset.presetValue;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function syncStateFromControls() {
  state.rows = clampInteger(rowCountInput.value, 1, 20, state.rows);
  state.columns = clampInteger(columnCountInput.value, 1, 20, state.columns);
  state.min = clampInteger(minNumberInput.value, -999999, 999999, state.min);
  state.max = clampInteger(maxNumberInput.value, -999999, 999999, state.max);
  state.numbersPerCell = clampInteger(numbersPerCellInput.value, 1, 20, state.numbersPerCell);
  state.unique = uniqueNumbersInput.checked;
  state.customRowPrefix = customRowPrefixInput.value;
  state.customColumnPrefix = customColumnPrefixInput.value;

  if (state.min > state.max) {
    const previousMin = state.min;
    state.min = state.max;
    state.max = previousMin;
  }

  rowCountInput.value = state.rows;
  columnCountInput.value = state.columns;
  minNumberInput.value = state.min;
  maxNumberInput.value = state.max;
  numbersPerCellInput.value = state.numbersPerCell;

  state.rowLabels = makeSequentialLabels(getActivePrefix("row"), state.rows, state.rowLabels);
  state.columnLabels = makeSequentialLabels(getActivePrefix("column"), state.columns, state.columnLabels);
  syncPrefixButtons();
  syncPresetButtons();
}

function buildNumberPool() {
  const pool = [];
  for (let number = state.min; number <= state.max; number += 1) {
    pool.push(number);
  }
  return pool;
}

function generateNumbers() {
  const rangeSize = state.max - state.min + 1;
  const numbersPerColumn = state.rows * state.numbersPerCell;

  if (state.unique && rangeSize < numbersPerColumn) {
    statusMessage.textContent = `Unique per-column mode needs at least ${numbersPerColumn} possible numbers. Increase the range, reduce the row count, or lower numbers per cell.`;
    return false;
  }

  if (!state.unique && rangeSize < state.numbersPerCell) {
    statusMessage.textContent = `Each cell needs at least ${state.numbersPerCell} possible numbers. Increase the range or lower numbers per cell.`;
    return false;
  }

  statusMessage.textContent = "";
  state.pickedCell = null;

  if (state.unique) {
    state.numbers = Array.from({ length: state.rows }, () => {
      return Array.from({ length: state.columns }, () => null);
    });

    for (let column = 0; column < state.columns; column += 1) {
      const pool = buildNumberPool();
      for (let row = 0; row < state.rows; row += 1) {
        state.numbers[row][column] = drawNumbersFromPool(pool);
      }
    }
    return true;
  }

  state.numbers = Array.from({ length: state.rows }, () => {
    return Array.from({ length: state.columns }, () => generateCellNumbers());
  });
  return true;
}

function drawNumbersFromPool(pool) {
  return Array.from({ length: state.numbersPerCell }, () => {
    const index = randomInteger(0, pool.length - 1);
    const [number] = pool.splice(index, 1);
    return number;
  });
}

function generateCellNumbers() {
  return drawNumbersFromPool(buildNumberPool());
}

function formatCellValue(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function transposeMatrix(matrix) {
  return Array.from({ length: state.rows }, (_, rowIndex) => {
    return Array.from({ length: state.columns }, (_, columnIndex) => matrix[columnIndex]?.[rowIndex]);
  });
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
      state.columnPreset = null;
      syncPresetButtons();
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
      button.textContent = formatCellValue(number);
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
    statusMessage.textContent = "Single-cell reroll is disabled while unique per-column mode is on. Generate the table instead.";
    return;
  }

  state.numbers[rowIndex][columnIndex] = generateCellNumbers();
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
    && state.numbers.every(row => {
      return row.length === state.columns
        && row.every(cell => {
          if (state.numbersPerCell === 1) {
            return !Array.isArray(cell) || cell.length === 1;
          }

          return Array.isArray(cell) && cell.length === state.numbersPerCell;
        });
    });
}

function drawOneCell() {
  syncStateFromControls();

  if (!hasCurrentTableShape() && !generateNumbers()) {
    return;
  }

  const row = randomInteger(0, state.rows - 1);
  const column = randomInteger(0, state.columns - 1);
  state.pickedCell = { row, column };
  statusMessage.textContent = `Draw: ${state.rowLabels[row]} / ${state.columnLabels[column]} = ${formatCellValue(state.numbers[row][column])}`;
  renderTable();
}

function resetLabels(target = "all") {
  if (target === "all" || target === "row") {
    state.rowLabels = [];
  }

  if (target === "all" || target === "column") {
    state.columnLabels = [];
  }

  syncStateFromControls();
  renderTable();
}

function selectPrefixOption(button) {
  const target = button.dataset.prefixTarget;
  const prefixValue = button.dataset.prefixValue;
  const stateKey = target === "row" ? "rowPrefix" : "columnPrefix";

  state[stateKey] = state[stateKey] === prefixValue ? null : prefixValue;
  if (target === "column") {
    state.columnPreset = null;
  }
  syncStateFromControls();
  resetLabels(target);
}

function transposeTable() {
  syncStateFromControls();

  const previousRows = state.rows;
  state.rows = state.columns;
  state.columns = previousRows;
  rowCountInput.value = state.rows;
  columnCountInput.value = state.columns;

  const previousRowLabels = state.rowLabels;
  state.rowLabels = state.columnLabels;
  state.columnLabels = previousRowLabels;
  state.numbers = transposeMatrix(state.numbers);

  if (state.pickedCell) {
    state.pickedCell = {
      row: state.pickedCell.column,
      column: state.pickedCell.row
    };
  }

  state.columnPreset = null;
  syncStateFromControls();
  renderTable();
}

function selectColumnPreset(button) {
  const presetValue = button.dataset.presetValue;
  state.columnPreset = state.columnPreset === presetValue ? null : presetValue;

  if (state.columnPreset) {
    const preset = columnPresets[state.columnPreset];
    state.columns = preset.columns;
    state.columnLabels = preset.labels.slice();
    state.columnPrefix = null;
    columnCountInput.value = preset.columns;
  }

  generateAndRender();
}

generateAllButton.addEventListener("click", generateAndRender);
drawOneButton.addEventListener("click", drawOneCell);
resetLabelsButton.addEventListener("click", () => resetLabels());

transposeTableButton.addEventListener("click", transposeTable);

prefixOptionButtons.forEach(button => {
  button.addEventListener("click", () => selectPrefixOption(button));
});

presetOptionButtons.forEach(button => {
  button.addEventListener("click", () => selectColumnPreset(button));
});

[customRowPrefixInput, customColumnPrefixInput].forEach(input => {
  input.addEventListener("input", () => {
    syncStateFromControls();
    if ((input === customRowPrefixInput && state.rowPrefix === "custom")
      || (input === customColumnPrefixInput && state.columnPrefix === "custom")) {
      resetLabels(input === customRowPrefixInput ? "row" : "column");
    }
  });
});

rowCountInput.addEventListener("change", generateAndRender);

columnCountInput.addEventListener("change", () => {
  state.columnPreset = null;
  generateAndRender();
});

[minNumberInput, maxNumberInput, numbersPerCellInput, uniqueNumbersInput].forEach(input => {
  input.addEventListener("change", generateAndRender);
});

generateAndRender();
