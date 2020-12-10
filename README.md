# NewsBot

A Discord bot that frequently scrape stock market news.

### Table of Contents

- [NewsBot](#newsbot)
    - [Table of Contents](#table-of-contents)
- [Discord Commands](#discord-commands)
- [Config](#config)
    - [Discord Config](#discord-config)
    - [Publisher Config](#publisher-config)
- [Publisher Templates Checklist](#publisher-templates-checklist)
- [How to Install](#how-to-install)
- [🔰 Commit Emoji Guide](#-commit-emoji-guide)


# Discord Commands

These command must be prefix with `command` characters:
- `ping`:           ping bot
- `register`:       register a channel for notification
- `unregister`:     unregister a channel
- `run`:            start scrape & notify loop
- `stop`:           stop loop
- `save`:           scrape & save news to database;
    use this to intialize bot after restarting service
- `is-running`      check whether the bot is running
- `load-config`     load new config files


# Config

### Discord Config

- `command`:        command to invoke the bot; ex: `>mna-ping`
- `token`:          bot token
- `request`:        request when scraping webpage
- `timer_interval`: how often we scrape

### Publisher Config

Contains a dictionary of configuration for publishers (newspaper).

- [key] `Publishers`:       list of publishers for scraping
- `domain`:                 url domain of newspaper
- `url`:                    url of scraping webpage
- `table`:                  name of table in database
- `articles_path`:          css path to list of news articles
- `title_path`:             css path from `articles_path` to title of articles
- `link_path`:              css path from `articles_path` to href of articles
- `link_with_domain`:       (boolean) `true` if the link has domain url in it;
    if `false`, the bot will append the domain before saving to database


# Publisher Templates Checklist

Mergers n' Acquisition:
- [x] SeekingAlpha
- [x] FT
- [x] BusinessWire
- [x] Reuters
- [x] TheStreet
- [x] ~~NewsNow~~
- [ ] MarketWatch
- [ ] ~~BizJournals~~

Short:
- [x] Citron Research
- [x] Hindenburg Research
- [x] Muddy Water Research
- [x] Spruce Point Research
- [x] White Diamond Research
- [ ] JCapital Research
- [ ] Shadowfall


# How to Install

1. Create directories: build, config, database
2. Run: `npm install`
3. Run: `npm run tsc`
4. Create config files: (examples in template directory)
   - `bot_config.json`
   - `publisher_config.json` 
5. Create `.service` file (example in template directory)
6. Run service


# 🔰 Commit Emoji Guide

| Emoji          | Meaning        |
| -------------- | -------------- |
| :tada:         | Initial Commit |
| :rocket:       | Release        |
| :rewind:       | Revert Changes |
| :bug:          | Bugfix         |
| :package:      | Dependency     |
| :no_entry:     | Deprecation    |
| :book:         | Documentation  |
| :sparkles:     | Features       |
| :construction: | In-Progress    |
| :zap:          | Performance    |
| :recycle:      | Refactoring    |
| :lock:         | Security       |
| :test_tube:    | Tests          |
| :pencil:       | Typos          |
| :lipstick:     | UI / Cosmetic  |
| :bookmark:     | Version        |