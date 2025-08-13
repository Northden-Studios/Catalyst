const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Import the warnings map from warn.js
const { warnings } = require('./warn.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warnings')
        .setDescription('View warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check warnings for')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const target = interaction.options.getUser('user');
            
            const guildWarnings = warnings.get(interaction.guild.id) || new Map();
            const userWarnings = guildWarnings.get(target.id) || [];
            
            if (userWarnings.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ No Warnings')
                    .setDescription(`${target.tag} has no warnings.`)
                    .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
                
                return interaction.editReply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle(`⚠️ Warnings for ${target.tag}`)
                .setDescription(`Total warnings: **${userWarnings.length}**`)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            
            // Show last 10 warnings to avoid embed limits
            const recentWarnings = userWarnings.slice(-10);
            
            for (const warning of recentWarnings) {
                const moderator = await interaction.client.users.fetch(warning.moderatorId).catch(() => null);
                const date = `<t:${Math.floor(warning.timestamp / 1000)}:R>`;
                
                embed.addFields({
                    name: `Warning ${warning.id}`,
                    value: `**Reason:** ${warning.reason}\n**Moderator:** ${moderator?.tag || 'Unknown'}\n**Date:** ${date}`,
                    inline: false
                });
            }
            
            if (userWarnings.length > 10) {
                embed.setFooter({ text: `Showing last 10 of ${userWarnings.length} warnings • Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() });
            }
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in warnings command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while fetching warnings!');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    }
};