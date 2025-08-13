const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Change or view the current volume')
        .addIntegerOption(option =>
            option.setName('level')
                .setDescription('Volume level (0-100)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(100)
        )
        .setDMPermission(false),
    
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const { guild, member, options } = interaction;
            const voiceChannel = member.voice.channel;
            const volumeLevel = options.getInteger('level');
            
            if (!voiceChannel) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('System Watcher')
                            .addFields({ name: '❌ | You need to be in a voice channel to use this command!', value: '\u200b', inline: true })
                    ]
                });
            }
            
            // Use the same manager as in play.js
            const manager = interaction.client.manager;
            if (!manager) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('System Watcher')
                            .addFields({ name: '❌ | Music system is not available!', value: '\u200b', inline: true })
                    ]
                });
            }
            
            const player = manager.players.get(guild.id);
            if (!player) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('System Watcher')
                            .addFields({ name: '❌ | No music is currently playing!', value: '\u200b', inline: true })
                    ]
                });
            }
        
            if (voiceChannel.id !== player.voiceId) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Red')
                            .setTitle('System Watcher')
                            .addFields({ name: '❌ | You need to be in the same voice channel as the bot!', value: '\u200b', inline: true })
                    ]
                });
            }
            
            // If no volume level provided, show current volume
            if (volumeLevel === null) {
                const currentVolume = Math.round(player.volume);
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor('Random')
                            .setTitle('🔊 Current Volume')
                            .setDescription(`Volume is currently set to **${currentVolume}%**`)
                            .setFooter({ text: 'Powered by Northden Studios', iconURL: interaction.client.user.displayAvatarURL() })
                            .setTimestamp()
                    ]
                });
            }
            
            // Set the new volume
            await player.setVolume(volumeLevel);
            
            const volumeBar = createVolumeBar(volumeLevel);
            
            let volumeEmoji = '🔇';
            if (volumeLevel > 0 && volumeLevel <= 30) volumeEmoji = '🔉';
            else if (volumeLevel > 30 && volumeLevel <= 70) volumeEmoji = '🔊';
            else if (volumeLevel > 70) volumeEmoji = '📢';
            
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('Random')
                        .setTitle(`${volumeEmoji} Volume Changed`)
                        .setDescription(`Volume has been set to **${volumeLevel}%**\n\n${volumeBar}`)
                        .addFields(
                            { name: 'Changed by', value: member.displayName, inline: true }
                        )
                        .setFooter({ text: 'Powered by Northden Studios', iconURL: interaction.client.user.displayAvatarURL() })
                        .setTimestamp()
                ]
            });
            
        } catch (error) {
            console.error('Error in volume command:', error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❌ | An error occurred while changing the volume! - (304V)');
            
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    },
};

/**
 * Creates a visual volume bar
 * @param {number} volume - Volume level (0-100)
 * @returns {string} - Formatted volume bar
 */
function createVolumeBar(volume) {
    const totalBars = 20;
    const filledBars = Math.round((volume / 100) * totalBars);
    const emptyBars = totalBars - filledBars;
    
    const filled = '█'.repeat(filledBars);
    const empty = '░'.repeat(emptyBars);
    
    return `\`${filled}${empty}\` ${volume}%`;
}