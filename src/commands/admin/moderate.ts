import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { GuildRepository } from '../../database/repositories/guildRepository.js';

const repository = new GuildRepository();

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('moderate')
    .setDescription('Configura o sistema de moderação automática.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Ativa ou desativa um módulo de moderação.')
        .addStringOption((option) =>
          option
            .setName('módulo')
            .setDescription('Módulo para ativar/desativar')
            .setRequired(true)
            .addChoices(
              { name: 'Anti-spam', value: 'antiSpam' },
              { name: 'Anti-links', value: 'antiLinks' },
              { name: 'Anti-caps', value: 'antiCaps' },
              { name: 'Filtro de palavrões', value: 'profanityFilter' }
            )
        )
        .addBooleanOption((option) => option.setName('ativo').setDescription('Ativado?').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('setchannel')
        .setDescription('Define o canal de logs de moderação.')
        .addChannelOption((option) => option.setName('canal').setDescription('Canal de logs').setRequired(true))
    ),
  category: 'admin',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Comando disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand();
    const guildConfig = await repository.findOrCreate(interaction.guild.id, {
      name: interaction.guild.name,
      ownerId: interaction.guild.ownerId ?? '0'
    });

    if (sub === 'toggle') {
      const moduleKey = interaction.options.getString('módulo', true) as keyof typeof guildConfig.config.moderation;
      const active = interaction.options.getBoolean('ativo', true);
      guildConfig.config.moderation[moduleKey] = active;
      await guildConfig.save();
      await interaction.reply({ content: `🔧 Módulo **${moduleKey}** agora está ${active ? 'ativado' : 'desativado'}.`, ephemeral: true });
      return;
    }

    if (sub === 'setchannel') {
      const channel = interaction.options.getChannel('canal', true);
      guildConfig.config.logChannel = channel.id;
      await guildConfig.save();
      await interaction.reply({ content: `📝 Canal de logs definido para ${channel}.`, ephemeral: true });
    }
  }
};

export default command;
