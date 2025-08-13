const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause or resume the currently playing song.'),
    async execute(interaction) {
        await interaction.deferReply();

        const { guildId, member } = interaction;
        const { channel } = member.voice;

        if (!channel) {
            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('System Watcher')
                .setDescription('**❎ | You have to be on the voice channel to pause or resume the music!**');
            return await interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        const player = interaction.client.manager.players.get(guildId);

        if (!player) {
            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('System Watcher')
                .setDescription('**❎ | No music is playing or the bot is not connected to a sound channel.**');
            return await interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        if (player.voiceId !== channel.id) {
            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setTitle('System Watcher')
                .setDescription('**⚠️ | You need to be on the same voice channel as the bot to pause or resume the music!**');
            return await interaction.editReply({ embeds: [embed], ephemeral: true });
        }

        try {

            if (player.paused) {

                await player.pause(false); 

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setTitle('System Watcher')
                    .setDescription('▶️ | **Music has resumed!**');
                await interaction.editReply({ embeds: [embed] });
            } else {
              
                await player.pause(true); 

                const embed = new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('System Watcher')
                    .setDescription('⏸️ | **Music has been paused!**');
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error saat menjeda/melanjutkan musik:', error);

            if (interaction.deferred || interaction.replied) {
                const embedConsole = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | Error while trying to pause the song! - (184C)');
                await interaction.editReply({ embeds: [embedConsole] });
            } else {
                const embedOther = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | Timeout - (454C)');
                await interaction.editReply({ embeds: [embedOther] });
            }
        }
    },
};