import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create departments
  const itDept = await prisma.department.upsert({
    where: { name: "Information Technology" },
    update: {},
    create: { name: "Information Technology", description: "IT department" },
  });

  const hrDept = await prisma.department.upsert({
    where: { name: "Human Resources" },
    update: {},
    create: { name: "Human Resources", description: "HR department" },
  });

  const financeDept = await prisma.department.upsert({
    where: { name: "Finance" },
    update: {},
    create: { name: "Finance", description: "Finance & Accounting" },
  });

  const opsDept = await prisma.department.upsert({
    where: { name: "Operations" },
    update: {},
    create: { name: "Operations", description: "Operations & Logistics" },
  });

  // Create branches
  const mainBranch = await prisma.branch.upsert({
    where: { name: "Head Office" },
    update: {},
    create: { name: "Head Office", address: "123 Main Street", city: "Accra", phone: "+233200000000" },
  });

  await prisma.branch.upsert({
    where: { name: "Kumasi Branch" },
    update: {},
    create: { name: "Kumasi Branch", address: "45 Ring Road", city: "Kumasi", phone: "+233200000001" },
  });

  // Create users
  const hashedPassword = await bcryptjs.hash("password123", 12);

  await prisma.user.upsert({
    where: { email: "superadmin@openabv.com" },
    update: {},
    create: {
      email: "superadmin@openabv.com",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      phone: "+233240000001",
      role: "SUPER_ADMIN",
      branchId: mainBranch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@openabv.com" },
    update: {},
    create: {
      email: "admin@openabv.com",
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      phone: "+233240000002",
      role: "ADMIN",
      branchId: mainBranch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "security@openabv.com" },
    update: {},
    create: {
      email: "security@openabv.com",
      password: hashedPassword,
      firstName: "John",
      lastName: "Security",
      phone: "+233240000003",
      role: "SECURITY",
      branchId: mainBranch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "reception@openabv.com" },
    update: {},
    create: {
      email: "reception@openabv.com",
      password: hashedPassword,
      firstName: "Jane",
      lastName: "Reception",
      phone: "+233240000004",
      role: "RECEPTIONIST",
      branchId: mainBranch.id,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@openabv.com" },
    update: {},
    create: {
      email: "staff@openabv.com",
      password: hashedPassword,
      firstName: "Kwame",
      lastName: "Mensah",
      phone: "+233240000005",
      role: "STAFF",
      departmentId: itDept.id,
      branchId: mainBranch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "depthead@openabv.com" },
    update: {},
    create: {
      email: "depthead@openabv.com",
      password: hashedPassword,
      firstName: "Ama",
      lastName: "Owusu",
      phone: "+233240000006",
      role: "DEPARTMENT_HEAD",
      departmentId: hrDept.id,
      branchId: mainBranch.id,
    },
  });

  // Create staff profiles
  await prisma.staffProfile.upsert({
    where: { userId: staffUser.id },
    update: {},
    create: {
      userId: staffUser.id,
      title: "Software Engineer",
      office: "Room 305",
      extension: "2105",
    },
  });

  // Create system settings
  const settings = [
    { key: "app_name", value: "OpenABV", group: "general" },
    { key: "app_tagline", value: "Appointment Booking & Visitor Management", group: "general" },
    { key: "working_hours_start", value: "08:00", group: "schedule" },
    { key: "working_hours_end", value: "17:00", group: "schedule" },
    { key: "appointment_duration_minutes", value: "30", group: "schedule" },
    { key: "require_approval", value: "true", group: "appointments" },
    { key: "send_email_notifications", value: "true", group: "notifications" },
    { key: "send_sms_notifications", value: "true", group: "notifications" },
    { key: "reminder_hours_before", value: "24", group: "notifications" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log("Database seeded successfully!");
  console.log("\nTest accounts:");
  console.log("  Super Admin: superadmin@openabv.com / password123");
  console.log("  Admin:       admin@openabv.com / password123");
  console.log("  Security:    security@openabv.com / password123");
  console.log("  Reception:   reception@openabv.com / password123");
  console.log("  Staff:       staff@openabv.com / password123");
  console.log("  Dept Head:   depthead@openabv.com / password123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
