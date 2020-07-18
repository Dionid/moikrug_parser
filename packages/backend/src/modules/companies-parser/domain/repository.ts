import { Repository } from "@dddl/core/dist/dal"
import { Company } from "./company/company.aggregate"
import { v4 } from "uuid"

export interface CompanyRepository extends Repository<Company> {}

export const COMPANY_REPOSITORY_DI_TOKEN = v4()
