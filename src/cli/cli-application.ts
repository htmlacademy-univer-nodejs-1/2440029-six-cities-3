import { CommandParser } from './command-parser.js';
import { Command } from './commands/command.interface.js';

type CommandCollection = Record<string, Command>;

export class CLIApplication {
  constructor(
    private readonly defaultCommand: string = '--help'
  ) { }

  private commands: CommandCollection = {};
  public registerCommands(commandList: Command[]): void {
    commandList.forEach((command) => {
      if (Object.hasOwn(this.commands, command.getName())) {
        throw new Error(`Command ${command.getName()} is already exist`);
      }
      this.commands[command.getName()] = command;
    });
  }

  public getCommand = (commandName: string): Command =>
    this.commands[commandName] ?? this.getDefaultCommand();


  public getDefaultCommand(): Command | never {
    if (!this.commands[this.defaultCommand]) {
      throw new Error(`The default command ${this.defaultCommand} is not register`);
    }
    return this.commands[this.defaultCommand];
  }

  public processCommand(argv: string[]): void {
    const parserCommand = CommandParser.parse(argv);
    const [commandName] = Object.keys(parserCommand);
    const command = this.getCommand(commandName);
    const commandArguments = parserCommand[commandName] ?? [];
    command.execute(...commandArguments);
  }
}
