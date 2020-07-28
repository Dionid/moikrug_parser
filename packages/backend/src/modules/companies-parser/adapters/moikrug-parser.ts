import {
  CompanyListCard,
  VacancyListCard,
} from "../application/commands/get-all-companies-and-target-vacancies/entities"
import { CompanyState } from "../domain/company/company.aggregate"
import { VacancyState } from "../domain/company/vacancy.entity"
import { AxiosInstance } from "axios"

export class MoikrugParser {
  constructor(
    private rootPage: string,
    private httpClient: AxiosInstance,
    private cheerio: CheerioAPI,
  ) {}

  public async getCompaniesListCards(pageUrl: string): Promise<CompanyListCard[]> {
    // . Get page by url
    const response = await this.httpClient.get(pageUrl)
    const $ = this.cheerio.load(response.data)
    const companiesEls = $(".companies-list .companies-item")
    const companiesListCard: CompanyListCard[] = []
    // . Form CompanyListCard array
    companiesEls.each(function (index, value) {
      const slug = $(value).find('a.title').attr('href') as string;
      companiesListCard.push({
        slug,
      })
    })
    // . Return CompanyListCard
    return companiesListCard
  }

  // public async getCompanyData(company: CompanyListCard): Promise<CompanyState> {
  //
  // }
  //
  // public async getVacancyListCards(vacancyPage: string): Promise<VacancyListCard[]> {
  //
  // }
  //
  // public async getVacancyState(card: VacancyListCard): Promise<VacancyState> {
  //
  // }

  public getNextPage(currentPageNumber: number): string {
    // . If exist return Page
    return this.rootPage + `/companies?page=${currentPageNumber + 1}`
  }

  public getNextVacancyPage(inactive: boolean, companySlug: string, currentPageNumber: number): string {
    return this.rootPage + `/${companySlug}/vacancies${inactive ? "/inactive" : ""}?page=${currentPageNumber + 1}`
  }
}
