import { useState } from "react";
import "./Calculator.css";
import * as math from "mathjs";

function Calculator() {
  const [expression, setExpression] = useState("");
  const [screenVal, setScreenVal] = useState("");
  const customVariables = {};

  function handleChange(e) {
    setExpression(e.target.value);
  }

  function handleClick(input) {
    setExpression((prevExpression) => prevExpression + input);
  }

  function calculate() {
    try {
      const allVariables = {
        ...customVariables,
        pi: Math.PI,
        e: Math.E,
        fact: math.factorial,
      };

      const result = math.evaluate(expression, allVariables);
      if (typeof result === "number" && !isNaN(result)) {
        setScreenVal(Number(result));
        // .toFixed(4)
      } else {
        setScreenVal("Error: Invalid expression");
      }
    } catch (error) {
      setScreenVal("Error: Invalid expression");
    }
  }

  function clearScreen() {
    setExpression("");
    setScreenVal("");
  }

  function backspace() {
    const newExpression = expression.slice(0, -1);
    setExpression(newExpression);
  }

  return (
    <>
      <div className='calculator'>
        <div className='calc-body'>
          <div className='input-section'>
            <input
              className='calculator-screen'
              type='text'
              value={expression}
              onChange={handleChange}
            />
            <div className='output'>Result: {screenVal}</div>
          </div>
          <div className='operators calculator-button'>
            {["^", "-", "/", "sqrt(", "+", "*", "(", ")"].map((input) => (
              <button
                className={
                  (input === "+") |
                  (input === "*") |
                  (input === "-") |
                  (input === "/")
                    ? "operator-green"
                    : "operators-keys"
                }
                key={input}
                onClick={() => handleClick(input)}
              >
                {input}
              </button>
            ))}
            <button
              className='operators-keys'
              onClick={() => handleClick("pi")}
            >
              Pi
            </button>
            <button
              className='operators-keys'
              onClick={() => handleClick("fact(")}
            >
              Factorial
            </button>
            <button className='operators-keys redbg' onClick={clearScreen}>
              C
            </button>
            <button className='backspace-button redbg' onClick={backspace}>
              del
            </button>
          </div>
          <div className='calculator-buttons'>
            <div className='numeric-pad calculator-buttons'>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map(
                (input) => (
                  <button key={input} onClick={() => handleClick(input)}>
                    {input}
                  </button>
                )
              )}

              <button onClick={() => handleClick(".")}>,</button>
              <button className='equals-button' onClick={calculate}>
                =
              </button>
            </div>
          </div>
        </div>
        <div className='variables'></div>
      </div>
    </>
  );
}

export default Calculator;

//   return (
//     <div className='calculator'>
//       <input
//         type='text'
//         className='calculator-screen'
//         value={expression}
//         readOnly
//       />
//       <div className='calculator-buttons'>
//         {[
//           "7",
//           "8",
//           "9",
//           "/",
//           "4",
//           "5",
//           "6",
//           "*",
//           "1",
//           "2",
//           "3",
//           "-",
//           "0",
//           ".",
//           "+",
//           "sin",
//           "cos",
//           "tan",
//           "^",
//           "%",
//           "(",
//           ")",
//           "C",
//           "√",
//           "e",
//           "log",
//           "π",
//           "⌫",
//           "AC",
//           "=",
//         ].map((button, index) => (
//           <button
//             key={index}
//             onClick={() => handleButtonClick(button)}
//             className={`calculator-button ${button === "=" ? "equals" : ""}`}
//           >
//             {button}
//           </button>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Calculator;
