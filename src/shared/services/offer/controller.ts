import { inject, injectable } from 'inversify';
import { ControllerBase } from '../../libs/rest/controller-base.js';
import { HttpMethod } from '../../libs/rest/http-method.enum.js';
import { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { isValidObjectId, Types } from 'mongoose';
import { StatusCodes } from 'http-status-codes';
import { DIName } from '../../libs/di/di.enum.js';
import { OfferRepository } from './repository/offer-repository.interface.js';
import { Logger } from '../../libs/logging/logger.interface.js';
import { CityType } from '../../models/rent-offer.js';
import { HttpError } from '../../libs/rest-exceptions/http-error.js';
import { OfferDto, createOrUpdateOfferDtoSchema } from './dto.js';
import { AppSchema } from '../../libs/config/app.schema.js';
import { Config } from '../../libs/config/config.interface.js';
import { AuthorizeMiddleware } from '../../libs/rest-middlewares/authorize.js';
import { ObjectExistingValidatorMiddleware } from '../../libs/rest-middlewares/object-id-validator.js';
import { SchemaValidatorMiddleware } from '../../libs/rest-middlewares/schema-validator.js';

@injectable()
export class OfferController extends ControllerBase {
  readonly prefix: string = '/offers';

  constructor(
    @inject(DIName.Logger) logger: Logger,
    @inject(DIName.OfferRepository) private offerRepository: OfferRepository,
    @inject(DIName.Config) private readonly config: Config<AppSchema>
  ) {
    super(logger);
    this.addRoute({
      path: '/premium/:city',
      httpMethod: HttpMethod.Get,
      handleAsync: this.indexPremiumForCity.bind(this)
    });

    this.addRoute({
      path: '/favourite',
      httpMethod: HttpMethod.Get,
      handleAsync: this.indexFavouriteForUser.bind(this),
      middlewares: [
        new AuthorizeMiddleware(this.config.get('JWT_SECRET'))
      ]
    });
    this.addRoute({
      path: '/favourite/:id',
      httpMethod: HttpMethod.Post,
      handleAsync: this.addToFavourite.bind(this),
      middlewares: [
        new ObjectExistingValidatorMiddleware(this.offerRepository, 'id'),
        new AuthorizeMiddleware(this.config.get('JWT_SECRET'))
      ]
    });
    this.addRoute({
      path: '/favourite/:id',
      httpMethod: HttpMethod.Delete,
      handleAsync: this.removeFromFavourite.bind(this),
      middlewares: [
        new ObjectExistingValidatorMiddleware(this.offerRepository, 'id'),
        new AuthorizeMiddleware(this.config.get('JWT_SECRET'))
      ]
    });

    this.addRoute({
      path: '/',
      httpMethod: HttpMethod.Get,
      handleAsync: this.index.bind(this)
    });
    this.addRoute({
      path: '/',
      httpMethod: HttpMethod.Post,
      handleAsync: this.create.bind(this),
      middlewares: [
        new SchemaValidatorMiddleware(createOrUpdateOfferDtoSchema),
        new AuthorizeMiddleware(this.config.get('JWT_SECRET'))
      ]
    });
    this.addRoute({
      path: '/:id',
      httpMethod: HttpMethod.Get,
      handleAsync: this.showById.bind(this),
      middlewares: [
        new ObjectExistingValidatorMiddleware(this.offerRepository, 'id')
      ]
    });
    this.addRoute({
      path: '/:id',
      httpMethod: HttpMethod.Put,
      handleAsync: this.updateById.bind(this),
      middlewares: [
        new SchemaValidatorMiddleware(createOrUpdateOfferDtoSchema),
        new ObjectExistingValidatorMiddleware(this.offerRepository, 'id'),
        new AuthorizeMiddleware(this.config.get('JWT_SECRET'))
      ]
    });
    this.addRoute({
      path: '/:id',
      httpMethod: HttpMethod.Delete,
      handleAsync: this.deleteById.bind(this),
      middlewares: [
        new ObjectExistingValidatorMiddleware(this.offerRepository, 'id'),
        new AuthorizeMiddleware(this.config.get('JWT_SECRET'))
      ]
    });
  }

  private async index(req: Request, res: Response): Promise<void> {
    const { limit, offset } = req.query;

    const defaultLimit = 20;
    const limitValue = limit ? parseInt(limit as string, 10) : defaultLimit;

    if (isNaN(limitValue)) {
      this.sendBadRequest('limit', limit);
    }

    const defaultOffset = 0;
    const skipValue = offset ? parseInt(offset as string, 10) : defaultOffset;

    if (isNaN(skipValue)) {
      this.sendBadRequest('skip', offset);
    }

    const offers = await this.offerRepository.findAll(limitValue, skipValue);
    this.ok(res, offers);
  }

  private async create(req: Request, res: Response): Promise<void> {
    const { userId } = res.locals;
    const dto = plainToInstance(OfferDto, req.body as object);
    dto.authorId = userId;
    const offer = await this.offerRepository.create(dto);
    this.created(res, offer);
  }

  private async showById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      this.sendBadRequest('id', id);
    }

    const offer = await this.offerRepository.findById(new Types.ObjectId(id));
    this.ok(res, offer);
  }

  private async updateById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      this.sendBadRequest('id', id);
    }

    const { userId } = res.locals;
    const offerId = new Types.ObjectId(id);

    const offerFromDb = await this.offerRepository.findById(offerId);

    if (offerFromDb?.authorId !== userId) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'No access to update offer');
    }

    const dto = plainToInstance(OfferDto, req.body);
    const offer = await this.offerRepository.updateById(new Types.ObjectId(id), dto);
    this.ok(res, offer);
  }

  private async deleteById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      this.sendBadRequest('id', id);
    }

    const { userId } = res.locals;
    const offerId = new Types.ObjectId(id);

    const offer = await this.offerRepository.findById(offerId);
    if (offer?.authorId !== userId) {
      throw new HttpError(StatusCodes.FORBIDDEN, 'No access to delete offer');
    }

    await this.offerRepository.deleteById(offerId);

    this.ok(res, `Offer ${id} was successfully deleted`);
  }

  private async indexPremiumForCity(req: Request, res: Response): Promise<void> {
    const { city } = req.params;

    const cityValue = city as CityType;
    if (!cityValue) {
      this.sendBadRequest('city', city);
    }

    const offsetValue = 0;
    const limitValue = 3;

    const offers = await this.offerRepository.findAllPremium(cityValue, limitValue, offsetValue);
    this.ok(res, offers);
  }

  private async indexFavouriteForUser(req: Request, res: Response): Promise<void> {
    const { limit, offset } = req.query;

    const defaultLimit = 20;
    const limitValue = limit ? parseInt(limit as string, 10) : defaultLimit;

    if (isNaN(limitValue)) {
      this.sendBadRequest('limit', limit);
    }

    const defaultOffset = 0;
    const skipValue = offset ? parseInt(offset as string, 10) : defaultOffset;

    if (isNaN(skipValue)) {
      this.sendBadRequest('skip', offset);
    }

    const { userId } = res.locals;

    const offers = await this.offerRepository.findAllFavourite(userId, limitValue, skipValue);
    this.ok(res, offers);
  }

  private async addToFavourite(req: Request, res: Response): Promise<void> {
    const { userId } = res.locals;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      this.sendBadRequest('id', id);
    }

    await this.offerRepository.addToFavourite(new Types.ObjectId(id), userId);
    this.ok(res, null);
  }

  private async removeFromFavourite(req: Request, res: Response): Promise<void> {
    const { userId } = res.locals;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      this.sendBadRequest('id', id);
    }

    await this.offerRepository.removeFromFavourite(new Types.ObjectId(id), userId);
    this.ok(res, null);
  }

  private sendBadRequest<T>(paramName: string, value: T): void {
    const error = `Wrong value for ${paramName}: ${value}`;
    throw new HttpError(StatusCodes.BAD_REQUEST, error);
  }
}
