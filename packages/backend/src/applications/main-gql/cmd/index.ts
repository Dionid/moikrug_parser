import "reflect-metadata"
import { Container } from "typedi"
import * as winston from "winston"
import dotenv from "dotenv"
import { format } from "winston"
import { LOGGER_DI_TOKEN } from "@dddl/core/dist/logger"
import {
  ASYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
  EVENT_BUS_DI_TOKEN,
  EventBusProvider,
  EventBusPublisher,
  SYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
} from "@dddl/core/dist/eda"
import { CQ_BUS_DI_TOKEN } from "@dddl/core/dist/cqrs"
import { EventBusInMemoryProvider } from "@dddl/core/dist/eda-inmemory"
import { CQBus } from "@dddl/core/dist/cqrs-inmemory"
import {
  AsyncEventBusProviderSetMetaDecorator,
  AsyncEventBusProviderTransactionDecorator,
  LoggerDecorator,
  SyncEventBusProviderSetMetaDecorator,
  SyncEventBusProviderTransactionDecorator,
  ValidateRequestDecorator,
} from "@dddl/core/dist/usecase-decorators"
import { KnexTransactionDecorator } from "@dddl/knex/dist/usecase-decorators"

interface Config {
  connectionString: string
  mailgunApiKey: string
  mailgunDomain: string
  jwtGenSecret: string
  jwtExpires: string
}

async function main() {
  // ENV
  dotenv.config()

  // ENV const
  const connectionString = process.env.MAIN_DB_CONNECTION_STRING
  if (!connectionString) {
    throw new Error("Env variable 'MAIN_DB_CONNECTION_STRING' is required")
  }
  const config: Config = {
    connectionString,
  }

  // Logger
  const logger = winston.createLogger({
    format: format.combine(
      format.errors({ stack: true }),
      format.metadata(),
      format.json(),
    ),
    transports: [new winston.transports.Console()],
  })
  Container.set({ id: LOGGER_DI_TOKEN, value: logger, global: true })

  // DB
  // const pg = knex({
  //   client: "pg",
  //   connection: connectionString,
  //   searchPath: ["knex", "public"],
  //   ...knexSnakeCaseMappers(),
  // })
  // Container.set({ id: KNEX_CONNECTION_DI_TOKEN, value: pg, global: true })

  // EDA
  const syncEventBusProvider = new EventBusInMemoryProvider(true, logger)
  const asyncEventBusProvider = new EventBusInMemoryProvider(false, logger)
  Container.set([
    { id: EVENT_BUS_DI_TOKEN, type: EventBusPublisher },
    {
      id: SYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
      factory: (): EventBusProvider => syncEventBusProvider.fork(),
    },
    {
      id: ASYNC_EVENT_BUS_PROVIDER_DI_TOKEN,
      factory: (): EventBusProvider => asyncEventBusProvider.fork(),
    },
  ])

  // CQRS
  const cqBus = new CQBus(logger)
  Container.set([{ id: CQ_BUS_DI_TOKEN, value: cqBus, global: true }])

  // Repos
  // const txContainer = new TxContainer()
  // Container.set({
  //   type: TxContainer,
  //   id: TX_CONTAINER_DI_TOKEN,
  // })
  //
  // const userRepo: IUserRepository = new UserORepository(v4(), pg, txContainer)
  // Container.set({
  //   type: UserORepository,
  //   id: USER_REPOSITORY_DI_TOKEN,
  // })

  // Services
  // ...

  // UseCase Decorators
  cqBus.use(LoggerDecorator)
  cqBus.use(ValidateRequestDecorator)
  cqBus.use(AsyncEventBusProviderSetMetaDecorator)
  cqBus.use(AsyncEventBusProviderTransactionDecorator)
  cqBus.use(KnexTransactionDecorator)
  cqBus.use(SyncEventBusProviderSetMetaDecorator)
  cqBus.use(SyncEventBusProviderTransactionDecorator)

  // UseCases
  cqBus.subscribe(RegisterUserPasswordlessCommand, RegisterUserPasswordless)
}

main()
