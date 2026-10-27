import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';

const dir = 'c:/Users/Acer/Downloads/DormSafe_Final';
const token = process.env.GITHUB_TOKEN;

async function run() {
  try {
    const status = await git.statusMatrix({ fs, dir });
    for (const [filepath, head, workdir, stage] of status) {
      if (head === 1 && workdir === 0) {
        await git.remove({ fs, dir, filepath });
      } else if (workdir === 2) {
        await git.add({ fs, dir, filepath });
      }
    }

    const sha = await git.commit({
      fs,
      dir,
      message: 'feat: add landlord location autocomplete and fix password reset email dispatch',
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
    console.error('Git error:', err);
  } finally {
    try { fs.unlinkSync('c:/Users/Acer/Downloads/DormSafe_Final/client/run_push.mjs'); } catch (e) {}
  }
}
run();
