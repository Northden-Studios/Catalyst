const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('Mute a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to mute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Duration of the mute (e.g., 10m, 1h, 1d)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the mute')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        const duration = interaction.options.getString('duration') || '10m';
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        const member = await interaction.guild.members.fetch(target.id);
        
        if (!member) {
            return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        }
        
        if (member.id === interaction.user.id) {
            return interaction.reply({ content: 'You cannot mute yourself.', ephemeral: true });
        }
        
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({ content: 'You cannot mute this user due to role hierarchy.', ephemeral: true });
        }
        
        if (member.isCommunicationDisabled()) {
            return interaction.reply({ content: 'This user is already muted.', ephemeral: true });
        }
        
        // Parse duration
        const durationMs = parseDuration(duration);
        if (!durationMs) {
            return interaction.reply({ content: 'Invalid duration format. Use formats like: 10m, 1h, 1d', ephemeral: true });
        }
        
        const maxDuration = 28 * 24 * 60 * 60 * 1000; // 28 days in milliseconds
        if (durationMs > maxDuration) {
            return interaction.reply({ content: 'Duration cannot exceed 28 days.', ephemeral: true });
        }
        
        try {
            await member.timeout(durationMs, reason);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🔇 User Muted')
                .setDescription(`${target.tag} has been muted successfully!`)
                .addFields(
                    { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Reason', value: reason, inline: false },
                    { name: 'Moderator', value: interaction.user.tag, inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();
            
            await interaction.reply({ embeds: [embed] });
            
            // Try to DM the user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('🔇 You have been muted')
                    .setDescription(`You have received a muted in **${interaction.guild.name}**`)
                    .addFields(
                        { name: 'Server', value: interaction.guild.name, inline: true },
                        { name: 'Duration', value: duration, inline: true },
                        { name: 'Reason', value: reason, inline: false }
                    )
                    .setTimestamp();
                
                await target.send({ embeds: [dmEmbed] });
            } catch (err) {
                // User has DMs disabled or blocked the bot
            }
            
        } catch (error) {
            console.error('Error muting user:', error);
            await interaction.reply({ content: 'Failed to mute the user.', ephemeral: true });
        }
    }
};

// Utility function to parse duration strings
function parseDuration(duration) {
    const regex = /^(\d+)([smhd])$/;
    const match = duration.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 's': return value * 1000;
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}

// Utility function to format duration in seconds to readable format
function formatDuration(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;
    
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);
    
    return parts.join(' ') || '0s';
}