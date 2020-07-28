import { MoikrugParser } from "./moikrug-parser"
import cheerio from "cheerio"
import axios from "axios"

describe("Moikrug Parser", function() {
  let service: MoikrugParser
  const rootPage = "https://career.habr.com"

  beforeEach(() => {
    service = new MoikrugParser(rootPage, axios, cheerio)
  })

  describe("getCompaniesListCards method", function() {
    it("should return more than 1 company", async function() {
      const url = service.getNextPage(0)
      // console.log(url)
      const companies = await service.getCompaniesListCards(url)
      expect(companies.length).toBeGreaterThan(1)
    })
  })
})
