import { defineRelations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const weightUnitEnum = pgEnum('weight_unit', ['kg', 'lb']);
export const setTypeEnum = pgEnum('set_type', ['warmup', 'working']);
export const muscleGroupEnum = pgEnum('muscle_group', [
  'chest',
  'back',
  'shoulders',
  'legs',
  'arms',
  'core',
  'other',
]);

/** Exercise catalog. A null `userId` marks a built-in exercise shared by everyone. */
export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id'),
    name: text('name').notNull(),
    muscleGroup: muscleGroupEnum('muscle_group'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Partial indexes: a plain unique on (user_id, name) would not dedupe the
    // global rows, because Postgres treats NULLs as distinct from each other.
    uniqueIndex('exercises_global_name_idx')
      .on(t.name)
      .where(sql`${t.userId} is null`),
    uniqueIndex('exercises_user_name_idx')
      .on(t.userId, t.name)
      .where(sql`${t.userId} is not null`),
  ],
);

/** A training session. `completedAt` stays null while the workout is in progress. */
export const workouts = pgTable(
  'workouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    title: text('title'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('workouts_user_started_idx').on(t.userId, t.startedAt.desc())],
);

/**
 * One exercise as performed within one workout.
 *
 * Intentionally not unique on (workoutId, exerciseId): the same lift can appear
 * twice in a session, such as bench press opening the workout and returning as a burnout.
 */
export const workoutExercises = pgTable(
  'workout_exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workoutId: uuid('workout_id')
      .notNull()
      .references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    notes: text('notes'),
  },
  (t) => [
    index('workout_exercises_workout_position_idx').on(t.workoutId, t.position),
  ],
);

/**
 * A single set.
 *
 * `weightKg` is always kilograms so aggregates never convert per row; `unit`
 * records what the lifter actually typed so it can be displayed back unchanged.
 * A scale of 3 is required for that: at scale 2, 135 lb round-trips to 134.99.
 * A weight of 0 means bodyweight.
 */
export const sets = pgTable(
  'sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workoutExerciseId: uuid('workout_exercise_id')
      .notNull()
      .references(() => workoutExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    weightKg: numeric('weight_kg', { precision: 8, scale: 3 }).notNull(),
    unit: weightUnitEnum('unit').notNull().default('kg'),
    reps: integer('reps').notNull(),
    setType: setTypeEnum('set_type').notNull().default('working'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('sets_workout_exercise_position_idx').on(
      t.workoutExerciseId,
      t.position,
    ),
    check('sets_reps_non_negative', sql`${t.reps} >= 0`),
    check('sets_weight_non_negative', sql`${t.weightKg} >= 0`),
  ],
);

const schema = { exercises, workouts, workoutExercises, sets };

export const relations = defineRelations(schema, (r) => ({
  workouts: { entries: r.many.workoutExercises() },
  exercises: { entries: r.many.workoutExercises() },
  workoutExercises: {
    workout: r.one.workouts({
      from: r.workoutExercises.workoutId,
      to: r.workouts.id,
    }),
    exercise: r.one.exercises({
      from: r.workoutExercises.exerciseId,
      to: r.exercises.id,
    }),
    sets: r.many.sets(),
  },
  sets: {
    entry: r.one.workoutExercises({
      from: r.sets.workoutExerciseId,
      to: r.workoutExercises.id,
    }),
  },
}));

export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type WorkoutExercise = typeof workoutExercises.$inferSelect;
export type NewWorkoutExercise = typeof workoutExercises.$inferInsert;
// Named WorkoutSet, not Set, so importers do not shadow the built-in Set.
export type WorkoutSet = typeof sets.$inferSelect;
export type NewWorkoutSet = typeof sets.$inferInsert;
