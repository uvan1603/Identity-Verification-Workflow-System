import winston from 'winston';
import config from '../config/index.js';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, ...args } = info;

    const ts = (timestamp as string).slice(0, 19).replace('T', ' ');
    return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 2) : ''}`;
  })
);

const transports = [
  // Console transport
  new winston.transports.Console(),
  // Error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // Combined logs
  new winston.transports.File({ filename: 'logs/all.log' }),
];

const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  format,
  transports,
});

export default logger;
