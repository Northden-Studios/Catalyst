const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the current queue'),
    
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        
        if (!voiceChannel) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ You need to be in a voice channel to use this command!')
                ],
                ephemeral: true
            });
        }

        const kazagumo = interaction.client.kazagumo;
        if (!kazagumo) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ Music system is not available!')
                ],
                ephemeral: true
            });
        }
        
        const player = interaction.client.manager.players.get(interaction.guildId);
        if (!player) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ No music is currently playing!')
                ],
                ephemeral: true
            });
        }
        
        if (voiceChannel.id !== player.voiceId) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ You need to be in the same voice channel as the bot!')
                ],
                ephemeral: true
            });
        }
        
        if (!player.queue || player.queue.length === 0) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ The queue is empty! Add some songs first.')
                ],
                ephemeral: true
            });
        }
        
        if (player.queue.length < 2) {
            return await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ Need at least 2 songs in the queue to shuffle!')
                ],
                ephemeral: true
            });
        }
        
        try {
            const queueLength = player.queue.length;
            
            for (let i = player.queue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
            }
            
            // Alternative method if Kazagumo has a built-in shuffle method
            // player.queue.shuffle();
            
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#00ff00')
                        .setTitle('🔀 Queue Shuffled')
                        .setDescription(`Successfully shuffled **${queueLength}** songs in the queue!`)
                        .addFields(
                            {
                                name: '🎵 Next Up',
                                value: player.queue.length > 0 ? 
                                    `**${player.queue[0].title}**\nBy ${player.queue[0].author}` : 
                                    'No songs in queue',
                                inline: true
                            },
                            {
                                name: '📊 Queue Info',
                                value: `**${queueLength}** songs\n**${formatDuration(getTotalDuration(player.queue))}** total duration`,
                                inline: true
                            }
                        )
                        .setTimestamp()
                        .setFooter({ text: `Shuffled by ${member.displayName}` })
                ]
            });
            
        } catch (error) {
            console.error('Error shuffling queue:', error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#ff0000')
                        .setDescription('❌ An error occurred while shuffling the queue!')
                ],
                ephemeral: true
            });
        }
    },
};

/**
 * Calculate total duration of all songs in queue
 * @param {Array} queue - The queue array
 * @returns {number} Total duration in milliseconds
 */
function getTotalDuration(queue) {
    return queue.reduce((total, track) => total + (track.length || 0), 0);
}

/**
 * Format duration from milliseconds to readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
function formatDuration(ms) {
    if (!ms || ms === 0) return '0:00';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}