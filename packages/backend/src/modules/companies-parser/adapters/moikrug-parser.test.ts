import { MoikrugParser } from "./moikrug-parser"
import cheerio from "cheerio"
import axios from "axios"

describe("Moikrug Parser", function () {
  let service: MoikrugParser
  const rootPage = "https://career.habr.com"

  beforeEach(() => {
    service = new MoikrugParser(rootPage, axios, cheerio)
  })

  describe("getCompaniesListCards method", function () {
    it("should return more than 1 company", async function () {
      const url = service.getNextPage(0)
      const companies = await service.getCompaniesListCards(url)
      expect(companies.length).toBeGreaterThan(1)
    })
  })

  describe("getCompanyData method", function () {
    it("should return company data", async function () {
      const companyList = { slug: "/companies/mailrugroup" }
      const companyData = await service.getCompanyData(companyList)
      expect(companyData.name).toBe("Mail.ru Group4.23")
    })
  })
})