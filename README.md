# vh-admin-web

This application provides the book a video hearing functionality for the video hearing case administrator.

## Sonar Cloud

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=vh-admin-web&metric=alert_status)](https://sonarcloud.io/dashboard?id=vh-admin-web)

## Build Status

[![Build Status](https://hmctsreform.visualstudio.com/VirtualHearings/_apis/build/status/hmcts.vh-admin-web?branchName=master)](https://hmctsreform.visualstudio.com/VirtualHearings/_build/latest?definitionId=102&branchName=master)

## Running accessibility linting

In the `ClientApp` folder run `node acessability_lint.js`. Will output a json with any issues.

## Branch name git hook will run on pre commit and control the standard for new branch name

The branch name should start with: feature/VIH-XXXX-branchName  (X - is digit).
If git version is less than 2.9 the pre-commit file from the .githooks folder need copy to local .git/hooks folder.
To change git hooks directory to directory under source control run (works only for git version 2.9 or greater) :
`$ git config core.hooksPath .githooks`

## Commit message

The commit message will be validated by prepare-commit-msg hook.
The commit message format should start with : 'feature/VIH-XXXX : ' folowing by 8 or more characters description of commit, otherwise the warning message will be presented.

## Running the app as a container

Visit the VH-Setup repository for
[Instructions to run as a container locally.](https://github.com/hmcts/vh-setup/tree/main/docs/local-container-setup).

## Running the app with docker compose

``` bash
docker compose -f "AdminWebsite/docker-compose.override.yml" up -d --build 
```
