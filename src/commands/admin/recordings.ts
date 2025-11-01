import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { VoiceRecordRepository } from '../../database/repositories/recordRepository.js';

const repository = new VoiceRecordRepository();

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('recordings')
    .setDescription('Lista as gravações mais recentes.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  category: 'admin',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const records = await repository.findByGuild(interaction.guild.id, 10);

    if (records.length === 0) {
      await interaction.reply({ content: 'Nenhuma gravação encontrada.', ephemeral: true });
      return;
    }

    const lines = records.map((record) => `• ${record.id} - ${record.participants.length} participantes - <t:${Math.floor(record.startedAt.getTime() / 1000)}:F>`);
    await interaction.reply({ content: `🎙️ Gravações recentes:\n${lines.join('\n')}`, ephemeral: true });
  }
};

export default command;
