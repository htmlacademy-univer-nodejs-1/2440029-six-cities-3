export enum UserType {
  common = 'Common',
  pro = 'Pro'
}

export type User = {
  firstName: string;
  lastName: string;
  email: string;
  avatarPath?: string;
  password?: string;
  type?: UserType;
}
