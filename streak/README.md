> NOTE: Common project-level docs (install, tests, CI, Node version) are consolidated in the root `README.md`.
>
<p align="center">
  <img src="https://i.imgur.com/GZHodUG.png" width="100px"/>
  [## Deployment]

  Deployment instructions (Vercel, Heroku, Docker, self-hosting) have been consolidated in the repository root `README.md`.

  See the root `README.md` for platform-specific guides and environment-variable notes.
### Example

```md
[![GitHub Streak](https://streak-stats.demolab.com/?user=denvercoder1&currStreakNum=2FD3EB&fire=pink&sideLabels=F00&date_format=[Y.]n.j)](https://git.io/streak-stats)
```

## ℹ️ How these stats are calculated

This tool uses the contribution graphs on your GitHub profile to calculate which days you have contributed.

To include contributions in private repositories, turn on the setting for "Private contributions" from the dropdown menu above the contribution graph on your profile page.

Contributions include commits, pull requests, and issues that you create in standalone repositories.

The longest streak is the highest number of consecutive days on which you have made at least one contribution.

The current streak is the number of consecutive days ending with the current day on which you have made at least one contribution. If you have made a contribution today, it will be counted towards the current streak, however, if you have not made a contribution today, the streak will only count days before today so that your streak will not be zero.

> [!NOTE]  
> You may need to wait up to 24 hours for new contributions to show up ([Learn how contributions are counted](https://docs.github.com/articles/why-are-my-contributions-not-showing-up-on-my-profile))

## 📤 Deploying it on your own

It is preferable to host the files on your own server and it takes less than 2 minutes to set up.

Doing this can lead to better uptime and more control over customization (you can modify the code for your usage).

You can deploy the PHP files on any website server with PHP installed including Heroku and Vercel.

The Inkscape dependency is required for PNG rendering, as well as Segoe UI font for the intended rendering. If using Heroku, the buildpacks will install these for you automatically.

### [![Deploy to Vercel](https://github.com/DenverCoder1/github-readme-streak-stats/assets/20955511/5a503e6b-c462-4627-82ee-651f2cb2a1fc)][verceldeploy]

Vercel is the recommended option for hosting the files since it is **free** and easy to set up. Watch the video below or expand the instructions to learn how to deploy to Vercel.

> [!NOTE]  
> PNG mode is not supported since Inkscape will not be installed but the default SVG mode will work.

### 📺 [Click here for a video tutorial on how to self-host on Vercel](https://www.youtube.com/watch?v=maoXtlb8t44)

<details>
  <summary><b>Instructions for deploying to Vercel (Free)</b></summary>

### Step-by-step instructions for deploying to Vercel

#### Option 1: Deploy to Vercel quickly with the Deploy button (recommended)

1. Click the Deploy button below

[![][hspace]](#) [![Deploy with Vercel](https://i.imgur.com/Mb3VLCi.png)][verceldeploy]

2. Create your repository by filling in a Repository Name and clicking "Create"
3. Visit [this link](https://github.com/settings/tokens/new?description=GitHub%20Readme%20Streak%20Stats) to create a new Personal Access Token (no scopes required)
4. Scroll to the bottom and click **"Generate token"**
5. **Add the token** as a Config Var with the key `TOKEN`:

![vercel environment variables](https://github.com/DenverCoder1/github-readme-streak-stats/assets/20955511/17a433d6-0aaa-4c69-9a53-6d4638318fbb)

6. Click **"Deploy"** at the end of the form
7. Once the app is deployed, click the screenshot of your app or continue to the dashboard to find your domain to use in place of `streak-stats.demolab.com`

![deployment](https://github.com/DenverCoder1/github-readme-streak-stats/assets/20955511/32092461-5983-4fed-b21b-29be55ed85e8)

> ⚠️ **Note**
> If you receive an error related to libssl or Node 20.x, you can fix this by opening your Vercel project settings and changing the Node.js version to 18.x.
>
> ![image](https://github.com/DenverCoder1/github-readme-streak-stats/assets/20955511/5fb18fb5-debe-4620-9c8b-193ab442a617)

#### Option 2: Deploy to Vercel manually

1. Sign in to **Vercel** or create a new account at <https://vercel.com>
2. Use the following command to clone the repository: `git clone https://github.com/DenverCoder1/github-readme-streak-stats.git`. If you plan to make changes, you can also fork the repository and clone your fork instead. If you do not have Git installed, you can download it from <https://git-scm.com/downloads>.
3. Navigate to the cloned repository's directory using the command `cd github-readme-streak-stats`
4. Switch to the "vercel" branch using the command `git checkout vercel`
5. Make sure you have the Vercel CLI (Command Line Interface) installed on your system. If not, you can download it from <https://vercel.com/download>.
6. Run the command `vercel` and follow the prompts to link your Vercel account and choose a project name
7. After successful deployment, your app will be available at `<project-name>.vercel.app`
8. Open [this link](https://github.com/settings/tokens/new?description=GitHub%20Readme%20Streak%20Stats) to create a new Personal Access Token on GitHub. You don't need to select any scopes for the token.
9. Scroll to the bottom of the page and click on **"Generate token"**
10. Visit the Vercel dashboard at <https://vercel.com/dashboard> and select your project. Then, click on **"Settings"** and choose **"Environment Variables"**.
11. Add a new environment variable with the key `TOKEN` and the value as the token you generated in step 9, then save your changes
12. To apply the new environment variable, you need to redeploy the app. Run `vercel --prod` to deploy the app to production.

![image](https://user-images.githubusercontent.com/20955511/209588756-8bf5b0cd-9aa6-41e8-909c-97bf41e525b3.png)

> ⚠️ **Note**  
> To set up automatic Vercel deployments from GitHub, make sure to turn **off** "Include source files outside of the Root Directory" in the General settings and use `vercel` as the production branch in the Git settings.

> ⚠️ **Note**  
> If you receive an error related to libssl or Node 20.x, you can fix this by opening your Vercel project settings and changing the Node.js version to 18.x.
>
> ![image](https://github.com/DenverCoder1/github-readme-streak-stats/assets/20955511/5fb18fb5-debe-4620-9c8b-193ab442a617)

</details>

### [![Deploy on Heroku](https://github.com/DenverCoder1/github-readme-streak-stats/assets/20955511/e8b575af-5746-4200-a295-7e7baa448383)][herokudeploy]

Heroku is another great option for hosting the files. All features are supported on Heroku and it is where the default domain is hosted. Heroku is not free, however, and you will need to pay between \$5 and \$7 per month to keep the app running. Expand the instructions below to learn how to deploy to Heroku.

<details>
  <summary><b>Instructions for deploying to Heroku (Paid)</b></summary>
  
### Step-by-step instructions for deploying to Heroku
  
1. Sign in to **Heroku** or create a new account at <https://heroku.com>
2. Visit [this link](https://github.com/settings/tokens/new?description=GitHub%20Readme%20Streak%20Stats) to create a new Personal Access Token (no scopes required)
3. Scroll to the bottom and click **"Generate token"**
4. Click the Deploy button below

[![][hspace]](#) [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)][herokudeploy]

5. **Add the token** as a Config Var with the key `TOKEN`:

![heroku config variables](https://user-images.githubusercontent.com/20955511/136292022-a8d9b3b5-d7d8-4a5e-a049-8d23b51ce9d7.png)

6. Click **"Deploy App"** at the end of the form
7. Once the app is deployed, you can use `<your-app-name>.herokuapp.com` in place of `streak-stats.demolab.com`

</details>

### ![Deploy on your own](https://github.com/DenverCoder1/github-readme-streak-stats/assets/20955511/e36ed842-ab56-473a-83fd-ace5bf968996)

You can transfer the files to any webserver using FTP or other means, then refer to [CONTRIBUTING.md](/CONTRIBUTING.md) for installation steps.

### 🐳 Docker

Docker is a great option for self-hosting with full control over your environment. All features are supported including PNG rendering with Inkscape. Expand the instructions below to learn how to deploy with Docker.

<details>
  <summary><b>Instructions for deploying with Docker</b></summary>

### Step-by-step instructions for deploying with Docker

1. Clone the repository:

   ```bash
   git clone https://github.com/DenverCoder1/github-readme-streak-stats.git
   cd github-readme-streak-stats
   ```

2. Visit https://github.com/settings/tokens/new?description=GitHub%20Readme%20Streak%20Stats to create a new Personal Access Token (no scopes required)

3. Scroll to the bottom and click "Generate token"

4. Build the Docker image:

   ```bash
   docker build -t streak-stats .
   ```

5. Run the container with your GitHub token:

   ```bash
   docker run -d -p 8080:80 -e TOKEN=your_github_token_here streak-stats
   ```

6. Visit http://localhost:8080 to access your self-hosted instance

</details>

[hspace]: https://user-images.githubusercontent.com/20955511/136058102-b79570bc-4912-4369-b664-064a0ada8588.png
[verceldeploy]: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDenverCoder1%2Fgithub-readme-streak-stats%2Ftree%2Fvercel&env=TOKEN&envDescription=GitHub%20Personal%20Access%20Token%20(no%20scopes%20required)&envLink=https%3A%2F%2Fgithub.com%2Fsettings%2Ftokens%2Fnew%3Fdescription%3DGitHub%2520Readme%2520Streak%2520Stats&project-name=streak-stats&repository-name=github-readme-streak-stats
[herokudeploy]: https://heroku.com/deploy?template=https://github.com/DenverCoder1/github-readme-streak-stats/tree/main

## 🤗 Contributing

Contributions are welcome! Feel free to [open an issue](https://github.com/DenverCoder1/github-readme-streak-stats/issues/new/choose) or submit a [pull request](https://github.com/DenverCoder1/github-readme-streak-stats/compare) if you have a way to improve this project.

Make sure your request is meaningful and you have tested the app locally before submitting a pull request.

Refer to [CONTRIBUTING.md](/CONTRIBUTING.md) for more details on contributing, installing requirements, and running the application.

## 🙋‍♂️ Support

💙 If you like this project, give it a ⭐ and share it with friends!

<p align="left">
  <a href="https://www.youtube.com/channel/UCipSxT7a3rn81vGLw9lqRkg?sub_confirmation=1"><img alt="Youtube" title="Youtube" src="https://img.shields.io/badge/-Subscribe-red?style=for-the-badge&logo=youtube&logoColor=white"/></a>
  <a href="https://github.com/sponsors/DenverCoder1"><img alt="Sponsor with Github" title="Sponsor with Github" src="https://img.shields.io/badge/-Sponsor-ea4aaa?style=for-the-badge&logo=github&logoColor=white"/></a>
</p>

[☕ Buy me a coffee](https://ko-fi.com/jlawrence)

---

Made with ❤️ and PHP

<a href="https://heroku.com/"><img alt="Powered by Heroku" title="Powered by Heroku" src="https://img.shields.io/badge/-Powered%20by%20Heroku-6567a5?style=for-the-badge&logo=heroku&logoColor=white"/></a>
