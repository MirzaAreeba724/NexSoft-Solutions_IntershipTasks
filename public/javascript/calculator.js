document.addEventListener("DOMContentLoaded", () => {
    const previousOperandText = document.getElementById("previous-operand");
    const currentOperandText = document.getElementById("current-operand");
    const buttonGrid = document.querySelector(".button-grid");

    let currentOperand = "0";
    let previousOperand = "";
    let operation = undefined;
    let shouldResetScreen = false;

    // --- Core Action Route Listener ---
    buttonGrid.addEventListener("click", (e) => {
        const button = e.target;

        // Safety check to ensure we clicked a button node element
        if (!button.matches("button")) return;

        const value = button.innerText;
        const action = button.dataset.action;
        const operator = button.dataset.operator;

        // Route actions depending on button type configuration keys
        if (action === "clear") {
            clearAll();
        } else if (action === "delete") {
            deleteNumber();
        } else if (action === "decimal") {
            appendDecimal();
        } else if (button.id === "equals-key") {
            compute();
            operation = undefined;
        } else if (operator) {
            chooseOperation(operator);
        } else {
            appendNumber(value);
        }

        updateDisplay();
    });

    // --- Calculator Engine Functions ---

    function clearAll() {
        currentOperand = "0";
        previousOperand = "";
        operation = undefined;
        shouldResetScreen = false;
    }

    function deleteNumber() {
        if (currentOperand === "0" || currentOperand === "Error") return;
        if (currentOperand.length === 1) {
            currentOperand = "0";
        } else {
            currentOperand = currentOperand.slice(0, -1);
        }
    }

    function appendNumber(number) {
        if (shouldResetScreen) {
            currentOperand = "";
            shouldResetScreen = false;
        }
        // Eliminate stacked double zeroes on initial display screen
        if (currentOperand === "0" && number === "0") return;
        if (currentOperand === "0") currentOperand = "";
        if (currentOperand === "Error") clearAll();

        currentOperand += number;
    }

    function appendDecimal() {
        if (shouldResetScreen) {
            currentOperand = "0.";
            shouldResetScreen = false;
            return;
        }
        if (currentOperand === "Error") clearAll();
        // Prevent stacking duplicate decimal points
        if (currentOperand.includes(".")) return;
        currentOperand += ".";
    }

    function chooseOperation(selectedOperator) {
        if (currentOperand === "Error") return;
        if (previousOperand !== "") {
            compute();
        }
        operation = selectedOperator;
        previousOperand = currentOperand;
        shouldResetScreen = true;
    }

    function compute() {
        let computation;
        const prev = parseFloat(previousOperand);
        const current = parseFloat(currentOperand);

        // Terminate computation loop early if inputs are invalid or incomplete
        if (isNaN(prev) || isNaN(current)) return;

        switch (operation) {
            case "+":
                computation = prev + current;
                break;
            case "-":
                computation = prev - current;
                break;
            case "*":
                computation = prev * current;
                break;
            case "/":
                // Core assignment rule check: Protect against division by zero errors
                if (current === 0) {
                    currentOperand = "Error";
                    previousOperand = "";
                    shouldResetScreen = true;
                    return;
                }
                computation = prev / current;
                break;
            case "%":
                computation = prev % current;
                break;
            default:
                return;
        }

        // Clean up floating point decimal precision issues (e.g. 0.1 + 0.2)
        currentOperand = parseFloat(computation.toFixed(8)).toString();
        previousOperand = "";
    }

    // --- Screen Updates Output Logic ---
    function updateDisplay() {
        currentOperandText.innerText = currentOperand;
        if (operation != null) {
            // Map raw code symbols into elegant typography representations for screen
            let displaySymbol = operation;
            if (operation === "*") displaySymbol = "×";
            if (operation === "/") displaySymbol = "÷";
            if (operation === "-") displaySymbol = "−";

            previousOperandText.innerText = `${previousOperand} ${displaySymbol}`;
        } else {
            previousOperandText.innerText = previousOperand;
        }
    }
});