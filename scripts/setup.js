#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎙️  Welcome to TTS Studio Setup!\n');

function createEnvFile() {
  return new Promise((resolve) => {
    rl.question('Enter your Replicate API token (get one from https://replicate.com/account/api-tokens): ', (token) => {
      if (!token.trim()) {
        console.log('❌ API token is required. You can set it up later in .env.local');
        resolve();
        return;
      }

      const envContent = `# Replicate API Configuration
REPLICATE_API_TOKEN=${token.trim()}
`;

      try {
        fs.writeFileSync('.env.local', envContent);
        console.log('✅ Created .env.local with your API token');
      } catch (error) {
        console.log('❌ Error creating .env.local:', error.message);
      }
      
      resolve();
    });
  });
}

async function main() {
  console.log('Setting up your TTS Studio project...\n');

  // Check if .env.local already exists
  if (fs.existsSync('.env.local')) {
    console.log('⚠️  .env.local already exists. Skipping environment setup.');
  } else {
    await createEnvFile();
  }

  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run "npm install" to install dependencies');
  console.log('2. Run "npm run dev" to start the development server');
  console.log('3. Open http://localhost:3000 in your browser');
  console.log('\nFor more information, check the README.md file.');

  rl.close();
}

main().catch(console.error); 