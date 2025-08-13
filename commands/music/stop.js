const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and clears the queue.'), 

        async execute(interaction) {

            await interaction.deferReply(); 

            try {

                const player = interaction.client.manager.players.get(interaction.guild.id);
                const { channel } = interaction.member.voice;

                if (!channel) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('**❎ | You have to be on the sound channel to stop the music!**');
                    return await interaction.editReply({ embeds: [embed], ephemeral: true }); 
                }

                if (!player) {
                    const embed = new EmbedBuilder()
                        .setColor('Red')
                        .setDescription('**❎ | No music playing!**');
                    return await interaction.editReply({ embeds: [embed], ephemeral: true });
                }

                if (player.voiceId !== channel.id) {
                    const embed = new EmbedBuilder()
                        .setColor('Orange')
                        .setDescription('**⚠️ You need to be on the same voice channel as the bot to stop the music!**');
                    return await interaction.editReply({ embeds: [embed], ephemeral: true });
                }

                await player.destroy();

                const embed = new EmbedBuilder()
                    .setColor('Green')
                    .setDescription('✅ **The music has been stopped and the line cleared!** 👋')
                    .setFooter({ text: `Powered by Northden Studios`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp()
                await interaction.editReply({ embeds: [embed] });

                } catch (error) {
                    console.error('Error saat menghentikan musik:', error); 

                    if (interaction.deferred || interaction.replied) {
                    const embedConsole = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('System Watcher - Catalyst')
                        .setDescription('❎ | Error while trying to stop the song! - (571C)');
                    await interaction.editReply({ embeds: [embedConsole] });
                    } else {
                    const embedOther = new EmbedBuilder()
                        .setColor('Red')
                        .setTitle('System Watcher - Catalyst')
                        .setDescription('❎ | Timeout - (454C)');
                    await interaction.editReply({ embeds: [embedOther] });
                    }
                }
        },
};