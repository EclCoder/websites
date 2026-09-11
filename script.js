/*
==================================================
   CODE ANIMATION
   GitHub Pages + Prism CDN
==================================================
*/


/* =========================================
   CONFIG
   ========================================= */

const CONFIG = {

    // Delay between each typed character
    typingSpeed: 32,

    // Extra delay after a line finishes
    linePause: 100,

    // Delay between code scene and output
    outputDelay: 120,

    // Pause after all code has been typed
    finalCodePause: 450,

    // Turtle drawing speed
    turtleSpeed: 650
};


/* =========================================
   SOURCE CODE
   ========================================= */

const pythonCode =
`import turtle

t = turtle.Turtle()

t.forward(250)
t.left(90)
t.forward(250)
t.left(90)
t.forward(250)
t.left(90)
t.forward(250)
t.left(90)
`;


/* =========================================
   DOM
   ========================================= */

const codeElement =
    document.getElementById("code");

const lineNumbersElement =
    document.getElementById("lineNumbers");

const codeScene =
    document.getElementById("codeScene");

const outputScene =
    document.getElementById("outputScene");

const canvas =
    document.getElementById("turtleCanvas");

const ctx =
    canvas.getContext("2d");


/* =========================================
   TOKEN COLORS
   ========================================= */

const TOKEN_COLORS = {

    comment: "#6A9955",

    keyword: "#C586C0",

    function: "#DCDCAA",

    "class-name": "#4EC9B0",

    string: "#CE9178",

    number: "#B5CEA8",

    boolean: "#569CD6",

    operator: "#D4D4D4",

    punctuation: "#D4D4D4",

    builtin: "#4FC1FF",

    constant: "#4FC1FF",

    variable: "#9CDCFE",

    decorator: "#DCDCAA"
};


/* =========================================
   PRISM TOKEN PROCESSING
   ========================================= */

/*
   Prism returns something like:

   [
       "import ",
       Token("keyword", "turtle"),
       ...
   ]

   Tokens can also contain nested tokens.

   We flatten everything into individual
   character objects while preserving the
   semantic token.

   IMPORTANT:

   Every logical Prism token receives
   ONE tokenId.

   Therefore:

       forwa

   stays unhighlighted while typing.

   Only when:

       forward

   is completely typed,

   the entire token changes color.
*/

function tokenizeCode(source) {

    const prismTokens =
        Prism.tokenize(
            source,
            Prism.languages.python
        );

    const characters = [];

    let tokenId = 0;


    function processItem(
        item,
        inheritedType = null
    ) {

        /* Plain text */

        if (typeof item === "string") {

            for (const char of item) {

                characters.push({

                    char,

                    tokenId: tokenId++,

                    tokenEnd: true,

                    tokenClass: null
                });
            }

            return;
        }


        /* Prism Token */

        const currentTokenId =
            tokenId++;

        const type =
            item.type || inheritedType;

        const content =
            item.content;


        /*
           We first collect all characters
           belonging to this token.
        */

        const localCharacters = [];


        function collect(value) {

            if (typeof value === "string") {

                for (const char of value) {

                    localCharacters.push({

                        char,

                        tokenId: currentTokenId,

                        tokenClass: type
                    });
                }

                return;
            }


            if (Array.isArray(value)) {

                for (const child of value) {

                    collect(child);
                }

                return;
            }


            if (value instanceof Prism.Token) {

                collect(value.content);
            }
        }


        collect(content);


        /*
           The final character marks the end
           of the logical Prism token.
        */

        if (localCharacters.length > 0) {

            localCharacters[
                localCharacters.length - 1
            ].tokenEnd = true;
        }


        characters.push(...localCharacters);
    }


    for (const item of prismTokens) {

        processItem(item);
    }


    return characters;
}


/* =========================================
   BUILD LINE NUMBERS
   ========================================= */

function buildLineNumbers(source) {

    const lines =
        source.split("\n");

    lineNumbersElement.innerHTML = "";

    lines.forEach((_, index) => {

        const line =
            document.createElement("div");

        line.textContent =
            index + 1;

        lineNumbersElement.appendChild(line);
    });
}


/* =========================================
   TOKEN COLOR
   ========================================= */

function getTokenColor(tokenClass) {

    if (!tokenClass) {

        return "#d4d4d4";
    }


    /*
       Prism can return classes such as:

       "keyword"
       "function"
       "string"
       "number"
       "operator"
       "punctuation"

       It can also return combinations.
    */

    const classes =
        tokenClass.split(/\s+/);


    for (const cls of classes) {

        if (TOKEN_COLORS[cls]) {

            return TOKEN_COLORS[cls];
        }
    }


    return "#d4d4d4";
}


/* =========================================
   CREATE CHARACTER SPAN
   ========================================= */

function createCharacter(
    item,
    index
) {

    const span =
        document.createElement("span");

    span.className = "char";

    span.dataset.index = index;

    span.dataset.tokenId =
        item.tokenId;

    span.dataset.tokenClass =
        item.tokenClass || "";

    span.textContent =
        item.char === " "
            ? "\u00A0"
            : item.char;


    /*
       Store the eventual syntax color
       but DO NOT apply it yet.
    */

    span.style.setProperty(
        "--token-color",
        getTokenColor(item.tokenClass)
    );


    return span;
}


/* =========================================
   INITIALIZE CODE
   ========================================= */

function initializeCode() {

    codeElement.innerHTML = "";

    const characters =
        tokenizeCode(pythonCode);


    characters.forEach(
        (item, index) => {

            const span =
                createCharacter(
                    item,
                    index
                );

            /*
               Hidden initially.
            */

            span.style.visibility =
                "hidden";

            codeElement.appendChild(span);
        }
    );


    buildLineNumbers(pythonCode);


    return characters;
}


/* =========================================
   CURSOR
   ========================================= */

function createCursor() {

    const cursor =
        document.createElement("span");

    cursor.className =
        "cursor";

    cursor.id =
        "typingCursor";

    return cursor;
}


function removeCursor() {

    const cursor =
        document.getElementById(
            "typingCursor"
        );

    if (cursor) {

        cursor.remove();
    }
}


/* =========================================
   HIGHLIGHT TOKEN
   ========================================= */

function highlightToken(tokenId) {

    const chars =
        codeElement.querySelectorAll(
            `.char[data-token-id="${tokenId}"]`
        );


    chars.forEach(char => {

        char.classList.add(
            "highlighted"
        );
    });
}


/* =========================================
   TYPE CODE
   ========================================= */

async function typeCode(characters) {

    const cursor =
        createCursor();

    codeElement.appendChild(cursor);


    let previousTokenId =
        null;


    for (
        let i = 0;
        i < characters.length;
        i++
    ) {

        const item =
            characters[i];


        const span =
            codeElement.children[i];


        /*
           Show this character.
        */

        span.style.visibility =
            "visible";


        /*
           Move cursor immediately after
           the character being typed.
        */

        codeElement.appendChild(cursor);


        /*
           If this is the final character
           of a Prism token, NOW apply the
           syntax color to the entire token.
        */

        if (item.tokenEnd) {

            highlightToken(
                item.tokenId
            );
        }


        /*
           Slightly different pause at
           newline characters.
        */

        if (item.char === "\n") {

            await sleep(
                CONFIG.linePause
            );

        } else {

            await sleep(
                CONFIG.typingSpeed
            );
        }


        previousTokenId =
            item.tokenId;
    }


    /*
       Keep cursor visible for a short time.
    */

    await sleep(
        CONFIG.finalCodePause
    );


    removeCursor();
}


/* =========================================
   SLEEP
   ========================================= */

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                ms
            )
    );
}


/* =========================================
   SCENE SWITCH
   ========================================= */

async function showOutputScene() {

    await sleep(
        CONFIG.outputDelay
    );


    codeScene.classList.remove(
        "active"
    );

    outputScene.classList.add(
        "active"
    );


    await sleep(100);


    drawTurtleAnimation();
}


/* =========================================
   TURTLE
   ========================================= */

function resetCanvas() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


/*
   Turtle-like movement.

   Start in the center.
   Angle 0 means facing right.
*/

const turtleCommands = [

    {
        type: "forward",
        value: 250
    },

    {
        type: "left",
        value: 90
    },

    {
        type: "forward",
        value: 250
    },

    {
        type: "left",
        value: 90
    },

    {
        type: "forward",
        value: 250
    },

    {
        type: "left",
        value: 90
    },

    {
        type: "forward",
        value: 250
    },

    {
        type: "left",
        value: 90
    }
];


/* =========================================
   DRAW ONE LINE
   ========================================= */

function animateLine(
    x,
    y,
    angle,
    distance
) {

    return new Promise(resolve => {

        const startX =
            x;

        const startY =
            y;


        const radians =
            angle * Math.PI / 180;


        const endX =
            startX +
            Math.cos(radians) *
            distance;

        const endY =
            startY +
            Math.sin(radians) *
            distance;


        const startTime =
            performance.now();


        function frame(now) {

            const elapsed =
                now - startTime;

            const progress =
                Math.min(
                    elapsed /
                    CONFIG.turtleSpeed,
                    1
                );


            const currentX =
                startX +
                (endX - startX) *
                progress;

            const currentY =
                startY +
                (endY - startY) *
                progress;


            /*
               Redraw the whole canvas
               so the line grows smoothly.
            */

            resetCanvas();


            /*
               Draw previous completed lines.
               They are stored separately.
            */

            drawCompletedLines();


            /*
               Current line.
            */

            ctx.beginPath();

            ctx.moveTo(
                startX,
                startY
            );

            ctx.lineTo(
                currentX,
                currentY
            );

            ctx.strokeStyle =
                "#000000";

            ctx.lineWidth =
                5;

            ctx.lineCap =
                "round";

            ctx.stroke();


            /*
               Turtle marker.
            */

            drawTurtle(
                currentX,
                currentY,
                angle
            );


            if (progress < 1) {

                requestAnimationFrame(
                    frame
                );

            } else {

                resolve({
                    x: endX,
                    y: endY
                });
            }
        }


        requestAnimationFrame(frame);
    });
}


/* =========================================
   COMPLETED LINES
   ========================================= */

let completedLines = [];


function drawCompletedLines() {

    ctx.strokeStyle =
        "#000000";

    ctx.lineWidth =
        5;

    ctx.lineCap =
        "round";


    for (const line of completedLines) {

        ctx.beginPath();

        ctx.moveTo(
            line.x1,
            line.y1
        );

        ctx.lineTo(
            line.x2,
            line.y2
        );

        ctx.stroke();
    }
}


/* =========================================
   TURTLE MARKER
   ========================================= */

function drawTurtle(
    x,
    y,
    angle
) {

    const radians =
        angle * Math.PI / 180;


    ctx.save();

    ctx.translate(
        x,
        y
    );

    ctx.rotate(
        radians
    );


    ctx.beginPath();

    ctx.moveTo(
        18,
        0
    );

    ctx.lineTo(
        -12,
        -10
    );

    ctx.lineTo(
        -8,
        0
    );

    ctx.lineTo(
        -12,
        10
    );

    ctx.closePath();


    ctx.fillStyle =
        "#008000";

    ctx.fill();


    ctx.restore();
}


/* =========================================
   TURTLE ANIMATION
   ========================================= */

async function drawTurtleAnimation() {

    resetCanvas();

    completedLines = [];


    let x = 400;
    let y = 400;

    let angle = 0;


    for (
        const command
        of turtleCommands
    ) {

        if (
            command.type === "forward"
        ) {

            const radians =
                angle *
                Math.PI /
                180;


            const endX =
                x +
                Math.cos(radians) *
                command.value;

            const endY =
                y +
                Math.sin(radians) *
                command.value;


            const result =
                await animateLine(
                    x,
                    y,
                    angle,
                    command.value
                );


            completedLines.push({

                x1: x,
                y1: y,

                x2: endX,
                y2: endY
            });


            x = result.x;
            y = result.y;


        } else if (
            command.type === "left"
        ) {

            angle -=
                command.value;

            /*
               Small pause after turning.
            */

            await sleep(100);
        }
    }


    /*
       Final frame.
    */

    resetCanvas();

    drawCompletedLines();

    drawTurtle(
        x,
        y,
        angle
    );
}


/* =========================================
   START
   ========================================= */

async function startAnimation() {

    const characters =
        initializeCode();


    await sleep(500);


    await typeCode(
        characters
    );


    await showOutputScene();
}


/* =========================================
   RUN
   ========================================= */

window.addEventListener(
    "load",
    () => {

        startAnimation();
    }
);