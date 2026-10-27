import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';

const dir = 'c:/Users/Acer/Downloads/DormSafe_Final';
const token = process.env.GITHUB_TOKEN;

async function run() {
  try {
    const status = await git.statusMatrix({ fs, dir });
    const changed = status.filter(row => row[1] !== row[2] || row[2] !== row[3]);
    console.log('Staging files:', changed.length);
    
    for (const [filepath, a, b, c] of changed) {
      if (b !== 0) {
        await git.add({ fs, dir, filepath });
        console.log('Staged:', filepath);
      } else {
        await git.remove({ fs, dir, filepath });
        console.log('Removed:', filepath);
      }
    }

    const sha = await git.commit({
      fs,
      dir,
      message: 'feat(map): enhance live GPS accuracy with student location detection and Google Maps walking/driving calibration',
      author: { name: 'Tep-pet', email: 'dormsafeateneo@gmail.com' }
    });
    console.log('Committed:', sha);

    for (const branch of ['chae', 'main']) {
      await git.branch({ fs, dir, ref: branch, object: sha, force: true });
      await git.push({
        fs,
        http,
        dir,
        remote: 'origin',
        ref: branch,
        onAuth: () => ({ username: token, password: '' })
      });
      console.log('Pushed branch:', branch);
    }
  } catch (err) {
    console.error('Git push error:', err);
  } finally {
    try { fs.unlinkSync('c:/Users/Acer/Downloads/DormSafe_Final/client/run_push.mjs'); } catch (e) {}
  }
}
run();
