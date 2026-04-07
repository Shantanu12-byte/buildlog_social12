const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION ---
// These are the same credentials found in codenid/lib/supabase.ts
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://trnfhlmwmagsdhabswsl.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybmZobG13bWFnc2RoYWJzd3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTc5NjUsImV4cCI6MjA4OTA3Mzk2NX0.k70D6gXb2eDF1raEodQFlk8vnQ5qNlw--fZVrMYmwwA';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DUMMY_PROFILES = [
  {
    username: 'pixel_pioneer',
    bio: 'UI/UX Designer turned Frontend Engineer. Obsessed with micro-interactions.',
    skills: ['React', 'Framer Motion', 'TypeScript'],
  },
  {
    username: 'backend_boss',
    bio: 'Distributed systems and database optimization. I make things go fast.',
    skills: ['Go', 'PostgreSQL', 'Redis', 'Kubernetes'],
  },
  {
    username: 'rust_renegade',
    bio: 'Safe systems programming. Rust enthusiast and open source contributor.',
    skills: ['Rust', 'Wasm', 'C++'],
  },
  {
    username: 'coffee_coder',
    bio: 'Fullstack developer and coffee connoisseur. Building products for humans.',
    skills: ['Next.js', 'Node.js', 'TailwindCSS'],
  },
  {
    username: 'git_guru',
    bio: 'DevOps wizard. Automating everything from CI/CD to my morning coffee.',
    skills: ['Docker', 'AWS', 'Terraform', 'GitHub Actions'],
  }
];

const DUMMY_PROJECTS = [
  {
    username: 'pixel_pioneer',
    title: 'Glassmorphism UI Kit',
    description: 'A comprehensive collection of glassy components for modern web apps.',
    caption: 'Just released the v1 of my Glassmorphism UI kit! Those blur effects are finally perfect. ✨',
    skills: ['React', 'CSS'],
  },
  {
    username: 'backend_boss',
    title: 'FastStream API',
    description: 'A high-performance streaming API built with Go.',
    caption: 'Achieved 100k requests per second on a single instance today. Go routines are pure magic. 🚀',
    skills: ['Go', 'gRPC'],
  },
  {
    username: 'rust_renegade',
    title: 'Oxidized Engine',
    description: 'A game engine written entirely in Rust for maximum safety and performance.',
    caption: 'Cleaning the render pipeline. No segments faults here! memory safety feels like a superpower. 🛡️',
    skills: ['Rust', 'Vulkan'],
  },
  {
    username: 'coffee_coder',
    title: 'Focus Pomodoro',
    description: 'A minimalist focus timer with zen sounds and deep work tracking.',
    caption: 'Building this for my own productivity. The secret is in the simplicity. ☕️',
    skills: ['TypeScript', 'Next.js'],
  },
  {
    username: 'git_guru',
    title: 'AutoDeploy Bot',
    description: 'A bot that automatically sets up your deployment pipeline in minutes.',
    caption: 'Automation is the only way forward. Stop doing manual work! 🤖',
    skills: ['GitHub Actions', 'Docker'],
  }
];

async function seed() {
  console.log('--- SEEDING DUMMY DATA ---');

  // Note: Since we don't have the User IDs for these dummy names (and we can't create Auth users easily via script),
  // we will try to find a user in the 'profiles' table to use as the base author, 
  // OR we will create profiles with random UUIDs if the DB allows (unlikely due to FK constraints to auth.users).
  
  // STRATEGY: Find the first available user in the profiles table to act as the "Master Seed User"
  // and use their ID for author_id, but vary the 'username' field in the posts if possible.
  
  try {
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, username').limit(1);
    if (profileErr || !profiles || profiles.length === 0) {
      console.error('Error: No users found in the system to attribute posts to. Please sign up at least once.');
      return;
    }

    const masterUser = profiles[0];
    console.log(`Using Master User: ${masterUser.username} (${masterUser.id})`);

    // In a real scenario, we'd create actual users. For this dummy diversification, 
    // we'll insert posts into the 'posts' table.
    
    // We also need project IDs. Let's create some projects first.
    console.log('Creating dummy projects...');
    
    for (const proj of DUMMY_PROJECTS) {
      // 1. Create Project
      const { data: newProj, error: projErr } = await supabase.from('projects').insert({
        user_id: masterUser.id,
        title: proj.title,
        description: proj.description,
        needed_skills: proj.skills,
        status: 'active',
      }).select().single();

      if (projErr) {
        console.error(`Error creating project ${proj.title}:`, projErr.message);
        continue;
      }

      console.log(`Created Project: ${proj.title}`);

      // 2. Create Post
      const { error: postErr } = await supabase.from('posts').insert({
        author_id: masterUser.id,
        user_id: masterUser.id, // Some schemas use user_id
        project_id: newProj.id,
        projectTitle: proj.title,
        caption: proj.caption,
        username: proj.username, // DIVERSIFICATION: This is where we swap the name!
        created_at: new Date().toISOString(), // Use current time for visibility
      });

      if (postErr) {
        console.error(`Error creating post for ${proj.title}:`, postErr.message);
      } else {
        console.log(`Created Post by: ${proj.username}`);
      }
    }

    console.log('\n--- SEEDING COMPLETE ---');
    console.log('Refresh your homepage to see the new diverse activity.');

  } catch (err) {
    console.error('Unexpected error during seeding:', err);
  }
}

seed();
