import "dotenv/config";
import { db } from "./index";
import { users, schools, cameras } from "./schema";
import bcrypt from "bcryptjs";

const schoolsData = [
  { name: "CEI LUIZ FELIPE", code: "CEI-LUIZ-FELIPE", type: "CEI" },
  { name: "CEM SAO CRISTOVAO", code: "CEM-SAO-CRISTOVAO", type: "CEM" },
  { name: "CEI ARCO IRIS", code: "CEI-ARCO-IRIS", type: "CEI" },
  { name: "CEI BRUNO LEONARDO", code: "CEI-BRUNO-LEONARDO", type: "CEI" },
  { name: "CEI DOM FRANCO", code: "CEI-DOM-FRANCO", type: "CEI" },
  { name: "CEI MENINO JESUS", code: "CEI-MENINO-JESUS", type: "CEI" },
  { name: "CEI NOSSO LAR", code: "CEI-NOSSO-LAR", type: "CEI" },
  { name: "CEI VASCO PAPA", code: "CEI-VASCO-PAPA", type: "CEI" },
  { name: "CEI CRIANÇA FELIZ", code: "CEI-CRIANCA-FELIZ", type: "CEI" },
  { name: "CEM GUILHERME", code: "CEM-GUILHERME", type: "CEM" },
  { name: "CEM ORLANDO PEREIRA", code: "CEM-ORLANDO-PEREIRA", type: "CEM" },
  { name: "EM MARIA HILDA", code: "EM-MARIA-HILDA", type: "EM" },
  { name: "EM PAULO FREIRE", code: "EM-PAULO-FREIRE", type: "EM" },
  { name: "EM JOSE ANCHIETA", code: "EM-JOSE-ANCHIETA", type: "EM" },
  { name: "ERM ALVARES AZEVEDO", code: "ERM-ALVARES-AZEVEDO", type: "ERM" },
  { name: "ERM CORA CORALINA", code: "ERM-CORA-CORALINA", type: "ERM" },
  { name: "ERM EUCLIDES CUNHA", code: "ERM-EUCLIDES-CUNHA", type: "ERM" },
  { name: "ERM OSVALDO CRUZ", code: "ERM-OSVALDO-CRUZ", type: "ERM" },
  { name: "ERM VINICIUS DE MORAIS", code: "ERM-VINICIUS-DE-MORAIS", type: "ERM" },
  { name: "LOGISTICA SME", code: "LOGISTICA-SME", type: "LOGISTICA" },
  { name: "ALMOXARIFADO", code: "ALMOXARIFADO", type: "ALMOXARIFADO" },
  { name: "MERENDA", code: "MERENDA", type: "MERENDA" },
];

export async function seed() {
  console.log("🌱 Seeding database...");

  // Create default users
  const hashedPassword = await bcrypt.hash("123456", 10);

  const defaultUsers = [
    {
      name: "Técnico Monitoramento",
      email: "tecnico@sme.local",
      password: hashedPassword,
      role: "tecnico_monitoramento" as const,
    },
    {
      name: "Tático Operador",
      email: "tatico@sme.local",
      password: hashedPassword,
      role: "tatico" as const,
    },
    {
      name: "Administrativo SME",
      email: "admin@sme.local",
      password: hashedPassword,
      role: "administrativo" as const,
    },
  ];

  for (const user of defaultUsers) {
    try {
      await db.insert(users).values(user).onConflictDoNothing();
    } catch {
      // user already exists
    }
  }

  // Create schools
  for (const school of schoolsData) {
    try {
      await db.insert(schools).values(school).onConflictDoNothing();
    } catch {
      // school already exists
    }
  }

  // Create sample cameras for each school
  const allSchools = await db.select().from(schools);
  for (const school of allSchools) {
    const cameraCount = Math.floor(Math.random() * 3) + 2; // 2-4 cameras per school
    for (let i = 1; i <= cameraCount; i++) {
      try {
        await db
          .insert(cameras)
          .values({
            schoolId: school.id,
            name: `Câmera ${i} - ${school.name}`,
            location: i === 1 ? "Entrada Principal" : i === 2 ? "Pátio" : `Corredor ${i - 2}`,
            ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            status: Math.random() > 0.15 ? "online" : Math.random() > 0.5 ? "offline" : "manutencao",
          })
          .onConflictDoNothing();
      } catch {
        // camera already exists
      }
    }
  }

  console.log("✅ Seed completed!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
