import { readFileSync } from 'node:fs';
import { Command } from './command.interface.js';
import { resolve } from 'node:path';
import chalk from 'chalk';

export class VersionCommand implements Command {
  constructor(private filePath: string = './package.json') { }

  public getName = (): string => '--version';

  private readVersion(): string {
    const jsonContent = readFileSync(resolve(this.filePath), 'utf-8');
    const importedContent = JSON.parse(jsonContent);

    if (!Object.hasOwn(importedContent, 'version')) {
      throw new Error('package.json has not "version" value');
    }

    return importedContent.version;
  }

  public execute(..._parameters: string[]): void {
    try {
      const version = this.readVersion();
      console.info(version);
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw error;
      }

      console.error(chalk.red(`Failed to read version from ${this.filePath}: ${error.message}`));
    }
  }
}
