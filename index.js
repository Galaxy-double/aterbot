// index.js
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, Events } = require('discord.js');
const puppeteer = require('puppeteer');
const express = require('express');
require('dotenv').config();

const app = express();
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(3000, () => console.log('Express server running'));

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName('start')
    .setDescription('Démarre votre serveur Aternos')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Enregistrement des commandes slash...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('Commandes slash enregistrées.');
  } catch (error) {
    console.error('Erreur enregistrement des commandes :', error);
  }
})();

client.once(Events.ClientReady, () => {
  console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'start') {
    await interaction.reply({ content: 'Démarrage du serveur Aternos en cours...', ephemeral: true });

    try {
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
      });
      const page = await browser.newPage();

      await page.goto('https://aternos.org/go/');
      await page.type('#user', process.env.ATERNOS_EMAIL);
      await page.type('#password', process.env.ATERNOS_PASS);
      await page.click('#login');
      await page.waitForNavigation();

      await page.goto('https://aternos.org/server/');
      await page.waitForSelector('#start');
      await page.click('#start');
      await page.waitForTimeout(5000);

      await interaction.followUp('Le serveur Aternos est en cours de démarrage !');
      await browser.close();
    } catch (err) {
      console.error(err);
      await interaction.followUp({ content: 'Erreur lors du démarrage du serveur.', ephemeral: true });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);