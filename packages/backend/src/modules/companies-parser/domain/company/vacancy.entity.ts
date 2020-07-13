import { EntityWithState } from "@dddl/core/dist/domain"
import { VacancyId } from "./vacancy.id"

export type VacancyState = {
  name: string
  originId: string
  isInactive: boolean
  tags: string[]
  salary?: {
    from: number
    to?: number
  }
  date?: string
  city?: string
  fullTime?: boolean
  remote?: boolean
  content: string
}

export class Vacancy extends EntityWithState<VacancyId, VacancyState> {}
