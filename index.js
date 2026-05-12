const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once("ready", () => {
  console.log(`${client.user.tag} is online!`);
});

/* EMBED COMMAND */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content.startsWith("!embed")) {
    const text = message.content.slice(7);

    const embed = new EmbedBuilder()
      .setTitle("Embed Message")
      .setDescription(text)
      .setColor("Red");

    message.channel.send({ embeds: [embed] });
  }
});

/* PING COMMAND */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    message.reply("Pong!");
  }
});

/* AUTO MOD */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const bannedWords = ["badword1", "badword2"];

  if (
    bannedWords.some(word =>
      message.content.toLowerCase().includes(word)
    )
  ) {
    await message.delete();
    message.channel.send(
      `${message.author}, watch your language.`
    );
  }
});

/* JOIN LOGS */
client.on("guildMemberAdd", member => {
  const channel = member.guild.channels.cache.find(
    ch => ch.name === "logs"
  );

  if (!channel) return;

  channel.send(
    `✅ ${member.user.tag} joined the server`
  );
});

/* LEAVE LOGS */
client.on("guildMemberRemove", member => {
  const channel = member.guild.channels.cache.find(
    ch => ch.name === "logs"
  );

  if (!channel) return;

  channel.send(
    `❌ ${member.user.tag} left the server`
  );
});

client.login(process.env.TOKEN);
