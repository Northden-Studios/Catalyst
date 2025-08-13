const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Displays information about the bot.'),
    async execute(interaction) {
        const botInfoEmbed = new EmbedBuilder()
            .setColor('Random') 
            .setTitle('Welcome to Setup!')
            .setDescription('To begin using this bot, you can choose by typing the commands.')
            .addFields(
                { name: 'To View Maintenance', value: '/viewupdates', inline: true },
                { name: 'To View System Security', value: '/security', inline: true },
                { name: 'To View Ping Average', value: '/ping', inline: true},
                { name: 'To Make Creation', value: '/create **TITLE**', inline: true},
                { name: 'To Random Meme', value: '/meme', inline: true},
                { name: 'To Play some Music', value: '/play **YOUR_QUERY**', inline: true},
                { name: 'To Skip the Music', value: '/skip', inline: true},
                { name: 'To Ban User', value: '/ban **TARGET_USER**', inline: true},
                { name: 'To Kick User', value: '/kick **TARGET_USER**', inline: true},
                { name: 'To View About', value: '/about', inline: true}
            )
            .setTimestamp()
            .setFooter({ text: 'Powered by Northden Studios', iconURL: interaction.client.user.displayAvatarURL() });

        await interaction.reply({ embeds: [botInfoEmbed] });
    },
};