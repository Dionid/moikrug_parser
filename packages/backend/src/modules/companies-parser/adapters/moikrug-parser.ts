import {
  CompanyListCard,
  VacancyListCard,
} from "../application/commands/get-all-companies-and-target-vacancies/entities"
import { CompanyState } from "../domain/company/company.aggregate"
import { Vacancy, VacancyState } from "../domain/company/vacancy.entity"
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
      const slug = $(value).find("a.title").attr("href") as string
      companiesListCard.push({
        slug,
      })
    })
    // . Return CompanyListCard
    return companiesListCard
  }

  public async getCompanyData(company: CompanyListCard): Promise<CompanyState> {
    // . Get page by url
    const response = await this.httpClient.get(this.rootPage + company.slug)
    const $ = this.cheerio.load(response.data)
    const name = $(".company_name a").text()
    const logoUrl = $(".company_info .logo img").attr("src")
    const description = $(".about_company .description").text()
    const site = $(".company_info .company_site").text()
    const companySlugSplittedArr = company.slug.split("/")
    const originId = companySlugSplittedArr[companySlugSplittedArr.length-1]
    const contacts: string[] = []
    $(".company_info .contacts .contact").each(function(i, val) {
      const type = $(val).find(".type").text() as string
      const value = $(val).find(".value").text() as string
      contacts.push(`${type}: ${value}`)
    })

    const companyState: CompanyState = {
      name,
      logoUrl,
      description,
      originId,
      site,
      targetVacancies: [],
      contacts,
    }
    // . Return CompanyListCard
    return companyState
  }

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

  public getNextVacancyPage(
    inactive: boolean,
    companySlug: string,
    currentPageNumber: number,
  ): string {
    return (
      this.rootPage +
      `/${companySlug}/vacancies${inactive ? "/inactive" : ""}?page=${
        currentPageNumber + 1
      }`
    )
  }
}
