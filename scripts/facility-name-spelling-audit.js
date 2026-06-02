const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const DEPARTMENT_COLLECTIONS = {
  dept2: [
    'technical_support_visits',
    'remote_technical_supports',
    'introductory_support_visits',
    'queued_support_visits',
    'scheduled_support_visits',
    'accredited_supported_facilities',
  ],
  dept4: [
    'technical_clinical_facilities',
    'technical_clinical_correction_rates',
  ],
  dept5: [
    'admin_audit_facilities',
    'observation_correction_rates',
  ],
  dept6: [
    'accreditation_facilities',
    'completion_facilities',
    'payment_facilities',
    'corrective_plan_facilities',
    'basic_requirements_facilities',
    'appeals_facilities',
    'paid_facilities',
    'medical_professional_registrations',
    'committee_preparation_facilities',
    'certificate_issuance_facilities',
  ],
};

const ALL_TARGET_COLLECTIONS = [...new Set(Object.values(DEPARTMENT_COLLECTIONS).flat())];

const args = process.argv.slice(2);
const options = {
  mode: args[0] || 'dry-run',
  department: 'dept6',
  outputDir: path.join('backups', `facility-name-spelling-${new Date().toISOString().replace(/[:.]/g, '-')}`),
  fromDir: null,
};

for (let i = 1; i < args.length; i += 1) {
  if (args[i] === '--department') options.department = args[++i];
  if (args[i] === '--out') options.outputDir = args[++i];
  if (args[i] === '--from') options.fromDir = args[++i];
}

function initAdmin() {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PROJECT_ID) {
    throw new Error('Missing Firebase Admin credentials in .env.local');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  return admin.firestore();
}

function serialize(value) {
  if (value && typeof value.toDate === 'function') {
    return { __type: 'timestamp', value: value.toDate().toISOString() };
  }

  if (Array.isArray(value)) return value.map(serialize);

  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = serialize(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function stableStringify(value) {
  return JSON.stringify(serialize(value));
}

function hash(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

function isNumericLike(value) {
  return typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value.trim()));
}

function correctFacilityName(value) {
  if (typeof value !== 'string' || isNumericLike(value)) return value;

  return value
    .replace(/وحده(?=\s+طب)/g, 'وحدة')
    .replace(/طب\s+[اأإآ]سر[هة]/g, 'طب أسرة')
    .replace(/مستشفيي(?![\u0600-\u06FF])/g, 'مستشفى')
    .replace(/مستشفي(?![\u0600-\u06FF])/g, 'مستشفى');
}

function withoutFacilityName(record) {
  const clone = { ...record };
  delete clone.facilityName;
  return clone;
}

async function readCollections(db, collections) {
  const data = {};

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    data[collectionName] = {};

    snapshot.forEach((doc) => {
      data[collectionName][doc.id] = serialize(doc.data());
    });
  }

  return data;
}

function readLocalCollections(collections, sourceDir) {
  const data = {};

  for (const collectionName of collections) {
    const filePath = path.join(sourceDir, `${collectionName}.json`);
    if (!fs.existsSync(filePath)) {
      data[collectionName] = {};
      continue;
    }

    data[collectionName] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  return data;
}

function buildAudit(data, collections) {
  const audit = {
    generatedAt: new Date().toISOString(),
    mode: options.mode,
    department: options.department,
    collections: {},
    totals: {
      collections: collections.length,
      records: 0,
      recordsWithFacilityName: 0,
      numericFacilityNameSkipped: 0,
      plannedChanges: 0,
    },
    changes: [],
  };

  for (const collectionName of collections) {
    const docs = data[collectionName] || {};
    const collectionAudit = {
      records: Object.keys(docs).length,
      recordsWithFacilityName: 0,
      numericFacilityNameSkipped: 0,
      plannedChanges: 0,
      hashAllFields: hash(docs),
      hashExcludingFacilityName: hash(
        Object.fromEntries(Object.entries(docs).map(([id, record]) => [id, withoutFacilityName(record)])),
      ),
    };

    audit.totals.records += collectionAudit.records;

    for (const [docId, record] of Object.entries(docs)) {
      if (!Object.prototype.hasOwnProperty.call(record, 'facilityName')) continue;

      collectionAudit.recordsWithFacilityName += 1;
      audit.totals.recordsWithFacilityName += 1;

      const current = record.facilityName;
      if (isNumericLike(current)) {
        collectionAudit.numericFacilityNameSkipped += 1;
        audit.totals.numericFacilityNameSkipped += 1;
        continue;
      }

      const corrected = correctFacilityName(current);
      if (corrected !== current) {
        collectionAudit.plannedChanges += 1;
        audit.totals.plannedChanges += 1;
        audit.changes.push({
          collection: collectionName,
          docId,
          before: current,
          after: corrected,
        });
      }
    }

    audit.collections[collectionName] = collectionAudit;
  }

  return audit;
}

async function applyChanges(db, audit) {
  const writer = db.bulkWriter();

  for (const change of audit.changes) {
    writer.update(db.collection(change.collection).doc(change.docId), {
      facilityName: change.after,
    });
  }

  await writer.close();
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function correctAiExportFile(sourcePath, collections, audit) {
  const exportData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const changeMap = new Map(
    audit.changes.map((change) => [`${change.collection}::${change.docId}`, change.after]),
  );

  for (const collectionName of collections) {
    const records = exportData.collections?.[collectionName];
    if (!Array.isArray(records)) continue;

    records.forEach((record, index) => {
      const key = `${collectionName}::${index}`;
      if (changeMap.has(key)) {
        record.facilityName = changeMap.get(key);
      }
    });
  }

  return exportData;
}

function buildCorrectionVerification(originalData, correctedData, collections, audit) {
  const verification = {
    generatedAt: new Date().toISOString(),
    sourceMode: 'ai-export-correct',
    totals: {
      originalTotalRecords: originalData.summary?.totalRecords ?? null,
      correctedTotalRecords: correctedData.summary?.totalRecords ?? null,
      plannedChanges: audit.totals.plannedChanges,
      appliedFacilityNameChanges: 0,
      unexpectedChanges: 0,
      recordCountChangedCollections: [],
    },
    collections: {},
    unexpectedChanges: [],
  };

  for (const collectionName of Object.keys(originalData.collections || {})) {
    const originalRecords = originalData.collections?.[collectionName];
    const correctedRecords = correctedData.collections?.[collectionName];
    if (!Array.isArray(originalRecords) || !Array.isArray(correctedRecords)) continue;

    const collectionCheck = {
      originalRecords: originalRecords.length,
      correctedRecords: correctedRecords.length,
      facilityNameChanges: 0,
      unexpectedChanges: 0,
    };

    if (originalRecords.length !== correctedRecords.length) {
      verification.totals.recordCountChangedCollections.push(collectionName);
      collectionCheck.unexpectedChanges += 1;
      verification.totals.unexpectedChanges += 1;
    }

    const maxLength = Math.max(originalRecords.length, correctedRecords.length);
    for (let index = 0; index < maxLength; index += 1) {
      const originalRecord = originalRecords[index];
      const correctedRecord = correctedRecords[index];
      if (!originalRecord || !correctedRecord) continue;

      const originalWithoutName = withoutFacilityName(originalRecord);
      const correctedWithoutName = withoutFacilityName(correctedRecord);

      if (hash(originalWithoutName) !== hash(correctedWithoutName)) {
        collectionCheck.unexpectedChanges += 1;
        verification.totals.unexpectedChanges += 1;
        verification.unexpectedChanges.push({
          collection: collectionName,
          index,
          original: originalRecord,
          corrected: correctedRecord,
        });
      }

      if (originalRecord.facilityName !== correctedRecord.facilityName) {
        collectionCheck.facilityNameChanges += 1;
        verification.totals.appliedFacilityNameChanges += 1;
      }
    }

    if (
      collectionCheck.facilityNameChanges > 0 ||
      collectionCheck.unexpectedChanges > 0 ||
      collections.includes(collectionName)
    ) {
      verification.collections[collectionName] = collectionCheck;
    }
  }

  return verification;
}

async function main() {
  if (!['backup', 'dry-run', 'local-dry-run', 'ai-export-dry-run', 'ai-export-correct', 'apply'].includes(options.mode)) {
    throw new Error('Usage: node scripts/facility-name-spelling-audit.js <backup|dry-run|local-dry-run|ai-export-dry-run|ai-export-correct|apply> [--department dept6|all] [--from backupDirOrAiExportJson] [--out dir]');
  }

  const collections = options.department === 'all'
    ? ALL_TARGET_COLLECTIONS
    : DEPARTMENT_COLLECTIONS[options.department];

  if (!collections) {
    throw new Error(`Unknown department: ${options.department}`);
  }

  const db = ['local-dry-run', 'ai-export-dry-run', 'ai-export-correct'].includes(options.mode) ? null : initAdmin();
  const data = options.mode === 'local-dry-run'
    ? readLocalCollections(collections, options.fromDir)
    : ['ai-export-dry-run', 'ai-export-correct'].includes(options.mode)
      ? JSON.parse(fs.readFileSync(options.fromDir, 'utf8')).collections || {}
      : await readCollections(db, collections);
  writeJson(path.join(options.outputDir, `${options.mode}-data.json`), data);

  const audit = buildAudit(data, collections);
  writeJson(path.join(options.outputDir, `${options.mode}-audit.json`), audit);

  if (options.mode === 'apply') {
    await applyChanges(db, audit);

    const afterData = await readCollections(db, collections);
    writeJson(path.join(options.outputDir, 'after-apply-data.json'), afterData);
    writeJson(path.join(options.outputDir, 'after-apply-audit.json'), buildAudit(afterData, collections));
  }

  if (options.mode === 'ai-export-correct') {
    const originalExportData = JSON.parse(fs.readFileSync(options.fromDir, 'utf8'));
    const correctedExportData = correctAiExportFile(options.fromDir, collections, audit);
    const verification = buildCorrectionVerification(originalExportData, correctedExportData, collections, audit);

    writeJson(path.join(options.outputDir, 'corrected-ai-export.json'), correctedExportData);
    writeJson(path.join(options.outputDir, 'correction-verification.json'), verification);
  }

  console.log(JSON.stringify({
    mode: options.mode,
    department: options.department,
    outputDir: options.outputDir,
    totals: audit.totals,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
