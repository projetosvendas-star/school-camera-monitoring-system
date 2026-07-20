import "dotenv/config";
import { supabaseAdmin } from "../lib/supabase-admin";
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
  { name: "CEI CRIANCA FELIZ", code: "CEI-CRIANCA-FELIZ", type: "CEI" },
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

async function seed() {
  console.log("🌱 Seeding database...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const defaultUsers = [
    { name: "Técnico Monitoramento", email: "tecnico@sme.local", password: hashedPassword, role: "tecnico_monitoramento" },
    { name: "Tático Operador", email: "tatico@sme.local", password: hashedPassword, role: "tatico" },
    { name: "Administrativo SME", email: "admin@sme.local", password: hashedPassword, role: "administrativo" },
  ];

  for (const user of defaultUsers) {
    await supabaseAdmin.from("users").upsert(user, { onConflict: "email" });
  }

  for (const school of schoolsData) {
    await supabaseAdmin.from("schools").upsert(school, { onConflict: "code" });
  }

  const { data: allSchools } = await supabaseAdmin.from("schools").select("id, name");

  if (allSchools) {
    for (const school of allSchools) {
      const cameraCount = Math.floor(Math.random() * 3) + 2;
      for (let i = 1; i <= cameraCount; i++) {
        await supabaseAdmin.from("cameras").upsert({
          school_id: school.id,
          name: `Câmera ${i} - ${school.name}`,
          location: i === 1 ? "Entrada Principal" : i === 2 ? "Pátio" : `Corredor ${i - 2}`,
          ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          status: Math.random() > 0.15 ? "online" : Math.random() > 0.5 ? "offline" : "manutencao",
        }, { onConflict: "school_id,name" });
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
