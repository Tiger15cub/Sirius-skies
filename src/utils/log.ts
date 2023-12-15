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

export function getStatusCodeColor(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) {
    return chalk.greenBright;
  } else if (statusCode >= 400 && statusCode < 500) {
    return chalk.yellowBright;
  } else if (statusCode >= 500) {
    return chalk.redBright;
  } else {
    return chalk.whiteBright;
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

  custom(
    message: string,
    module: string,
    color: keyof Chalk,
    args?: unknown[]
  ) {
    return logMessage(message, module, color, args);
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
