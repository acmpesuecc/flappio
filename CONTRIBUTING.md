# Participant: How to Contribute

## 🤝 Contributing to [Flappio]
Thank you for your interest in contributing to this project as part of **HackNight 7.0** 🎉  

1. **Visit the HackNight 7.0 Leaderboard**:
   Browse the leaderboard and choose a repository you'd like to contribute to!

2. **Check for Open Issues**  
   - Look for any open issues in the repository.  
   - If you find one that interests you, ask to be assigned to it by commenting on the issue.  

3. **Setup Your Codebase**:
   - **Optional:** If you are new to Git, check out this guide: [Git Up and Running (Git 101)](https://rowjee.com/blog/git_up_and_running)
   - **Fork** the repository to your GitHub account and copy it's clone URL
   - **Clone** your forked repository to your local machine using [Git](https://docs.github.com/en/get-started/getting-started-with-git/set-up-git) (make sure it's installed)

   ```bash
   git clone git@github.com:your-username/flappio.git
   ```

5. **Make Your Changes**
   After cloning and setting up your branch, make the necessary changes to the code in your IDE.

6. **Commit and Push**:
   Commit your changes and push them to your fork:

   ```bash
   git commit -m "Describe the changes you made"
   git push
   ```

   Alternatively, use VSCode's inbuilt Git source control pane `Ctrl+Shift+G` if you're unconfortable with a CLI

7. **Submit a Pull Request**:
   After pushing your changes, open a pull request to pull changes from your fork to the original repository.

8. **Get Feedback**
   Wait for a maintainer to review your pull request (PR) and provide feedback.

9. **Gain Bounty Points**
   If everything is approved, your issue will be closed, and you'll gain bounty points on the leaderboard!

## Project Structure

The project layout looks like this:
```bash
/flappio
  ├── Backend/         
  │   ├── backend.cjs
  │   └── db_stuff.cjs
  ├── Frontend/        
  │   ├── app.jsx
  │   ├── canvas.js
  │   ├── controls.js
  │   ├── flappy.css
  │   ├── index.html
  │   ├── leaderboard.html
  │   └── simulation.js
  ├── Sprites/         
  ├── server.js        
  ├── package.json
  └── README.md
```
## Pull Request (PR) Guidelines

- Keep PRs focused (one feature/fix per PR).
- Ensure your code builds successfully and passes tests.
- Write meaningful commit messages.
- Add/update documentation if required.
- Request a review once ready.

## Project Rules
- Discuss before adding external libraries.

## Coding & Formatting Conventions

- Indentation: [2 spaces/4 spaces/tabs].
- File naming in [CamelCase,Snake Case,etc].
- Add comments for complex logic.
- Run formatters before committing.

