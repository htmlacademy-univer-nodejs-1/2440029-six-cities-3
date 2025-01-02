import { inject, injectable } from 'inversify';
import { ControllerBase } from '../../libs/rest/controller-base.js';
import { HttpMethod } from '../../libs/rest/http-method.enum.js';
import { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { DIName } from '../../libs/di/di.enum.js';
import { Logger } from '../../libs/logging/logger.interface.js';
import { UserRepository } from './repository/user-repository.interface.js';
import { CreateUserDto, createUserDtoSchema, LoginDto, loginDtoSchema } from './dto.js';
import { SchemaValidatorMiddleware } from '../../libs/rest-middlewares/schema-validator.js';
import { UploadFileMiddleware } from '../../libs/rest-middlewares/upload-file.js';
import { Config } from '../../libs/config/config.interface.js';
import { AppSchema } from '../../libs/config/app.schema.js';
import { HttpError } from '../../libs/rest-exceptions/http-error.js';
import { StatusCodes } from 'http-status-codes';
import { getToken } from '../../helpers/jwt.js';
import { AuthorizeMiddleware, AuthorizeMiddlewareMode } from '../../libs/rest-middlewares/authorize.js';


@injectable()
export class UserController extends ControllerBase {
  readonly prefix: string = '/users';

  constructor(
    @inject(DIName.Logger) logger: Logger,
    @inject(DIName.UserRepository) private userRepository: UserRepository,
    @inject(DIName.Config) private config: Config<AppSchema>,
  ) {
    super(logger);

    this.addRoute({
      path: '/register',
      httpMethod: HttpMethod.Post,
      handleAsync: this.register.bind(this),
      middlewares: [
        new AuthorizeMiddleware(this.config.get('JWT_SECRET'), AuthorizeMiddlewareMode.Silent),
        new SchemaValidatorMiddleware(createUserDtoSchema)
      ]
    });
    this.addRoute({
      path: '/login',
      httpMethod: HttpMethod.Post,
      handleAsync: this.login.bind(this),
      middlewares: [
        new SchemaValidatorMiddleware(loginDtoSchema)
      ]
    });
    this.addRoute({
      path: '/avatar',
      httpMethod: HttpMethod.Post,
      handleAsync: this.loadAvatar.bind(this),
      middlewares: [
        new AuthorizeMiddleware(this.config.get('JWT_SECRET')),
        new UploadFileMiddleware(this.config.get('STATIC_ROOT'), 'avatar')
      ]
    });
    this.addRoute({
      path: '/check_session',
      httpMethod: HttpMethod.Get,
      handleAsync: this.getUser.bind(this),
      middlewares: [
        new AuthorizeMiddleware(this.config.get('JWT_SECRET')),
      ]
    });
  }

  private async loadAvatar(req: Request, res: Response): Promise<void> {
    const { userId } = res.locals;

    const filepath = req.file?.path;
    if (!filepath) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Avatar wasn\'t loaded');
    }

    await this.userRepository.updateAvatar(userId, filepath);
    this.created(res, { filepath });
  }

  private async register(req: Request, res: Response): Promise<void> {
    const { userId } = res.locals;
    if (userId) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'Only anonymous clients can create new users');
    }

    const dto = plainToInstance(CreateUserDto, req.body as object);

    const existedUser = await this.userRepository.findByEmail(dto.email);

    if (existedUser) {
      const error = `User with email ${dto.email} already exists`;
      throw new HttpError(StatusCodes.CONFLICT, error);
    }

    if (!dto.avatarUrl) {
      dto.avatarUrl = this.config.get('DEFAULT_AVATAR');
    }

    const user = await this.userRepository.create(dto, this.config.get('SALT'));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...restData} = user.toObject();

    this.ok(res, restData);
  }

  private async login(req: Request, res: Response): Promise<void> {
    const dto = plainToInstance(LoginDto, req.body as object);

    const user = await this.userRepository.checkPassword(dto.email, dto.password, this.config.get('SALT'));
    if (!user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Wrong credentials');
    }

    const accessToken = await getToken({ userId: user.id }, this.config.get('JWT_SECRET'));
    this.ok(res, { accessToken });
  }

  private async getUser(_req: Request, res: Response): Promise<void> {
    const { userId } = res.locals;

    const user = await this.userRepository.findById(userId);

    if (user === null) {
      this.notFound(res, `User with id ${userId} not found`);
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...restData} = user.toObject();

    this.ok(res, restData);
  }
}
