const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Import the warnings map from warn.js
const { warnings } = require('./warn.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warninfo')
        .setDescription('Get information about a specific warning')
        .addStringOption(option =>
            option.setName('warning_id')
                .setDescription('The warning ID to lookup')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const warnId = interaction.options.getString('warning_id');
            
            const guildWarnings = warnings.get(interaction.guild.id) || new Map();
            let warning = null;
            
            // Find the warning
            for (const userWarnings of guildWarnings.values()) {
                warning = userWarnings.find(w => w.id === warnId);
                if (warning) break;
            }
            
            if (!warning) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | Warning not found!');
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }
            
            const user = await interaction.client.users.fetch(warning.userId).catch(() => null);
            const moderator = await interaction.client.users.fetch(warning.moderatorId).catch(() => null);
            
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle(`⚠️ Warning Information`)
                .setDescription(`Details for warning **${warning.id}**`)
                .addFields(
                    { name: 'Warning ID', value: warning.id, inline: true },
                    { name: 'User', value: user?.tag || 'Unknown', inline: true },
                    { name: 'Moderator', value: moderator?.tag || 'Unknown', inline: true },
                    { name: 'Date', value: `<t:${Math.floor(warning.timestamp / 1000)}:F>`, inline: true },
                    { name: 'Relative Time', value: `<t:${Math.floor(warning.timestamp / 1000)}:R>`, inline: true },
                    { name: 'Server', value: interaction.guild.name, inline: true },
                    { name: 'Reason', value: warning.reason, inline: false }
                )
                .setThumbnail(user?.displayAvatarURL({ dynamic: true }) || null)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in warninfo command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while fetching warning information!');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    }
};