const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Shows the current music queue.')
        .addIntegerOption(option =>
            option.setName('page')
                .setDescription('The page number of the queue to display.')
                .setMinValue(1)
                .setRequired(false)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const player = interaction.client.manager.players.get(interaction.guildId);

        if (!player || (!player.queue.current && player.queue.length === 0)) {
            const embed = new EmbedBuilder()
                .setColor('Orange')
                .setDescription('There is nothing in the queue right now!');
            return interaction.editReply({ embeds: [embed] });
        }

        const currentPage = interaction.options.getInteger('page') || 1;
        const tracksPerPage = 10;

        const queueLength = player.queue.length;
        const totalPages = Math.ceil(queueLength / tracksPerPage) + (player.queue.current ? 1 : 0);

        if (currentPage < 1 || currentPage > totalPages) {
            const embed = new EmbedBuilder()
                .setColor('Red')
                .setDescription(`Invalid page number. Please provide a number between 1 and ${totalPages}.`);
            return interaction.editReply({ embeds: [embed] });
        }

        let description = '';

        if (player.queue.current) {
            const currentTrack = player.queue.current;
            // Use multiple fallback options for duration
            const currentTrackDuration = currentTrack.duration || currentTrack.length || currentTrack.info?.duration || currentTrack.info?.length;
            const formattedDuration = formatDuration(currentTrackDuration).formattedDuration;
            description += `**Currently playing:**\n**[${currentTrack.title}](${currentTrack.uri})** - \`${formattedDuration}\`\n\n`;
        }

        if (player.queue.length > 0) {
            const startIndex = (currentPage - 1) * tracksPerPage;
            const endIndex = startIndex + tracksPerPage;
            const songsOnPage = player.queue.slice(startIndex, endIndex);

            if (songsOnPage.length > 0) {
                description += `**Upcoming Songs (Page ${currentPage}/${totalPages}):**\n`;
                description += songsOnPage
                    .map((track, i) => {
                        // Use multiple fallback options for duration
                        const trackDuration = track.duration || track.length || track.info?.duration || track.info?.length;
                        const formattedDuration = formatDuration(trackDuration).formattedDuration;
                        return `${startIndex + i + 1}. [${track.title}](${track.uri}) - \`${formattedDuration}\``;
                    })
                    .join('\n');
            } else {
                 description += `No more songs on this page.`;
            }
        } else {

            if (currentPage === 1 && player.queue.current) {
                description += 'No more songs in the queue.';
            } else {
                 description += 'No more songs in the queue.';
            }
        }

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('Music Queue')
            .setDescription(description)
            .setFooter({ text: `Total songs in queue: ${player.queue.length} | Page ${currentPage}/${totalPages}`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        if (player.queue.current && player.queue.current.thumbnail) {
            embed.setThumbnail(player.queue.current.thumbnail);
        }

        interaction.editReply({ embeds: [embed] }); 
    },
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