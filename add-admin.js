import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHd0amRpenNkZmFuamFpaG56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5MjM4NSwiZXhwIjoyMDc2NTY4Mzg1fQ.Zf5TpZdRGv0u8bxVGOGXO7ckEqEFqKo_2UpxbZcmSrY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdmin() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  console.log('Found users:', users.users.map(u => u.email));

  const adminUser = users.users.find(u => u.email === 'admin@test.com');

  if (!adminUser) {
    console.error('User admin@test.com not found in list');
    return;
  }

  const { data, error } = await supabase
    .from('admin_users')
    .insert({
      id: adminUser.id,
      email: adminUser.email,
      full_name: 'Admin User',
      role: 'admin',
      is_active: true
    });

  if (error) {
    if (error.message.includes('duplicate')) {
      console.log('Admin user already exists');
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('Success! Admin user added:', adminUser.id);
  }
}

addAdmin();
