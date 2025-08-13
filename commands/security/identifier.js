const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const { URL } = require('url');

class LinkIdentifier {
    constructor() {

        this.maliciousDomains = [
            'discord-gifts.com',
            'discord-nitro.com',
            'steamcommunity.ru',
            'steamcommunity.tk',
            'steam-community.com',
            'steampowered.tk',
            'bit.ly/discord',
            'tinyurl.com/discord',
            'grabify.link',
            'iplogger.org',
            'discordgift.site',
            'discord-give.com',
            'discord-app.net',
            'discrod.com',
            'discoord.com',
            'discordapp.io',
            'discord-nitro.org',
            'discord-promo.com',
            'steam-wallet.com',
            'steamwalletgift.com',
            'discordgiveaway.com',
            'free-discord-nitro.com',
            'discord-free.com',
            'discordstore.com',
            'discordstore.net'
        ];

        this.suspiciousPatterns = [
            /discord.*nitro/i,
            /discord.*gift/i,
            /discord.*free/i,
            /steam.*free/i,
            /free.*nitro/i,
            /claim.*nitro/i,
            /discord.*generator/i,
            /hack.*discord/i,
            /discord.*hack/i,
            /ip.*grab/i,
            /grabify/i,
            /iplogger/i,
            /2no\.co/i,
            /cutt\.ly/i,
            /shorturl/i,
            /tinyurl/i,
            /bit\.ly/i,
            /t\.co/i,
            /goo\.gl/i,
            /ow\.ly/i,
            /is\.gd/i,
            /buff\.ly/i
        ];

        this.virusTotalApiKey = process.env.VIRUSTOTAL_API_KEY || null;
    }

    async checkMessage(message) {
        if (message.author.bot) return;

        const urls = this.extractUrls(message.content);
        if (urls.length === 0) return;

        for (const url of urls) {
            const threatLevel = await this.analyzeUrl(url);
            if (threatLevel.ismalicious) {
                await this.sendWarningEmbed(message, url, threatLevel);
            }
        }
    }

    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = text.match(urlRegex) || [];
        return urls;
    }

    async analyzeUrl(url) {
        try {
            const parsedUrl = new URL(url);
            const domain = parsedUrl.hostname.toLowerCase();
            
            let threatLevel = {
                ismalicious: false,
                reasons: [],
                severity: 'low',
                category: 'unknown'
            };

            if (this.maliciousDomains.some(malDomain => domain.includes(malDomain))) {
                threatLevel.ismalicious = true;
                threatLevel.reasons.push('Known malicious domain');
                threatLevel.severity = 'high';
                threatLevel.category = 'phishing';
            }

            const suspiciousPattern = this.suspiciousPatterns.find(pattern => pattern.test(url));
            if (suspiciousPattern) {
                threatLevel.ismalicious = true;
                threatLevel.reasons.push('Suspicious URL pattern detected');
                threatLevel.severity = threatLevel.severity === 'high' ? 'high' : 'medium';
                threatLevel.category = 'suspicious';
            }

            const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly'];
            if (shorteners.some(shortener => domain.includes(shortener))) {
                threatLevel.ismalicious = true;
                threatLevel.reasons.push('URL shortener detected (potential risk)');
                threatLevel.severity = 'medium';
                threatLevel.category = 'shortener';
            }

            if (this.virusTotalApiKey) {
                const vtResult = await this.checkVirusTotal(url);
                if (vtResult.malicious) {
                    threatLevel.ismalicious = true;
                    threatLevel.reasons.push(`VirusTotal detection: ${vtResult.engines} engines flagged this URL`);
                    threatLevel.severity = 'high';
                    threatLevel.category = 'malware';
                }
            }

            return threatLevel;
        } catch (error) {
            console.error('Error analyzing URL:', error);
            return { ismalicious: false, reasons: [], severity: 'low', category: 'unknown' };
        }
    }

    async checkVirusTotal(url) {
        try {
            if (!this.virusTotalApiKey) return { malicious: false, engines: 0 };

            const response = await axios.post(
                'https://www.virustotal.com/vtapi/v2/url/scan',
                `apikey=${this.virusTotalApiKey}&url=${encodeURIComponent(url)}`,
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );

            await new Promise(resolve => setTimeout(resolve, 2000));

            const reportResponse = await axios.get(
                `https://www.virustotal.com/vtapi/v2/url/report?apikey=${this.virusTotalApiKey}&resource=${encodeURIComponent(url)}`
            );

            const data = reportResponse.data;
            return {
                malicious: data.positives > 0,
                engines: data.positives || 0
            };
        } catch (error) {
            console.error('VirusTotal API error:', error);
            return { malicious: false, engines: 0 };
        }
    }

    async sendWarningEmbed(message, url, threatLevel) {
        const embed = new EmbedBuilder()
            .setTitle('🚨 **SECURITY WARNING** 🚨')
            .setDescription(`**Potentially malicious link detected!**\n\n**URL:** \`${url}\``)
            .setColor(this.getSeverityColor(threatLevel.severity))
            .addFields(
                {
                    name: '⚠️ Threat Level',
                    value: `**${threatLevel.severity.toUpperCase()}**`,
                    inline: true
                },
                {
                    name: '📂 Category',
                    value: `**${threatLevel.category.toUpperCase()}**`,
                    inline: true
                },
                {
                    name: '🔍 Detection Reasons',
                    value: threatLevel.reasons.map(reason => `• ${reason}`).join('\n'),
                    inline: false
                },
                {
                    name: '🛡️ Recommended Actions',
                    value: this.getRecommendations(threatLevel.category),
                    inline: false
                }
            )
            .setFooter({
                text: `Detected by Catalyst`,
                iconURL: message.client.user.displayAvatarURL()
            })
            .setTimestamp();

        try {

            await message.channel.send({ embeds: [embed] });

            if (message.guild && message.channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.ManageMessages)) {
                await message.delete();
                
                const deleteEmbed = new EmbedBuilder()
                    .setTitle('🗑️ Message Removed')
                    .setDescription(`A message containing a potentially malicious link was removed for security reasons.`)
                    .setColor('#FF6B6B')
                    .addFields({
                        name: '👤 Original Author',
                        value: message.author.toString(),
                        inline: true
                    })
                    .setTimestamp();

                await message.channel.send({ embeds: [deleteEmbed] });
            }

            console.log(`🚨 Malicious link detected: ${url} | Severity: ${threatLevel.severity} | Channel: ${message.channel.name} | User: ${message.author.tag}`);

        } catch (error) {
            console.error('Error sending warning embed:', error);
        }
    }

    getSeverityColor(severity) {
        switch (severity) {
            case 'high': return '#FF0000'; // Red
            case 'medium': return '#FFA500'; // Orange
            case 'low': return '#FFFF00'; // Yellow
            default: return '#808080'; // Gray
        }
    }

    getRecommendations(category) {
        switch (category) {
            case 'phishing':
                return '• **DO NOT** click this link\n• **DO NOT** enter your credentials\n• Report to server moderators\n• Be cautious of similar links';
            case 'malware':
                return '• **DO NOT** download anything\n• Run antivirus scan if clicked\n• Report to server moderators\n• Avoid this domain entirely';
            case 'shortener':
                return '• Be cautious with shortened URLs\n• Use URL expanders to see real destination\n• Verify the source before clicking\n• Ask the poster for the full URL';
            case 'suspicious':
                return '• Exercise extreme caution\n• Verify with the link sender\n• Do not enter personal information\n• Report if confirmed malicious';
            default:
                return '• Exercise caution when clicking\n• Verify the source\n• Report to moderators if suspicious\n• Use antivirus protection';
        }
    }
}

module.exports = LinkIdentifier;