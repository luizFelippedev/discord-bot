import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from '../../types/commands.js';
import { buildEmbed } from '../../utils/embedBuilder.js';
import { EconomyRepository } from '../../database/repositories/economyRepository.js';
import { VoiceRecordRepository } from '../../database/repositories/recordRepository.js';
import { UserRepository } from '../../database/repositories/userRepository.js';

const economyRepository = new EconomyRepository();
const voiceRecordRepository = new VoiceRecordRepository();
const userRepository = new UserRepository();

const command: SlashCommand = {
  data: new SlashCommandBuilder().setName('analytics').setDescription('Mostra analytics avançados do servidor.'),
  category: 'dashboard',
  async execute(interaction) {
    if (!interaction.guild) {
      await interaction.reply({ content: 'Este comando só pode ser usado em servidores.', ephemeral: true });
      return;
    }

    const [economyTotal, voiceRecords, topUsers] = await Promise.all([
      economyRepository.sumByType(interaction.guild.id, 'daily'),
      voiceRecordRepository.findByGuild(interaction.guild.id, 5),
      userRepository.topBy('xp', interaction.guild.id, 5)
    ]);

    const embed = buildEmbed({
      title: '📈 Analytics',
      description: 'Visão geral de métricas'
    })
      .addFields(
        { name: '💸 Total distribuído em diárias', value: `${economyTotal}`, inline: true },
        { name: '🎙️ Gravações recentes', value: `${voiceRecords.length}`, inline: true },
        { name: '🏆 Top XP', value: topUsers.map((user, index) => `**${index + 1}.** ${user.username} - ${user.xp} XP`).join('\n') || 'Sem dados' }
      )
      .setFooter({ text: 'Atualizado em tempo real' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

export default command;
