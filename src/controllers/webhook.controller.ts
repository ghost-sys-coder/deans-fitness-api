import { Request, Response } from "express";
import { Webhook } from "svix";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

// Clerk webhook payload types

interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

interface ClerkUserData {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string;
  public_metadata: {
    role?: "client" | "trainer" | "admin";
    onboardingComplete?: boolean;
  };
}

interface ClerkDeletedData {
  id: string;
  deleted: true;
}

type ClerkWebhookEvent =
  | { type: "user.created"; data: ClerkUserData }
  | { type: "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: ClerkDeletedData };

// Signature verification

function verifyWebhook(req: Request, secret: string): ClerkWebhookEvent {
  const wh = new Webhook(secret);
  return wh.verify(req.body as string, {
    "svix-id":        req.headers["svix-id"] as string,
    "svix-timestamp": req.headers["svix-timestamp"] as string,
    "svix-signature": req.headers["svix-signature"] as string,
  }) as ClerkWebhookEvent;
}

// Event handlers

async function onUserCreated(data: ClerkUserData) {
  const primaryEmail = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  );

  if (!primaryEmail) throw new Error("No primary email on user.created payload");

  await db.insert(users).values({
    clerkId:            data.id,
    email:              primaryEmail.email_address,
    role:               data.public_metadata.role ?? "client",
    onboardingComplete: data.public_metadata.onboardingComplete ?? false,
  });
}

async function onUserUpdated(data: ClerkUserData) {
  const primaryEmail = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  );

  const updates: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (primaryEmail) {
    updates.email = primaryEmail.email_address;
  }
  if (data.public_metadata.role) {
    updates.role = data.public_metadata.role;
  }
  if (data.public_metadata.onboardingComplete !== undefined) {
    updates.onboardingComplete = data.public_metadata.onboardingComplete;
  }

  await db.update(users).set(updates).where(eq(users.clerkId, data.id));
}

async function onUserDeleted(data: ClerkDeletedData) {
  await db.delete(users).where(eq(users.clerkId, data.id));
}

// Main webhook handler

export async function handleClerkWebhook(req: Request, res: Response) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  const svixId        = req.headers["svix-id"];
  const svixTimestamp = req.headers["svix-timestamp"];
  const svixSignature = req.headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  let event: ClerkWebhookEvent;

  try {
    event = verifyWebhook(req, secret);
  } catch {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  try {
    switch (event.type) {
      case "user.created":
        await onUserCreated(event.data);
        res.status(201).json({ success: true });
        break;

      case "user.updated":
        await onUserUpdated(event.data);
        res.status(200).json({ success: true });
        break;

      case "user.deleted":
        await onUserDeleted(event.data);
        res.status(200).json({ success: true });
        break;

      default:
        res.status(200).json({ received: true });
    }
  } catch (err) {
    console.error(`Webhook handler failed for event [${event.type}]:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
}
