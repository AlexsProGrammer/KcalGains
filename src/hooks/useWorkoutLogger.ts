import { useEffect, useState } from 'react'
import { WorkoutLogSchema } from '@/schemas/workout.schema'
import { saveWorkoutLog } from '@/db/workoutRepository'
import type { ExerciseSet, LoggedExercise, WorkoutLog } from '@/types'

const storageKey = 'kcalgains-active-workout'

type WorkoutState = { workout: WorkoutLog; restSeconds: number }

function newWorkout(): WorkoutLog {
  return WorkoutLogSchema.parse({ id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), startTime: new Date(), title: 'Workout', exercises: [] })
}

function loadWorkout(): WorkoutLog {
  if (typeof localStorage === 'undefined') return newWorkout()
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? WorkoutLogSchema.parse(JSON.parse(saved)) : newWorkout()
  } catch {
    return newWorkout()
  }
}

export function useWorkoutLogger() {
  const [workout, setWorkout] = useState<WorkoutLog>(loadWorkout)
  const [restSeconds, setRestSeconds] = useState(0)

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey || !event.newValue) return
      try {
        const parsed = WorkoutLogSchema.parse(JSON.parse(event.newValue))
        setWorkout(parsed)
      } catch {
        // ignore corrupt saved state and keep the current value
      }
    }

    const handleWorkoutSync = (event: Event) => {
      const customEvent = event as CustomEvent<WorkoutLog>
      if (!customEvent.detail) return
      setWorkout(WorkoutLogSchema.parse(customEvent.detail))
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener('kcalgains-workout-sync', handleWorkoutSync)

    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('kcalgains-workout-sync', handleWorkoutSync)
    }
  }, [])

  function emitWorkout(nextWorkout: WorkoutLog) {
    const normalized = WorkoutLogSchema.parse(nextWorkout)
    setWorkout(normalized)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(normalized))
      window.dispatchEvent(new CustomEvent<WorkoutLog>('kcalgains-workout-sync', { detail: normalized }))
    }
    return normalized
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(storageKey, JSON.stringify(workout))
  }, [workout])

  useEffect(() => {
    if (restSeconds <= 0) return
    const timer = window.setInterval(() => setRestSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [restSeconds])

  function updateWorkout(updates: Partial<WorkoutLog>) {
    setWorkout((current) => {
      const next = WorkoutLogSchema.parse({ ...current, ...updates })
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(next))
        window.dispatchEvent(new CustomEvent<WorkoutLog>('kcalgains-workout-sync', { detail: next }))
      }
      return next
    })
  }

  function appendExercises(exercises: LoggedExercise[]): WorkoutLog {
    let nextWorkout: WorkoutLog | null = null
    setWorkout((current) => {
      const merged = [...current.exercises]
      for (const exercise of exercises) {
        const index = merged.findIndex((item) => item.exerciseId === exercise.exerciseId)
        if (index >= 0) {
          merged[index] = {
            ...merged[index],
            notes: exercise.notes ?? merged[index].notes,
            sets: [...merged[index].sets, ...exercise.sets],
          }
        } else {
          merged.push(exercise)
        }
      }

      nextWorkout = WorkoutLogSchema.parse({ ...current, exercises: merged })
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(nextWorkout))
        window.dispatchEvent(new CustomEvent<WorkoutLog>('kcalgains-workout-sync', { detail: nextWorkout }))
      }
      return nextWorkout
    })
    return nextWorkout ?? workout
  }

  function addExercise(exerciseId: string, exerciseName: string): void {
    const exercise: LoggedExercise = { exerciseId, exerciseName, sets: [], notes: undefined }
    updateWorkout({ exercises: [...workout.exercises, exercise] })
  }

  function removeExercise(exerciseId: string): void {
    updateWorkout({ exercises: workout.exercises.filter((exercise) => exercise.exerciseId !== exerciseId) })
  }

  function addSet(exerciseId: string, set?: Partial<ExerciseSet>): void {
    const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId)
    if (!exercise) return
    const nextSet: ExerciseSet = { setId: crypto.randomUUID(), setNumber: exercise.sets.length + 1, type: 'normal', weightKg: 0, reps: 0, isCompleted: false, ...set }
    updateWorkout({ exercises: workout.exercises.map((item) => item.exerciseId === exerciseId ? { ...item, sets: [...item.sets, nextSet] } : item) })
  }

  function updateSet(exerciseId: string, setId: string, updates: Partial<ExerciseSet>): void {
    updateWorkout({ exercises: workout.exercises.map((exercise) => exercise.exerciseId === exerciseId ? { ...exercise, sets: exercise.sets.map((set) => set.setId === setId ? { ...set, ...updates } : set) } : exercise) })
  }

  function removeSet(exerciseId: string, setId: string): void {
    updateWorkout({ exercises: workout.exercises.map((exercise) => exercise.exerciseId === exerciseId ? { ...exercise, sets: exercise.sets.filter((set) => set.setId !== setId) } : exercise) })
  }

  function toggleSetCompleted(exerciseId: string, setId: string, restDuration = 90): void {
    const exercise = workout.exercises.find((item) => item.exerciseId === exerciseId)
    const set = exercise?.sets.find((item) => item.setId === setId)
    if (!set) return
    updateSet(exerciseId, setId, { isCompleted: !set.isCompleted })
    if (!set.isCompleted) setRestSeconds(restDuration)
  }

  async function finishWorkout(targetWorkout: WorkoutLog = workout): Promise<WorkoutLog> {
    const completed = WorkoutLogSchema.parse({ ...targetWorkout, endTime: new Date() })
    await saveWorkoutLog(completed)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey)
      window.dispatchEvent(new CustomEvent('kcalgains-workout-sync', { detail: newWorkout() }))
    }
    setWorkout(newWorkout())
    setRestSeconds(0)
    return completed
  }

  return { addExercise, addSet, appendExercises, finishWorkout, isResting: restSeconds > 0, removeExercise, removeSet, restSeconds, setRestSeconds, toggleSetCompleted, updateSet, updateWorkout, workout }
}
