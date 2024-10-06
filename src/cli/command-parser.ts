type ParserCommand = Record<string, string[]>;

export class CommandParser {
  static parse(cliArguments: string[]): ParserCommand {
    const parserCommand: ParserCommand = {};
    let currentCommand = '';

    for (const argument of cliArguments) {
      if (argument.startsWith('--')) {
        parserCommand[argument] = [];
        currentCommand = argument;
      } else if (currentCommand && argument) {
        parserCommand[currentCommand].push(argument);
      }
    }

    return parserCommand;
  }
}
