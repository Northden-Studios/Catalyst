// commands/play.js
const { SlashCommandBuilder, EmbedBuilder, ApplicationCommandOptionType, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song or add it to the queue.')
        .addStringOption(option =>
            option.setName('search')
                .setDescription('The song name or URL you want to play.')
                .setRequired(true)
        )
        .setDMPermission(false), 

    async execute(interaction) {

        await interaction.deferReply();

        try {
            const search = interaction.options.getString('search');
            const { channel } = interaction.member.voice;

            if(!channel) {
                return interaction.editReply({
                    content: 'You must be in the voice channel!',
                    ephemeral: true
                });
            }

            const botPermissionsInChannel = channel.permissionsFor(interaction.guild.members.me);
            if (!botPermissionsInChannel.has(PermissionsBitField.Flags.Connect) || !botPermissionsInChannel.has(PermissionsBitField.Flags.Speak)) {
                const embedNoPerm = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '⚠️ | I dont have permission to join or speak on your voice channel!', inline: true });

                return await interaction.editReply({ embeds: [embedNoPerm] });
            }

            const player = await interaction.client.manager.createPlayer({
                guildId: interaction.guild.id,
                textId: interaction.channel.id,
                voiceId: channel.id,
                volume: 100,
                deaf: true
            });

            const res = await player.search(search, {requester: interaction.user});

            if (!res.tracks.length) {
                if (!player.playing && !player.queue.length) { 
                    player.destroy();
                }
                const embedError = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .addFields({ name: '❎ | No video or music query search found!', inline: true });

                return await interaction.editReply({ embeds: [embedError] });
            }

            if (res.type === 'PLAYLIST') {

                const track = res.tracks[0];

                for (let track of res.tracks) {
                    player.queue.add(track);
                }
                if (!player.playing && !player.paused) {
                    await player.play();
                }

                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle("Playlist added to queue!")
                    .setDescription(`**[${res.playlistName}]** with \`${res.tracks.length}\` songs has been added to the queue!`)
                    .setThumbnail(track.thumbnail)
                    .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                // Calculate total duration with error handling
                const totalDurationMs = res.tracks.reduce((sum, track) => {
                    const duration = track.duration || track.length || 0;
                    return sum + (typeof duration === 'number' ? duration : 0);
                }, 0);
                
                const { formattedDuration: playlistFormattedDuration } = formatDuration(totalDurationMs);
                embed.addFields({ name: 'Total Playlist Duration', value: playlistFormattedDuration, inline: true });

                return interaction.editReply({ embeds: [embed] });

            } else {
                player.queue.add(res.tracks[0]);
                if (!player.playing && !player.paused) {
                    player.play();
                }

                const track = res.tracks[0];
                // Handle duration with fallback options
                const duration = track.duration || track.length || 0;
                const { formattedDuration } = formatDuration(duration);

                const embed = new EmbedBuilder()
                    .setColor('Random')
                    .setTitle('Added to Song Queue!')
                    .setDescription(`**[${track.title}](${track.uri})** has been added to the queue!`)
                    .setThumbnail(track.thumbnail)
                    .addFields(
                        { name: 'Duration', value: formattedDuration, inline: true },
                        { name: 'Requested by', value: interaction.user.tag, inline: true }
                    )
                    .setFooter({ text: 'Powered by Northden Studios', iconURL: interaction.client.user.displayAvatarURL() })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
           console.error("Error di perintah play:", error);
            if (interaction.deferred || interaction.replied) {
                const embedConsole = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | Error while trying to playing the song! - (304C)');
                await interaction.editReply({ embeds: [embedConsole] });
            } else {
                const embedOther = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher')
                    .setDescription('❎ | Timeout - (454C)');
                await interaction.editReply({ embeds: [embedOther] });
            }
        }
    }
    
};

function formatDuration(ms) {
    // Handle invalid or missing duration
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