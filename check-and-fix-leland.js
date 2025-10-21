import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ebdwtjdizsdfanjaihnz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZHd0amRpenNkZmFuamFpaG56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTIzODUsImV4cCI6MjA3NjU2ODM4NX0._hbBUdagU4EjrvpXKeOC61lXQllQX0yjdMTEPliSG3w'
);

// First try to sign in with Leland's credentials
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'leland@candlstrategy.com',
  password: 'GoBrowns333'
});

if (error) {
  console.log('Cannot sign in:', error.message);
  console.log('The account exists but password may be different or needs to be reset.');
} else {
  console.log('Sign in successful!');
  console.log('User ID:', data.user.id);
  console.log('Email:', data.user.email);
  
  // Check if admin record exists
  const { data: adminData, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', data.user.id)
    .single();
    
  if (adminError) {
    console.log('No admin record found. This needs to be added manually via SQL.');
  } else {
    console.log('Admin record exists:', adminData);
  }
}
