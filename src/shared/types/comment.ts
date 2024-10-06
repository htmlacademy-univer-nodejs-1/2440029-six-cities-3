import { User } from './user.js';

export type Comment = {
  text: string;
  date: Date;
  rating: number;
  author: User;
}
