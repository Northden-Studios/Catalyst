const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Import the warnings map from warn.js
const { warnings } = require('./warn.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearwarnings')
        .setDescription('Clear all warnings for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear warnings for')
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
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | This user has no warnings to clear!');
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }
            
            const warningCount = userWarnings.length;
            guildWarnings.set(target.id, []);
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ Warnings Cleared')
                .setDescription(`All warnings for ${target.tag} have been cleared successfully!`)
                .addFields(
                    { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Warnings Cleared', value: warningCount.toString(), inline: true },
                    { name: 'Cleared by', value: interaction.user.tag, inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Error in clearwarnings command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while clearing warnings!');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    }
};