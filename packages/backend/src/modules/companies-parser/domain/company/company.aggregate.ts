import { CompanyId } from "./company.id"
import { AggregateRootWithState } from "@dddl/core/dist/domain"
import { Vacancy } from "./vacancy.entity"

export type CompanyState = {
  name: string
  logoUrl?: string
  contacts: string[]
  description?: string
  originId: string
  site?: string
  targetVacancies: Vacancy[]
}

export class Company extends AggregateRootWithState<CompanyId, CompanyState> {
  addVacancies(vacancies: Vacancy[]) {
    this.state.targetVacancies = [...this.state.targetVacancies, ...vacancies]
  }
}
