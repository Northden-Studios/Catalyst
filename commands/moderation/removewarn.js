const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Import the warnings map from warn.js
const { warnings } = require('./warn.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removewarn')
        .setDescription('Remove a warning by ID')
        .addStringOption(option =>
            option.setName('warning_id')
                .setDescription('The warning ID to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const warnId = interaction.options.getString('warning_id');
            
            const guildWarnings = warnings.get(interaction.guild.id) || new Map();
            let found = false;
            let targetUser = null;
            let removedWarning = null;
            
            // Find and remove the warning
            for (const [userId, userWarnings] of guildWarnings) {
                const warnIndex = userWarnings.findIndex(w => w.id === warnId);
                if (warnIndex !== -1) {
                    removedWarning = userWarnings.splice(warnIndex, 1)[0];
                    targetUser = await interaction.client.users.fetch(userId).catch(() => null);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | Warning not found!');
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Warning Removed')
                .setDescription(`Warning **${warnId}** has been successfully removed!`)
                .addFields(
                    { name: 'Warning ID', value: warnId, inline: true },
                    { name: 'User', value: targetUser?.tag || 'Unknown', inline: true },
                    { name: 'Removed by', value: interaction.user.tag, inline: true },
                    { name: 'Original Reason', value: removedWarning.reason, inline: false }
                )
                .setThumbnail(targetUser?.displayAvatarURL({ dynamic: true }) || null)
                .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in removewarn command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while removing the warning!');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    }
};