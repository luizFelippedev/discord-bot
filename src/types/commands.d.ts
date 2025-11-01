import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  LocaleString,
  PermissionResolvable,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder
} from 'discord.js';

export type SlashCommandData = SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;

export interface SlashCommand {
  data: SlashCommandData;
  category: string;
  cooldown?: number;
  guildOnly?: boolean;
  defaultMemberPermissions?: PermissionResolvable[];
  translations?: Partial<Record<LocaleString, string>>;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}
