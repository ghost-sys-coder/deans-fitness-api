import { Request, Response } from "express";
import { Webhook } from "svix";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

interface ClerkUserCreatedEvent {
  type: "user.created";
  data: {
    id: string;                          // Clerk user ID
    email_addresses: { email_address: string; primary: boolean }[];
  };
}

export async function handleClerkWebhook(req: Request, res: Response) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;

  if (!secret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  // Verify the webhook signature using svix
  const svixId        = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing svix headers" });
    return;
  }

  let event: ClerkUserCreatedEvent;

  try {
    const wh = new Webhook(secret);
    event = wh.verify(req.body as string, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkUserCreatedEvent;
  } catch {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  // Only handle user.created events
  if (event.type !== "user.created") {
    res.status(200).json({ received: true });
    return;
  }

  const clerkId = event.data.id;
  const primaryEmail = event.data.email_addresses.find((e) => e.primary);

  if (!primaryEmail) {
    res.status(400).json({ error: "No primary email found on user" });
    return;
  }

  try {
    await db.insert(users).values({
      clerkId,
      email: primaryEmail.email_address,
      role: "client",
      onboardingComplete: false,
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Failed to insert user from webhook:", err);
    res.status(500).json({ error: "Failed to create user" });
  }
}
