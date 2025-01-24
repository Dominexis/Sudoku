"use strict";
;
;
const background = document.getElementById("background");
const board = document.getElementById("board");
const choiceBox = document.getElementById("choice-box");
const resetButton = document.getElementById("reset-button");
const solveButton = document.getElementById("solve-button");
const cluesInput = document.getElementById("clues-input");
let width = 3;
const tileWidth = 2;
const boardPadding = 0.5;
let clues = 30;
let choice = null;
const symbols = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
let globalLayout = {};
function setupBoard() {
    const cellWidth = (tileWidth + 0.4) * width;
    const boardWidth = (cellWidth + 0.4) * width;
    const cellRows = [];
    for (let y = 0; y < width; y++) {
        const cellRow = document.createElement("div");
        cellRow.className = "flex";
        for (let x = 0; x < width; x++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            for (let j = 0; j < width; j++) {
                const tileRow = document.createElement("div");
                tileRow.className = "flex";
                for (let i = 0; i < width; i++) {
                    const tile = document.createElement("div");
                    tile.className = "tile";
                    const key = `${x * width + i}-${y * width + j}`;
                    tile.id = key;
                    tileRow.appendChild(tile);
                }
                ;
                cell.appendChild(tileRow);
            }
            ;
            cell.style.width = `${cellWidth}rem`;
            cellRow.appendChild(cell);
        }
        ;
        cellRows.push(cellRow);
    }
    ;
    board.replaceChildren(...cellRows);
    const choiceRows = [];
    let choiceRow = document.createElement("div");
    choiceRow.className = "flex";
    for (let i = 0; i < width; i++) {
        const choiceCell = document.createElement("div");
        choiceCell.className = "cell flex";
        for (let j = 0; j < width; j++) {
            const choice = document.createElement("div");
            choice.className = "choice";
            choice.innerText = symbols[i * 3 + j];
            choiceCell.appendChild(choice);
        }
        ;
        choiceRow.appendChild(choiceCell);
    }
    ;
    choiceRows.push(choiceRow);
    choiceRow = document.createElement("div");
    choiceRow.className = "flex";
    const choiceCell = document.createElement("div");
    choiceCell.className = "cell flex";
    const choice = document.createElement("div");
    choice.className = "choice";
    choiceCell.appendChild(choice);
    choiceRow.appendChild(choiceCell);
    choiceRows.push(choiceRow);
    choiceBox.replaceChildren(...choiceRows);
    background.style.width = `${boardWidth + boardPadding * 2}rem`;
    globalLayout = getRandomLayout();
    assignBoardFromLayout(globalLayout, true);
    cluesInput.value = String(clues);
}
;
function assignBoardFromLayout(layout, initial = false) {
    for (const key in layout) {
        const tile = document.getElementById(key);
        if (layout[key]) {
            tile.innerText = layout[key];
            if (initial)
                tile.className = "tile-fixed";
        }
        else if (initial)
            tile.className = "tile";
    }
    ;
}
;
function getRandomLayout() {
    const layout = solveLayout({}, getInitialPossibilities());
    for (let i = 0; i < width * width * width * width - clues; i++) {
        const key = getRandomItem(Object.keys(layout));
        delete layout[key];
    }
    ;
    return layout;
}
;
function solveLayout(layout, possibilities) {
    for (let i = 0; i < width * width; i++) {
        const collapse = findPossibilityCollapse(layout, possibilities);
        if (!collapse)
            break;
        layout[collapse.key] = collapse.symbol;
        removePossibilities(possibilities, collapse.key, collapse.symbol);
    }
    ;
    for (const key of getKeys()) {
        if (layout[key])
            continue;
        const legalSymbols = shuffleList(getLegalSymbols(layout, key));
        if (legalSymbols.length === 0)
            throw Error;
        for (const symbol of legalSymbols) {
            try {
                const layoutAssumption = Object.assign({}, layout);
                const possibilitiesAssumption = Object.assign({}, possibilities);
                layoutAssumption[key] = symbol;
                removePossibilities(possibilitiesAssumption, key, symbol);
                return solveLayout(layoutAssumption, possibilitiesAssumption);
            }
            catch {
            }
            ;
        }
        ;
        throw Error;
    }
    ;
    return layout;
}
;
function getLegalSymbols(layout, key) {
    return getLegalSymbolsFromSet(getAffectingSymbols(layout, key));
}
;
function getLegalSymbolsFromSet(symbolSet) {
    const legalSymbols = [];
    for (const symbol of symbols.slice(0, width * width)) {
        if (!symbolSet.includes(symbol))
            legalSymbols.push(symbol);
    }
    ;
    return legalSymbols;
}
;
function getAffectingSymbols(layout, key) {
    return getAffectingKeys(key).map(target => layout[target]);
}
;
function isSymbolLegal(layout, key, symbol) {
    if (layout[key] && layout[key] !== symbol)
        return false;
    const symbolSet = getAffectingSymbols(layout, key);
    return !symbolSet.includes(symbol);
}
;
function getInitialPossibilities() {
    const possibilities = {};
    for (const key of getKeys()) {
        possibilities[key] = symbols.slice(0, width * width);
    }
    ;
    return possibilities;
}
;
function getPossibiliesFromLayout(layout) {
    const possibilities = getInitialPossibilities();
    for (const key in layout) {
        if (layout[key])
            removePossibilities(possibilities, key, layout[key]);
    }
    ;
    return possibilities;
}
;
function removePossibilities(possibilities, key, symbol) {
    for (const target of getAffectingKeys(key)) {
        if (possibilities[target])
            possibilities[target].filter(entry => entry !== symbol);
    }
    ;
    possibilities[key] = [symbol];
}
;
function findPossibilityCollapse(layout, possibilities) {
    for (const key in possibilities) {
        if (layout[key])
            continue;
        if (possibilities[key].length === 0)
            throw Error;
        if (possibilities[key].length === 1) {
            const symbol = possibilities[key][0];
            if (isSymbolLegal(layout, key, symbol)) {
                return { key, symbol };
            }
            ;
        }
        ;
        const rowKeys = getAffectingKeysFromRow(key);
        const columnKeys = getAffectingKeysFromColumn(key);
        const cellKeys = getAffectingKeysFromCell(key);
        for (const symbol of possibilities[key]) {
            for (const keys of [rowKeys, columnKeys, cellKeys]) {
                if (keys.map(target => possibilities[target].includes(symbol)).filter(value => value).length === 0) {
                    if (isSymbolLegal(layout, key, symbol)) {
                        return { key, symbol };
                    }
                    ;
                }
                ;
            }
            ;
        }
        ;
    }
    ;
}
;
function isLayoutLegal(layout) {
    for (const key in getKeys()) {
        if (!layout[key])
            return false;
        if (!isSymbolLegal(layout, key, layout[key])) {
            console.log(`Contradiction found: ${key}`);
            return false;
        }
        ;
    }
    ;
    return true;
}
;
function getCoords(key) {
    const coords = key.split("-").map(entry => Number(entry));
    return {
        x: coords[0],
        y: coords[1],
    };
}
;
function getKeys() {
    const keys = [];
    for (let x = 0; x < width * width; x++)
        for (let y = 0; y < width * width; y++) {
            keys.push(`${x}-${y}`);
        }
    ;
    return keys;
}
;
function getAffectingKeys(key) {
    return getAffectingKeysFromCell(key, getAffectingKeysFromColumn(key, getAffectingKeysFromRow(key)));
}
;
function getAffectingKeysFromRow(key, keys = []) {
    const { x, y } = getCoords(key);
    for (let i = 0; i < width * width; i++) {
        if (x === i)
            continue;
        const key = `${i}-${y}`;
        if (!keys.includes(key))
            keys.push(key);
    }
    ;
    return keys;
}
;
function getAffectingKeysFromColumn(key, keys = []) {
    const { x, y } = getCoords(key);
    for (let j = 0; j < width * width; j++) {
        if (y === j)
            continue;
        const key = `${x}-${j}`;
        if (!keys.includes(key))
            keys.push(key);
    }
    ;
    return keys;
}
;
function getAffectingKeysFromCell(key, keys = []) {
    const { x, y } = getCoords(key);
    const cellX = Math.floor(x / width) * width;
    const cellY = Math.floor(y / width) * width;
    for (let i = 0; i < width; i++)
        for (let j = 0; j < width; j++) {
            if (cellX + i === x && cellY + j === y)
                continue;
            const key = `${cellX + i}-${cellY + j}`;
            if (!keys.includes(key))
                keys.push(key);
        }
    ;
    return keys;
}
;
function getRandomItem(items) {
    return items[Math.floor(Math.random() % 1 * items.length)];
}
;
function shuffleList(items) {
    const newItems = [];
    while (items.length > 0) {
        newItems.push(...items.splice(Math.floor(Math.random() % 1 * items.length), 1));
    }
    ;
    return newItems;
}
;
function checkWin() {
    const win = isLayoutLegal(globalLayout);
    for (const cellRow of board.children) {
        for (const cell of cellRow.children) {
            if (win)
                cell.className = "cell-win";
            else
                cell.className = "cell";
        }
        ;
    }
    ;
}
;
function leftClick(event) {
    const element = event.target;
    if (!element?.className)
        return;
    if (element.className.startsWith("tile") && !element.className.startsWith("tile-fixed")) {
        if (element.id === choice) {
            element.className = "tile";
            choice = null;
        }
        else {
            element.className = "tile-selected";
            if (choice) {
                const selected = document.getElementById(choice);
                selected.className = "tile";
            }
            ;
            choice = element.id;
        }
        ;
    }
    ;
    if (element.className.startsWith("choice") && choice) {
        const selected = document.getElementById(choice);
        selected.innerText = element.innerText;
        if (element.innerText) {
            globalLayout[choice] = element.innerText;
        }
        else
            delete globalLayout[choice];
        checkWin();
    }
    ;
}
;
resetButton.addEventListener("click", () => {
    clues = Number(cluesInput.value);
    setupBoard();
});
solveButton.addEventListener("click", () => {
    globalLayout = solveLayout(globalLayout, getPossibiliesFromLayout(globalLayout));
    assignBoardFromLayout(globalLayout);
    checkWin();
});
document.addEventListener("click", leftClick);
setupBoard();
