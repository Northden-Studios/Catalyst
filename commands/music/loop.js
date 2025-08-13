// commands/loop.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Toggle loop mode for the current song or queue.')
        .addStringOption(option =>
            option.setName('mode')
                .setDescription('The loop mode to set.')
                .setRequired(false)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Track', value: 'track' },
                    { name: 'Queue', value: 'queue' }
                )
        )
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

            if (!player || (!player.playing && !player.paused)) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | There is no music currently playing!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            if (channel.id !== player.voiceId) {
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | You must be in the same voice channel as the bot!', value: '\u200B', inline: false });

                return interaction.editReply({ embeds: [embedError] });
            }

            const mode = interaction.options.getString('mode');

            if (!mode) {
                let newMode;
                switch (player.loop) {
                    case 'none':
                        newMode = 'track';
                        break;
                    case 'track':
                        newMode = 'queue';
                        break;
                    case 'queue':
                        newMode = 'none';
                        break;
                    default:
                        newMode = 'track';
                }
                player.setLoop(newMode);
            } else {
                // Set the specified mode
                switch (mode) {
                    case 'off':
                        player.setLoop('none');
                        break;
                    case 'track':
                        player.setLoop('track');
                        break;
                    case 'queue':
                        player.setLoop('queue');
                        break;
                }
            }

            let loopModeDisplay;
            let loopIcon;
            let loopColor;

            switch (player.loop) {
                case 'none':
                    loopModeDisplay = 'Off';
                    loopIcon = '⏹️';
                    loopColor = 'Grey';
                    break;
                case 'track':
                    loopModeDisplay = 'Track';
                    loopIcon = '🔂';
                    loopColor = 'Blue';
                    break;
                case 'queue':
                    loopModeDisplay = 'Queue';
                    loopIcon = '🔁';
                    loopColor = 'Green';
                    break;
                default:
                    loopModeDisplay = 'Off';
                    loopIcon = '⏹️';
                    loopColor = 'Grey';
            }

            const embed = new EmbedBuilder()
                .setColor(loopColor)
                .setTitle('Loop Mode Changed')
                .setDescription(`${loopIcon} | Loop mode has been set to **${loopModeDisplay}**`)
                .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (player.queue.current) {
                const currentTrack = player.queue.current;
                const trackDuration = currentTrack.duration || currentTrack.length || currentTrack.info?.duration || currentTrack.info?.length;
                const formattedDuration = formatDuration(trackDuration).formattedDuration;
                
                embed.addFields({
                    name: 'Current Track',
                    value: `[${currentTrack.title}](${currentTrack.uri}) - \`${formattedDuration}\``,
                    inline: false
                });

                if (currentTrack.thumbnail) {
                    embed.setThumbnail(currentTrack.thumbnail);
                }
            }

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Error in loop command:", error);
            
            const embedError = new EmbedBuilder()
                .setColor('Red')
                .setTitle('System Watcher')
                .setDescription('❎ | An error occurred while changing loop mode! - (505C)');

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