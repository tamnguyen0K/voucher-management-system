/**
 * Script để import dữ liệu từ folder data hoặc new_data vào MongoDB
 * Hỗ trợ cả tiếng Anh và tiếng Việt với encoding UTF-8
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

require('dotenv').config({ path: './src/config/dotenv' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voucher_system';
const DATA_FOLDER = process.argv[2] || 'data'; // Mặc định là 'data', có thể dùng 'new_data'

// Parse MongoDB URI để lấy database name
const getDbName = (uri) => {
  const match = uri.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'voucher_system';
};

const dbName = getDbName(MONGODB_URI);
const host = MONGODB_URI.includes('@') 
  ? MONGODB_URI.split('@')[1].split('/')[0]
  : MONGODB_URI.split('//')[1]?.split('/')[0] || 'localhost:27017';

console.log(`📦 Importing data from folder: ${DATA_FOLDER}`);
console.log(`🗄️  Database: ${dbName}`);
console.log(`🔗 Host: ${host}\n`);

const importCollection = async (collectionName, filePath) => {
  const fileName = path.basename(filePath);
  console.log(`📄 Importing ${collectionName} from ${fileName}...`);
  
  try {
    // Kiểm tra file có tồn tại không
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  File không tồn tại: ${filePath}`);
      return false;
    }

    // Kiểm tra encoding của file
    const content = fs.readFileSync(filePath, 'utf8');
    const hasVietnamese = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/.test(content);
    
    if (hasVietnamese) {
      console.log(`   ✓ File chứa tiếng Việt, đảm bảo encoding UTF-8`);
    }

    // Sử dụng mongoimport với encoding UTF-8
    // Format: mongoimport --uri <uri> --db <db> --collection <collection> --file <file> --jsonArray
    const command = `mongoimport --uri "${MONGODB_URI}" --db ${dbName} --collection ${collectionName} --file "${filePath}" --jsonArray --drop`;
    
    const { stdout, stderr } = await execAsync(command, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024 // 10MB
    });

    if (stderr && !stderr.includes('connected to:')) {
      console.log(`   ⚠️  Warning: ${stderr}`);
    }

    if (stdout) {
      console.log(`   ✓ ${stdout.trim()}`);
    } else {
      console.log(`   ✓ Imported successfully`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error importing ${collectionName}:`, error.message);
    if (error.message.includes('ENOENT')) {
      console.error(`   💡 Tip: Đảm bảo mongoimport đã được cài đặt và có trong PATH`);
      console.error(`   💡 Tip: Trên Windows, cài MongoDB Tools từ: https://www.mongodb.com/try/download/database-tools`);
    }
    return false;
  }
};

const main = async () => {
  const dataDir = path.join(__dirname, DATA_FOLDER);
  
  if (!fs.existsSync(dataDir)) {
    console.error(`❌ Folder không tồn tại: ${dataDir}`);
    process.exit(1);
  }

  const collections = [
    { name: 'users', file: 'voucher_system.users.json' },
    { name: 'locations', file: 'voucher_system.locations.json' },
    { name: 'vouchers', file: 'voucher_system.vouchers.json' },
    { name: 'reviews', file: 'voucher_system.reviews.json' },
    { name: 'sessions', file: 'voucher_system.sessions.json' }
  ];

  console.log('🚀 Bắt đầu import dữ liệu...\n');

  const results = [];
  for (const { name, file } of collections) {
    const filePath = path.join(dataDir, file);
    const success = await importCollection(name, filePath);
    results.push({ name, success });
  }

  console.log('\n📊 Kết quả import:');
  results.forEach(({ name, success }) => {
    console.log(`   ${success ? '✓' : '✗'} ${name}`);
  });

  const allSuccess = results.every(r => r.success);
  if (allSuccess) {
    console.log('\n✅ Tất cả dữ liệu đã được import thành công!');
  } else {
    console.log('\n⚠️  Một số collection import thất bại. Vui lòng kiểm tra lại.');
  }
};

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

