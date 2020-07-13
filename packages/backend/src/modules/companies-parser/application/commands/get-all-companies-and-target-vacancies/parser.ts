import { v4 } from "uuid"
import { CompanyListCard } from "./entities"
import { CompanyState } from "../../../domain/company/company.aggregate"
import { VacancyState } from "../../../domain/company/vacancy.entity"

export interface Parser {
  getCompanies(page: string): CompanyListCard[]
  getCompanyData(company: CompanyListCard): CompanyState
  getVacancyState(vacancyPage: string): VacancyState
}

export const PARSER_DI_TOKEN = v4()
