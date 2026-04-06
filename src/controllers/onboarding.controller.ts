import { createClerkClient } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { db } from "../db/index.js";
import {
  clientGoals,
  clientProfiles,
  clientWorkoutTypes,
  users,
} from "../db/schema.js";
import { AuthRequest } from "../middleware/requireAuth.js";

// Clerk backend client — used to promote onboardingComplete to publicMetadata
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

// Types that mirror the OnboardingPayload in the mobile app

type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";
type Goal =
  | "lose_weight"
  | "build_muscle"
  | "improve_endurance"
  | "increase_flexibility"
  | "general_fitness"
  | "sport_performance";
type FitnessLevel = "beginner" | "intermediate" | "advanced";
type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active";
type WorkoutType =
  | "strength"
  | "cardio"
  | "hiit"
  | "yoga"
  | "pilates"
  | "crossfit"
  | "running"
  | "swimming";
type WorkoutLocation = "gym" | "home" | "both";
type PreferredTime = "morning" | "afternoon" | "evening" | "flexible";

interface OnboardingPayload {
  role: "client";
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender | null;
    heightCm: number;
    weightKg: number;
  };
  fitness: {
    goals: Goal[];
    fitnessLevel: FitnessLevel | null;
    activityLevel: ActivityLevel | null;
    workoutTypes: WorkoutType[];
    workoutLocation: WorkoutLocation | null;
  };
  schedule: {
    daysPerWeek: number;
    preferredTime: PreferredTime | null;
    sessionDurationMinutes: number;
  };
}

export async function handleClientOnboarding(
  req: Request,
  res: Response
): Promise<void> {
  const clerkUserId = (req as AuthRequest).clerkUserId;
  const body = req.body as OnboardingPayload;

  // Basic validation
  if (!body?.profile?.firstName || !body?.profile?.lastName) {
    res.status(400).json({ error: "firstName and lastName are required" });
    return;
  }
  if (!body?.fitness?.goals?.length) {
    res.status(400).json({ error: "At least one goal is required" });
    return;
  }

  // Resolve our internal user row from the Clerk ID
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUserId))
    .limit(1);

  if (!user) {
    // Webhook may not have fired yet — unlikely but handled gracefully
    res.status(404).json({ error: "User not found. Try again in a moment." });
    return;
  }

  // Guard: don't allow re-submission if already complete
  if (user.onboardingComplete) {
    res.status(409).json({ error: "Onboarding already completed" });
    return;
  }

  try {
    // Insert the client profile
    const [profile] = await db
      .insert(clientProfiles)
      .values({
        userId:                 user.id,
        firstName:              body.profile.firstName,
        lastName:               body.profile.lastName,
        dateOfBirth:            body.profile.dateOfBirth || null,
        gender:                 body.profile.gender,
        heightCm:               body.profile.heightCm ? String(body.profile.heightCm) : null,
        weightKg:               body.profile.weightKg ? String(body.profile.weightKg) : null,
        fitnessLevel:           body.fitness.fitnessLevel,
        activityLevel:          body.fitness.activityLevel,
        workoutLocation:        body.fitness.workoutLocation,
        daysPerWeek:            body.schedule.daysPerWeek,
        preferredTime:          body.schedule.preferredTime,
        sessionDurationMinutes: body.schedule.sessionDurationMinutes,
      })
      .returning();

    // Insert goals (one row per goal)
    if (body.fitness.goals.length > 0) {
      await db.insert(clientGoals).values(
        body.fitness.goals.map((goal) => ({
          clientProfileId: profile.id,
          goal,
        }))
      );
    }

    // Insert preferred workout types (one row per type)
    if (body.fitness.workoutTypes.length > 0) {
      await db.insert(clientWorkoutTypes).values(
        body.fitness.workoutTypes.map((workoutType) => ({
          clientProfileId: profile.id,
          workoutType,
        }))
      );
    }

    // Mark onboarding complete in our DB
    await db
      .update(users)
      .set({ onboardingComplete: true, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Promote to publicMetadata via Clerk backend API
    // This is what the mobile app reads on next launch for trusted role-based routing
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        role: "client",
        onboardingComplete: true,
      },
    });

    res.status(201).json({ success: true, profileId: profile.id });
  } catch (err) {
    console.error("Onboarding failed:", err);
    res.status(500).json({ error: "Failed to save onboarding data" });
  }
}
