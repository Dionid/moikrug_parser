import { GetAllCompaniesAndTargetVacancies } from "./index"
import { Logger } from "@dddl/core/dist/logger"
import { Parser } from "./parser"
import { Matcher, mock, MockProxy } from "jest-mock-extended"
import { CompanyRepository } from "../../../domain/repository"
import { Company, CompanyState } from "../../../domain/company/company.aggregate"
import { CompanyListCard } from "./entities"
import { Result } from "@dddl/core/dist/rop"

describe("GetAllCompaniesAndTargetVacancies", function () {
  let uc: GetAllCompaniesAndTargetVacancies
  let logger: MockProxy<Logger>
  let parser: MockProxy<Parser>
  let companyRepository: MockProxy<CompanyRepository>
  const rootPage = "root-page.ru"

  beforeEach(() => {
    logger = mock<Logger>()
    parser = mock<Parser>()
    companyRepository = mock<CompanyRepository>()
    uc = new GetAllCompaniesAndTargetVacancies(logger, parser, companyRepository)
  })

  it("should save correct companies", async function () {
    // const firstCompanyId = new CompanyId(v4())
    const firstCompanyState: CompanyState = {
      name: "firstCompany",
      logoUrl: "",
      contacts: ["firstCompanyContact"],
      description: "firstCompany company is first",
      originId: "firstCompanyOriginId",
      site: "firstCompany.com",
      targetVacancies: [],
    }
    // const firstCompany = new Company(firstCompanyId, firstCompanyState)
    // const secondCompanyId = new CompanyId(v4())
    const secondCompanyState: CompanyState = {
      name: "secondCompany",
      logoUrl: "",
      contacts: ["secondCompanyContact"],
      description: "secondCompany company is second",
      originId: "secondCompanyOriginId",
      site: "secondCompany.com",
      targetVacancies: [],
    }
    // const secondCompany = new Company(secondCompanyId, secondCompanyState)
    const companyListCard: CompanyListCard[] = [
      {
        slug: firstCompanyState.originId,
      },
      {
        slug: secondCompanyState.originId,
      },
    ]
    // Check only 2 pages are trying to be proccessed
    parser.getNextPage.calledWith(0).mockReturnValue(rootPage)
    parser.getNextPage.calledWith(1).mockReturnValue(rootPage + "?page=2")
    // Return 2 card on first page
    parser.getCompaniesListCards.calledWith(rootPage).mockResolvedValue(companyListCard)
    // Return 0 card on second page
    parser.getCompaniesListCards.calledWith(rootPage + "?page=2").mockResolvedValue([])
    // Return firstCompanyState on first card
    parser.getCompanyData
      .calledWith(companyListCard[0])
      .mockResolvedValue(firstCompanyState)
    // Return secondCompanyState on second card
    parser.getCompanyData
      .calledWith(companyListCard[1])
      .mockResolvedValue(secondCompanyState)
    // Get active vacancies root url for first company
    const firstCompanyActiveVacancyPageUrl =
      rootPage + firstCompanyState.originId + "/vacancypage/?page=1"
    parser.getNextVacancyPage
      .calledWith(false, firstCompanyState.originId, 0)
      .mockReturnValue(firstCompanyActiveVacancyPageUrl)
    // Get inactive vacancies root url for first company
    const firstCompanyInactiveVacancyPageUrl =
      rootPage + firstCompanyState.originId + "/vacancypage/inactive/?page=1"
    parser.getNextVacancyPage
      .calledWith(true, firstCompanyState.originId, 0)
      .mockReturnValue(firstCompanyInactiveVacancyPageUrl)
    // Get active vacancies root url for second company
    const secondCompanyActiveVacancyPageUrl =
      rootPage + secondCompanyState.originId + "/vacancypage/?page=1"
    parser.getNextVacancyPage
      .calledWith(false, secondCompanyState.originId, 0)
      .mockReturnValue(secondCompanyActiveVacancyPageUrl)
    // Get inactive vacancies root url for second company
    const secondCompanyInactiveVacancyPageUrl =
      rootPage + secondCompanyState.originId + "/vacancypage/inactive/?page=1"
    parser.getNextVacancyPage
      .calledWith(true, secondCompanyState.originId, 0)
      .mockReturnValue(secondCompanyInactiveVacancyPageUrl)
    // Get no active and inactive cards for first company
    parser.getVacancyListCards
      .calledWith(firstCompanyActiveVacancyPageUrl)
      .mockResolvedValue([])
    // Get no active and inactive cards for first company
    parser.getVacancyListCards
      .calledWith(firstCompanyInactiveVacancyPageUrl)
      .mockResolvedValue([])
    // Get no active and inactive cards for second company
    parser.getVacancyListCards
      .calledWith(secondCompanyActiveVacancyPageUrl)
      .mockResolvedValue([])
    // Get no active and inactive cards for second company
    parser.getVacancyListCards
      .calledWith(secondCompanyInactiveVacancyPageUrl)
      .mockResolvedValue([])
    // Repo
    companyRepository.save
      .calledWith(
        new Matcher((company) => {
          return (
            company.state.originId === firstCompanyState.originId &&
            company.state.targetVacancies.length === 0
          )
        }),
      )
      .mockResolvedValue(Result.oku())
    companyRepository.save
      .calledWith(
        new Matcher((company) => {
          return (
            company.state.originId === secondCompanyState.originId &&
            company.state.targetVacancies.length === 0
          )
        }),
      )
      .mockResolvedValue(Result.oku())
    // Test
    const res = await uc.handle()
    if (res.isError()) {
      throw res.error
    }
    expect(res.value).toBeUndefined()
  })
})
