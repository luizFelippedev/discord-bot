import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { VoiceRecordRepository } from '../../database/repositories/recordRepository.js';

const repository = new VoiceRecordRepository();

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('playback')
    .setDescription('Obtém o arquivo de reprodução de uma gravação.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName('id').setDescription('ID da gravação').setRequired(true)),
  category: 'admin',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Disponível apenas em servidores.', ephemeral: true });
      return;
    }

    const id = interaction.options.getString('id', true);
    const record = await repository.findById(id);

    if (!record) {
      await interaction.reply({ content: 'Gravação não encontrada.', ephemeral: true });
      return;
    }

    await interaction.reply({
      content: `🎧 Gravação disponível em: \`${record.filePath}\`\nParticipantes: ${record.participants.map((user) => `<@${user}>`).join(', ')}`
    });
  }
};

export default command;
