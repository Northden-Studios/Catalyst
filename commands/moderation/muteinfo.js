const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('muteinfo')
        .setDescription('Check mute status of a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    async execute(interaction) {
        const target = interaction.options.getUser('user');
        
        const member = await interaction.guild.members.fetch(target.id);
        
        if (!member) {
            return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        }
        
        const embed = new EmbedBuilder()
            .setColor(member.isCommunicationDisabled() ? '#ff0000' : '#00ff00')
            .setTitle('Mute Status')
            .addFields(
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Status', value: member.isCommunicationDisabled() ? 'Muted' : 'Not Muted', inline: true }
            )
            .setTimestamp();
        
        if (member.isCommunicationDisabled()) {
            const timeoutEnd = member.communicationDisabledUntil;
            const timeRemaining = Math.ceil((timeoutEnd - Date.now()) / 1000);
            
            embed.addFields(
                { name: 'Ends At', value: `<t:${Math.floor(timeoutEnd / 1000)}:F>`, inline: true },
                { name: 'Time Remaining', value: formatDuration(timeRemaining), inline: true }
            );
        }
        
        await interaction.reply({ embeds: [embed] });
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