// CodeMirrorを初期化
const editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
    mode: 'javascript',
    theme: 'dracula',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    extraKeys: {
        "Tab": function(cm) {
            if (cm.somethingSelected()) {
                cm.indentSelection("add");
            } else {
                cm.replaceSelection(Array(cm.getOption("indentUnit") + 1).join(" "), "end");
            }
        }
    }
});

const runButton = document.getElementById('run-button');
const outputArea = document.getElementById('output-area');
const hintArea = document.getElementById('hint-area');
const challengeDisplay = document.getElementById('challenge-display');

const problemSettingsModal = document.getElementById('problem-settings-modal');
const openProblemSettingsButton = document.getElementById('open-problem-settings-button');
const closeModalButton = document.getElementById('close-modal-button');
const problemDescriptionInput = document.getElementById('problem-description-input');
const targetOutputInput = document.getElementById('target-output-input');
const setProblemButton = document.getElementById('set-problem-button');

let currentProblemDescription = problemDescriptionInput.value;
let currentTargetOutput = targetOutputInput.value;

function updateChallengeDisplay() {
    const escapedTargetOutput = currentTargetOutput
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    challengeDisplay.innerHTML = `
        <p class="text-blue-800 font-medium mb-2">
            課題: ${currentProblemDescription.replace(/`([^`]+)`/g, '<span class="font-bold">`$1`</span>')}
        </p>
        <p class="text-blue-700 text-sm mb-1">目標出力 (コンソールログ):</p>
        <pre>${escapedTargetOutput || '(未設定)'}</pre>
    `;
}

updateChallengeDisplay();

openProblemSettingsButton.addEventListener('click', () => {
    problemSettingsModal.classList.remove('hidden');
    problemDescriptionInput.value = currentProblemDescription;
    targetOutputInput.value = currentTargetOutput;
});

closeModalButton.addEventListener('click', () => {
    problemSettingsModal.classList.add('hidden');
});

problemSettingsModal.addEventListener('click', (e) => {
    if (e.target === problemSettingsModal) {
        problemSettingsModal.classList.add('hidden');
    }
});

setProblemButton.addEventListener('click', async () => {
    currentProblemDescription = problemDescriptionInput.value;
    currentTargetOutput = targetOutputInput.value;
    updateChallengeDisplay();
    problemSettingsModal.classList.add('hidden');
    await executeCodeAndGenerateHint();
});

function initializeEditor() {
    outputArea.textContent = 'JavaScript環境の準備が完了しました！コードを実行できます。';
    runButton.disabled = false;
    runButton.textContent = 'コードを実行';

    editor.setValue(`console.log("Hello, JavaScript!");
console.log("これは2行目の出力です。");

let x = 10;
if (x > 5) {
    console.log("xは5より大きい");
} else {
    console.log("xは5以下");
}

for (let i = 0; i < 3; i++) {
    console.log("ループカウンター: " + i);
}

function greet(name) {
    return "こんにちは、" + name + "さん！";
}
console.log(greet("Hana"));`);

    problemDescriptionInput.value = "JavaScriptの`console.log()`を複数回使用し、変数、`if`文、`for`ループ、関数定義を組み合わせて、指定された複数行の文字列や計算結果をコンソールに順番通りに出力してみよう。";
    targetOutputInput.value = `Hello, JavaScript!
これは2行目の出力です。
xは5より大きい
ループカウンター: 0
ループカウンター: 1
ループカウンター: 2
こんにちは、Hanaさん！`;
    currentProblemDescription = problemDescriptionInput.value;
    currentTargetOutput = targetOutputInput.value;
    updateChallengeDisplay();
}

window.addEventListener('load', initializeEditor);
runButton.addEventListener('click', executeCodeAndGenerateHint);

async function fetchGPTHint(promptText) {
    const apiKey = "YOUR_OPENAI_API_KEY_HERE";
    const apiUrl = "https://api.openai.com/v1/chat/completions";

    const messages = [
        { role: "system", content: "あなたは子供向けのプログラミングチューターです。優しく具体的にヒントを与えてください。" },
        { role: "user", content: promptText }
    ];

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            console.error("OpenAI API からエラー:", response.status, response.statusText);
            return "ヒントの生成に失敗しました。";
        }

        const data = await response.json();
        const hint = data.choices?.[0]?.message?.content;
        return hint ? hint.trim() : "ヒントが取得できませんでした。";
    } catch (error) {
        console.error("OpenAI API 呼び出し中の例外:", error);
        return "ヒントの生成中にネットワークエラーが発生しました。";
    }
}

async function executeCodeAndGenerateHint() {
    const code = editor.getValue();
    outputArea.textContent = "";
    hintArea.innerHTML = "";

    let capturedLogs = [];
    let errorDetected = false;
    let errorMessage = "";

    const originalConsole = {};
    const consoleMethods = ["log", "error", "warn", "info", "debug"];
    consoleMethods.forEach(method => {
        originalConsole[method] = console[method];
        console[method] = (...args) => {
            const message = args.map(arg => {
                if (typeof arg === "object" && arg !== null) {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(" ");
            capturedLogs.push({ type: method, message: message });
            originalConsole[method].apply(console, args);
        };
    });

    try {
        const userFunction = new Function(code);
        userFunction();
    } catch (e) {
        errorDetected = true;
        errorMessage = e.name + ": " + e.message;
        if (e.stack) {
            errorMessage += "\n" + e.stack.split("\n").slice(0, 3).join("\n");
        }
        capturedLogs.push({ type: "error", message: `実行時エラー: ${errorMessage}` });
    } finally {
        consoleMethods.forEach(method => {
            console[method] = originalConsole[method];
        });

        const actualOutputString = capturedLogs.map(log => `[${log.type.toUpperCase()}] ${log.message}`).join("\n");
        outputArea.textContent = actualOutputString.trim() || "（コンソール出力なし）";

        if (errorDetected || capturedLogs.some(log => log.type === "error")) {
            outputArea.classList.remove("text-green-400");
            outputArea.classList.add("text-red-400");
        } else {
            outputArea.classList.remove("text-red-400");
            outputArea.classList.add("text-green-400");
        }
    }

    const normalizeOutput = str => str.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    const normalizedTargetOutput = normalizeOutput(currentTargetOutput);
    const actualConsoleLogsOnly = capturedLogs
        .filter(log => log.type === "log")
        .map(log => log.message)
        .join("\n");
    const normalizedActualConsoleLogs = normalizeOutput(actualConsoleLogsOnly);

    let correctStringPrinted = false;
    if (!capturedLogs.some(log => log.type === "error")) {
        correctStringPrinted = normalizedTargetOutput === normalizedActualConsoleLogs;
    }

    // 正誤判定を表示（一旦不使用）
    const judgementHTML = correctStringPrinted
        ? `<p class="text-green-700 font-bold mb-2">⭕️ 正しく実行できました！</p>`
        : `<p class="text-red-700 font-bold mb-2">❌ 期待される出力と異なります。</p>`;
    // ヒント生成中の表示
    hintArea.innerHTML = `${judgementHTML}<p class="text-gray-600">ヒントを生成中...</p>`;

    const challengeDescription = `${currentProblemDescription}\n目標出力 (コンソールログ):\n\`\`\`\n${currentTargetOutput}\n\`\`\``;
    let situationSummary = "";

    if (capturedLogs.some(log => log.type === "error")) {
        const firstError = capturedLogs.find(log => log.type === "error");
        situationSummary = `コードにエラーがあります: ${firstError.message.split("\n")[0]}`;
    } else if (correctStringPrinted) {
        situationSummary = "コードは正しく、期待されるコンソール出力が得られました。";
    } else {
        situationSummary = `コンソール出力が期待されるものと異なります。\n` +
            `期待される出力:\n\`\`\`\n${normalizedTargetOutput}\n\`\`\`\n` +
            `実際の出力 (logのみ):\n\`\`\`\n${normalizedActualConsoleLogs}\n\`\`\``;
    }


//はなちゃんが変えるところはここかな    
    const promptText = `
あなたは子供向けのプログラミングチューターです。以下の情報に基づいて、JavaScriptの課題に取り組んでいる子供に、**具体的で明確なヒント**を提供してください。答えを直接教えるのではなく、子供が**次の一歩**を踏み出せるように優しく導いてください。

**課題:** ${challengeDescription}

**子供の書いたコード:**
\`\`\`javascript
${code}
\`\`\`

**コードの実行結果 (全コンソールログ):**
\`\`\`
${outputArea.textContent}
\`\`\`

**エラーの有無:** ${capturedLogs.some(log => log.type === "error") ? "あり" : "なし"}
${capturedLogs.some(log => log.type === "error") ? `**エラーメッセージの抜粋:** ${(capturedLogs.find(log => log.type === "error") || { message: errorMessage }).message.split("\n")[0]}` : ""}

**現在の状況:**
${situationSummary}

特に、JavaScriptの基本的な文法（変数、データ型、演算子、\`console.log()\`関数、\`if\`文、\`for\`ループ、配列、関数定義など）に焦点を当ててヒントを生成してください。子供が次に何をすべきか、優しくヒントを教えてください。
`;

    // GPT に問い合わせてヒントを取得
    const generatedHint = await fetchGPTHint(promptText);

    // 判定とヒントを両方表示
    const colouredHint = correctStringPrinted
        ? generatedHint.replace(/\n/g, "<br>")
        : generatedHint.replace(/\n/g, "<br>");
    hintArea.innerHTML = `${judgementHTML}<p>${colouredHint}</p>`;

    if (correctStringPrinted) {
        hintArea.classList.remove("text-yellow-800", "border-yellow-200", "bg-yellow-50");
        hintArea.classList.add("text-green-700", "bg-green-50", "border-green-200");
    } else {
        hintArea.classList.remove("text-green-700", "bg-green-50", "border-green-200");
        hintArea.classList.add("text-yellow-800", "bg-yellow-50", "border-yellow-200");
    }
}