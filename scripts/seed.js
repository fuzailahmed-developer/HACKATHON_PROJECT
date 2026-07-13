/**
 * MaintainIQ Database Seeder Script
 * Uses Firebase Admin SDK to clear and seed the database with initial demo data.
 * 
 * To Run:
 * 1. Download your service account key file from Firebase Console -> Project Settings -> Service Accounts
 * 2. Save it as `service-account.json` in the root folder of this project.
 * 3. Run: `node scripts/seed.js`
 */

const admin = require("firebase-admin")
const fs = require("fs")
const path = require("path")

const serviceAccountPath = path.join(__dirname, "../service-account.json")

if (!fs.existsSync(serviceAccountPath)) {
  console.error("==========================================================================")
  console.error("ERROR: service-account.json not found in the project root directory!")
  console.error("To seed the database, please download your Firebase Service Account JSON key")
  console.error("and save it as 'service-account.json' in the project root folder.")
  console.error("==========================================================================")
  process.exit(1)
}

const serviceAccount = require(serviceAccountPath)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()
const auth = admin.auth()

const DEMO_ADMIN_EMAIL = "admin@maintainiq.com"
const DEMO_TECH_EMAIL = "tech@maintainiq.com"
const DEMO_PASSWORD = "admin123456" // Used for both

async function seed() {
  console.log("Starting database seed process...")

  // 1. Create or retrieve Authentication users
  let adminUid, techUid

  try {
    const adminUser = await auth.getUserByEmail(DEMO_ADMIN_EMAIL)
    adminUid = adminUser.uid
    console.log(`Found existing admin user: ${DEMO_ADMIN_EMAIL}`)
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      const newUser = await auth.createUser({
        email: DEMO_ADMIN_EMAIL,
        password: DEMO_PASSWORD,
        displayName: "John Admin",
      })
      adminUid = newUser.uid
      console.log(`Created new auth user: ${DEMO_ADMIN_EMAIL}`)
    } else {
      throw error
    }
  }

  try {
    const techUser = await auth.getUserByEmail(DEMO_TECH_EMAIL)
    techUid = techUser.uid
    console.log(`Found existing tech user: ${DEMO_TECH_EMAIL}`)
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      const newUser = await auth.createUser({
        email: DEMO_TECH_EMAIL,
        password: "tech123456",
        displayName: "Marcus Tech",
      })
      techUid = newUser.uid
      console.log(`Created new auth user: ${DEMO_TECH_EMAIL}`)
    } else {
      throw error
    }
  }

  // 2. Set up Firestore Users Collection profile docs
  await db.collection("users").doc(adminUid).set({
    name: "John Admin",
    email: DEMO_ADMIN_EMAIL,
    role: "Admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  await db.collection("users").doc(techUid).set({
    name: "Marcus Tech",
    email: DEMO_TECH_EMAIL,
    role: "Technician",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  })
  console.log("Firestore users collection seeded.")

  // 3. Clear existing Firestore data to avoid duplicate collisions
  const collections = ["assets", "issues", "maintenanceRecords", "assetHistory"]
  for (const col of collections) {
    const snapshot = await db.collection(col).get()
    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    console.log(`Cleared collection: ${col}`)
  }

  // 4. Seed Assets
  const assetsData = [
    {
      name: "Main Server Lobby HVAC Unit A",
      code: "PROJ-0001",
      category: "HVAC",
      location: "Building 1, Server Hall A",
      condition: "Good",
      status: "Operational",
    },
    {
      name: "Freight Elevator Elevator B",
      code: "PROJ-0002",
      category: "Elevator",
      location: "Loading Dock 2, Rear Corridor",
      condition: "Fair",
      status: "Issue Reported",
    },
    {
      name: "Primary Electrical Junction Box",
      code: "PROJ-0003",
      category: "Electrical",
      location: "Basement Power Vault Room B",
      condition: "Excellent",
      status: "Operational",
    },
    {
      name: "Main Water Intake Pumping Valve",
      code: "PROJ-0004",
      category: "Plumbing",
      location: "Basement Utility Room A",
      condition: "Poor",
      status: "Under Maintenance",
    },
    {
      name: "Kitchen Gas Ranges Hood Extractor",
      code: "PROJ-0005",
      category: "General Equipment",
      location: "Floor 1 Kitchen Cafeteria",
      condition: "Good",
      status: "Operational",
    },
    {
      name: "Lobby Fire Sprinkler Control Manifold",
      code: "PROJ-0006",
      category: "Fire Safety",
      location: "Lobby Reception Foyer Area",
      condition: "Excellent",
      status: "Operational",
    },
    {
      name: "Server Rack Backup Generator B",
      code: "PROJ-0007",
      category: "IT Infrastructure",
      location: "Generator Room East Courtyard",
      condition: "Critical",
      status: "Out of Service",
    },
    {
      name: "Roof Central Chillers Compressor A",
      code: "PROJ-0008",
      category: "HVAC",
      location: "Roof Access Level North Section",
      condition: "Good",
      status: "Under Inspection",
    },
  ]

  const assetRefs = {}
  for (const asset of assetsData) {
    const docRef = await db.collection("assets").add({
      ...asset,
      assignedTechnicianId: null,
      lastServiceDate: null,
      nextServiceDate: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    assetRefs[asset.code] = docRef.id
    console.log(`Seeded asset: ${asset.name} (${asset.code})`)

    // Write history log for creation
    await db.collection("assetHistory").add({
      assetId: docRef.id,
      action: `Asset "${asset.name}" registered`,
      actor: "John Admin",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
  }

  // 5. Seed Issues
  const issuesData = [
    {
      issueNumber: "ISS-0001",
      assetCode: "PROJ-0002",
      title: "Elevator cable vibrations",
      description: "Freight elevator makes heavy metallic squeaking when descending between floors 3 and 2.",
      category: "Mechanical Failure",
      priority: "High",
      status: "Assigned",
      assignedTo: techUid,
      reporterName: "Alice Reporter",
      reporterContact: "alice@example.com",
    },
    {
      issueNumber: "ISS-0002",
      assetCode: "PROJ-0004",
      title: "Water Intake Flange Leaking",
      description: "Water valve connection joint is dripping slowly, pooling liquid near primary generator board.",
      category: "Plumbing/Leak",
      priority: "Critical",
      status: "Maintenance In Progress",
      assignedTo: techUid,
      reporterName: "Supervisor Dave",
      reporterContact: "dave@example.com",
    },
    {
      issueNumber: "ISS-0003",
      assetCode: "PROJ-0007",
      title: "Backup generator starter fails",
      description: "Batteries register charge but starter system cuts power immediately when manual crank attempted.",
      category: "Electrical Issue",
      priority: "Critical",
      status: "Reported",
      assignedTo: null,
      reporterName: "Security Shift C",
      reporterContact: "security@example.com",
      aiSuggested: {
        title: "Backup generator starter fails",
        category: "Electrical Issue",
        priority: "Critical",
        possibleCauses: ["Dead starter motor coil", "Corroded ignition switch contacts", "Relay solenoid fault"],
        initialChecks: ["Measure starter coil voltage drop during starter attempt", "Check relay continuity"],
        safetyWarning: "WARNING: High voltage generator starter circuit. Avoid contact with wet areas and isolate battery connections before checking.",
        wasEdited: false,
      },
    },
    {
      issueNumber: "ISS-0004",
      assetCode: "PROJ-0008",
      title: "Roof Chiller compressor cycling",
      description: "Compressor cycles on and off every 45 seconds, blowing warm air to the lobby vents.",
      category: "HVAC/Climate",
      priority: "Medium",
      status: "Inspection Started",
      assignedTo: techUid,
      reporterName: "HR Reception desk",
      reporterContact: null,
    },
  ]

  const issueRefs = {}
  for (const issue of issuesData) {
    const assetId = assetRefs[issue.assetCode]
    const docRef = await db.collection("issues").add({
      issueNumber: issue.issueNumber,
      assetId,
      title: issue.title,
      description: issue.description,
      category: issue.category,
      priority: issue.priority,
      status: issue.status,
      reporterName: issue.reporterName,
      reporterContact: issue.reporterContact,
      evidenceUrls: [],
      assignedTo: issue.assignedTo,
      aiSuggested: issue.aiSuggested || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    issueRefs[issue.issueNumber] = docRef.id
    console.log(`Seeded issue: ${issue.title} (${issue.issueNumber})`)

    // Write history
    await db.collection("assetHistory").add({
      assetId,
      action: `Issue ${issue.issueNumber} reported: ${issue.title}`,
      actor: "Public Reporter",
      relatedIssueId: docRef.id,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })

    if (issue.assignedTo) {
      await db.collection("assetHistory").add({
        assetId,
        action: `Issue ${issue.issueNumber} assigned to Marcus Tech`,
        actor: "John Admin",
        relatedIssueId: docRef.id,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      })
    }
  }

  // 6. Seed a resolved issue + maintenance records
  const resolvedAssetId = assetRefs["PROJ-0001"]
  const resolvedIssueRef = await db.collection("issues").add({
    issueNumber: "ISS-0005",
    assetId: resolvedAssetId,
    title: "Air filter choked HVAC",
    description: "HVAC is showing indicator code Error 4. Restricted airflow noted.",
    category: "HVAC/Climate",
    priority: "Low",
    status: "Resolved",
    reporterName: "Staff Cafeteria",
    reporterContact: null,
    evidenceUrls: [],
    assignedTo: techUid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  await db.collection("maintenanceRecords").add({
    issueId: resolvedIssueRef.id,
    assetId: resolvedAssetId,
    technicianId: techUid,
    findings: "Filter choked with construction dust from hallway remodeling.",
    actionsTaken: "Vacuumed casing. Replaced primary filter mesh with spare MERV-13 filter panel.",
    partsUsed: ["MERV-13 filter mesh panel"],
    cost: 45.0,
    timeSpentMinutes: 30,
    evidenceUrls: [],
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  // Update asset history for Resolved
  await db.collection("assetHistory").add({
    assetId: resolvedAssetId,
    action: "Issue ISS-0005 reported",
    actor: "Public Reporter",
    relatedIssueId: resolvedIssueRef.id,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  })

  await db.collection("assetHistory").add({
    assetId: resolvedAssetId,
    action: "Maintenance completed. Cost: $45.0. Findings: Air filter choked...",
    actor: "Marcus Tech",
    relatedIssueId: resolvedIssueRef.id,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  })

  // Update original asset service fields
  await db.collection("assets").doc(resolvedAssetId).update({
    lastServiceDate: admin.firestore.FieldValue.serverTimestamp(),
    nextServiceDate: admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
    ),
  })

  console.log("Seeding process completed successfully!")
  console.log("==========================================")
  console.log("DEMO ACCOUNTS READY TO USE:")
  console.log(`Admin email: ${DEMO_ADMIN_EMAIL}`)
  console.log(`Tech email: ${DEMO_TECH_EMAIL}`)
  console.log(`Password: ${DEMO_PASSWORD}`)
  console.log("==========================================")
  process.exit(0)
}

seed().catch((err) => {
  console.error("Fatal error during seeding:", err)
  process.exit(1)
})
