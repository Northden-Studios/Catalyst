const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// In-memory storage for warnings (replace with database in production)
const warnings = new Map();

// Utility function to generate warning ID
function generateWarnId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the warning')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .setDMPermission(false),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const target = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason');
            
            const member = await interaction.guild.members.fetch(target.id).catch(() => null);
            
            if (!member) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | User not found in this server!');
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }
            
            if (member.id === interaction.user.id) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | You cannot warn yourself!');
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }
            
            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | You cannot warn this user due to role hierarchy!');
                
                return interaction.editReply({ embeds: [errorEmbed] });
            }
            
            // Generate warning ID
            const warnId = generateWarnId();
            
            // Create warning object
            const warning = {
                id: warnId,
                userId: target.id,
                guildId: interaction.guild.id,
                moderatorId: interaction.user.id,
                reason: reason,
                timestamp: Date.now()
            };
            
            // Store warning
            const guildWarnings = warnings.get(interaction.guild.id) || new Map();
            const userWarnings = guildWarnings.get(target.id) || [];
            userWarnings.push(warning);
            guildWarnings.set(target.id, userWarnings);
            warnings.set(interaction.guild.id, guildWarnings);
            
            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('⚠️ User Warned')
                .setDescription(`${target.tag} has been warned successfully!`)
                .addFields(
                    { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Warning ID', value: warnId, inline: true },
                    { name: 'Total Warnings', value: userWarnings.length.toString(), inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('⚠️ You have been warned')
                    .setDescription(`You have received a warning in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Warning ID', value: warnId, inline: true },
                        { name: 'Total Warnings', value: userWarnings.length.toString(), inline: true },
                        { name: 'Reason', value: reason, inline: false },
                        { name: 'Moderator', value: interaction.user.tag, inline: true }
                    )
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
                    .setFooter({ text: `${interaction.guild.name} • Warning System`, iconURL: interaction.guild.iconURL() })
                    .setTimestamp();
                
                await target.send({ embeds: [dmEmbed] });
            } catch (err) {
                // User has DMs disabled or blocked the bot
                const dmFailEmbed = new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('System Watcher')
                    .setDescription('⚠️ | Could not send DM to the user. They may have DMs disabled.');
                
                setTimeout(() => {
                    interaction.followUp({ embeds: [dmFailEmbed], ephemeral: true });
                }, 1000);
            }
        } catch (error) {
            console.error("Error in warn command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while executing the warn command!');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    },
    
    // Export warnings for other commands
    warnings
};