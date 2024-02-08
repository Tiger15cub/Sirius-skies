<div style="text-align:center;">
  <img src="assets/SiriusBanner.png" alt="Sirius Banner" style="display:block; margin:auto;">
</div>
  
</div>

# Sirius

Sirius is a universal Fortnite private server backend written in TypeScript.

## Tested / Supported Versions

- **Chapter 1 Season 2** `++Fortnite+Release-1.11-CL-3807424-Windows`
- **Chapter 1 Season 4** `++Fortnite+Release-4.1-CL-405353-Windows`
- **Chapter 1 Season 7** `++Fortnite+Release-7.40-CL-5046157-Windows`
- **Chapter 1 Season 8** `++Fortnite+Release-8.51-CL-6165369-Windows`
- **Chapter 1 Season 9** `++Fortnite+Release-9.10-CL-6639283-Windows`
- **Chapter 1 Season X** `++Fortnite+Release-10.40-CL-9380822-Windows`
- **Chapter 2 Season 1** `++Fortnite+Release-11.31-CL-10800459-Windows`
- **Chapter 2 Season 2** `++Fortnite+Release-12.41-CL-12905909-Windows`
- **Chapter 2 Season 3** `++Fortnite+Release-13.40-CL-14113327-Windows`
- **Chapter 2 Season 4** `++Fortnite+Release-14.60-CL-14786821-Windows`

## Broken Versions

- **Chapter 1 Season 1** `++Fortnite+Release-1.7.2-CL-370011-Windows`
- **Chapter 1 Season 4** `++Fortnite+Release-4.5-CL-4159770-Windows`

## Features

### TODO

- [ ] Weekly Quests
- [ ] Seasonal Quests
- [ ] XP and Leveling up
- [ ] Vbucks on Kill (GameServer endpoint)
- [ ] Stats
- [ ] Arena

### Work In Progress (WIP)

- [-] Voice Chat
- [-] Item Refunding

### Finished

- [x] Basic functionality
- [x] MultiSeason Shop
- [x] Item Shop (24/7)
- [x] OAuth
- [x] TimeLine
- [x] CloudStorage
- [x] Daily Quests
- [x] Shop Purchasing
- [x] Parties
- [x] Friends
- [x] Matchmaking Bans
- [x] Gifting
- [x] Variants (Chapter 1, Chapter 2)
- [x] BattlePass Purchasing
- [x] Party V2 (Kinda Buggy)
- [x] Support a Creator
- [x] ClientSettings Saving

## Getting Started

To get started with `Sirius`, follow these steps:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Skiesuwu/Sirius.git
   ```

2. **Install Node.js:**
   Install the latest version of [Node.js](https://nodejs.org/).

3. **Setting up Environment:**

   - Navigate to the `config` folder
   - Rename `.env.example` to `.env`
   - Edit `CLIENT_SECRET` in the `.env` file and enter your backend client secret (enter a random string of numbers or letters must be 32 characters or more.).

4. **Install Dependencies:**
   Open your command prompt and run:

   ```bash
   npm install
   ```

5. **Build Sirius:**
   Run the command:

   ```bash
   npm run build
   ```

6. **Start Sirius:**
   To start Sirius, run:
   ```bash
   node .
   ```

## Help

If you need help, join the [Discord Server](https://discord.gg/Y3YRVMDxEb)
