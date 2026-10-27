import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/Acer/Downloads/DormSafe_Final';
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('GITHUB_TOKEN not found');
  process.exit(1);
}

const author = {
  name: 'Franshiska Pacatang',
  email: '186857260+rilakkuma404@users.noreply.github.com'
};

async function sync() {
  console.log('Working in git dir:', dir);

  console.log('1. Checking statusMatrix...');
  const status = await git.statusMatrix({ fs, dir });

  for (const [filepath, head, workdir, stage] of status) {
    if (filepath.startsWith('node_modules/') || 
        filepath.startsWith('client/node_modules/') || 
        filepath.startsWith('server/node_modules/') || 
        filepath.startsWith('.vercel/')) {
      continue;
    }

    if (workdir === 0 && (head !== 0 || stage !== 0)) {
      console.log(`git.remove: ${filepath}`);
      await git.remove({ fs, dir, filepath });
    } else if (workdir !== head || workdir !== stage) {
      console.log(`git.add: ${filepath}`);
      await git.add({ fs, dir, filepath });
    }
  }

  console.log('2. Committing changes...');
  const sha = await git.commit({
    fs,
    dir,
    author,
    message: 'fix(vercel): restore multi-service configuration and remove root package.json'
  });
  console.log('Committed SHA:', sha);

  console.log('3. Pushing chae...');
  const resChae = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'chae',
    force: true,
    onAuth: () => ({ username: token, password: '' })
  });
  console.log('Chae pushed:', JSON.stringify(resChae));

  console.log('4. Updating main to latest SHA...');
  await git.branch({ fs, dir, ref: 'main', object: sha, force: true });

  console.log('5. Pushing main...');
  const resMain = await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    force: true,
    onAuth: () => ({ username: token, password: '' })
  });
  console.log('Main pushed:', JSON.stringify(resMain));

  console.log('ALL DONE! Pushed multi-service fix to GitHub.');
}

sync().catch(err => {
  console.error('Git sync error:', err);
  process.exit(1);
});
