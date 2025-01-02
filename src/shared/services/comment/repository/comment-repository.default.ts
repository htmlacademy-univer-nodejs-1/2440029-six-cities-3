import 'reflect-metadata';
import { DocumentType, types } from '@typegoose/typegoose';
import { inject, injectable } from 'inversify';
import { DIName } from '../../../libs/di/di.enum.js';
import { Logger } from '../../../libs/logging/logger.interface.js';
import { CommentRepository } from './comment-repository.interface.js';
import { CommentEntity } from '../enteties.js';
import { OfferEntity } from '../../offer/enteties.js';
import { CreateCommentDto } from '../dto.js';
import { Types } from 'mongoose';


@injectable()
export class DefaultCommentRepository implements CommentRepository {
  constructor(
    @inject(DIName.Logger) private readonly logger: Logger,
    @inject(DIName.CommentModel) private readonly commentModel: types.ModelType<CommentEntity>,
    @inject(DIName.OfferModel) private readonly offerModel: types.ModelType<OfferEntity>
  ) {}

  public async doesIdExist(id: Types.ObjectId): Promise<boolean> {
    const result = await this.commentModel.findById(id);
    return Boolean(result);
  }

  public async create(dto: CreateCommentDto): Promise<DocumentType<CommentEntity>> {
    const result = await this.commentModel.create(dto);

    const aggregation = await this.commentModel.aggregate([{'$match': {offerId: String(dto.offerId)}}, {'$group': {_id: null, count: {'$sum': 1}, average: {'$avg': '$rating'}}}]).exec();
    await this.offerModel.findByIdAndUpdate(dto.offerId, {commentCount: aggregation[0].count, rating: aggregation[0].average}).exec();

    this.logger.info(`Created comment ${result._id}`);

    return result;
  }

  public async findByOffer(offerId: Types.ObjectId, limit: number, offset: number): Promise<DocumentType<CommentEntity>[]> {
    return await this.commentModel.find({offerId: {$eq: offerId}}).sort({ createdAt: -1 }).populate('authorId').skip(offset).limit(limit).exec();
  }
}
