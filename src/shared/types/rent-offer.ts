import { User } from './user.js';

export enum AccommodationType {
  apartment = 'Apartment',
  house = 'House',
  room = 'Room',
  hotel = 'Hotel'
}

export enum Convenience {
  Breakfast = 'Breakfast',
  AirConditioning = 'Air conditioning',
  LaptopFriendlyWorkspace = 'Laptop friendly workspace',
  BabySeat = 'Baby seat',
  Washer = 'Washer',
  Towels = 'Towels',
  Fridge = 'Fridge'
}

export type RentOffer = {
  title: string;
  description: string;
  date: Date;
  city: string;
  previewImage: string;
  images: string[];
  isPremium: boolean;
  isFavorite: boolean;
  rating: number;
  type: AccommodationType;
  roomCount: number;
  guestCount: number;
  rentPrice: number;
  conveniences: Convenience[];
  author: User;
  commentCount: number;
  coordinates: string;
}
