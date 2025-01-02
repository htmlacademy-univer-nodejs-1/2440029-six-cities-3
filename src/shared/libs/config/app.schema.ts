import convict from 'convict';
import validator from 'convict-format-with-validator';

convict.addFormats(validator);

export type AppSchema = {
  PORT: number,
  DATABASE_HOST: string,
  DATABASE_PORT: string,
  DATABASE_USER: string,
  DATABASE_PASSWORD: string,
  DATABASE_NAME: string,
  STATIC_ROOT: string,
  SALT: string,
  JWT_SECRET: string,
  DEFAULT_AVATAR: string,
}

export const configAppSchema = convict<AppSchema>({
  PORT: {
    doc: 'Порт, на котором будет работать API',
    format: 'port',
    env: 'PORT',
    default: 8000
  },
  DATABASE_HOST: {
    doc: 'Database host',
    format: 'url',
    env: 'DATABASE_HOST',
    default: null
  },
  DATABASE_PORT: {
    doc: 'Database port',
    format: 'port',
    env: 'DATABASE_PORT',
    default: '27017'
  },
  DATABASE_USER: {
    doc: 'Database username',
    format: String,
    env: 'DATABASE_USER',
    default: null
  },
  DATABASE_PASSWORD: {
    doc: 'Database password',
    format: String,
    env: 'DATABASE_PASSWORD',
    default: null
  },
  DATABASE_NAME: {
    doc: 'Database name',
    format: String,
    env: 'DATABASE_NAME',
    default: 'six-cities'
  },
  STATIC_ROOT: {
    doc: 'Корень для static files',
    format: String,
    env: 'STATIC_ROOT',
    default: null
  },
  SALT: {
    doc: 'salt для надежности хранения паролей',
    format: String,
    env: 'SALT',
    default: null
  },
  JWT_SECRET: {
    doc: 'Секрет для подписания токенов',
    format: String,
    env: 'JWT_SECRET',
    default: null
  },
  DEFAULT_AVATAR: {
    doc: 'Дефолтный аватар',
    format: String,
    env: 'DEFAULT_AVATAR',
    default: null
  },
});
