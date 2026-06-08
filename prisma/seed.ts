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
    where: { email: "superadmin@visitflow.io" },
    update: {},
    create: {
      email: "superadmin@visitflow.io",
      password: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      phone: "+233240000001",
      role: "SUPER_ADMIN",
      branchId: mainBranch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@visitflow.io" },
    update: {},
    create: {
      email: "admin@visitflow.io",
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      phone: "+233240000002",
      role: "ADMIN",
      branchId: mainBranch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "security@visitflow.io" },
    update: {},
    create: {
      email: "security@visitflow.io",
      password: hashedPassword,
      firstName: "John",
      lastName: "Security",
      phone: "+233240000003",
      role: "SECURITY",
      branchId: mainBranch.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "reception@visitflow.io" },
    update: {},
    create: {
      email: "reception@visitflow.io",
      password: hashedPassword,
      firstName: "Jane",
      lastName: "Reception",
      phone: "+233240000004",
      role: "RECEPTIONIST",
      branchId: mainBranch.id,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff@visitflow.io" },
    update: {},
    create: {
      email: "staff@visitflow.io",
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
    where: { email: "depthead@visitflow.io" },
    update: {},
    create: {
      email: "depthead@visitflow.io",
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
    { key: "app_name", value: "VisitFlow", group: "general" },
    { key: "app_tagline", value: "Smart Appointments. Secure Access.", group: "general" },
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

  // Create meeting rooms
  await prisma.meetingRoom.upsert({
    where: { id: "room-board-1" },
    update: {},
    create: {
      id: "room-board-1",
      name: "Board Room A",
      branchId: mainBranch.id,
      floor: "3rd Floor",
      capacity: 12,
      amenities: JSON.stringify(["projector", "whiteboard", "video_conferencing"]),
    },
  });

  await prisma.meetingRoom.upsert({
    where: { id: "room-conf-1" },
    update: {},
    create: {
      id: "room-conf-1",
      name: "Conference Room B",
      branchId: mainBranch.id,
      floor: "2nd Floor",
      capacity: 6,
      amenities: JSON.stringify(["whiteboard", "tv_screen"]),
    },
  });

  await prisma.meetingRoom.upsert({
    where: { id: "room-small-1" },
    update: {},
    create: {
      id: "room-small-1",
      name: "Meeting Pod C",
      branchId: mainBranch.id,
      floor: "1st Floor",
      capacity: 4,
      amenities: JSON.stringify(["whiteboard"]),
    },
  });

  // Create approval rules
  const approvalRules = [
    {
      name: "Auto-approve VIPs",
      description: "Automatically approve all VIP visitor appointments",
      conditions: JSON.stringify({ visitorType: ["VIP"], trustedVisitor: true }),
      action: "auto_approve",
      priority: 10,
    },
    {
      name: "Block outside hours",
      description: "Block appointments outside 8am-5pm",
      conditions: JSON.stringify({ blockOutsideHours: true, timeRange: { start: "08:00", end: "17:00" } }),
      action: "block",
      priority: 20,
    },
    {
      name: "Limit daily visits",
      description: "Cap at 15 visits per staff member per day",
      conditions: JSON.stringify({ maxDailyVisits: 15 }),
      action: "block",
      priority: 5,
    },
  ];

  for (const rule of approvalRules) {
    const existing = await prisma.approvalRule.findFirst({ where: { name: rule.name } });
    if (!existing) {
      await prisma.approvalRule.create({ data: rule });
    }
  }

  // Create subscription plans
  const subPlans = [
    {
      name: "Free",
      description: "For small offices getting started",
      price: 0,
      currency: "GHS",
      interval: "monthly",
      maxUsers: 3,
      maxBranches: 1,
      maxVisitors: 50,
      maxRooms: 1,
      features: JSON.stringify(["appointments", "walkins", "visitor_log"]),
    },
    {
      name: "Professional",
      description: "For growing organizations",
      price: 199,
      currency: "GHS",
      interval: "monthly",
      maxUsers: 15,
      maxBranches: 3,
      maxVisitors: 500,
      maxRooms: 5,
      features: JSON.stringify(["appointments", "walkins", "visitor_log", "qr_pass", "watchlist", "analytics", "calendar_sync", "badge_printing"]),
    },
    {
      name: "Enterprise",
      description: "For large institutions with advanced needs",
      price: 499,
      currency: "GHS",
      interval: "monthly",
      maxUsers: 100,
      maxBranches: 10,
      maxVisitors: 5000,
      maxRooms: 20,
      features: JSON.stringify(["appointments", "walkins", "visitor_log", "qr_pass", "watchlist", "analytics", "calendar_sync", "badge_printing", "access_control", "kiosk", "contractor_mgmt", "data_retention", "sla_tracking", "api_access"]),
    },
  ];

  for (const plan of subPlans) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      await prisma.subscriptionPlan.create({ data: plan });
    }
  }

  // Create data retention policies
  const retentionPolicies = [
    { entityType: "visitor_log", retentionDays: 365, action: "anonymize" },
    { entityType: "documents", retentionDays: 180, action: "delete" },
    { entityType: "visitor_photo", retentionDays: 90, action: "delete" },
  ];

  for (const policy of retentionPolicies) {
    await prisma.dataRetentionPolicy.upsert({
      where: { entityType: policy.entityType },
      update: {},
      create: policy,
    });
  }

  // Create a demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      name: "Demo Organization",
      slug: "demo-org",
      primaryColor: "#0A2540",
    },
  });

  console.log(`Demo tenant created: ${tenant.name}`);

  console.log("Database seeded successfully!");
  console.log("\nTest accounts:");
  console.log("  Super Admin: superadmin@visitflow.io / password123");
  console.log("  Admin:       admin@visitflow.io / password123");
  console.log("  Security:    security@visitflow.io / password123");
  console.log("  Reception:   reception@visitflow.io / password123");
  console.log("  Staff:       staff@visitflow.io / password123");
  console.log("  Dept Head:   depthead@visitflow.io / password123");
  console.log("\nPro features seeded:");
  console.log("  3 Meeting Rooms");
  console.log("  3 Approval Rules");
  console.log("  3 Subscription Plans (Free, Professional, Enterprise)");
  console.log("  3 Data Retention Policies");
  console.log("  1 Demo Tenant");
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
