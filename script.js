import { createHighlighter } from
    "https://esm.sh/shiki@3";


/*
=========================================================
CONFIG
=========================================================
*/

const CONFIG = {

    typingSpeed: 32,

    linePause: 120,

    outputDelay: 140,

    turtleSpeed: 650
};


/*
=========================================================
PYTHON CODE
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
DOM
=========================================================
*/

const codeContainer =
    document.getElementById("codeContainer");

const lineNumbers =
    document.getElementById("lineNumbers");

const codeScene =
    document.getElementById("codeScene");

const outputScene =
    document.getElementById("outputScene");

const canvas =
    document.getElementById("turtleCanvas");

const ctx =
    canvas.getContext("2d");


/*
=========================================================
SHIKI
=========================================================
*/

const highlighter =
    await createHighlighter({

        themes: [
            "github-dark"
        ],

        langs: [
            "python"
        ]

    });


/*
=========================================================
TOKENIZE
=========================================================
*/

function tokenizePython(code) {

    const result =
        highlighter.codeToTokens(
            code,
            {
                lang: "python",
                theme: "github-dark"
            }
        );

    return result.tokens;
}


/*
=========================================================
BUILD TOKEN MAP
=========================================================
*/

function buildCharacterMap(code) {

    const tokens =
        tokenizePython(code);

    const characters = [];

    let tokenIndex = 0;

    for (const token of tokens) {

        const text =
            token.content;

        const color =
            token.color || "#c9d1d9";

        for (
            let i = 0;
            i < text.length;
            i++
        ) {

            characters.push({

                char: text[i],

                color: color,

                tokenIndex,

                tokenEnd:
                    i === text.length - 1

            });
        }

        tokenIndex++;
    }

    return characters;
}


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

    lines.forEach((_, index) => {

        const number =
            document.createElement("div");

        number.textContent =
            index + 1;

        lineNumbers.appendChild(number);

    });


    /*
    Code lines
    */

    for (const line of lines) {

        const div =
            document.createElement("div");

        div.className =
            "code-line";

        codeContainer.appendChild(div);
    }
}


/*
=========================================================
TYPE CODE
=========================================================
*/

async function typeCode() {

    createEditor();

    const characters =
        buildCharacterMap(pythonCode);

    let currentLine = 0;

    let currentLineElement =
        codeContainer.children[currentLine];


    const cursor =
        document.createElement("span");

    cursor.className =
        "cursor";


    /*
    Track token spans.
    */

    let currentTokenIndex = -1;

    let currentTokenSpans = [];


    for (const item of characters) {


        /*
        New line
        */

        if (item.char === "\n") {

            currentLine++;

            currentLineElement =
                codeContainer.children[
                    currentLine
                ];

            currentTokenIndex = -1;

            currentTokenSpans = [];

            await sleep(
                CONFIG.linePause
            );

            continue;
        }


        /*
        New token
        */

        if (
            item.tokenIndex !==
            currentTokenIndex
        ) {

            currentTokenIndex =
                item.tokenIndex;

            currentTokenSpans = [];
        }


        /*
        Character
        */

        const span =
            document.createElement("span");

        span.className =
            "code-char";

        span.textContent =
            item.char;

        span.style.setProperty(
            "--token-color",
            item.color
        );


        currentTokenSpans.push(span);


        /*
        Put cursor after character.
        */

        currentLineElement.appendChild(
            span
        );

        currentLineElement.appendChild(
            cursor
        );


        /*
        Typing delay
        */

        await sleep(
            CONFIG.typingSpeed
        );


        /*
        Highlight the COMPLETE token.
        */

        if (item.tokenEnd) {

            for (
                const charSpan
                of currentTokenSpans
            ) {

                charSpan.classList.add(
                    "highlighted"
                );
            }

        }
    }


    /*
    Final cursor pause.
    */

    await sleep(450);
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
TURTLE LINE
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


            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    3
                );


            const x =
                x1 +
                (x2 - x1) * eased;

            const y =
                y1 +
                (y2 - y1) * eased;


            clearCanvas();


            /*
            Current line
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
            Turtle
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


            if (progress < 1) {

                requestAnimationFrame(
                    frame
                );

            } else {

                resolve();
            }
        }


        requestAnimationFrame(frame);
    });
}


/*
=========================================================
RUN TURTLE
=========================================================
*/

async function runTurtle() {

    clearCanvas();


    let x = 550;
    let y = 550;


    const points = [

        [550, 300],

        [300, 300],

        [300, 550],

        [550, 550],

        [550, 300]

    ];


    for (const [nx, ny] of points) {

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
SHOW OUTPUT
=========================================================
*/

async function showOutput() {

    /*
    Code finished.

    Wait a few milliseconds.
    */

    await sleep(
        CONFIG.outputDelay
    );


    /*
    Switch scenes.
    */

    codeScene.classList.remove(
        "active"
    );

    outputScene.classList.add(
        "active"
    );


    /*
    Give browser one frame to
    render the new scene.
    */

    await sleep(100);


    await runTurtle();
}


/*
=========================================================
MAIN
=========================================================
*/

async function main() {

    outputScene.classList.remove(
        "active"
    );

    codeScene.classList.add(
        "active"
    );


    await typeCode();

    await showOutput();
}


main();