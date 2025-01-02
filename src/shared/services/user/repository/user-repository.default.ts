import 'reflect-metadata';
import { DocumentType, types } from '@typegoose/typegoose';
import { inject, injectable } from 'inversify';
import { ObjectId, Types } from 'mongoose';
import { DIName } from '../../../libs/di/di.enum.js';
import { UserRepository } from './user-repository.interface.js';
import { Logger } from '../../../libs/logging/logger.interface.js';
import { UserEntity } from '../enteties.js';
import { CreateUserDto } from '../dto.js';
import { generatePassword } from '../../../helpers/password.js';

@injectable()
export class DefaultUserRepository implements UserRepository {
  constructor(
    @inject(DIName.Logger) private readonly logger: Logger,
    @inject(DIName.UserModel) private readonly userModel: types.ModelType<UserEntity>
  ) {}

  public async doesIdExist(id: Types.ObjectId): Promise<boolean> {
    const result = await this.userModel.findById(id);
    return Boolean(result);
  }

  public async create(schema: CreateUserDto, salt: string): Promise<DocumentType<UserEntity>> {
    const user = new UserEntity(schema);
    user.setPassword(schema.password, salt);

    const result = this.userModel.create(user);
    this.logger.info(`New user created: ${user.email}`);

    return result;
  }

  public async findById(id: Types.ObjectId): Promise<DocumentType<UserEntity> | null> {
    return await this.userModel.findById(id).exec();
  }

  public async findByEmail(email: string): Promise<DocumentType<UserEntity> | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  public async checkPassword(email: string, password: string, salt: string): Promise<DocumentType<UserEntity> | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    const currentHash = generatePassword(password, salt);
    const hashFromDb = user.getPassword();

    if (currentHash !== hashFromDb) {
      return null;
    }

    return user;
  }

  public async updateAvatar(id: ObjectId, avatarPath: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { avatarUrl: avatarPath }).exec();
  }
}
