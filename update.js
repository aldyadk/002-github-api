const cron = require('node-cron');
const axios = require('axios')
const shell = require('shelljs');
const fs = require('fs')
const path = require('path')

const username = 'YOUR_GITHUB_USERNAME_HERE'
const token = 'YOUR_PERSONAL_ACCESS_TOKEN'
const repoName = 'nqa-1'
const filename = 'src/service-worker.js'
const line = 24
const filename2 = 'src/data/config.js'
const line2 = 1

const updates = () => {
  axios
    .get(`https://api.github.com/repos/${username}/${repoName}`, { auth: { username, password: token } })
    .then(res => {
      const removeScript = process.env.SHELL && (process.env.SHELL.includes('bash') || process.env.SHELL.includes('zsh')) ? 'rm -rf target-repo' : 'rd /s /q target-repo'
      shell.exec(removeScript)
      shell.exec(`git clone ${res.data.clone_url.replace('https://', `https://x-access-token:${token}@`)} target-repo`)
      fs.readFile(`target-repo/${filename}`, { encoding: 'utf-8' }, (err, data) => {
        if (!err) {
          data = data.split('\n')
          data[line - 1] = data[line - 1].replace(/\b([.0-9]+)\b/, (match, g1) => {
            const splitted = g1.split('.');
            splitted[splitted.length - 1] = parseInt(splitted[splitted.length - 1]) + 1;
            return splitted.join('.')
          })
          data = data.join('\n')
          fs.writeFile(`target-repo/${filename}`, data, { encoding: 'utf-8' }, () => {
            fs.readFile(`target-repo/${filename2}`, { encoding: 'utf-8' }, (err2, data2) => {
              if (!err2) {
                data2 = data2.split('\n')
                data2[line2 - 1] = data2[line2 - 1].replace(/\b([.0-9]+)\b/, (match, g1) => {
                  const splitted2 = g1.split('.');
                  splitted2[splitted2.length - 1] = parseInt(splitted2[splitted2.length - 1]) + 1;
                  return splitted2.join('.')
                })
                data2 = data2.join('\n')
                fs.writeFile(`target-repo/${filename2}`, data2, { encoding: 'utf-8' }, () => {
                  shell.cd(path.join('target-repo','api'))
                  shell.exec('npm install')
                  shell.exec('node index.js')
                  const target = path.join('..','src','db','output.js')
                  shell.cp('output.js', target)
                  shell.cd('..')
                  shell.exec('git config user.name nodeUpdate')
                  shell.exec('git config user.email tes@mail.com')
                  shell.exec(`git add ${path.join('src','*')} && git commit -m "latest cron update" && git push`)
                  shell.exec('git status')
                })
              }
            })
          })
        } else {
          console.log(err)
        }
      })
    })
    .catch(console.error)
}

updates(); //start execution right away

// scheduled for every next 3 hours
cron.schedule('* */3 * * *', () => {
  updates();
});

