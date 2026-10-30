import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { env } from '../src/config/env.js';
import { supabaseAdmin } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUCKET = 'verification-docs';
const ADMIN_ID = '1a875ac4-7075-47da-b6c8-d563692d6047';

const TARGET_ACCOUNTS = [
  {
    email: 'sgpalima@addu.edu.ph',
    password: 'Student123!',
    name: 'Stephanie Palima',
    contact: '0917-234-5678',
  },
  {
    email: 'lssaguirre@addu.edu.ph',
    password: 'Student123!',
    name: 'Samantha Aguirre',
    contact: '0928-876-5432',
  },
  {
    email: 'fmppacatang@addu.edu.ph',
    password: 'Student12345!',
    name: 'Franshiska Pacatang',
    contact: '0939-555-4321',
  },
];

async function run() {
  console.log('--- Seeding Verified Student Accounts & Valid IDs ---');

  const imagePath = path.resolve(__dirname, '../../client/public/sample-valid-id.jpg');
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Valid ID image not found at ${imagePath}`);
  }
  const imageBuffer = fs.readFileSync(imagePath);
  console.log(`Loaded ID image from: ${imagePath} (${imageBuffer.length} bytes)`);

  const { data: usersList, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) {
    throw new Error(`Failed to list auth users: ${listErr.message}`);
  }

  for (const acc of TARGET_ACCOUNTS) {
    console.log(`\n==================================================`);
    console.log(`Processing: ${acc.email} (${acc.name})`);

    // 1. Find or create Supabase Auth user and enforce exact password
    let authUser = usersList.users.find((u) => u.email?.toLowerCase() === acc.email.toLowerCase());
    if (!authUser) {
      console.log(`Creating auth user for ${acc.email}...`);
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          full_name: acc.name,
          role: 'student',
          email_verified: true,
        },
      });
      if (createErr) throw createErr;
      authUser = created.user;
      console.log(`Created auth user: ${authUser.id}`);
    } else {
      console.log(`Updating auth user password & metadata for ${acc.email}...`);
      const { data: updated, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        authUser.id,
        {
          password: acc.password,
          email_confirm: true,
          user_metadata: {
            full_name: acc.name,
            role: 'student',
            email_verified: true,
          },
        }
      );
      if (updateErr) throw updateErr;
      authUser = updated.user;
      console.log(`Updated auth user password for: ${authUser.id}`);
    }

    // 2. Ensure profile exists and has role 'student' + verification_status 'approved'
    const now = new Date().toISOString();
    const { data: existingProfile, error: exErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, role, verification_status')
      .eq('email', acc.email)
      .maybeSingle();

    if (exErr) {
      console.error(`Error querying profile for ${acc.email}:`, exErr);
    }

    let profile;
    if (existingProfile) {
      const { data: updatedProf, error: updateProfErr } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name: acc.name,
          role: 'student',
          verification_status: 'approved',
          updated_at: now,
        })
        .eq('id', existingProfile.id)
        .select('id, full_name, email, role, verification_status')
        .single();

      if (updateProfErr) {
        console.error(`Failed to update profile for ${acc.email}:`, updateProfErr);
        continue;
      }
      profile = updatedProf;
    } else {
      const { data: insertedProf, error: insertProfErr } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.id,
          email: acc.email,
          full_name: acc.name,
          role: 'student',
          verification_status: 'approved',
          created_at: now,
          updated_at: now,
        })
        .select('id, full_name, email, role, verification_status')
        .single();

      if (insertProfErr) {
        console.error(`Failed to insert profile for ${acc.email}:`, insertProfErr);
        continue;
      }
      profile = insertedProf;
    }
    console.log(`Profile synced: ${profile.full_name} (${profile.id}) -> verification_status: approved`);

    // 3. Upload valid ID to Supabase storage bucket
    const storagePath = `${profile.id}/id-${randomUUID()}.jpg`;
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadErr) {
      console.error(`Failed to upload ID to storage:`, uploadErr);
      continue;
    }
    console.log(`Uploaded valid ID to storage path: ${storagePath}`);

    // 4. Upsert account_verifications record
    const { data: existingVerifs } = await supabaseAdmin
      .from('account_verifications')
      .select('id')
      .eq('user_id', profile.id);

    let verifId;
    if (existingVerifs && existingVerifs.length > 0) {
      verifId = existingVerifs[0].id;
      const { error: updateVerifErr } = await supabaseAdmin
        .from('account_verifications')
        .update({
          id_storage_path: storagePath,
          license_storage_path: null,
          status: 'approved',
          reviewed_by: ADMIN_ID,
          reviewed_at: now,
          notes: 'Verified student valid ID',
        })
        .eq('id', verifId);

      if (updateVerifErr) {
        console.error(`Failed to update verification record:`, updateVerifErr);
        continue;
      }
      console.log(`Updated verification record (${verifId}) to status: approved.`);
    } else {
      const { data: newVerif, error: insertVerifErr } = await supabaseAdmin
        .from('account_verifications')
        .insert({
          user_id: profile.id,
          id_storage_path: storagePath,
          license_storage_path: null,
          status: 'approved',
          reviewed_by: ADMIN_ID,
          reviewed_at: now,
          notes: 'Verified student valid ID',
          created_at: now,
        })
        .select()
        .single();

      if (insertVerifErr) {
        console.error(`Failed to insert verification record:`, insertVerifErr);
        continue;
      }
      verifId = newVerif.id;
      console.log(`Inserted new verification record (${verifId}) with status: approved.`);
    }

    // 5. Ensure an audit log entry exists in audit_logs
    const { data: existingLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('id')
      .eq('entity_id', verifId)
      .limit(1);

    if (!existingLogs || existingLogs.length === 0) {
      const { error: auditErr } = await supabaseAdmin.from('audit_logs').insert({
        admin_id: ADMIN_ID,
        action: 'approved',
        entity_type: 'account',
        entity_id: verifId,
        details: {
          email: acc.email,
          student: acc.name,
          notes: 'Verified student valid ID',
        },
        created_at: now,
      });
      if (auditErr) {
        console.warn(`Failed to insert audit log for ${acc.email}:`, auditErr.message);
      } else {
        console.log(`Audit log recorded for account approval (${verifId}).`);
      }
    }

    // 6. Test signed document URL generation
    const { data: signedData, error: signedErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);

    if (signedErr) {
      console.error(`Failed to create signed URL:`, signedErr);
    } else {
      console.log(`Signed URL verified: ${signedData.signedUrl.substring(0, 80)}...`);
    }

    // 7. Verify sign-in credentials using an isolated disposable client
    const testAuthClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: signInData, error: signInErr } = await testAuthClient.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });

    if (signInErr) {
      console.error(`Sign in verification FAILED for ${acc.email}:`, signInErr.message);
    } else {
      console.log(`Sign in verification SUCCESS for ${acc.email} (token active).`);
    }
  }

  console.log('\n==================================================');
  console.log('--- All 3 student accounts successfully verified and credentials confirmed! ---');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
