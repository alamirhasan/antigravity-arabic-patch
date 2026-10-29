const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// محاولة جلب أداة asar
let asar;
try {
  asar = require('@electron/asar');
} catch (e) {
  console.log('📦 Installing @electron/asar locally...');
  execSync('npm install --no-save @electron/asar', { stdio: 'inherit' });
  asar = require('@electron/asar');
}

// مسار Antigravity التلقائي على ويندوز
const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Local');
const resourcesDir = path.join(localAppData, 'Programs', 'antigravity', 'resources');
const asarPath = path.join(resourcesDir, 'app.asar');
const backupPath = path.join(resourcesDir, 'app.asar.bak');
const extractDir = path.join(resourcesDir, 'app_extracted_patch');

if (!fs.existsSync(asarPath)) {
  console.error(`❌ لم يتم العثور على ملف app.asar في المسار التالي:`);
  console.error(asarPath);
  console.error(`يرجى التأكد من أن تطبيق Antigravity مثبت.`);
  process.exit(1);
}

async function runPatch() {
  try {
    console.log('🚀 بدء تطبيق الترقيع الذكي للغة العربية على Antigravity...');

    // 1. نسخة احتياطية
    if (!fs.existsSync(backupPath)) {
      console.log('💾 إنشاء نسخة احتياطية app.asar.bak...');
      fs.copyFileSync(asarPath, backupPath);
    }

    // 2. فك الضغط
    console.log('📂 فك ضغط app.asar...');
    if (fs.existsSync(extractDir)) {
      fs.rmSync(extractDir, { recursive: true, force: true });
    }
    asar.extractAll(asarPath, extractDir);

    // 3. تعديل preload.js
    const preloadPath = path.join(extractDir, 'dist', 'preload.js');
    if (!fs.existsSync(preloadPath)) {
      throw new Error(`الملف preload.js غير موجود في المسار المفكوك!`);
    }

    const snippet = fs.readFileSync(path.join(__dirname, 'patch-snippet.js'), 'utf8');
    let preloadContent = fs.readFileSync(preloadPath, 'utf8');

    // إزالة أي ترقيع سابق إن وجد
    preloadContent = preloadContent.replace(/\/\* Antigravity Arabic RTL Patch \*\/[\s\S]*$/, '');

    // إضافة الترقيع
    const updatedContent = preloadContent + '\n\n/* Antigravity Arabic RTL Patch */\n' + snippet;
    fs.writeFileSync(preloadPath, updatedContent, 'utf8');
    console.log('✍️ تم حقن كود الدعم الذكي للغة العربية في preload.js.');

    // 4. إعادة الحزم
    const repackedAsar = path.join(resourcesDir, 'app.asar.patched');
    console.log('📦 إعادة حزم الملفات...');
    await asar.createPackage(extractDir, repackedAsar);

    // 5. استبدال الملف
    console.log('🔄 استبدال app.asar الأصلي...');
    try {
      fs.copyFileSync(repackedAsar, asarPath);
      fs.unlinkSync(repackedAsar);
      console.log('✅ تم استبدال الملف بنجاح!');
    } catch (err) {
      console.log('⚠️ يبدو أن التطبيق قيد التشغيل حالياً.');
      console.log('تم حفظ الحزمة باسم app.asar.patched في مجلد resources.');
      console.log('أغلق تطبيق Antigravity ثم أعد تسمية الملف إلى app.asar يدويًا.');
    }

    // تنظيف المجلد المؤقت
    fs.rmSync(extractDir, { recursive: true, force: true });

    console.log('\n🎉 تمت العملية بنجاح! أعد تشغيل تطبيق Antigravity للاستمتاع بالقراءة العربية من اليمين لليسار.');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء تطبيق الترقيع:', error);
  }
}

runPatch();
