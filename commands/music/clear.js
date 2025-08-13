const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear the music queue'),
    
    async execute(interaction) {
        const { member, guild, client, user } = interaction;
        
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            return this.sendError(interaction, '❌ You need to be in a voice channel to use this command!');
        }

        const botVoiceChannel = guild.members.me.voice.channel;
        if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
            return this.sendError(interaction, '❌ You need to be in the same voice channel as the bot!');
        }

        const player = client.kazagumo?.players?.get(guild.id) || 
                      client.shoukaku?.players?.get(guild.id) ||
                      client.manager?.players?.get(guild.id) ||
                      client.player?.nodes?.get(guild.id);

        if (!player) {
            return this.sendError(interaction, '❌ No music player found for this server!');
        }

        if (!player.queue?.size && !player.queue?.length) {
            return this.sendError(interaction, '❌ The queue is already empty!');
        }

        try {
            if (player.queue?.clear) {
                player.queue.clear();
            } else if (player.queue?.splice) {
                player.queue.splice(0);
            } else if (Array.isArray(player.queue)) {
                player.queue.length = 0;
            }

            const embed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setDescription('🗑️ **Queue cleared successfully!**')
                .setFooter({ 
                    text: `Requested by ${user.tag}`,
                    iconURL: user.displayAvatarURL({ size: 64 })
                })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('[CLEAR] Error clearing queue:', error);
            return this.sendError(interaction, 'An error occurred while clearing the queue. Please try again.');
        }
    },

    sendError(interaction, message) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setDescription(message);
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }
};