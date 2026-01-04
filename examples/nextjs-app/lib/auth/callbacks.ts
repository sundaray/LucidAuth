import { db } from "@/db";
import { users, accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type {
  CheckCredentialUserExistsParams,
  CreateCredentialUserParams,
  CreateGoogleUserParams,
  GetCredentialUserParams,
  SendPasswordResetEmailParams,
  SendPasswordUpdateEmailParams,
  SendVerificationEmailParams,
  UpdatePasswordParams,
  CheckCredentialUserExistsReturn,
  CreateGoogleUserReturn,
  GetCredentialUserReturn,
} from "lucidauth/core/types";
import { resend } from "@/lib/resend";
import { PasswordResetTemplate } from "@/components/password-reset-template";
import { PasswordChangeConfirmationTemplate } from "@/components/password-change-confirmation-template";
import { EmailVerificationTemplate } from "@/components/email-verification-template";

export async function checkCredentialUserExists({
  email,
}: CheckCredentialUserExistsParams): Promise<CheckCredentialUserExistsReturn> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      accounts: {
        where: eq(accounts.provider, "credential"),
      },
    },
  });

  if (!user) {
    return { exists: false };
  }

  return { exists: user.accounts.length > 0 };
}

export async function createCredentialUser({
  email,
  hashedPassword,
}: CreateCredentialUserParams): Promise<void> {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  let userId: string;

  if (existingUser) {
    userId = existingUser.id;
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, userId));
  } else {
    const [newUser] = await db
      .insert(users)
      .values({ email, emailVerified: true })
      .returning();
    userId = newUser.id;
  }

  await db.insert(accounts).values({
    userId,
    provider: "credential",
    passwordHash: hashedPassword,
  });
}

export async function createGoogleUser(
  userClaims: CreateGoogleUserParams
): Promise<CreateGoogleUserReturn> {
  const existingGoogleAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.provider, "google"),
      eq(accounts.providerAccountId, userClaims.sub)
    ),
    with: { user: true },
  });

  if (existingGoogleAccount) {
    return {
      id: existingGoogleAccount.user.id,
      email: existingGoogleAccount.user.email,
      name: existingGoogleAccount.user.name,
      image: existingGoogleAccount.user.picture,
    };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, userClaims.email),
  });

  if (existingUser) {
    await db.insert(accounts).values({
      userId: existingUser.id,
      provider: "google",
      providerAccountId: userClaims.sub,
    });

    return {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      image: existingUser.picture,
    };
  }

  const [newUser] = await db
    .insert(users)
    .values({
      email: userClaims.email,
      emailVerified: userClaims.email_verified ?? false,
      name: userClaims.name ?? null,
      picture: userClaims.picture ?? null,
    })
    .returning();

  await db.insert(accounts).values({
    userId: newUser.id,
    provider: "google",
    providerAccountId: userClaims.sub,
  });

  return {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    image: newUser.picture,
  };
}

export async function getCredentialUser({
  email,
}: GetCredentialUserParams): Promise<GetCredentialUserReturn> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return null;
  }

  const credentialAccount = await db.query.accounts.findFirst({
    where: and(
      eq(accounts.userId, user.id),
      eq(accounts.provider, "credential")
    ),
  });

  if (!credentialAccount) {
    return null;
  }

  if (!credentialAccount.passwordHash) {
    return null;
  }

  return {
    email: user.email,
    name: user.name,
    image: user.picture,
    hashedPassword: credentialAccount.passwordHash,
  };
}

export async function sendPasswordResetEmail({
  email,
  url,
}: SendPasswordResetEmailParams): Promise<void> {
  await resend.emails.send({
    from: "auth@hemantasundaray.com",
    to: [email],
    subject: "Reset your password",
    react: PasswordResetTemplate({
      email,
      resetUrl: url,
    }),
  });
}

export async function sendPasswordUpdateEmail({
  email,
}: SendPasswordUpdateEmailParams): Promise<void> {
  await resend.emails.send({
    from: "auth@hemantasundaray.com",
    to: [email],
    subject: "Password changed successfully",
    react: PasswordChangeConfirmationTemplate({
      email,
    }),
  });
}

export async function sendVerificationEmail({
  email,
  url,
}: SendVerificationEmailParams): Promise<void> {
  await resend.emails.send({
    from: "auth@hemantasundaray.com",
    to: [email],
    subject: "Verify your email address",
    react: EmailVerificationTemplate({
      email,
      verificationUrl: url,
    }),
  });
}

export async function updatePassword({
  email,
  hashedPassword,
}: UpdatePasswordParams): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) return;

  // Update the password in the accounts table
  await db
    .update(accounts)
    .set({ passwordHash: hashedPassword })
    .where(
      and(eq(accounts.userId, user.id), eq(accounts.provider, "credential"))
    );
}
