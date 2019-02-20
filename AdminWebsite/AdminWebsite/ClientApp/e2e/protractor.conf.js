// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

//const username = process.env.SAUCE_USERNAME;
//const accessKey = process.env.SAUCE_ACCESS_KEY;
//const usernameBooking = process.env.Username_Booking;
//const passwordBooking = procees.env.Password_Booking;

exports.config = {
  allScriptsTimeout: 11000,
  //sauceUser: username,
  //sauceKey: accessKey,
  params: {
    login: {
      usernameBookingUI: 'usernameBooking',
      passwordBookingUI: 'passwordBooking'
    }
  },
  capabilities:
  {
    browserName: 'chrome',
    version: '68',
    platform: 'Windows 10',
    name: "chrome-tests"
    //shardTestFiles: true
    // maxInstances: 25
    //   metadata: {
    //     browser: {
    //         name: 'Chrome',
    //         version: '10'
    //     },
    //     device: 'PC',
    //     platform: {
    //         name: 'Windows',
    //         version: '10'
    //     }
    // }
  },
  directConnect: true,
  baseUrl: 'https://login.microsoftonline.com/fb6e0e22-0da3-4c35-972a-9d61eb256508/oauth2/authorize?response_type=id_token&client_id=a862a2b2-0c27-49f4-95ee-9d969756e58f&redirect_uri=http%3A%2F%2Flocalhost%3A4200%2Fdashboard&state=3d5d92f5-4453-4360-ae52-2961ad341e9f&client-request-id=04ee4b3b-7601-4fcd-9c0a-a946eb2b6a15&x-client-SKU=Js&x-client-Ver=1.0.16&nonce=5eb61cb0-4d87-488b-be23-e5d896781a68&sso_reload=true/',

  // Specs here are the cucumber feature files
  specs: [
    './features/*.feature'
  ],

  plugins: [{
    package: 'protractor-multiple-cucumber-html-reporter-plugin',
    options: {
      // read the options part for more options
      automaticallyGenerateReport: true,
      removeExistingJsonReportFile: true,
      reportName: "Reforms - Book a Hearing Report",
      reportPath: "reports/e2e",
      durationInMS: true,
      jsonOutputPath: "reports/json",
      pageTitle: "Book a Hearing e2e",
      pageFooter: "<p style='color:MediumSeaGreen;'><b>Reforms - Book a Hearing Report</b></p>",
      displayDuration: true,
      removeOriginalJsonReportFile: true
    }
  }],

  // Use a custom framework adapter and set its relative path
  framework: 'custom',
  frameworkPath: require.resolve('protractor-cucumber-framework'),

  // cucumber command line options
  cucumberOpts: {
    // require step definition files before executing features
    require: ['./steps/**/*.ts', './support/**/*.ts'],
    // <string[]> (expression) only execute the features or scenarios with tags matching the expression
    // tags: [],
    // <boolean> fail if there are any undefined or pending steps
    strict: true,
    // <string[]> (type[:path]) specify the output format, optionally supply PATH to redirect formatter output (repeatable)
    format: [
      'json:reports/cucumber_result.json'
    ],
    // <boolean> invoke formatters without executing steps
    dryRun: false,
    // <string[]> ("extension:module") require files with the given EXTENSION after requiring MODULE (repeatable)
    compiler: []
  },

  // Enable TypeScript for the tests
  onPrepare() {
    require('ts-node').register({
      project: 'e2e/tsconfig.e2e.json'
    });
  }
};