import 'reflect-metadata';
import { DocumentType, types } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { OfferRepository } from './offer-repository.interface.js';
import { inject, injectable } from 'inversify';
import { DIName } from '../../../libs/di/di.enum.js';
import { OfferEntity } from '../enteties.js';
import { Logger } from '../../../libs/logging/logger.interface.js';
import { OfferDto, CreateOrUpdateOfferDto } from '../dto.js';
import { CityType } from '../../../models/rent-offer.js';
import { CommentEntity } from '../../comment/enteties.js';

@injectable()
export class DefaultOfferRepository implements OfferRepository {
  constructor(
    @inject(DIName.Logger) private readonly logger: Logger,
    @inject(DIName.OfferModel) private readonly offerModel: types.ModelType<OfferEntity>,
    @inject(DIName.CommentModel) private readonly commentModel: types.ModelType<CommentEntity>
  ) {}

  public async doesIdExist(id: Types.ObjectId): Promise<boolean> {
    const result = await this.offerModel.findById(id);
    return Boolean(result);
  }

  public async create(dto: OfferDto): Promise<DocumentType<OfferEntity>> {
    const result = this.offerModel.create(dto);

    this.logger.info(`New offer created: ${dto.name}`);
    return result;
  }

  public async findById(id: Types.ObjectId): Promise<DocumentType<OfferEntity> | null> {
    return this.offerModel.findById(id).exec();
  }

  public async updateById(id: Types.ObjectId, dto: CreateOrUpdateOfferDto): Promise<DocumentType<OfferEntity> | null> {
    const result = await this.offerModel.findByIdAndUpdate(id, dto).exec();
    this.logger.info(`Updated offer ${id}`);
    return result;
  }

  public async deleteById(id: Types.ObjectId): Promise<void> {
    await this.offerModel.findByIdAndDelete(id).exec();
    await this.commentModel.deleteMany({ offerId: id }).exec();
    this.logger.info(`Offer deleted: ${id}`);
  }

  public async findAll(limit: number, offset: number): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel.find().sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
  }

  public async findAllPremium(city: CityType, limit: number, offset: number): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel.find({isPremium: true, city: city}).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
  }

  public async findAllFavourite(userId: Types.ObjectId, limit: number, offset: number): Promise<DocumentType<OfferEntity>[]> {
    return this.offerModel.find({favouriteUsers: {'$in': [userId]}}).sort({ createdAt: -1 }).skip(offset).limit(limit).exec();
  }

  public async addToFavourite(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    await this.offerModel.findByIdAndUpdate(orderId, {'$addToSet': {favouriteUsers: userId}}).exec();
  }

  public async removeFromFavourite(orderId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    await this.offerModel.findByIdAndUpdate(orderId, {'$pull': {favouriteUsers: userId}}).exec();
  }
}
