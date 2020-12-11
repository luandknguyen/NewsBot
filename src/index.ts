import Fetch, { RequestInit } from "node-fetch";
import Cheerio from "cheerio";
import Sqlite3 from "sqlite3";
import Discord from "discord.js";
import Fs from "fs";

//====== CONFIG

const publisher_config_path = "./config/publisher_config.json";
const bot_config_path = "./config/bot_config.json";

var publisher_config: { [key: string]: any };
var publisher_names: string[] = [];

var bot_config: { [key: string]: any };
var token: string = "";
var command: string = "";
var request: RequestInit;
var timer_interval: number = 60000;

function load_config() {

    //------ scraper

    const publisher_config_data = Fs.readFileSync(publisher_config_path, "utf-8");
    publisher_config = JSON.parse(publisher_config_data);

    publisher_names = publisher_config["Publishers"];

    //------ discord

    const bot_config_data = Fs.readFileSync(bot_config_path, "utf-8");
    bot_config = JSON.parse(bot_config_data);

    token = bot_config.token;
    command = bot_config.command;
    request = bot_config.request;
    timer_interval = bot_config.timer_interval;
}

//------ database

const news_db = new Sqlite3.Database("database/news.db");
const discord_db = new Sqlite3.Database("database/discord.db");


//====== SCRAPER

async function scrape(publisher: { [key: string]: any }) {
    let result: { [key: string]: string }[] = [];

    await Fetch(publisher.url as string, request)
        .then(res => res.text())
        .then(html => {
            const $ = Cheerio.load(html);
            const rows = $(publisher.articles_path as string);

            rows.each((_index, row) => {
                let title = $(row).find(publisher.title_path as string).text();
                let link = $(row).find(publisher.link_path as string).attr("href");

                if (typeof link === "undefined") {
                    return;
                } else if (!publisher.link_with_domain) {
                    link = publisher.domain + link;
                }

                title = title.trim();

                result.push({
                    title: title,
                    link: link,
                });
            });
        });

    return result;
}


//====== DISCORD

var channels: string[] = [];
var running: boolean = false;
var timeout: NodeJS.Timer | undefined = undefined;

function notify(row: { [key: string]: string }, publisher_name: string) {
    channels.map(channelId => {
        let channel = client.channels.get(channelId);
        if (typeof channel !== "undefined") {
            const text_channel = channel as Discord.TextChannel;
            const embed = new Discord.RichEmbed()
                .setTitle("Link")
                .setURL(row.link);
            const msg = row["title"] + " - " + ` [${publisher_name}]`;
            if (typeof channel !== "undefined") {
                text_channel.send(msg, embed);
            }
        }
    });
}

function savedata(row: { [key: string]: string, }, table: string) {
    news_db.run(
        `INSERT INTO ${table} VALUES (?, ?)`,
        [row.title, row.link]
    );
}

function loop(publisher_name: string) {
    let publisher: { [key: string]: any } = publisher_config[publisher_name];
    let table = publisher.table as string;
    scrape(publisher).then(
        rows => {
            rows.map(row => {
                news_db.get(
                    `SELECT * FROM ${table} WHERE link = ?`,
                    [row.link],
                    (_err, value) => {
                        if (typeof value !== "undefined") return;

                        notify(row, publisher_name);
                        savedata(row, publisher.table);
                    }
                );
            });
        },
        console.error
    );
}

function save(publisher_name: string) {
    let publisher: { [key: string]: any } = publisher_config[publisher_name];
    let table = publisher.table as string;
    scrape(publisher).then(
        rows => {
            news_db.run(
                `CREATE TABLE IF NOT EXISTS ${table} (title TEXT, link TEXT)`, [],
                () => {
                    rows.map(row => {
                        news_db.get(
                            `SELECT * FROM ${table} WHERE link = ?`,
                            [row.link],
                            (_err, value) => {
                                if (typeof value !== "undefined") return;

                                savedata(row, table);
                            }
                        );
                    });
                }
            );
        },
        console.error
    );
}

function task() {
    for (let publisher_name of publisher_names) {
        loop(publisher_name);
    }
}

function onReady() {
    console.log(`Ready!`);

    discord_db.run(
        "CREATE TABLE IF NOT EXISTS Channels (channel TEXT)", [],
        () => {
            discord_db.each(
                "SELECT * FROM Channels", [],
                (_err, row) => {
                    if (!channels.includes(row.channel)) {
                        channels.push(row.channel);
                    }
                }
            );
        }
    );
}

function onMessage(msg: Discord.Message) {
    if (msg.content === command + "ping") {
        console.log("PING");
        msg.channel.send("<< Ping");
    } else if (msg.content === command + "save") {
        console.log("SAVE");
        for (let publisher_name of publisher_names) {
            save(publisher_name);
        }
    } else if (msg.content === command + "register") {
        console.log("REGISTER");
        if (!channels.includes(msg.channel.id)) {
            channels.push(msg.channel.id);
        }
        discord_db.get(
            "SELECT * FROM Channels WHERE channel = ?",
            [msg.channel.id],
            (_err, value) => {
                if (typeof value !== "undefined") return;

                discord_db.run(
                    "INSERT INTO Channels VALUES (?)",
                    [msg.channel.id]
                );
            }
        );
    } else if (msg.content === command + "unregister") {
        console.log("UNREGISTER");
        for (let index = 0; index < channels.length; index++) {
            if (channels[index] === msg.channel.id) {
                channels.splice(index, 1);
            }
        }
        discord_db.get(
            "SELECT * FROM Channels WHERE channel = ?",
            [msg.channel.id],
            (_err, value) => {
                if (typeof value === "undefined") return;

                discord_db.run(
                    "DELETE FROM Channels WHERE channel = ?",
                    [msg.channel.id]
                );
            }
        );
    } else if (msg.content === command + "run") {
        console.log("RUN");
        if (!running) {
            timeout = client.setInterval(task, timer_interval);
            running = true;
        }
    } else if (msg.content === command + "stop") {
        console.log("STOP");
        if (running && typeof timeout !== "undefined") {
            client.clearInterval(timeout);
            running = false;
        }
    } else if (msg.content === command + "is-running") {
        if (running) {
            msg.channel.send("Is running");
        } else {
            msg.channel.send("Is not running");
        }
    } else if (msg.content === command + "load-config") {
        console.log("RELOAD CONFIG");
        if (!running) {
            load_config();
        }
    }
}

//====== MAIN

load_config();

const client = new Discord.Client();

client.on("ready", onReady);
client.on("message", onMessage);
client.login(token);


