import { ApplicationCommandOptionType } from "discord.js";

export const registerData = {
  data: {
    name: "register",
    description: "Register an account.",
    options: [
      {
        name: "email",
        type: ApplicationCommandOptionType.String,
        description: "The email you want to use for your account.",
        required: true,
      },
      {
        name: "username",
        type: ApplicationCommandOptionType.String,
        description: "The username you want to use for your account.",
        required: true,
      },
      {
        name: "password",
        type: ApplicationCommandOptionType.String,
        description: "The password you want to use for your account.",
        required: true,
      },
    ],
  },
};

export const changePassword = {
  data: {
    name: "change-password",
    description: "Change your accounts password.",
    options: [
      {
        name: "password",
        type: ApplicationCommandOptionType.String,
        description: "Your new account password.",
        required: true,
      },
    ],
  },
};

export const changeUsername = {
  data: {
    name: "change-username",
    description: "Change your accounts username.",
    options: [
      {
        name: "username",
        type: ApplicationCommandOptionType.String,
        description: "Your new account username.",
        required: true,
      },
    ],
  },
};
