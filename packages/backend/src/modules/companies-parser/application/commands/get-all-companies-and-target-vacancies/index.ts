import { CommandHandler, CommandRequest } from "@dddl/core/dist/cqrs"
import { GetAllCompaniesAndTargetVacanciesCommand } from "./command"
import { EitherResultP, Result } from "@dddl/core/dist/rop"
import { Inject } from "typedi"
import { LOGGER_DI_TOKEN, Logger } from "@dddl/core/dist/logger"
import { Parser, PARSER_DI_TOKEN } from "./parser"
import { CompanyListCard } from "./entities"
import { Company } from "../../../domain/company/company.aggregate"
import { CompanyId } from "../../../domain/company/company.id"
import { v4 } from "uuid"
import { Vacancy } from "../../../domain/company/vacancy.entity"
import { VacancyId } from "../../../domain/company/vacancy.id"

export class GetAllCompaniesAndTargetVacancies
  implements CommandHandler<GetAllCompaniesAndTargetVacanciesCommand> {
  constructor(
    @Inject(LOGGER_DI_TOKEN) private logger: Logger,
    @Inject(PARSER_DI_TOKEN) private parser: Parser,
    private rootPage: string,
  ) {}

  // Vacancy
  private async processVacancyPage(page: string): Promise<Vacancy> {
    // . Get CompanyState from page
    const vacancyState = await this.parser.getVacancyState(page)
    // . Get vacancies
    return new Vacancy(new VacancyId(v4()), vacancyState)
  }

  private getNextVacancyPage(inactive: boolean, companySlug: string, currentPageNumber: number): string {
    return this.rootPage + `/${companySlug}${inactive ? "/inactive" : ""}?page=${currentPageNumber + 1}`
  }

  private async parseVacancy(
    inactive: boolean,
    companySlug: string,
    page: string,
    currentPageNumber: number,
    vacancies: Vacancy[],
  ): Promise<Vacancy[]> {
    // ProcessPage
    const vacancy = await this.processVacancyPage(page)
    vacancies.push(vacancy)

    // . Go to next page
    const nextPage = this.getNextVacancyPage(inactive, companySlug, currentPageNumber)

    // . Parse nextPage
    return this.parseVacancy(inactive, companySlug, nextPage, currentPageNumber + 1, vacancies)
  }

  private async getVacanciesByType(
    inactive: boolean,
    company: Company,
  ): Promise<Vacancy[]> {
    // . Go to vacancies list page (by type)
    return await this.parseVacancy(
      inactive,
      company.state.originId,
      this.getNextVacancyPage(inactive, company.state.originId, 0),
      1,
      [],
    )
  }

  private async getVacancies(company: Company): Promise<Vacancy[]> {
    // . Get archive / active vacancies
    const activeVacancies = await this.getVacanciesByType(false, company)
    const inactiveVacancies = await this.getVacanciesByType(true, company)
    return [...activeVacancies, ...inactiveVacancies]
  }

  // Company

  private async getNextPage(currentPageNumber: number): Promise<string> {
    // . If exist return Page
    return this.rootPage + `?page=${currentPageNumber + 1}`
  }

  private async parseCompany(companyListCard: CompanyListCard): Promise<void> {
    // . Get CompanyState from page
    const companyState = await this.parser.getCompanyData(companyListCard)

    // . Create Company aggregate and fill it
    const company = new Company(new CompanyId(v4()), companyState)

    // . Get vacancies
    const vacancies = await this.getVacancies(company)
    company.addVacancies(vacancies)

    // TODO. Save company
    // ...

    return
  }

  private async processListPage(pageUrl: string): Promise<void> {
    // . Get companies on page
    const companies: CompanyListCard[] = this.parser.getCompanies(pageUrl)
    if (companies.length === 0) {
      return
    }

    // . Loop through pageCompanies
    for (let i = 0; i < companies.length; i++) {
      await this.parseCompany(companies[i])
    }
  }

  private async parse(pageUrl: string, currentPageNumber: number): Promise<void> {
    // ProcessPage
    await this.processListPage(pageUrl)

    // . Go to next pageUrl
    const nextPage = await this.getNextPage(currentPageNumber)

    // . Parse nextPage
    return this.parse(nextPage, currentPageNumber + 1)
  }

  async handle(): EitherResultP {
    // . Start parsing
    await this.parse(this.rootPage, 1)

    // TODO. Flush repo
    // ...

    return Result.oku()
  }
}
