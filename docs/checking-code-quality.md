# Code Quality

To check the code quality of the project, we use [SonarCloud](https://sonarcloud.io/dashboard?id=vh-admin-web). This is a cloud-based code quality and security service. It provides reports on duplicated code, code coverage, code smells, security vulnerabilities and bugs.

To run SonarCloud locally, you will need to install the [SonarScanner for .NET](https://docs.sonarqube.org/latest/analysis/scan/sonarscanner-for-msbuild/). This is a command line tool that works with the .NET build system to run code analysis against a project and upload the results to SonarCloud. Alternatively you can the following command in  terminal to install the scanner:

``` shell
dotnet tool retstore
```

Then, assuming you have Docker installed, you can run the following command to run SonarCloud(SonaQube) locally:

``` shell
docker run -d --name sonarqube -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true -p 9000:9000 sonarqube:latest
```

## Setup SonarQube locally

Navigate to the [SonarQube](http://127.0.0.1:9000) website and login with the following credentials:

username: admin
password: admin

You will be prompted to change the password. Once you have done this, you will be taken to the dashboard.

* Create a project (choose manually) and give it the name `vh-admin-web`
* Give the project key the same value `vh-admin-web`
* Since the free version only supports one branch, set the 'Main branch name' to whatever your local branch is called
* Choose to analyze your project locally (the square with the finger and arrows pointing down)
* Generate a token, call it whatever you please and set the expiration date to never (copy this token for later use)
* Choose `.NET` for the description and `.NET Core` for the build tool
* Copy the instructions for the scanner and paste them into your terminal

```  shell
dotnet sonarscanner begin /k:"vh-admin-web" /d:sonar.host.url="http://127.0.0.1:9000"  /d:sonar.login="<token>"
dotnet build
dotnet sonarscanner end /d:sonar.login="<token>"
```
