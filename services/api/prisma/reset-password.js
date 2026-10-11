require("dotenv").config();

const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const prisma = require("./client");

const MIN_PASSWORD_LENGTH = 8;

// Sets a user's password directly in the database, for when you're locked
// out locally and don't want to go through the forgot-password email.
//
//   npm run reset-password -- <email> [new-password]
//
// Leave out the password to be prompted for it instead (keeps it out of
// your shell history).
async function main() {
  let [email, password] = process.argv.slice(2);

  if (!email) {
    console.error("Usage: npm run reset-password -- <email> [new-password]");
    process.exitCode = 1;
    return;
  }

  if (!password) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    password = await rl.question("New password: ");
    rl.close();
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exitCode = 1;
    return;
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    console.error(`No user found with email ${email}.`);
    process.exitCode = 1;
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Any outstanding reset links are now stale, same as after a normal reset.
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
  ]);

  console.log(`Password updated for ${email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
