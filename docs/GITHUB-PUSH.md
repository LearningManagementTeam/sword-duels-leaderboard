# Push to GitHub (finish in 5 minutes)

Your project is **already saved on your laptop** (git commit done). You only need to put it on GitHub once.

## Step A — Create an empty repo (browser)

1. Open [https://github.com/new](https://github.com/new)
2. **Repository name:** `sword-duels-leaderboard`
3. Leave it **Public** or **Private** (your choice)
4. **Do not** check “Add a README” (leave empty)
5. Click **Create repository**

GitHub shows a page with a URL like:  
`https://github.com/YOUR-USERNAME/sword-duels-leaderboard.git`  
Copy that URL.

## Step B — Tell Cursor to push

In Cursor chat, send:

> Push to `https://github.com/YOUR-USERNAME/sword-duels-leaderboard.git`

(Use your real URL from Step A.)

The agent will connect and push. If macOS asks to sign in to GitHub, approve it.

## Step B alternative — GitHub Desktop (no terminal)

1. Install [GitHub Desktop](https://desktop.github.com/)
2. **File → Add local repository** → choose `Sword Duels Leaderboard` folder
3. **Publish repository** → name `sword-duels-leaderboard`

Done.

## Step B alternative — Terminal (one-time login)

If the agent says “not logged in”, run once in Terminal:

```bash
/tmp/gh_2.67.0_macOS_arm64/bin/gh auth login
```

Choose: GitHub.com → HTTPS → Login with browser.

Then ask the agent to push again.
