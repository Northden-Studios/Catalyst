const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jokes')
        .setDescription('Sending random jokes to cheer you up!'),
    async execute(interaction) {

        await interaction.deferReply(); 

        try {

            const response = await fetch('https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,religious,political,racist,sexist,explicit&type=single');
            const data = await response.json();

            if (!response.ok) {
                console.error('Failed to take a joke from the API:', data);
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ **Sorry, I cant find any jokes at the moment. Try again later!**');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            if (data.error) {
                console.error('API mengembalikan error untuk lelucon:', data);
                const errorEmbed = new EmbedBuilder()
                    .setColor('Red')
                    .setDescription('❌ **Ada masalah saat mendapatkan lelucon. Pesan dari API: `' + (data.message || 'Tidak diketahui') + '`**');
                return await interaction.editReply({ embeds: [errorEmbed] });
            }

            const joke = data.joke;

            const jokeEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('Recommneded jokes for you 🤣')
                .setDescription(joke)
                .setFooter({ text: `Category: ${data.category || 'Unknown'}` });

            await interaction.editReply({ embeds: [jokeEmbed] });

        } catch (error) {
            console.error('Terjadi kesalahan saat menjalankan perintah jokes:', error);
             if (interaction.deferred || interaction.replied) {
                const embedConsole = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle('System Watcher - Catalyst')
                    .setDescription('❎ | Error while trying to create jokes! - (818C)');
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