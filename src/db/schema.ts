import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// enums

export const roleEnum = pgEnum("role", ["client", "trainer", "admin"]);

export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "non_binary",
  "prefer_not_to_say",
]);

export const goalEnum = pgEnum("goal", [
  "lose_weight",
  "build_muscle",
  "improve_endurance",
  "increase_flexibility",
  "general_fitness",
  "sport_performance",
]);

export const fitnessLevelEnum = pgEnum("fitness_level", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const activityLevelEnum = pgEnum("activity_level", [
  "sedentary",
  "lightly_active",
  "moderately_active",
  "very_active",
]);

export const workoutTypeEnum = pgEnum("workout_type", [
  "strength",
  "cardio",
  "hiit",
  "yoga",
  "pilates",
  "crossfit",
  "running",
  "swimming",
]);

export const workoutLocationEnum = pgEnum("workout_location", [
  "gym",
  "home",
  "both",
]);

export const preferredTimeEnum = pgEnum("preferred_time", [
  "morning",
  "afternoon",
  "evening",
  "flexible",
]);

export const workoutStatusEnum = pgEnum("workout_status", [
  "pending",
  "in_progress",
  "completed",
  "skipped",
]);

export const trainerClientStatusEnum = pgEnum("trainer_client_status", [
  "pending",
  "active",
  "inactive",
]);

export const feelingEnum = pgEnum("feeling", [
  "great",
  "good",
  "okay",
  "hard",
  "terrible",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "workout_reminder",
  "workout_assigned",
  "message",
  "achievement",
  "measurement_reminder",
]);

export const exerciseCategoryEnum = pgEnum("exercise_category", [
  "strength",
  "cardio",
  "hiit",
  "yoga",
  "pilates",
  "crossfit",
  "running",
  "swimming",
  "flexibility",
  "warmup",
  "cooldown",
]);

// users

export const users = pgTable("users", {
  id:                 uuid("id").primaryKey().defaultRandom(),
  clerkId:            text("clerk_id").notNull().unique(),
  email:              text("email").notNull().unique(),
  role:               roleEnum("role").notNull().default("client"),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt:          timestamp("created_at").notNull().defaultNow(),
  updatedAt:          timestamp("updated_at").notNull().defaultNow(),
});

// client profiles

export const clientProfiles = pgTable("client_profiles", {
  id:                     uuid("id").primaryKey().defaultRandom(),
  userId:                 uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstName:              text("first_name").notNull(),
  lastName:               text("last_name").notNull(),
  dateOfBirth:            date("date_of_birth"),
  gender:                 genderEnum("gender"),
  heightCm:               numeric("height_cm", { precision: 5, scale: 1 }),
  weightKg:               numeric("weight_kg", { precision: 5, scale: 1 }),
  fitnessLevel:           fitnessLevelEnum("fitness_level"),
  activityLevel:          activityLevelEnum("activity_level"),
  workoutLocation:        workoutLocationEnum("workout_location"),
  daysPerWeek:            integer("days_per_week").default(3),
  preferredTime:          preferredTimeEnum("preferred_time"),
  sessionDurationMinutes: integer("session_duration_minutes").default(45),
  avatarUrl:              text("avatar_url"),
  createdAt:              timestamp("created_at").notNull().defaultNow(),
  updatedAt:              timestamp("updated_at").notNull().defaultNow(),
});

export const clientGoals = pgTable("client_goals", {
  id:              uuid("id").primaryKey().defaultRandom(),
  clientProfileId: uuid("client_profile_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  goal:            goalEnum("goal").notNull(),
});

export const clientWorkoutTypes = pgTable("client_workout_types", {
  id:              uuid("id").primaryKey().defaultRandom(),
  clientProfileId: uuid("client_profile_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  workoutType:     workoutTypeEnum("workout_type").notNull(),
});

// trainer profiles

export const trainerProfiles = pgTable("trainer_profiles", {
  id:                uuid("id").primaryKey().defaultRandom(),
  userId:            uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  firstName:         text("first_name").notNull(),
  lastName:          text("last_name").notNull(),
  bio:               text("bio"),
  yearsOfExperience: integer("years_of_experience"),
  avatarUrl:         text("avatar_url"),
  createdAt:         timestamp("created_at").notNull().defaultNow(),
  updatedAt:         timestamp("updated_at").notNull().defaultNow(),
});

export const trainerCertifications = pgTable("trainer_certifications", {
  id:               uuid("id").primaryKey().defaultRandom(),
  trainerProfileId: uuid("trainer_profile_id").notNull().references(() => trainerProfiles.id, { onDelete: "cascade" }),
  name:             text("name").notNull(),
  issuedBy:         text("issued_by"),
  issuedAt:         date("issued_at"),
  expiresAt:        date("expires_at"),
});

export const trainerSpecializations = pgTable("trainer_specializations", {
  id:               uuid("id").primaryKey().defaultRandom(),
  trainerProfileId: uuid("trainer_profile_id").notNull().references(() => trainerProfiles.id, { onDelete: "cascade" }),
  name:             text("name").notNull(),
});

// Trainer ↔ Client Relationship

export const trainerClients = pgTable("trainer_clients", {
  id:         uuid("id").primaryKey().defaultRandom(),
  trainerId:  uuid("trainer_id").notNull().references(() => trainerProfiles.id, { onDelete: "cascade" }),
  clientId:   uuid("client_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  status:     trainerClientStatusEnum("status").notNull().default("pending"),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  notes:      text("notes"),
});

// Exercise library

export const exercises = pgTable("exercises", {
  id:               uuid("id").primaryKey().defaultRandom(),
  name:             text("name").notNull(),
  description:      text("description"),
  category:         exerciseCategoryEnum("category").notNull(),
  primaryMuscle:    text("primary_muscle"),
  secondaryMuscles: text("secondary_muscles"),
  equipment:        text("equipment"),
  videoUrl:         text("video_url"),
  thumbnailUrl:     text("thumbnail_url"),
  createdBy:        uuid("created_by").references(() => users.id),
  isPublic:         boolean("is_public").notNull().default(true),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
});

// workout plans

export const workoutPlans = pgTable("workout_plans", {
  id:               uuid("id").primaryKey().defaultRandom(),
  trainerId:        uuid("trainer_id").notNull().references(() => trainerProfiles.id),
  name:             text("name").notNull(),
  description:      text("description"),
  goal:             goalEnum("goal"),
  difficulty:       fitnessLevelEnum("difficulty"),
  estimatedMinutes: integer("estimated_minutes"),
  isTemplate:       boolean("is_template").notNull().default(false),
  createdAt:        timestamp("created_at").notNull().defaultNow(),
  updatedAt:        timestamp("updated_at").notNull().defaultNow(),
});

export const workoutPlanExercises = pgTable("workout_plan_exercises", {
  id:              uuid("id").primaryKey().defaultRandom(),
  workoutPlanId:   uuid("workout_plan_id").notNull().references(() => workoutPlans.id, { onDelete: "cascade" }),
  exerciseId:      uuid("exercise_id").notNull().references(() => exercises.id),
  orderIndex:      integer("order_index").notNull(),
  sets:            integer("sets"),
  reps:            integer("reps"),
  durationSeconds: integer("duration_seconds"),
  restSeconds:     integer("rest_seconds").default(60),
  weightKg:        numeric("weight_kg", { precision: 5, scale: 1 }),
  notes:           text("notes"),
});

// Assigned workouts

export const assignedWorkouts = pgTable("assigned_workouts", {
  id:            uuid("id").primaryKey().defaultRandom(),
  workoutPlanId: uuid("workout_plan_id").notNull().references(() => workoutPlans.id),
  clientId:      uuid("client_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  trainerId:     uuid("trainer_id").notNull().references(() => trainerProfiles.id),
  scheduledDate: date("scheduled_date").notNull(),
  status:        workoutStatusEnum("status").notNull().default("pending"),
  assignedAt:    timestamp("assigned_at").notNull().defaultNow(),
  notes:         text("notes"),
});

// workout logs

export const workoutLogs = pgTable("workout_logs", {
  id:                uuid("id").primaryKey().defaultRandom(),
  clientId:          uuid("client_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  workoutPlanId:     uuid("workout_plan_id").references(() => workoutPlans.id),
  assignedWorkoutId: uuid("assigned_workout_id").references(() => assignedWorkouts.id),
  startedAt:         timestamp("started_at").notNull(),
  completedAt:       timestamp("completed_at"),
  durationMinutes:   integer("duration_minutes"),
  overallFeeling:    feelingEnum("overall_feeling"),
  caloriesBurned:    integer("calories_burned"),
  notes:             text("notes"),
});

export const workoutLogSets = pgTable("workout_log_sets", {
  id:              uuid("id").primaryKey().defaultRandom(),
  workoutLogId:    uuid("workout_log_id").notNull().references(() => workoutLogs.id, { onDelete: "cascade" }),
  exerciseId:      uuid("exercise_id").notNull().references(() => exercises.id),
  setNumber:       integer("set_number").notNull(),
  repsCompleted:   integer("reps_completed"),
  weightKg:        numeric("weight_kg", { precision: 5, scale: 1 }),
  durationSeconds: integer("duration_seconds"),
  distanceMeters:  numeric("distance_meters", { precision: 7, scale: 1 }),
  notes:           text("notes"),
});

// body measurements

export const bodyMeasurements = pgTable("body_measurements", {
  id:             uuid("id").primaryKey().defaultRandom(),
  clientId:       uuid("client_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  recordedAt:     timestamp("recorded_at").notNull().defaultNow(),
  weightKg:       numeric("weight_kg", { precision: 5, scale: 1 }),
  bodyFatPercent: numeric("body_fat_percent", { precision: 4, scale: 1 }),
  muscleMassKg:   numeric("muscle_mass_kg", { precision: 5, scale: 1 }),
  waistCm:        numeric("waist_cm", { precision: 4, scale: 1 }),
  hipCm:          numeric("hip_cm", { precision: 4, scale: 1 }),
  chestCm:        numeric("chest_cm", { precision: 4, scale: 1 }),
  armCm:          numeric("arm_cm", { precision: 4, scale: 1 }),
  thighCm:        numeric("thigh_cm", { precision: 4, scale: 1 }),
  notes:          text("notes"),
});

// progress photos

export const progressPhotos = pgTable("progress_photos", {
  id:       uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").notNull().references(() => clientProfiles.id, { onDelete: "cascade" }),
  url:      text("url").notNull(),
  takenAt:  timestamp("taken_at").notNull().defaultNow(),
  notes:    text("notes"),
});

// notifications

export const notifications = pgTable("notifications", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type:      notificationTypeEnum("type").notNull(),
  title:     text("title").notNull(),
  body:      text("body").notNull(),
  read:      boolean("read").notNull().default(false),
  metadata:  text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations

export const usersRelations = relations(users, ({ one }) => ({
  clientProfile:  one(clientProfiles,  { fields: [users.id], references: [clientProfiles.userId] }),
  trainerProfile: one(trainerProfiles, { fields: [users.id], references: [trainerProfiles.userId] }),
}));

export const clientProfilesRelations = relations(clientProfiles, ({ one, many }) => ({
  user:             one(users,               { fields: [clientProfiles.userId], references: [users.id] }),
  goals:            many(clientGoals),
  workoutTypes:     many(clientWorkoutTypes),
  trainerLinks:     many(trainerClients),
  assignedWorkouts: many(assignedWorkouts),
  workoutLogs:      many(workoutLogs),
  measurements:     many(bodyMeasurements),
  progressPhotos:   many(progressPhotos),
}));

export const trainerProfilesRelations = relations(trainerProfiles, ({ one, many }) => ({
  user:             one(users,                  { fields: [trainerProfiles.userId], references: [users.id] }),
  certifications:   many(trainerCertifications),
  specializations:  many(trainerSpecializations),
  clients:          many(trainerClients),
  workoutPlans:     many(workoutPlans),
  assignedWorkouts: many(assignedWorkouts),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ one, many }) => ({
  trainer:   one(trainerProfiles, { fields: [workoutPlans.trainerId], references: [trainerProfiles.id] }),
  exercises: many(workoutPlanExercises),
  assigned:  many(assignedWorkouts),
  logs:      many(workoutLogs),
}));

export const workoutLogsRelations = relations(workoutLogs, ({ one, many }) => ({
  client:          one(clientProfiles,   { fields: [workoutLogs.clientId],          references: [clientProfiles.id] }),
  workoutPlan:     one(workoutPlans,     { fields: [workoutLogs.workoutPlanId],      references: [workoutPlans.id] }),
  assignedWorkout: one(assignedWorkouts, { fields: [workoutLogs.assignedWorkoutId],  references: [assignedWorkouts.id] }),
  sets:            many(workoutLogSets),
}));
