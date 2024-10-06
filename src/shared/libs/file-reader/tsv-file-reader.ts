import { readFileSync } from 'node:fs';
import { FileReader } from './file-reader.interface.js';

import chalk from 'chalk';
import { User } from '../../types/user.js';
import { AccommodationType, Convenience, RentOffer } from '../../types/rent-offer.js';

export class TSVFileReader implements FileReader {
  private rawData: string = '';

  constructor(
    private readonly filePath: string
  ) { }

  read(): void {
    try {
      this.rawData = readFileSync(this.filePath, { encoding: 'utf-8' });
    } catch (error: unknown) {
      console.error(chalk.red(`Failed to read file from ${this.filePath}`));
    }
  }

  public toArray(): RentOffer[] {
    if (!this.rawData) {
      throw new Error('File was not read');
    }

    return this.rawData
      .split('\n')
      .filter((row) => row.trim().length > 0)
      .map((line) => line.split('\t'))
      .map(([title, description, date, city, previewImage, images, isPremium, isFavorite, rating, type, roomCount, guestCount, rentPrice, conveniences, firstName, lastName, email, avatarPath, commentCount, coordinates]) => ({
        title,
        description,
        date: new Date(date),
        city,
        previewImage,
        images: images.split(' '),
        isPremium: Boolean(isPremium),
        isFavorite: Boolean(isFavorite),
        rating: Number.parseInt(rating, 10),
        type: type as AccommodationType,
        roomCount: Number.parseInt(roomCount, 10),
        guestCount: Number.parseInt(guestCount, 10),
        rentPrice: Number.parseInt(rentPrice, 10),
        conveniences: conveniences.split(' ')
          .map((convenience) => convenience as Convenience),
        author: {firstName, lastName, email, avatarPath} as User,
        commentCount: Number.parseInt(commentCount, 10),
        coordinates
      }));
  }

}
