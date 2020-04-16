const Discord = require('discord.js');
const fs = require('fs');
const webhookListener = require('./webhook_listener.js');
const { prefix } = require('./config.json');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
const schedule = require ('node-schedule');
const emojipasta = require ('./emojipasta.js');
const LanguageDetect = require('languagedetect');
const lngDetector = new LanguageDetect();

client.login(process.env.BOT_TOKEN);

client.on('ready', () => {
	schedule.scheduleJob('0 0 * * *', () => {
		const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
		const { donator_role } = config;
		const date = new Date();

		for (const key of Object.keys(config.kofi_users)) {
			if(config.kofi_users[key] === date.toLocaleDateString()) {
				const guild = client.guilds.cache.find(guild => guild.members.cache.has(key));
				const guildMember = guild.members.cache.get(key);

				const role = Array.from(guild.roles.cache.values())
					.find(role => role.name === donator_role);
				guildMember.roles.remove(role.id);

				for(const keyr of Object.keys(config.kofi_roles)) {
					if(guildMember.roles.cache.find(r => r.name === donator_role)) {
						guildMember.roles.remove(config.kofi_roles[keyr]);
					}
				}
			}
		}
	});
});

client.on('message', message => {
	const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	// currently redirects all dms
	/* if(message.content === `${prefix}anon help`) {
		message.channel.send('Anonbot is dead');
	}
    else */
	if(message.content === `${prefix}ko-fi`) {
		message.channel.send('Get that money sis');
	}
	else if(message.content === `${prefix}ko-fi help`) {
		message.channel.send('Para escolher os roles é necessário o role Ko-fi.');
	}
	else if(message.content === `${prefix}ko-fi config` && (message.member.hasPermission('ADMINISTRATOR'))) {
		message.channel.send({ embed: {
			color: 3447003,
			author: {
				name: client.user.username,
				icon_url: client.user.avatarURL,
			},
			description: 'Esreva o que deseja configurar:',
			fields: [{
				name: 'Emoji Reactions',
				value: 'Mude os emojis que aparecem para dar role.',
			},
			{
				name: 'Mensagem de Agradecimento',
				value: 'Edite ou desative as mensagens de agradecimento.',
			},
			],
		},
		});

		try {
			const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 30000 });
			let choosen = false;
			collector.on('collect', message => {
				const { content } = message;
				if (!choosen && content == 'Emoji Reactions') {
					message.channel.send('😔 Escolhe os novos emojis, separados por um espaço');
					choosen = true;
				}
				else if (!choosen && content == 'Mensagem de Agradecimento') {
					message.channel.send('Escreva a mensagem colocando um ### no final.');
					choosen = true;
				}
				else if (choosen && content.split(':').length - 1 == 4 && content.includes(',')) {
					const newEmojis = content.split(',').map(e => e.replace(/[^\w\s]/gi, '').replace(/\D/g, ''));
					const newJSON = config.kofi_roles;
					newEmojis.map ((e, i) =>newJSON[e] = config.kofi_roles[Object.keys(config.kofi_roles)[i]]);
					Object.keys(newJSON).map((e, i) => {
						if (i <= 1) delete newJSON[`${e}`];
					});
					config.kofi_roles = newJSON;
					fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
					message.channel.send('Emojis alterados!');
				}
				else if (choosen && content.includes('###')) {
					const newMessage = content.split('###')[0];
					config.donation_thanks_message = newMessage;
					fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
					message.channel.send('Mensagem alterada!');
					collector.stop();
				}
			});
		}
		catch(err) {
			message.channel.send('Aconteceu um erro!' + err);
		}
	}
	else if(message.content === `${prefix}nitro config` && (message.member.hasPermission('ADMINISTRATOR'))) {
		message.channel.send({ embed: {
			color: 3447003,
			author: {
				name: client.user.username,
				icon_url: client.user.avatarURL,
			},
			description: 'Esreva o que deseja configurar:',
			fields: [{
				name: 'Emoji Reactions',
				value: 'Mude os emojis que aparecem para dar role.',
			},
			{
				name: 'Mensagem de Agradecimento',
				value: 'Edite ou desative as mensagens de agradecimento.',
			},
			],
		},
		});

		try {
			const collector = new Discord.MessageCollector(message.channel, m => m.author.id === message.author.id, { time: 30000 });
			let choosen = false;
			collector.on('collect', message => {
				const { content } = message;
				if (!choosen && content == 'Emoji Reactions') {
					message.channel.send('😔 Escolhe os novos emojis, separados por um espaço');
					choosen = true;
				}
				else if (choosen && content.split(':').length - 1 == 4 && content.includes(',')) {
					const newEmojis = content.split(',').map(e => e.replace(/[^\w\s]/gi, '').replace(/\D/g, ''));
					const newJSON = config.nitro_roles;
					newEmojis.map ((e, i) =>newJSON[e] = config.nitro_roles[Object.keys(config.nitro_roles)[i]]);
					Object.keys(newJSON).map((e, i) => {
						if (i <= 1) delete newJSON[`${e}`];
					});
					config.nitro_roles = newJSON;
					fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
					message.channel.send('Emojis alterados!');
				}
			});
		}
		catch(err) {
			message.channel.send('Aconteceu um erro!' + err);
		}
	}
	else if(message.content === `${prefix}commands`) {
		message.channel.send('Para escolher os roles é necessário o role Ko-fi.');
	}
	else if (message.content === `${prefix}ko-fi roles enable` && (message.member.hasPermission('ADMINISTRATOR'))) {
		message.channel.send('Get your roles sis').then(sentMessage => {
			Object.keys(config.kofi_roles).map (emoji => sentMessage.react(emoji));
			config.kofi_message_id = sentMessage.id;
			fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
		});

	}
	else if (message.content === `${prefix}nitro roles enable` && (message.member.hasPermission('ADMINISTRATOR'))) {
		message.channel.send('Get your roles sis').then(sentMessage => {
			Object.keys(config.nitro_roles).map (emoji => sentMessage.react(emoji));
			config.nitro_message_id = sentMessage.id;
			fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
		});

	}
	else if (message.content === `${prefix}roles enable` && (message.member.hasPermission('ADMINISTRATOR'))) {
		message.channel.send('Get your roles sis').then(sentMessage => {
			Object.keys(config.kofi_roles).map (emoji => sentMessage.react(emoji));
			config.kofi_message_id = sentMessage.id;
			fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
		});

		message.channel.send('Get your roles sis').then(sentMessage => {
			Object.keys(config.nitro_roles).map (emoji => sentMessage.react(emoji));
			config.nitro_message_id = sentMessage.id;
			fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
		});

	}
	else if (message.content.includes(`${prefix}emojipasta`)) {
		if(message.content.length > 1500) {
			message.channel.send('Gurl, pls, usa um texto com menos de 1500 caracteres! noção né amor');
		}
		else if(lngDetector.detect(message.content)[0][0] !== 'english') {
			message.channel.send('Siiiisssss, a língua portuguesa ainda não é suportada :tea: :flag_pt:');
		}
		else {
			const emojipasted = emojipasta(message.content.split(`${prefix}emojipasta`)[1]);
			message.channel.send(emojipasted);
		}
	}
});

client.on('messageReactionAdd', async (reaction, user) => {
	const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	const { kofi_message_id, kofi_roles, donator_role, nitro_role, nitro_message_id, nitro_roles } = config;
	if(!user) return;
	if(user.bot)return;
	if(!reaction.message.channel.guild) return;

	const { message, emoji } = reaction;

	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		}
		catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	const guild = user ? client.guilds.cache.find(guild => guild.members.cache.has(user.id)) : null;
	const guildMember = guild ? guild.members.cache.get(user.id) : null;

	if(message.id === kofi_message_id && guildMember.roles.cache.find(r => r.name === donator_role)) {
		if(emoji.id === Object.keys(kofi_roles)[0]) {
			guildMember.roles.add(kofi_roles[Object.keys(kofi_roles)[0]]);
			if (guildMember.roles.cache.find(r => r.id === kofi_roles[Object.keys(kofi_roles)[1]])) {
				reaction.message.reactions.resolve(Object.keys(kofi_roles)[1]).users.remove(user.id);
			}
		}
		else if(emoji.id === Object.keys(kofi_roles)[1]) {
			guildMember.roles.add(kofi_roles[Object.keys(kofi_roles)[1]]);
			if (guildMember.roles.cache.find(r => r.id === kofi_roles[Object.keys(kofi_roles)[0]])) {
				reaction.message.reactions.resolve(Object.keys(kofi_roles)[0]).users.remove(user.id);
			}
		}
		return;
	}

	if(message.id === nitro_message_id && guildMember.roles.cache.find(r => r.name === nitro_role)) {
		if(emoji.id === Object.keys(nitro_roles)[0]) {
			guildMember.roles.add(nitro_roles[Object.keys(nitro_roles)[0]]);
			if (guildMember.roles.cache.find(r => r.id === nitro_roles[Object.keys(nitro_roles)[1]])) {
				reaction.message.reactions.resolve(Object.keys(nitro_roles)[1]).users.remove(user.id);
			}
		}
		else if(emoji.id === Object.keys(nitro_roles)[1]) {
			guildMember.roles.add(nitro_roles[Object.keys(nitro_roles)[1]]);
			if (guildMember.roles.cache.find(r => r.id === nitro_roles[Object.keys(nitro_roles)[0]])) {
				reaction.message.reactions.resolve(Object.keys(nitro_roles)[0]).users.remove(user.id);
			}
		}
		return;
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	const { kofi_message_id, donator_role, kofi_roles, nitro_roles, nitro_role, nitro_message_id } = config;
	if(!user) return;
	if(user.bot)return;
	if(!reaction.message.channel.guild) return;

	const { message, emoji } = reaction;

	if (reaction.partial) {
		// If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
		try {
			await reaction.fetch();
		}
		catch (error) {
			console.log('Something went wrong when fetching the message: ', error);
			// Return as `reaction.message.author` may be undefined/null
			return;
		}
	}

	const guild = user ? client.guilds.cache.find(guild => guild.members.cache.has(user.id)) : null;
	const guildMember = guild ? guild.members.cache.get(user.id) : null;

	if(message.id === kofi_message_id && guildMember.roles.cache.find(r => r.name === donator_role)) {
		if(emoji.id === Object.keys(kofi_roles)[0]) {
			guildMember.roles.remove(kofi_roles[Object.keys(kofi_roles)[0]]);
		}
		else if(emoji.id === Object.keys(kofi_roles)[1]) {
			guildMember.roles.remove(kofi_roles[Object.keys(kofi_roles)[1]]);
		}
		return;
	}

	if(message.id === nitro_message_id && guildMember.roles.cache.find(r => r.name === nitro_role)) {
		if(emoji.id === Object.keys(nitro_roles)[0]) {
			guildMember.roles.remove(nitro_roles[Object.keys(nitro_roles)[0]]);
		}
		else if(emoji.id === Object.keys(nitro_roles)[1]) {
			guildMember.roles.remove(nitro_roles[Object.keys(nitro_roles)[1]]);
		}
		return;
	}
});

client.on('guildMemberUpdate', (oldmember, newmember) => {
	const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
	const { nitro_roles } = config;

	const guild = client.guilds.cache.find(guild => guild.members.cache.has(newmember.id));
	const role = Array.from(guild.roles.cache.values())
		.find(role => role.name === 'Nitro & Ko-fi Supporters');
	const guildMember = guild ? guild.members.cache.get(newmember.id) : null;
	if (newmember.premiumSinceTimestamp !== null) {
		newmember.roles.add(role);
	}
	else if(guildMember.roles.cache.find(r => r.id === nitro_roles[Object.keys(nitro_roles)[0]])) {
		guildMember.roles.remove(role);
		for(const key of Object.keys(config.nitro_roles)) {
			guildMember.roles.remove(config.nitro_roles[key]);
		}
	}
});

async function onDonation(
	paymentSource,
	paymentId,
	timestamp,
	amount,
	message,
	senderName,
) {
	try {
		const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
		const { donator_role, donation_thanks_message } = config;
		const user = client.users.cache.find(
			user => senderName.toLowerCase().indexOf(`${user.username.toLowerCase()}#${user.discriminator}`) !== -1,
		);
		const guild = user ? client.guilds.cache.find(guild => guild.members.cache.has(user.id)) : null;
		const guildMember = guild ? guild.members.cache.get(user.id) : null;

		const role = Array.from(guild.roles.cache.values())
			.find(role => role.name === donator_role);
		guildMember.roles.add(role.id);

		const date = new Date();
		date.setDate(date.getDate() + 31);
		config.kofi_users[guildMember.id] = date.toLocaleDateString('en-GB');
		fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
		return await guildMember.send(donation_thanks_message);
	}
	catch (err) {
		console.warn('Error handling donation event.');
		console.warn(err);
	}
}


webhookListener.on('donation', onDonation);