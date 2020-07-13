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

  private async getNextVacancyPage(currentPage: string): Promise<string> {
    // . Try to get next
    // . If doesn't exist, than exist
    // . If exist return Page
    return ""
  }

  private async parseVacancy(page: string, vacancies: Vacancy[]): Promise<Vacancy[]> {
    // ProcessPage
    const vacancy = await this.processVacancyPage(page)
    vacancies.push(vacancy)

    // . Go to next page
    const nextPage = await this.getNextVacancyPage(page)
    if (!nextPage) {
      return vacancies
    }

    // . Parse nextPage
    return this.parseVacancy(nextPage, vacancies)
  }

  private async getVacanciesByType(
    active: boolean,
    company: Company,
  ): Promise<Vacancy[]> {
    // . Go to vacancies list page (by type)
    const vancancyPageByType = ""

    return await this.parseVacancy(vancancyPageByType, [])
  }

  private async getVacancies(company: Company): Promise<Vacancy[]> {
    // . Get archive / active vacancies
    const activeVacancies = await this.getVacanciesByType(true, company)
    const inactiveVacancies = await this.getVacanciesByType(false, company)
    return [...activeVacancies, ...inactiveVacancies]
  }

  // Company

  private async getNextPage(currentPage: string): Promise<string> {
    // . Check for limit
    // . Try to get next
    // . If doesn't exist, than exist
    // . If exist return Page
    return ""
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

  private async processListPage(page: string): Promise<void> {
    // . Get companies on page
    const companies: CompanyListCard[] = this.parser.getCompanies(page)

    // . Loop through pageCompanies
    for (let i = 0; i < companies.length; i++) {
      await this.parseCompany(companies[i])
    }
  }

  private async parse(page: string): Promise<void> {
    // ProcessPage
    await this.processListPage(page)

    // . Go to next page
    const nextPage = await this.getNextPage(page)
    if (!nextPage) {
      return
    }

    // . Parse nextPage
    return this.parse(nextPage)
  }

  async handle(): EitherResultP {
    // Start parsing
    await this.parse(this.rootPage)

    return Result.oku()
  }
}
