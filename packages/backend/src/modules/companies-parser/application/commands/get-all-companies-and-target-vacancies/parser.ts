import { v4 } from "uuid"
import { CompanyListCard, VacancyListCard } from "./entities"
import { CompanyState } from "../../../domain/company/company.aggregate"
import { VacancyState } from "../../../domain/company/vacancy.entity"

export interface Parser {
  getCompaniesListCards(page: string): Promise<CompanyListCard[]>
  getCompanyData(company: CompanyListCard): Promise<CompanyState>
  getVacancyListCards(vacancyPage: string): Promise<VacancyListCard[]>
  getVacancyState(card: VacancyListCard): Promise<VacancyState>
  getNextPage(currentPageNumber: number): string
  getNextVacancyPage(
    inactive: boolean,
    companySlug: string,
    currentPageNumber: number,
  ): string
}

export const PARSER_DI_TOKEN = v4()
