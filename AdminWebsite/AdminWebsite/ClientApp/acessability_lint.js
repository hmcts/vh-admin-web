const { promisify } = require('util');
const { resolve } = require('path');
const pa11y = require('pa11y');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

async function getFiles(dir) {
  const subDirectories = await readdir(dir);
  const files = await Promise.all(subDirectories.map(async (subDirectory) => {
    const res = resolve(dir, subDirectory);
    return (await stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.reduce((a, f) => a.concat(f), []);
}

async function getHtmlFiles() {
  const files = await getFiles('src');
  return files.filter(f => f.endsWith('.html'));
}

function output(str) {
  process.stderr.write(`${str}\n`);
}

async function runPa11y(filename) {
  // ignore rules for automatically added html/body tags
  const ignoreRules = ['WCAG2AA.Principle3.Guideline3_1.3_1_1.H57.2', 'WCAG2AA.Principle2.Guideline2_4.2_4_2.H25.1.NoTitleEl'];
  return await pa11y(filename, { reporter: 'json', ignore: ignoreRules });
}

const run = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = [];
      const files = await getHtmlFiles();
      output(`detected ${files.length} html files to parse`);
      for (let index = 0; index < files.length; index += 1) {
        result.push(await runPa11y(files[index]));
        const doneDegree = Math.round((index / files.length) * 100);
        output(`${doneDegree}% done, completed ${files[index]}`);
      }
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

run()
  .then((res) => console.log(JSON.stringify(res, null, 2)))
  .catch((err) => console.log(err));
