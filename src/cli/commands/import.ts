import { TSVFileReader } from '../../shared/libs/file-reader/tsv-file-reader.js';
import { Command } from './command.interface.js';
import chalk from 'chalk';

export class ImportCommand implements Command {

  public getName = (): string => '--import';

  public execute(...parameters: string[]): void {
    const [filePath] = parameters;
    const fileReader = new TSVFileReader(filePath.trim());
    try {
      fileReader.read();
      console.log(fileReader.toArray());
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }

      console.error(chalk.red(`Can't import data from file: ${filePath}.`));
      console.error(`Details: ${error.message}`);
    }
  }
}
