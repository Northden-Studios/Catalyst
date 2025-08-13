const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the song currently playing on the voice!'),

        async execute (interaction) {

            await interaction.deferReply();

            try {
                const player = interaction.client.manager.players.get(interaction.guild.id);
                if (!player) {
                    const embedOther = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('System Watcher')
                        .setDescription('❎ | No music playing on the voice! - (218C)');
                    return await interaction.editReply({ embeds: [embedOther] });
                }

                const { channel } = interaction.member.voice;

                if (!channel) {
                    const embedMust = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('System Watcher')
                        .setDescription('❎ | You have to be on the voice channel to skip the music! - (238C)');
                    return await interaction.editReply({ embeds: [embedMust] });
                }

                if (player.voiceId !== channel.id) {
                    const embedNew = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('System Watcher')
                        .setDescription('❎ | You need to be on the same voice channel as the bot to miss the music! - (315C)');
                    return await interaction.editReply({ embeds: [embedNew] });
                }

                if (player.queue.length === 0 && !player.playing) {
                    const embedSame = new EmbedBuilder()
                        .setColor('Orange')
                        .setTitle('System Watcher')
                        .setDescription('⚠️ | No songs in the queue to skip! - (322C)');
                    return await interaction.editReply({ embeds: [embedSame] });
                }

                const oldTrack = player.currentTrack; 
                await player.skip();
                
                if (player.connected) {
                    player.destroy();
                }
                
                const embed = new EmbedBuilder()
                    .setTitle('Skip the songs!')
                    .setDescription('Moving to next music or playlist!')
                    .addFields(
                        { name: `⏩ | Song Skipped!`, value: `*Song **${oldTrack ? `\`${oldTrack.title}\`` : 'telah'}** dilewati!*` }
                    )
                    .setColor('Blue')
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();
        
                return await interaction.editReply({ embeds: [embed] });

                } catch (error) {
                    console.error("Error di perintah skip:", error);
                    if (interaction.deferred || interaction.replied) {
                    const embedConsole = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('System Watcher - Catalyst')
                        .setDescription('❎ | Error while trying to skip the song! - (554C)');
                    await interaction.editReply({ embeds: [embedConsole] });
                    } else {
                    const embedSkip= new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('System Watcher - Catalyst')
                        .setDescription('❎ | Timeout - (454C)');
                    await interaction.editReply({ embeds: [embedSkip] });
                }
            }
        } 
};