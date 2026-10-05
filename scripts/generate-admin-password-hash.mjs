import { scrypt, randomBytes } from "node:crypto";
import { StringDecoder } from "node:string_decoder";

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
  throw new Error("Run this command in an interactive terminal.");
}

const decoder = new StringDecoder("utf8");
let password = "";
let finished = false;

process.stdout.write("Enter the administrator password (input is hidden): ");
process.stdin.setRawMode(true);
process.stdin.resume();

const passwordInput = new Promise((resolve, reject) => {
  process.stdin.on("data", (chunk) => {
    const input = decoder.write(chunk);

    for (const character of input) {
      if (character === "\u0003") {
        reject(new Error("Password generation cancelled."));
        return;
      }

      if (character === "\r" || character === "\n") {
        finished = true;
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write("\n");
        resolve(password);
        return;
      }

      if (character === "\u007f" || character === "\b") {
        password = Array.from(password).slice(0, -1).join("");
      } else {
        password += character;
      }
    }
  });
});

try {
  const enteredPassword = await passwordInput;

  if (typeof enteredPassword !== "string" || enteredPassword.length < 12) {
    throw new Error("Use an administrator password with at least 12 characters.");
  }

  const salt = randomBytes(16);
  const hash = await new Promise((resolve, reject) => {
    scrypt(enteredPassword, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });

  process.stdout.write(
    `ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}\n`,
  );
} finally {
  if (!finished && process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }
}
