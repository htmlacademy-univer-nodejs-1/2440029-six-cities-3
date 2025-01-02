import { getErrorMessage } from '../../shared/helpers/random.js';
import { DBClient } from '../../shared/libs/db/db-client.interface.js';
import { MongoDatabaseClient } from '../../shared/libs/db/mongo.db-client.js';
import { TsvFileReader } from '../../shared/libs/file-reader/tsv-file-reader.js';
import { ConsoleLogger } from '../../shared/libs/logging/console.logger.js';
import { Logger } from '../../shared/libs/logging/logger.interface.js';
import { OfferTsvParser } from '../../shared/libs/offer/offer-tsv-parser.js';
import { RentOffer } from '../../shared/models/rent-offer.js';
import { DefaultOfferRepository } from '../../shared/services/offer/repository/offer-repository.default.js';
import { OfferModel } from '../../shared/services/offer/enteties.js';
import { OfferRepository } from '../../shared/services/offer/repository/offer-repository.interface.js';
import { DefaultUserRepository } from '../../shared/services/user/repository/user-repository.default.js';
import { UserModel } from '../../shared/services/user/enteties.js';
import { UserRepository } from '../../shared/services/user/repository/user-repository.interface.js';
import { Command } from './command.interface.js';
import { CommentModel } from '../../shared/services/comment/enteties.js';


export class ImportCommand implements Command {
  private readonly userRepository: UserRepository;
  private readonly offerRepository: OfferRepository;
  private readonly dbClient: DBClient;
  private readonly logger: Logger;
  private readonly parser: OfferTsvParser = new OfferTsvParser();

  constructor() {
    this.onImportedLine = this.onImportedLine.bind(this);
    this.onCompleteImport = this.onCompleteImport.bind(this);
    this.logger = new ConsoleLogger();
    this.offerRepository = new DefaultOfferRepository(this.logger, OfferModel, CommentModel);
    this.userRepository = new DefaultUserRepository(this.logger, UserModel);
    this.dbClient = new MongoDatabaseClient(this.logger);
  }

  public getName = (): string => '--import';

  public async execute(filename: string, databaseConnectionUri: string, salt: string): Promise<void> {

    await this.dbClient.connect(databaseConnectionUri);
    const reader = new TsvFileReader(filename.trim());

    reader.on(
      'readline',
      (importedLine: string, resolve: () => void) => this.onImportedLine(salt, importedLine, resolve)
    );
    reader.on('end', this.onCompleteImport);

    try {
      await reader.read();
    } catch (error: unknown) {
      console.error(`Error while importing data from ${filename}: ${getErrorMessage(error)}`);
    }
  }

  private async onImportedLine(salt: string, importedLine: string, resolve: () => void): Promise<void> {
    const offer = this.parser.parse(importedLine);
    await this.saveOffer(offer, salt);
    resolve();
  }

  private onCompleteImport(importedRowCount: number) {
    console.log(`Imported ${importedRowCount} rows`);
    this.dbClient.disconnect();
  }

  private async saveOffer(offer: RentOffer, salt: string) {
    let user = await this.userRepository.findByEmail(offer.author.email);

    if (user === null) {
      user = await this.userRepository.create(offer.author, salt);
    }

    await this.offerRepository.create({
      ...offer,
      authorId: user.id,
    });
  }
}
