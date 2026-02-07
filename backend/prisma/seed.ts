import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin@123';
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      fullName: 'Admin User',
      role: Role.ADMIN,
    },
  });

  console.log(`✓ Created admin user: ${admin.email}`);

  // Create default learner user
  const learnerEmail = 'learner@example.com';
  const learnerPassword = 'Learner@123';
  const learnerPasswordHash = await bcrypt.hash(learnerPassword, 10);

  const learner = await prisma.user.upsert({
    where: { email: learnerEmail },
    update: {},
    create: {
      email: learnerEmail,
      passwordHash: learnerPasswordHash,
      fullName: 'Learner User',
      role: Role.LEARNER,
    },
  });

  console.log(`✓ Created learner user: ${learner.email}`);

  // Create sample course
  const course = await prisma.course.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Introduction to Python Programming',
      description: 'Learn Python programming from scratch. This comprehensive course covers Python basics, data structures, functions, object-oriented programming, and more.',
      thumbnailUrl: null,
      instructorId: admin.id,
      isPublished: true,
    },
  });

  console.log(`✓ Created sample course: ${course.title}`);

  // Create sample lessons
  const lessons = [
    {
      title: 'Python Basics',
      description: 'Introduction to Python syntax, variables, and data types',
      order: 1,
      contentText: '# Python Basics\n\nPython is a high-level, interpreted programming language known for its simplicity and readability.\n\n## Variables\nVariables in Python are dynamically typed:\n```python\nx = 5\nname = "Python"\nis_active = True\n```',
    },
    {
      title: 'Functions and Modules',
      description: 'Learn how to create and use functions in Python',
      order: 2,
      contentText: '# Functions in Python\n\nFunctions are reusable blocks of code that perform specific tasks.\n\n## Defining Functions\n```python\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("World"))\n```',
    },
    {
      title: 'Object-Oriented Programming',
      description: 'Understanding classes, objects, and OOP principles',
      order: 3,
      contentText: '# Object-Oriented Programming\n\nPython supports OOP with classes and objects.\n\n## Classes\n```python\nclass Person:\n    def __init__(self, name, age):\n        self.name = name\n        self.age = age\n```',
    },
  ];

  for (const lessonData of lessons) {
    const lesson = await prisma.lesson.upsert({
      where: { id: lessonData.order },
      update: {},
      create: {
        ...lessonData,
        courseId: course.id,
      },
    });
    console.log(`✓ Created lesson: ${lesson.title}`);
  }

  // Enroll learner in the sample course
  await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: learner.id,
        courseId: course.id,
      },
    },
    update: {},
    create: {
      userId: learner.id,
      courseId: course.id,
    },
  });

  console.log(`✓ Enrolled learner in sample course`);

  console.log('✅ Database seed completed successfully!');
  console.log('\n📝 Default credentials:');
  console.log(`   Admin:   ${adminEmail} / ${adminPassword}`);
  console.log(`   Learner: ${learnerEmail} / ${learnerPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
