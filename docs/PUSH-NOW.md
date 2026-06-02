# One-time: authorize GitHub, then push

Your project is linked to:

**https://github.com/LearningManagementTeam/sword-duels-leaderboard**

The code is ready on your laptop. GitHub just needs you to sign in once.

## Option 1 — GitHub Desktop (easiest)

1. Open **GitHub Desktop**
2. **File → Add local repository** → `Sword Duels Leaderboard` folder
3. If it asks to publish, choose the existing repo **LearningManagementTeam/sword-duels-leaderboard**
4. Click **Push origin**

Refresh the GitHub page — you should see files.

## Option 2 — Browser login in Terminal

1. Open **Terminal** on your Mac
2. Run:

```bash
cd ~/Desktop/Sword\ Duels\ Leaderboard
git push -u origin main
```

3. If a browser or login window opens, sign in to GitHub as **LearningManagementTeam** (or your account with access to that org)
4. Approve access

Run the same `git push` again if needed.

## After push succeeds

Tell Cursor: **"GitHub push done"** — next step is **Vercel**.
