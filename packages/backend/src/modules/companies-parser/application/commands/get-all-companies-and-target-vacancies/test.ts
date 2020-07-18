import { GetAllCompaniesAndTargetVacancies } from "./index"
import { Logger } from "@dddl/core/dist/logger"
import { Parser } from "./parser"
import { Matcher, mock, MockProxy } from "jest-mock-extended"
import { CompanyRepository } from "../../../domain/repository"
import { Company, CompanyState } from "../../../domain/company/company.aggregate"
import { CompanyListCard } from "./entities"
import { Result } from "@dddl/core/dist/rop"
import { v4 } from "uuid"
import { VacancyState } from "../../../domain/company/vacancy.entity"

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

  describe("if everything allright", function () {
    let firstCompanyState: CompanyState
    let secondCompanyState: CompanyState
    let companyListCards: CompanyListCard[]
    let firstCompanyActiveVacancyPageUrl: string
    let firstCompanyInactiveVacancyPageUrl: string
    let secondCompanyActiveVacancyPageUrl: string
    let secondCompanyInactiveVacancyPageUrl: string
    beforeEach(() => {
      // const firstCompanyId = new CompanyId(v4())
      firstCompanyState = {
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
      secondCompanyState = {
        name: "secondCompany",
        logoUrl: "",
        contacts: ["secondCompanyContact"],
        description: "secondCompany company is second",
        originId: "secondCompanyOriginId",
        site: "secondCompany.com",
        targetVacancies: [],
      }
      // const secondCompany = new Company(secondCompanyId, secondCompanyState)
      companyListCards = [
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
      parser.getCompaniesListCards
        .calledWith(rootPage)
        .mockResolvedValue(companyListCards)
      // Return 0 card on second page
      parser.getCompaniesListCards.calledWith(rootPage + "?page=2").mockResolvedValue([])
      // Return firstCompanyState on first card
      parser.getCompanyData
        .calledWith(companyListCards[0])
        .mockResolvedValue(firstCompanyState)
      // Return secondCompanyState on second card
      parser.getCompanyData
        .calledWith(companyListCards[1])
        .mockResolvedValue(secondCompanyState)
      // Get active vacancies root url for first company
      firstCompanyActiveVacancyPageUrl =
        rootPage + firstCompanyState.originId + "/vacancypage/?page=1"
      parser.getNextVacancyPage
        .calledWith(false, firstCompanyState.originId, 0)
        .mockReturnValue(firstCompanyActiveVacancyPageUrl)
      // Get inactive vacancies root url for first company
      firstCompanyInactiveVacancyPageUrl =
        rootPage + firstCompanyState.originId + "/vacancypage/inactive/?page=1"
      parser.getNextVacancyPage
        .calledWith(true, firstCompanyState.originId, 0)
        .mockReturnValue(firstCompanyInactiveVacancyPageUrl)
      // Get active vacancies root url for second company
      secondCompanyActiveVacancyPageUrl =
        rootPage + secondCompanyState.originId + "/vacancypage/?page=1"
      parser.getNextVacancyPage
        .calledWith(false, secondCompanyState.originId, 0)
        .mockReturnValue(secondCompanyActiveVacancyPageUrl)
      // Get inactive vacancies root url for second company
      secondCompanyInactiveVacancyPageUrl =
        rootPage + secondCompanyState.originId + "/vacancypage/inactive/?page=1"
      parser.getNextVacancyPage
        .calledWith(true, secondCompanyState.originId, 0)
        .mockReturnValue(secondCompanyInactiveVacancyPageUrl)
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
    })
    it("should save correct companies with no vacancies", async function () {
      // Get no active and inactive cards for first company
      parser.getVacancyListCards
        .calledWith(firstCompanyActiveVacancyPageUrl)
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
    it("should save correct companies with vacancies", async function () {
      const vacancyListCards = [
        {
          id: v4(),
        },
      ]
      const firstCompanyInactiveVacancyPageUrlPage2 =
        rootPage + firstCompanyState.originId + "/vacancypage/inactive/?page=2"
      const firstvacancyState: VacancyState = {
        name: v4(),
        originId: vacancyListCards[0].id,
        isInactive: false,
        tags: [],
        content: "Good vacancy",
      }
      parser.getVacancyListCards
        .calledWith(firstCompanyActiveVacancyPageUrl)
        .mockResolvedValue(vacancyListCards)
      parser.getVacancyState
        .calledWith(vacancyListCards[0])
        .mockResolvedValue(firstvacancyState)
      parser.getNextVacancyPage
        .calledWith(false, firstCompanyState.originId, 1)
        .mockReturnValue(firstCompanyInactiveVacancyPageUrlPage2)
      parser.getVacancyListCards
        .calledWith(firstCompanyInactiveVacancyPageUrlPage2)
        .mockResolvedValue([])
      // Repo
      companyRepository.save
        .calledWith(
          new Matcher((company) => {
            return (
              company.state.originId === firstCompanyState.originId &&
              company.state.targetVacancies.length === 1 &&
              company.state.targetVacancies[0].state.originId === firstvacancyState.originId // TODO. Add equal function
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
})
