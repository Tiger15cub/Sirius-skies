import chalk, { Chalk } from "chalk";

export function getMethodColor(method: string) {
  switch (method.toUpperCase()) {
    case "GET":
      return chalk.greenBright;
    case "POST":
      return chalk.blueBright;
    case "PUT":
      return chalk.yellowBright;
    case "DELETE":
      return chalk.redBright;
    default:
      return chalk.whiteBright;
  }
}

chalk.level = 3;
const pink = chalk.rgb(255, 105, 180);

export function getStatusCodeColor(statusCode: number) {
  switch (statusCode) {
    case 200:
      return pink;
    case 201:
      return chalk.greenBright;
    case 204:
      return chalk.greenBright;
    case 400:
      return chalk.yellowBright;
    case 401:
      return chalk.yellowBright;
    case 403:
      return chalk.yellowBright;
    case 404:
      return chalk.yellowBright;
    case 500:
      return chalk.redBright;
    case 501:
      return chalk.redBright;
    case 502:
      return chalk.redBright;
    default:
      return pink;
  }
}

export default {
  log(message: string, module: string, color: keyof Chalk, args?: unknown[]) {
    return logMessage(message, module, color, args);
  },

  error(message: string, module: string, args?: unknown[]) {
    return logMessage(message, module, "redBright", args);
  },

  warn(message: string, module: string, args?: unknown[]) {
    return logMessage(message, module, "yellowBright", args);
  },

  info(message: string, module: string, args?: unknown[]) {
    return logMessage(message, module, "blueBright", args);
  },

  success(message: string, module: string, args?: unknown[]) {
    return logMessage(message, module, "greenBright", args);
  },

  debug(message: string, module: string, args?: unknown[]) {
    return logMessage(message, module, "cyanBright", args);
  },

  custom(message: string, module: string, args?: unknown[]) {
    const color = chalk.hex("#FF1493");
    const timestamp = new Date().toISOString();
    const chalkColor: any = color;
    let logText = `${chalkColor.gray(timestamp)} [${chalkColor(
      module
    )}] ${message}`;

    if (args && args.length > 0) {
      logText += ` ${args.join(" ")}`;
    }

    console.log(logText);
  },
};

function logMessage(
  message: string,
  module: string,
  color: keyof Chalk,
  args?: unknown[]
) {
  const timestamp = new Date().toISOString();
  const chalkColor: any = chalk[color];
  let logText = `${chalkColor.gray(timestamp)} [${chalkColor(
    module
  )}] ${message}`;

  if (args && args.length > 0) {
    logText += ` ${args.join(" ")}`;
  }

  console.log(logText);
}
