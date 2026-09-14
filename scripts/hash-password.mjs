import crypto from "crypto";
const password = process.argv[2];
if (!password) {
  console.log("Usage: npm run hash-password -- YourPassword");
  process.exit(1);
}
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password, salt, 64);
console.log(`scrypt$${salt.toString("base64")}$${hash.toString("base64")}`);