declare module 'javascript-lp-solver' {
  export type SolverOperation = 'min' | 'max'

  export type SolverConstraint = {
    min?: number
    max?: number
  }

  export type SolverVariable = Record<string, number>

  export type SolverModel = {
    optimize: string
    opType: SolverOperation
    constraints: Record<string, SolverConstraint>
    variables: Record<string, SolverVariable>
    ints?: Record<string, 1>
    bounds?: Record<string, { min?: number; max?: number }>
  }

  export type SolveResult = {
    feasible?: boolean
    bounded?: boolean
    result?: number
    [variable: string]: unknown
  }

  export function Solve(model: SolverModel): SolveResult
}
