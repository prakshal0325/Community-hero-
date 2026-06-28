import { PrismaClient, Role, ComplaintStatus, ComplaintCategory, Severity, Priority, ImageType, ChallengeType, AchievementType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.challengeProgress.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.vote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.complaintImage.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.systemSetting.deleteMany();

  // ─── Departments ───────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Roads & Infrastructure',
        description: 'Handles potholes, road damage, and infrastructure maintenance',
        contactEmail: 'roads@municipality.gov',
        contactPhone: '+91-1234567001',
        icon: 'construction',
        color: '#ef4444',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Sanitation & Waste',
        description: 'Manages garbage collection, illegal dumping, and cleanliness',
        contactEmail: 'sanitation@municipality.gov',
        contactPhone: '+91-1234567002',
        icon: 'trash-2',
        color: '#22c55e',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Water & Sewage',
        description: 'Handles water leakage, sewage issues, and drainage',
        contactEmail: 'water@municipality.gov',
        contactPhone: '+91-1234567003',
        icon: 'droplets',
        color: '#3b82f6',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Electrical & Lighting',
        description: 'Manages streetlights, traffic signals, and electrical infrastructure',
        contactEmail: 'electrical@municipality.gov',
        contactPhone: '+91-1234567004',
        icon: 'zap',
        color: '#eab308',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Parks & Environment',
        description: 'Handles fallen trees, park maintenance, and environmental issues',
        contactEmail: 'parks@municipality.gov',
        contactPhone: '+91-1234567005',
        icon: 'trees',
        color: '#10b981',
      },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // ─── Users ─────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('Password@123', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@communityhero.app',
      password: hashedPassword,
      name: 'System Admin',
      phone: '+91-9000000001',
      role: Role.ADMIN,
      isVerified: true,
      points: 0,
      xp: 0,
      level: 1,
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SA',
    },
  });

  const officerUser = await prisma.user.create({
    data: {
      email: 'officer@communityhero.app',
      password: hashedPassword,
      name: 'Rahul Sharma',
      phone: '+91-9000000002',
      role: Role.OFFICER,
      isVerified: true,
      points: 0,
      xp: 0,
      level: 1,
      departmentId: departments[0].id,
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=RS',
    },
  });

  const citizenUser = await prisma.user.create({
    data: {
      email: 'citizen@communityhero.app',
      password: hashedPassword,
      name: 'Priya Patel',
      phone: '+91-9000000003',
      role: Role.CITIZEN,
      isVerified: true,
      points: 450,
      xp: 1250,
      level: 5,
      streak: 7,
      latitude: 19.076,
      longitude: 72.8777,
      address: 'Mumbai, Maharashtra',
      ward: 'Ward A',
      avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=PP',
    },
  });

  // Additional citizen users for leaderboard
  const extraCitizens = await Promise.all([
    prisma.user.create({
      data: {
        email: 'amit@example.com',
        password: hashedPassword,
        name: 'Amit Kumar',
        role: Role.CITIZEN,
        isVerified: true,
        points: 820,
        xp: 2100,
        level: 8,
        streak: 12,
        avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=AK',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sneha@example.com',
        password: hashedPassword,
        name: 'Sneha Reddy',
        role: Role.CITIZEN,
        isVerified: true,
        points: 650,
        xp: 1800,
        level: 7,
        streak: 5,
        avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=SR',
      },
    }),
    prisma.user.create({
      data: {
        email: 'vikram@example.com',
        password: hashedPassword,
        name: 'Vikram Singh',
        role: Role.CITIZEN,
        isVerified: true,
        points: 320,
        xp: 900,
        level: 4,
        streak: 3,
        avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=VS',
      },
    }),
  ]);

  console.log('✅ Created users (admin, officer, citizen + 3 extras)');

  // ─── Badges ────────────────────────────────────────────────
  const badges = await Promise.all([
    prisma.badge.create({
      data: { name: 'First Report', description: 'Submitted your first community report', icon: '🏅', color: '#6366f1', criteria: 'Submit 1 complaint', pointsRequired: 0, category: 'reporting' },
    }),
    prisma.badge.create({
      data: { name: 'Community Hero', description: 'Submitted 50 reports and helped improve the community', icon: '🦸', color: '#ec4899', criteria: 'Submit 50 complaints', pointsRequired: 500, category: 'reporting' },
    }),
    prisma.badge.create({
      data: { name: 'Verified Citizen', description: 'Verified 10 community reports', icon: '✅', color: '#22c55e', criteria: 'Verify 10 complaints', pointsRequired: 100, category: 'verification' },
    }),
    prisma.badge.create({
      data: { name: 'Eagle Eye', description: 'Reported 10 issues that were confirmed and resolved', icon: '🦅', color: '#f59e0b', criteria: '10 confirmed and resolved reports', pointsRequired: 200, category: 'quality' },
    }),
    prisma.badge.create({
      data: { name: 'Streak Master', description: 'Maintained a 30-day active streak', icon: '🔥', color: '#ef4444', criteria: '30 day streak', pointsRequired: 300, category: 'engagement' },
    }),
    prisma.badge.create({
      data: { name: 'Top Contributor', description: 'Reached the top 10 on the monthly leaderboard', icon: '🏆', color: '#eab308', criteria: 'Top 10 monthly leaderboard', pointsRequired: 400, category: 'leaderboard' },
    }),
    prisma.badge.create({
      data: { name: 'Night Owl', description: 'Reported an issue between 10 PM and 6 AM', icon: '🦉', color: '#8b5cf6', criteria: 'Report between 10 PM - 6 AM', pointsRequired: 0, category: 'special' },
    }),
    prisma.badge.create({
      data: { name: 'Photographer', description: 'Uploaded high-quality evidence photos for 20 reports', icon: '📸', color: '#06b6d4', criteria: 'Upload photos for 20 reports', pointsRequired: 150, category: 'reporting' },
    }),
  ]);

  // Assign some badges to citizen
  await prisma.userBadge.createMany({
    data: [
      { userId: citizenUser.id, badgeId: badges[0].id },
      { userId: citizenUser.id, badgeId: badges[2].id },
      { userId: extraCitizens[0].id, badgeId: badges[0].id },
      { userId: extraCitizens[0].id, badgeId: badges[1].id },
      { userId: extraCitizens[0].id, badgeId: badges[3].id },
    ],
  });

  console.log(`✅ Created ${badges.length} badges`);

  // ─── Achievements ──────────────────────────────────────────
  await prisma.achievement.createMany({
    data: [
      { name: 'Reporter I', description: 'Submit 5 reports', icon: '📝', type: AchievementType.REPORTS_SUBMITTED, target: 5, reward: 50 },
      { name: 'Reporter II', description: 'Submit 25 reports', icon: '📋', type: AchievementType.REPORTS_SUBMITTED, target: 25, reward: 150 },
      { name: 'Reporter III', description: 'Submit 100 reports', icon: '📊', type: AchievementType.REPORTS_SUBMITTED, target: 100, reward: 500 },
      { name: 'Verifier I', description: 'Verify 10 reports', icon: '🔍', type: AchievementType.REPORTS_VERIFIED, target: 10, reward: 75 },
      { name: 'Verifier II', description: 'Verify 50 reports', icon: '🔎', type: AchievementType.REPORTS_VERIFIED, target: 50, reward: 250 },
      { name: 'Commentator', description: 'Post 20 comments', icon: '💬', type: AchievementType.COMMENTS_MADE, target: 20, reward: 100 },
      { name: 'Streak Warrior', description: 'Maintain a 7-day streak', icon: '⚡', type: AchievementType.STREAK_DAYS, target: 7, reward: 100 },
      { name: 'Level 10', description: 'Reach level 10', icon: '⭐', type: AchievementType.LEVEL_REACHED, target: 10, reward: 300 },
      { name: 'Point Master', description: 'Earn 1000 points', icon: '💎', type: AchievementType.POINTS_EARNED, target: 1000, reward: 200 },
    ],
  });

  console.log('✅ Created achievements');

  // ─── Challenges ────────────────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  await prisma.challenge.createMany({
    data: [
      { name: 'Daily Reporter', description: 'Submit 2 reports today', type: ChallengeType.DAILY, target: 2, reward: 25, category: 'reporting', startDate: now, endDate: tomorrow },
      { name: 'Daily Verifier', description: 'Verify 3 reports today', type: ChallengeType.DAILY, target: 3, reward: 20, category: 'verification', startDate: now, endDate: tomorrow },
      { name: 'Weekly Warrior', description: 'Submit 10 reports this week', type: ChallengeType.WEEKLY, target: 10, reward: 100, category: 'reporting', startDate: now, endDate: weekEnd },
      { name: 'Community Champion', description: 'Get 5 of your reports verified this month', type: ChallengeType.MONTHLY, target: 5, reward: 200, category: 'quality', startDate: now, endDate: monthEnd },
    ],
  });

  console.log('✅ Created challenges');

  // ─── Sample Complaints ─────────────────────────────────────
  const sampleComplaints = [
    {
      title: 'Large pothole on MG Road causing accidents',
      description: 'A dangerous pothole has formed near the MG Road junction. Multiple vehicles have been damaged and two minor accidents have occurred in the past week. The pothole is approximately 2 feet wide and 8 inches deep.',
      category: ComplaintCategory.POTHOLE,
      severity: Severity.HIGH,
      priority: Priority.HIGH,
      status: ComplaintStatus.IN_PROGRESS,
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'MG Road, Near Junction, Mumbai',
      ward: 'Ward A',
      aiConfidence: 0.94,
      aiTags: ['pothole', 'road-damage', 'accident-risk', 'high-traffic'],
      estimatedCost: 15000,
      estimatedTime: '3-5 days',
      reporterId: citizenUser.id,
      assignedOfficerId: officerUser.id,
      departmentId: departments[0].id,
      verificationCount: 12,
      communityScore: 0.92,
    },
    {
      title: 'Garbage overflow near residential complex',
      description: 'The garbage bin near Sunshine Apartments has been overflowing for 3 days. Stray animals are scattering the waste across the road. Foul smell is affecting residents.',
      category: ComplaintCategory.GARBAGE,
      severity: Severity.MEDIUM,
      priority: Priority.MEDIUM,
      status: ComplaintStatus.ACCEPTED,
      latitude: 19.0830,
      longitude: 72.8900,
      address: 'Sunshine Apartments, Andheri West, Mumbai',
      ward: 'Ward B',
      aiConfidence: 0.89,
      aiTags: ['garbage', 'overflow', 'sanitation', 'health-hazard'],
      estimatedCost: 2000,
      estimatedTime: '1-2 days',
      reporterId: extraCitizens[0].id,
      departmentId: departments[1].id,
      verificationCount: 8,
      communityScore: 0.85,
    },
    {
      title: 'Water pipe burst flooding street',
      description: 'A major water main has burst on Station Road causing significant flooding. Water is flowing into nearby shops and homes. Immediate attention required.',
      category: ComplaintCategory.WATER_LEAKAGE,
      severity: Severity.CRITICAL,
      priority: Priority.URGENT,
      status: ComplaintStatus.WORK_STARTED,
      latitude: 19.0690,
      longitude: 72.8697,
      address: 'Station Road, Dadar, Mumbai',
      ward: 'Ward C',
      aiConfidence: 0.97,
      aiTags: ['water-leak', 'flooding', 'emergency', 'infrastructure'],
      estimatedCost: 50000,
      estimatedTime: '1-2 days',
      reporterId: extraCitizens[1].id,
      assignedOfficerId: officerUser.id,
      departmentId: departments[2].id,
      verificationCount: 22,
      communityScore: 0.98,
    },
    {
      title: 'Multiple streetlights not working in park area',
      description: 'At least 5 streetlights in Joggers Park area have been non-functional for over a week. The dark area has become unsafe for evening walkers and residents.',
      category: ComplaintCategory.BROKEN_STREETLIGHT,
      severity: Severity.MEDIUM,
      priority: Priority.MEDIUM,
      status: ComplaintStatus.ASSIGNED,
      latitude: 19.0630,
      longitude: 72.8300,
      address: 'Joggers Park, Bandra, Mumbai',
      ward: 'Ward D',
      aiConfidence: 0.91,
      aiTags: ['streetlight', 'safety', 'park', 'electrical'],
      estimatedCost: 8000,
      estimatedTime: '2-3 days',
      reporterId: citizenUser.id,
      assignedOfficerId: officerUser.id,
      departmentId: departments[3].id,
      verificationCount: 6,
      communityScore: 0.78,
    },
    {
      title: 'Sewage overflow in residential street',
      description: 'Sewage water is overflowing from the manhole cover on 5th Cross Street. The entire road is flooded with contaminated water. Health hazard for residents.',
      category: ComplaintCategory.SEWAGE_PROBLEM,
      severity: Severity.HIGH,
      priority: Priority.HIGH,
      status: ComplaintStatus.SUBMITTED,
      latitude: 19.0500,
      longitude: 72.8800,
      address: '5th Cross Street, Chembur, Mumbai',
      ward: 'Ward E',
      aiConfidence: 0.93,
      aiTags: ['sewage', 'health-hazard', 'overflow', 'emergency'],
      estimatedCost: 25000,
      estimatedTime: '2-4 days',
      reporterId: extraCitizens[2].id,
      departmentId: departments[2].id,
      verificationCount: 15,
      communityScore: 0.90,
    },
    {
      title: 'Fallen tree blocking entire road',
      description: 'A large neem tree has fallen across the road after last night\'s storm. Traffic is completely blocked and vehicles are being diverted through narrow lanes.',
      category: ComplaintCategory.FALLEN_TREE,
      severity: Severity.HIGH,
      priority: Priority.URGENT,
      status: ComplaintStatus.RESOLVED,
      latitude: 19.0880,
      longitude: 72.8360,
      address: 'Hill Road, Bandra West, Mumbai',
      ward: 'Ward D',
      aiConfidence: 0.96,
      aiTags: ['fallen-tree', 'road-block', 'storm-damage', 'traffic'],
      estimatedCost: 5000,
      estimatedTime: '4-6 hours',
      reporterId: citizenUser.id,
      assignedOfficerId: officerUser.id,
      departmentId: departments[4].id,
      verificationCount: 18,
      communityScore: 0.95,
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Illegal construction waste dumped on vacant lot',
      description: 'Someone has illegally dumped construction debris including concrete, bricks, and metal rods on the vacant lot next to the park. This is a safety hazard for children.',
      category: ComplaintCategory.ILLEGAL_DUMPING,
      severity: Severity.MEDIUM,
      priority: Priority.MEDIUM,
      status: ComplaintStatus.PENDING_REVIEW,
      latitude: 19.0720,
      longitude: 72.8540,
      address: 'Near City Park, Mahim, Mumbai',
      ward: 'Ward C',
      aiConfidence: 0.87,
      aiTags: ['illegal-dumping', 'construction-waste', 'safety-hazard'],
      estimatedCost: 10000,
      estimatedTime: '3-5 days',
      reporterId: extraCitizens[0].id,
      departmentId: departments[1].id,
      verificationCount: 4,
      communityScore: 0.72,
    },
    {
      title: 'Traffic signal completely non-functional at busy intersection',
      description: 'The traffic signal at the Sion junction has been blinking amber for 3 days. During peak hours, the intersection becomes chaotic. Multiple near-miss incidents reported.',
      category: ComplaintCategory.TRAFFIC_SIGNAL_FAILURE,
      severity: Severity.HIGH,
      priority: Priority.HIGH,
      status: ComplaintStatus.ACCEPTED,
      latitude: 19.0410,
      longitude: 72.8620,
      address: 'Sion Junction, Mumbai',
      ward: 'Ward E',
      aiConfidence: 0.92,
      aiTags: ['traffic-signal', 'intersection', 'safety', 'electrical'],
      estimatedCost: 20000,
      estimatedTime: '1-2 days',
      reporterId: extraCitizens[1].id,
      departmentId: departments[3].id,
      verificationCount: 10,
      communityScore: 0.88,
    },
    {
      title: 'Road caved in after heavy rain',
      description: 'A section of road approximately 10 feet long has caved in near the school zone. Underground pipe damage may be the cause. Extremely dangerous for vehicles and pedestrians.',
      category: ComplaintCategory.ROAD_DAMAGE,
      severity: Severity.CRITICAL,
      priority: Priority.URGENT,
      status: ComplaintStatus.IN_PROGRESS,
      latitude: 19.0550,
      longitude: 72.8410,
      address: 'Near DPS School, Parel, Mumbai',
      ward: 'Ward C',
      aiConfidence: 0.95,
      aiTags: ['road-damage', 'cave-in', 'school-zone', 'emergency'],
      estimatedCost: 75000,
      estimatedTime: '5-7 days',
      reporterId: extraCitizens[2].id,
      assignedOfficerId: officerUser.id,
      departmentId: departments[0].id,
      verificationCount: 25,
      communityScore: 0.96,
    },
    {
      title: 'Public bench and dustbin vandalized in garden',
      description: 'Multiple benches have been broken and dustbins overturned in Municipal Garden. Graffiti has been sprayed on the walls. The garden looks neglected.',
      category: ComplaintCategory.PUBLIC_PROPERTY_DAMAGE,
      severity: Severity.LOW,
      priority: Priority.LOW,
      status: ComplaintStatus.SUBMITTED,
      latitude: 19.0800,
      longitude: 72.8750,
      address: 'Municipal Garden, Goregaon, Mumbai',
      ward: 'Ward B',
      aiConfidence: 0.85,
      aiTags: ['vandalism', 'public-property', 'park', 'maintenance'],
      estimatedCost: 12000,
      estimatedTime: '5-7 days',
      reporterId: citizenUser.id,
      departmentId: departments[4].id,
      verificationCount: 3,
      communityScore: 0.65,
    },
  ];

  const createdComplaints = [];
  for (const complaintData of sampleComplaints) {
    const complaint = await prisma.complaint.create({
      data: complaintData,
    });
    createdComplaints.push(complaint);

    // Add status history
    await prisma.statusHistory.create({
      data: {
        fromStatus: null,
        toStatus: ComplaintStatus.SUBMITTED,
        note: 'Report submitted by citizen',
        changedById: complaintData.reporterId,
        complaintId: complaint.id,
      },
    });

    if (complaint.status !== ComplaintStatus.SUBMITTED) {
      await prisma.statusHistory.create({
        data: {
          fromStatus: ComplaintStatus.SUBMITTED,
          toStatus: complaint.status,
          note: 'Status updated',
          changedById: complaintData.assignedOfficerId || officerUser.id,
          complaintId: complaint.id,
        },
      });
    }
  }

  console.log(`✅ Created ${createdComplaints.length} sample complaints with status histories`);

  // ─── Sample Comments ───────────────────────────────────────
  await prisma.comment.createMany({
    data: [
      { content: 'I can confirm this pothole is very dangerous. Almost fell off my bike yesterday!', userId: extraCitizens[0].id, complaintId: createdComplaints[0].id },
      { content: 'Please fix this urgently. School children use this road daily.', userId: extraCitizens[1].id, complaintId: createdComplaints[0].id },
      { content: 'Work has started. Our team is on site.', userId: officerUser.id, complaintId: createdComplaints[0].id },
      { content: 'The smell is unbearable. Please collect the garbage immediately.', userId: citizenUser.id, complaintId: createdComplaints[1].id },
      { content: 'This flooding is causing damage to my shop. Need immediate action!', userId: extraCitizens[2].id, complaintId: createdComplaints[2].id },
    ],
  });

  console.log('✅ Created sample comments');

  // ─── Sample Votes ──────────────────────────────────────────
  await prisma.vote.createMany({
    data: [
      { type: 'VERIFY', userId: extraCitizens[0].id, complaintId: createdComplaints[0].id },
      { type: 'VERIFY', userId: extraCitizens[1].id, complaintId: createdComplaints[0].id },
      { type: 'VERIFY', userId: citizenUser.id, complaintId: createdComplaints[1].id },
      { type: 'VERIFY', userId: extraCitizens[2].id, complaintId: createdComplaints[2].id },
      { type: 'VERIFY', userId: citizenUser.id, complaintId: createdComplaints[2].id },
    ],
  });

  console.log('✅ Created sample votes');

  // ─── System Settings ───────────────────────────────────────
  await prisma.systemSetting.createMany({
    data: [
      { key: 'points_per_report', value: 10 },
      { key: 'points_per_verification', value: 5 },
      { key: 'points_per_comment', value: 2 },
      { key: 'points_per_resolved', value: 25 },
      { key: 'xp_per_report', value: 25 },
      { key: 'xp_per_verification', value: 15 },
      { key: 'xp_per_level', value: 500 },
      { key: 'ai_auto_categorize', value: true },
      { key: 'ai_duplicate_detection', value: true },
      { key: 'ai_priority_detection', value: true },
      { key: 'duplicate_radius_km', value: 0.5 },
      { key: 'verification_threshold', value: 5 },
      { key: 'max_upload_size_mb', value: 10 },
    ],
  });

  console.log('✅ Created system settings');
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('📧 Test Accounts:');
  console.log('   Admin:   admin@communityhero.app   / Password@123');
  console.log('   Officer: officer@communityhero.app / Password@123');
  console.log('   Citizen: citizen@communityhero.app / Password@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
