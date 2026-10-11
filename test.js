// test.js
// Verify that a token can be consumed only once,
// even when five consumers attempt to consume it concurrently.

import {
  issueToken,
  consumeToken,
  closeRedis
} from "./token-service.js";

async function main() {
  try {
    // Issue one token with a payload and a 60-second expiry.
    const id = await issueToken({ userId: 42 }, 60);

    console.log("issued token:", id);

    // Attempt to consume the same token concurrently five times.
    const results = await Promise.all([
      consumeToken(id),
      consumeToken(id),
      consumeToken(id),
      consumeToken(id),
      consumeToken(id)
    ]);

    // Count successful consumers.
    const winners = results.filter((result) => result.ok).length;

    console.log("winners:", winners);

    // Verify exactly one consumer succeeded.
    if (winners !== 1) {
      throw new Error(`Expected 1 winner, but got ${winners}`);
    }

    // Verify the successful result contains the expected payload.
    const successfulResult = results.find((result) => result.ok);

    if (successfulResult.payload.userId !== 42) {
      throw new Error("Unexpected token payload");
    }

    console.log("PASS: token was single-use.");
  } finally {
    await closeRedis();
  }
}

main().catch((error) => {
  console.error("FAIL:", error.message);
  process.exitCode = 1;
});