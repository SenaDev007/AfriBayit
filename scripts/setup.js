const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up AfriBayit platform...\n');

// Check if .env exists, if not copy from env.example
if (!fs.existsSync('.env')) {
    console.log('📝 Creating .env file from template...');
    fs.copyFileSync('env.example', '.env');
    console.log('✅ .env file created\n');
} else {
    console.log('✅ .env file already exists\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed\n');
} catch (error) {
    console.error('❌ Error installing dependencies:', error.message);
    process.exit(1);
}

// Generate Prisma client
console.log('🔧 Generating Prisma client...');
try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma client generated\n');
} catch (error) {
    console.error('❌ Error generating Prisma client:', error.message);
    process.exit(1);
}

// Run database migrations
console.log('🗄️ Running database migrations...');
try {
    execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
    console.log('✅ Database migrations completed\n');
} catch (error) {
    console.error('❌ Error running migrations:', error.message);
    console.log('💡 Make sure PostgreSQL is running and the database exists\n');
}

// Seed the database
console.log('🌱 Seeding database...');
try {
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Database seeded\n');
} catch (error) {
    console.error('❌ Error seeding database:', error.message);
    console.log('💡 You can run "npm run db:seed" manually later\n');
}

console.log('🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Make sure PostgreSQL is running');
console.log('2. Update the DATABASE_URL in .env if needed');
console.log('3. Run "npm run dev" to start the development server');
console.log('4. Open http://localhost:3000 in your browser');
console.log('\n🌟 Welcome to AfriBayit!');
