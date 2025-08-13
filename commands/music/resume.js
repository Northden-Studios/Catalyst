// commands/resume.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the currently paused music.')
        .setDMPermission(false),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const { channel } = interaction.member.voice;
            const player = interaction.client.manager.players.get(interaction.guildId);

            if (!channel) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | You must be in a voice channel to use this command!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (!player) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | There is no music player active!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (channel.id !== player.voiceId) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | You must be in the same voice channel as the bot!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (!player.queue.current) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | There is no track currently loaded!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (player.playing && !player.paused) {
                const embedError = new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('System Watcher')
                    .addFields({ name: '⚠️ | The music is already playing!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (!player.paused) {
                const embedError = new EmbedBuilder()
                    .setColor('Orange')
                    .setTitle('System Watcher')
                    .addFields({ name: '⚠️ | The music is not paused!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            player.pause(false);

            const currentTrack = player.queue.current;
            const trackDuration = currentTrack.duration || currentTrack.length || currentTrack.info?.duration || currentTrack.info?.length;
            const formattedDuration = formatDuration(trackDuration).formattedDuration;

            const embed = new EmbedBuilder()
                .setColor('Green')
                .setTitle('Music Resumed')
                .setDescription(`▶️ | Successfully resumed the music!`)
                .addFields(
                    { name: 'Now Playing', value: `[${currentTrack.title}](${currentTrack.uri})`, inline: false },
                    { name: 'Duration', value: formattedDuration, inline: true },
                    { name: 'Requested by', value: currentTrack.requester ? currentTrack.requester.tag : 'Unknown', inline: true }
                )
                .setFooter({ text: `Resumed by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (currentTrack.thumbnail) {
                embed.setThumbnail(currentTrack.thumbnail);
            }

            if (player.loop && player.loop !== 'none') {
                let loopIcon;
                let loopText;
                switch (player.loop) {
                    case 'track':
                        loopIcon = '🔂';
                        loopText = 'Track Loop';
                        break;
                    case 'queue':
                        loopIcon = '🔁';
                        loopText = 'Queue Loop';
                        break;
                    default:
                        loopIcon = '';
                        loopText = '';
                }
                if (loopText) {
                    embed.addFields({ name: 'Loop Status', value: `${loopIcon} ${loopText}`, inline: true });
                }
            }

            if (player.queue.length > 0) {
                embed.addFields({ name: 'Queue', value: `${player.queue.length} song(s) in queue`, inline: true });
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error in resume command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while trying to resume the music! - (506C)');

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ embeds: [embedError] });
            } else {
                await interaction.reply({ embeds: [embedError] });
            }
        }
    }
};

function formatDuration(ms) {
    if (!ms || typeof ms !== 'number' || isNaN(ms) || ms <= 0) {
        return {
            hours: 0,
            minutes: 0,
            seconds: 0,
            formattedDuration: 'Unknown'
        };
    }

    const hours = Math.floor(ms / 3600000);
    ms %= 3600000;
    const minutes = Math.floor(ms / 60000);
    ms %= 60000;
    const seconds = Math.floor(ms / 1000);

    let formattedDuration = '';
    if (hours > 0) {
        formattedDuration += `${hours}:`;
    }
    formattedDuration += `${minutes < 10 && hours > 0 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    return {
        hours,
        minutes,
        seconds,
        formattedDuration
    };
}