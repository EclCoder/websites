/*
=========================================================
PYTHON SOURCE
=========================================================
*/

const pythonCode =
`import turtle

t = turtle.Turtle()
t.forward(250)
t.left(90)
t.forward(250)
t.left(90)
t.forward(250)
t.left(90)
t.forward(250)`;


/*
=========================================================
ANIMATION CONFIG
=========================================================
*/

const CONFIG = {

    /*
        Time between characters.
    */

    typingSpeed: 32,


    /*
        Pause after Enter.
    */

    linePause: 120,


    /*
        Delay after code finishes
        before switching scene.
    */

    outputDelay: 120,


    /*
        Pause after final character.
    */

    finalCodePause: 450,


    /*
        Turtle drawing speed.
    */

    turtleSpeed: 650

};


/*
=========================================================
DOM
=========================================================
*/

const codeContainer =
    document.getElementById(
        "codeContainer"
    );

const lineNumbers =
    document.getElementById(
        "lineNumbers"
    );

const codeScene =
    document.getElementById(
        "codeScene"
    );

const outputScene =
    document.getElementById(
        "outputScene"
    );

const canvas =
    document.getElementById(
        "turtleCanvas"
    );

const ctx =
    canvas.getContext("2d");


/*
=========================================================
PRISM
=========================================================
*/

const prismTokens =
    Prism.tokenize(
        pythonCode,
        Prism.languages.python
    );


/*
=========================================================
TOKEN → CHARACTER MAP
=========================================================

Prism returns nested Token objects.

We flatten them into:

[
    {
        char: "i",
        tokenId: 0,
        colorClass: "keyword",
        tokenEnd: false
    },

    ...
]

This allows us to type one character
at a time while highlighting the
WHOLE token only after it finishes.
=========================================================
*/

function buildCharacterMap(tokens) {

    const characters = [];

    let tokenId = 0;


    function processToken(token) {

        /*
            Plain text
        */

        if (typeof token === "string") {

            for (
                let i = 0;
                i < token.length;
                i++
            ) {

                characters.push({

                    char: token[i],

                    tokenId,

                    tokenEnd:
                        i === token.length - 1,

                    tokenClass:
                        null

                });
            }

            tokenId++;

            return;
        }


        /*
            Prism Token
        */

        const classes =
            token.type || "";


        /*
            Token can contain nested tokens.
        */

        if (Array.isArray(token.content)) {

            for (
                const child
                of token.content
            ) {

                processNestedToken(
                    child,
                    classes
                );
            }

        } else {

            const text =
                String(token.content);

            for (
                let i = 0;
                i < text.length;
                i++
            ) {

                characters.push({

                    char: text[i],

                    tokenId,

                    tokenEnd:
                        i === text.length - 1,

                    tokenClass:
                        classes

                });
            }

            tokenId++;
        }
    }


    function processNestedToken(
        token,
        parentClass
    ) {

        if (typeof token === "string") {

            for (
                let i = 0;
                i < token.length;
                i++
            ) {

                characters.push({

                    char: token[i],

                    tokenId,

                    tokenEnd:
                        i === token.length - 1,

                    tokenClass:
                        parentClass

                });
            }

            tokenId++;

            return;
        }


        const classes =
            token.type || parentClass;


        if (Array.isArray(token.content)) {

            for (
                const child
                of token.content
            ) {

                processNestedToken(
                    child,
                    classes
                );
            }

        } else {

            const text =
                String(token.content);

            for (
                let i = 0;
                i < text.length;
                i++
            ) {

                characters.push({

                    char: text[i],

                    tokenId,

                    tokenEnd:
                        i === text.length - 1,

                    tokenClass:
                        classes

                });
            }

            tokenId++;
        }
    }


    for (const token of tokens) {

        processToken(token);
    }


    return characters;
}


const characters =
    buildCharacterMap(
        prismTokens
    );


/*
=========================================================
CREATE EDITOR
=========================================================
*/

function createEditor() {

    codeContainer.innerHTML = "";

    lineNumbers.innerHTML = "";


    const lines =
        pythonCode.split("\n");


    /*
        Line numbers
    */

    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        const number =
            document.createElement("div");

        number.textContent =
            i + 1;

        lineNumbers.appendChild(
            number
        );
    }


    /*
        Code lines
    */

    for (
        const line of lines
    ) {

        const div =
            document.createElement("div");

        div.className =
            "code-line";

        codeContainer.appendChild(
            div
        );
    }
}


/*
=========================================================
TYPE CODE
=========================================================
*/

async function typeCode() {

    createEditor();


    let lineIndex = 0;

    let currentLine =
        codeContainer.children[
            lineIndex
        ];


    /*
        Cursor
    */

    const cursor =
        document.createElement(
            "span"
        );

    cursor.className =
        "cursor";


    /*
        Current token tracking
    */

    let activeTokenId = null;

    let activeTokenSpans = [];


    for (
        const item
        of characters
    ) {


        /*
        =============================================
        NEW LINE
        =============================================
        */

        if (item.char === "\n") {

            /*
                Remove cursor from
                previous line.
            */

            if (
                cursor.parentNode
            ) {

                cursor.remove();
            }


            lineIndex++;

            currentLine =
                codeContainer.children[
                    lineIndex
                ];


            activeTokenId = null;

            activeTokenSpans = [];


            await sleep(
                CONFIG.linePause
            );

            continue;
        }


        /*
        =============================================
        NEW TOKEN
        =============================================
        */

        if (
            item.tokenId !==
            activeTokenId
        ) {

            activeTokenId =
                item.tokenId;

            activeTokenSpans = [];
        }


        /*
        =============================================
        CREATE CHARACTER
        =============================================
        */

        const span =
            document.createElement(
                "span"
            );

        span.className =
            "code-char";

        span.textContent =
            item.char;


        /*
            Determine token color.
        */

        if (
            item.tokenClass
        ) {

            span.classList.add(
                "token",
                item.tokenClass
            );
        }


        /*
            Prism doesn't directly
            provide our CSS variable.

            Find the token's computed
            color variable from its class.
        */

        const color =
            getTokenColor(
                item.tokenClass
            );

        span.style.setProperty(
            "--token-color",
            color
        );


        activeTokenSpans.push(
            span
        );


        /*
        =============================================
        INSERT CHARACTER
        =============================================
        */

        currentLine.appendChild(
            span
        );

        currentLine.appendChild(
            cursor
        );


        /*
        =============================================
        TYPING DELAY
        =============================================
        */

        await sleep(
            CONFIG.typingSpeed
        );


        /*
        =============================================
        TOKEN COMPLETE
        =============================================
        */

        if (
            item.tokenEnd
        ) {

            for (
                const charSpan
                of activeTokenSpans
            ) {

                charSpan.classList.add(
                    "highlighted"
                );
            }

            activeTokenSpans = [];
        }
    }


    /*
        Final cursor pause.
    */

    await sleep(
        CONFIG.finalCodePause
    );
}


/*
=========================================================
TOKEN COLORS
=========================================================
*/

function getTokenColor(type) {

    switch (type) {

        case "keyword":
            return "#ff7b72";

        case "function":
            return "#d2a8ff";

        case "class-name":
            return "#ffa657";

        case "number":
            return "#79c0ff";

        case "string":
            return "#a5d6ff";

        case "comment":
            return "#8b949e";

        case "operator":
            return "#ff7b72";

        case "builtin":
            return "#79c0ff";

        case "boolean":
            return "#79c0ff";

        default:
            return "#c9d1d9";
    }
}


/*
=========================================================
SLEEP
=========================================================
*/

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(resolve, ms)
    );
}


/*
=========================================================
CANVAS
=========================================================
*/

function clearCanvas() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


/*
=========================================================
DRAW TURTLE LINE
=========================================================
*/

function drawLine(
    x1,
    y1,
    x2,
    y2,
    duration
) {

    return new Promise(resolve => {

        const start =
            performance.now();


        function frame(now) {

            const elapsed =
                now - start;


            const progress =
                Math.min(
                    elapsed / duration,
                    1
                );


            /*
                Smooth easing.
            */

            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );


            const x =
                x1 +
                (x2 - x1) *
                eased;

            const y =
                y1 +
                (y2 - y1) *
                eased;


            clearCanvas();


            /*
            =========================================
            DRAW LINE
            =========================================
            */

            ctx.beginPath();

            ctx.moveTo(
                x1,
                y1
            );

            ctx.lineTo(
                x,
                y
            );

            ctx.strokeStyle =
                "#58a6ff";

            ctx.lineWidth =
                8;

            ctx.lineCap =
                "round";

            ctx.stroke();


            /*
            =========================================
            TURTLE
            =========================================
            */

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                10,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "#f0f6fc";

            ctx.fill();


            if (
                progress < 1
            ) {

                requestAnimationFrame(
                    frame
                );

            } else {

                resolve();
            }
        }


        requestAnimationFrame(
            frame
        );
    });
}


/*
=========================================================
RUN TURTLE
=========================================================
*/

async function runTurtle() {

    clearCanvas();


    /*
        Start point.
    */

    let x = 550;

    let y = 550;


    /*
        Square.

        forward(250)
        left(90)
        ...
    */

    const points = [

        [550, 300],

        [300, 300],

        [300, 550],

        [550, 550],

        [550, 300]

    ];


    for (
        const [nx, ny]
        of points
    ) {

        await drawLine(
            x,
            y,
            nx,
            ny,
            CONFIG.turtleSpeed
        );


        x = nx;

        y = ny;
    }
}


/*
=========================================================
SHOW OUTPUT
=========================================================
*/

async function showOutput() {

    /*
        Code is finished.

        Wait a very short time.
    */

    await sleep(
        CONFIG.outputDelay
    );


    /*
        Switch from code
        to output.
    */

    codeScene.classList.remove(
        "active"
    );

    outputScene.classList.add(
        "active"
    );


    /*
        Let browser render
        output scene.
    */

    await sleep(50);


    await runTurtle();
}


/*
=========================================================
MAIN
=========================================================
*/

async function main() {

    /*
        Start with code.
    */

    codeScene.classList.add(
        "active"
    );

    outputScene.classList.remove(
        "active"
    );


    /*
        Type Python.
    */

    await typeCode();


    /*
        Show Turtle output.
    */

    await showOutput();
}


/*
=========================================================
START
=========================================================
*/

main();