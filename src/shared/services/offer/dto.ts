import Joi from 'joi';
import { Types } from 'mongoose';
import { AccommodationType, CityType, ConvenienceType } from '../../models/rent-offer.js';

export class CreateOrUpdateOfferDto {
  public name!: string;
  public description!: string;
  public city!: CityType;
  public previewUrl!: string;
  public imagesUrls!: string[];
  public createdAt!: Date;
  public isPremium!: boolean;
  public accommodationType!: AccommodationType;
  public roomCount!: number;
  public guestCount!: number;
  public rentPrice!: number;
  public conveniences!: ConvenienceType[];
  public latitude!: number;
  public longitude!: number;
}

export class OfferDto extends CreateOrUpdateOfferDto {
  public authorId!: Types.ObjectId;
}

export const createOrUpdateOfferDtoSchema = Joi.object({
  name: Joi.string().min(10).max(100).required(),
  description: Joi.string().min(20).max(1024).required(),
  city: Joi.string().valid(...Object.values(CityType)).required(),
  previewUrl: Joi.string().uri().required(),
  imagesUrls: Joi.array().items(Joi.string().uri()).min(6).max(6).required(),
  isPremium: Joi.boolean().required(),
  accommodationType: Joi.string().valid(...Object.values(AccommodationType)).required(),
  roomCount: Joi.number().min(1).max(8).required(),
  guestCount: Joi.number().min(1).max(10).required(),
  rentPrice: Joi.number().min(100).max(100000).required(),
  conveniences: Joi.array().items(Joi.string().valid(...Object.values(ConvenienceType))).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required()
});
