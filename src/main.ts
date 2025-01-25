interface Layout {
    [index: string]: string;
};
interface Possibilities {
    [index: string]: string[];
};

const background = document.getElementById("background") as HTMLDivElement;
const board = document.getElementById("board") as HTMLDivElement;
const choiceBox = document.getElementById("choice-box") as HTMLDivElement;
const resetButton = document.getElementById("reset-button") as HTMLButtonElement;
const solveButton = document.getElementById("solve-button") as HTMLButtonElement;
const cluesInput = document.getElementById("clues-input") as HTMLInputElement;

let width = 3;
const tileWidth = 2;
const boardPadding = 0.5;

let clues = 30;
let choice: string | null = null;

const symbols = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
let globalLayout: Layout = {};




function setupBoard() {
    const cellWidth = (tileWidth + 0.4)*width;
    const boardWidth = (cellWidth + 0.4)*width;

    // Initialize layout
    const cellRows: HTMLDivElement[] = [];
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
                    const key = `${x*width + i}-${y*width + j}`;
                    tile.id = key;
                    tileRow.appendChild(tile);
                };
                cell.appendChild(tileRow);
            };
            cell.style.width = `${cellWidth}rem`;
            cellRow.appendChild(cell);
        };
        cellRows.push(cellRow);
    };
    board.replaceChildren(...cellRows);

    // Initialize choice box
    const choiceRows: HTMLDivElement[] = [];
    let choiceRow = document.createElement("div");
    choiceRow.className = "flex";
    for (let i = 0; i < width; i++) {
        const choiceCell = document.createElement("div");
        choiceCell.className = "cell flex";
        for (let j = 0; j < width; j++) {
            const choice = document.createElement("div");
            choice.className = "choice";
            choice.innerText = symbols[i*3 + j];
            choiceCell.appendChild(choice);
        };
        choiceRow.appendChild(choiceCell);
    };
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


    background.style.width = `${boardWidth + boardPadding*2}rem`;

    // Assign layout
    globalLayout = getRandomLayout();
    assignBoardFromLayout(globalLayout, true);

    cluesInput.value = String(clues);
};



function assignBoardFromLayout(layout: Layout, initial: boolean = false) {
    for (const key in layout) {
        const tile = document.getElementById(key) as HTMLDivElement;
        if (layout[key]) {
            tile.innerText = layout[key];
            if (initial) tile.className = "tile-fixed";
        } else if (initial) tile.className = "tile";
    };
};



function getRandomLayout(): Layout {
    const layout = solveLayout({}, getInitialPossibilities());
    for (let i = 0; i < width*width*width*width - clues; i++) {
        const key = getRandomItem(Object.keys(layout));
        delete layout[key];
    };
    return layout;
};

function solveLayout(layout: Layout, possibilities: Possibilities): Layout {
    // Collapse all necessary symbols
    for (let i = 0; i < width*width; i++) {
        const collapse = findPossibilityCollapse(layout, possibilities);
        if (!collapse) break;
        // console.log(`Found collapse: ${JSON.stringify(collapse)}`);
        layout[collapse.key] = collapse.symbol;
        removePossibilities(possibilities, collapse.key, collapse.symbol);
    };

    for (const key of getKeys()) {
        if (layout[key]) continue;

        // Throw an error if a contradiction is found, meaning that the most recent assumption is false
        const legalSymbols = shuffleList(getLegalSymbols(layout, key));
        if (legalSymbols.length === 0) throw Error;

        // If a tile is reached that cannot be determined, make an assumption and branch the solving efforts
        // console.log(`Making assumptions from symbol pool: ${legalSymbols}`);
        for (const symbol of legalSymbols) {
            try {
                const layoutAssumption = Object.assign({}, layout);
                const possibilitiesAssumption = Object.assign({}, possibilities);
                // console.log(`Testing assumption: ${key}: ${symbol}`);
                layoutAssumption[key] = symbol;
                removePossibilities(possibilitiesAssumption, key, symbol);
                return solveLayout(layoutAssumption, possibilitiesAssumption);
            } catch {
                // console.log(`Assumption led to contradiction: ${key}: ${symbol}`);
            };
        };

        // If none of the symbols worked, a contradiction has been found
        throw Error;
    };

    // It should never escape the loop, but if it does, it means all tiles are filled
    return layout;
};

function getLegalSymbols(layout: Layout, key: string): string[] {
    return getLegalSymbolsFromSet(getAffectingSymbols(layout, key));
};

function getLegalSymbolsFromSet(symbolSet: string[]): string[] {
    const legalSymbols: string[] = [];
    for (const symbol of symbols.slice(0, width*width)) {
        if (!symbolSet.includes(symbol)) legalSymbols.push(symbol);
    };
    return legalSymbols;
};

function getAffectingSymbols(layout: Layout, key: string): string[] {
    return getAffectingKeys(key).map(target => layout[target]);
};

function isSymbolLegal(layout: Layout, key: string, symbol: string): boolean {
    if (layout[key] && layout[key] !== symbol) return false;
    const symbolSet = getAffectingSymbols(layout, key);
    return !symbolSet.includes(symbol);
};



function getInitialPossibilities(): Possibilities {
    const possibilities: Possibilities = {};
    for (const key of getKeys()) {
        possibilities[key] = symbols.slice(0, width*width);
    };
    return possibilities;
};

function getPossibiliesFromLayout(layout: Layout): Possibilities {
    const possibilities = getInitialPossibilities();
    for (const key in layout) {
        if (layout[key]) removePossibilities(possibilities, key, layout[key]);
    };
    return possibilities;
};

function removePossibilities(possibilities: Possibilities, key: string, symbol: string) {
    for (const target of getAffectingKeys(key)) {
        if (possibilities[target]) possibilities[target].filter(entry => entry !== symbol);
    };
    possibilities[key] = [symbol];
};

function findPossibilityCollapse(layout: Layout, possibilities: Possibilities) {
    for (const key in possibilities) {
        if (layout[key]) continue;

        // Throw an error if a contradiction is found, meaning that the most recent assumption is false
        if (possibilities[key].length === 0) throw Error;
        
        // Search for cases where only one symbol may occupy a tile
        if (possibilities[key].length === 1) {
            const symbol = possibilities[key][0];
            // console.log(`First: ${key}: ${symbol}`);
            if (isSymbolLegal(layout, key, symbol)) {
                return {key, symbol};
            };
        };

        // Search for cases where a symbol occurs only once in a row, column, or cell
        const rowKeys = getAffectingKeysFromRow(key);
        const columnKeys = getAffectingKeysFromColumn(key);
        const cellKeys = getAffectingKeysFromCell(key);
        for (const symbol of possibilities[key]) {
            for (const keys of [rowKeys, columnKeys, cellKeys]) {
                if (keys.map(target => possibilities[target].includes(symbol)
                ).filter(value => value).length === 0) {
                    // console.log(`Second: ${key}: ${symbol}, ${isSymbolLegal(layout, key, symbol)}`);
                    if (isSymbolLegal(layout, key, symbol)) {
                        return {key, symbol};
                    };
                };
            };
        };
    };
};



function isLayoutLegal(layout: Layout): boolean {
    for (const key of getKeys()) {
        if (!layout[key]) {
            console.log(`Missing key found: ${key}`);
            return false;
        };
        if (!isSymbolLegal(layout, key, layout[key])) {
            console.log(`Contradiction found: ${key}`);
            return false;
        };
    };
    return true;
};



function getCoords(key: string) {
    const coords = key.split("-").map(entry => Number(entry));
    return {
        x: coords[0],
        y: coords[1],
    };
};

function getKeys(): string[] {
    const keys: string[] = [];
    for (let x = 0; x < width*width; x++) for (let y = 0; y < width*width; y++) {
        keys.push(`${x}-${y}`);
    };
    return keys;
};
function getAffectingKeys(key: string): string[] {
    return getAffectingKeysFromCell(key, getAffectingKeysFromColumn(key, getAffectingKeysFromRow(key)));
};
function getAffectingKeysFromRow(key: string, keys: string[] = []): string[] {
    const {x, y} = getCoords(key);
    for (let i = 0; i < width*width; i++) {
        if (x === i) continue;
        const key = `${i}-${y}`;
        if (!keys.includes(key)) keys.push(key);
    };
    return keys;
};
function getAffectingKeysFromColumn(key: string, keys: string[] = []): string[] {
    const {x, y} = getCoords(key);
    for (let j = 0; j < width*width; j++) {
        if (y === j) continue;
        const key = `${x}-${j}`;
        if (!keys.includes(key)) keys.push(key);
    };
    return keys;
};
function getAffectingKeysFromCell(key: string, keys: string[] = []): string[] {
    const {x, y} = getCoords(key);
    const cellX = Math.floor(x/width)*width;
    const cellY = Math.floor(y/width)*width;
    for (let i = 0; i < width; i++) for (let j = 0; j < width; j++) {
        if (cellX + i === x && cellY + j === y) continue;
        const key = `${cellX + i}-${cellY + j}`;
        if (!keys.includes(key)) keys.push(key);
    };
    return keys;
};

function getRandomItem<T>(items: T[]): T {
    return items[Math.floor(Math.random()%1*items.length)];
};

function shuffleList<T>(items: T[]): T[] {
    const newItems: T[] = [];
    while (items.length > 0) {
        newItems.push(...items.splice(Math.floor(Math.random()%1*items.length), 1));
    };
    return newItems;
};



function checkWin() {
    const win = isLayoutLegal(globalLayout);
    for (const cellRow of board.children as HTMLCollectionOf<HTMLDivElement>) {
        for (const cell of cellRow.children as HTMLCollectionOf<HTMLDivElement>) {
            if (win) cell.className = "cell-win";
            else cell.className = "cell";
        };
    };
};



function leftClick(event: MouseEvent) {
    const element = event.target as HTMLDivElement;
    if (!element?.className) return;
    
    if (element.className.startsWith("tile") && !element.className.startsWith("tile-fixed")) {
        if (element.id === choice) {
            element.className = "tile";
            choice = null;
        } else {
            element.className = "tile-selected";
            if (choice) {
                const selected = document.getElementById(choice) as HTMLDivElement;
                selected.className = "tile";
            };
            choice = element.id;
        };
    };

    if (element.className.startsWith("choice") && choice) {
        const selected = document.getElementById(choice) as HTMLDivElement;
        selected.innerText = element.innerText;
        if (element.innerText) {
            globalLayout[choice] = element.innerText;
        } else delete globalLayout[choice];
        checkWin();
    };
};



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