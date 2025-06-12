import { Status } from '@/lib/types';
import { PrismaClient } from '@prisma/client';

const boards = [
  {
    name: 'WebsiteRedesign',
    image:
      'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?q=80&w=578&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tasks: [
      {
        title: 'Research Competitor Websites',
        description: 'Analyze competitor websites for design trends.',
        order: 1,
        status: 'TODO',
      },
      {
        title: 'Create Wireframes',
        description: 'Design homepage and landing page wireframes.',
        order: 2,
        status: 'IN_PROGRESS',
      },
      {
        title: 'Design UI Components',
        description: 'Create UI kit for buttons, forms, and navigation.',
        order: 3,
        status: 'TODO',
      },
      {
        title: 'Develop Responsive Header',
        description: 'Implement and test responsive navigation.',
        order: 4,
        status: 'IN_PROGRESS',
      },
      { title: 'Optimize Images', description: 'Compress images for better performance.', order: 5, status: 'DONE' },
      { title: 'Improve Page Load Speed', description: 'Reduce render-blocking resources.', order: 6, status: 'TODO' },
      { title: 'Add SEO Metadata', description: 'Optimize for search engines.', order: 7, status: 'IN_PROGRESS' },
      { title: 'Implement Dark Mode', description: 'Add a toggle for dark mode.', order: 8, status: 'TODO' },
      { title: 'Fix CSS Bugs', description: 'Resolve layout inconsistencies.', order: 9, status: 'IN_PROGRESS' },
    ],
  },
  {
    name: 'MobileAppDevelopment',
    image:
      'https://images.unsplash.com/photo-1601972602237-8c79241e468b?q=80&w=578&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tasks: [
      {
        title: 'Define MVP Features',
        description: 'List core features for the first release.',
        order: 1,
        status: 'TODO',
      },
      { title: 'Create Wireframes', description: 'Design user flow and app layout.', order: 2, status: 'DONE' },
      {
        title: 'Develop Authentication',
        description: 'Implement login, signup, and social login.',
        order: 3,
        status: 'IN_PROGRESS',
      },
      { title: 'Set Up Database', description: 'Choose and configure database storage.', order: 4, status: 'TODO' },
      {
        title: 'Implement Push Notifications',
        description: 'Set up Firebase Cloud Messaging.',
        order: 5,
        status: 'DONE',
      },
      { title: 'Optimize App Performance', description: 'Improve speed and battery usage.', order: 6, status: 'TODO' },
      {
        title: 'Create UI Components',
        description: 'Design reusable buttons, cards, and inputs.',
        order: 7,
        status: 'IN_PROGRESS',
      },
      {
        title: 'Develop API Endpoints',
        description: 'Build RESTful APIs for backend integration.',
        order: 8,
        status: 'IN_PROGRESS',
      },
      { title: 'Test on iOS & Android', description: 'Ensure compatibility across devices.', order: 9, status: 'TODO' },
      { title: 'Fix Bugs', description: 'Resolve issues found in testing.', order: 10, status: 'IN_PROGRESS' },
      {
        title: 'Conduct Beta Testing',
        description: 'Invite beta users for early feedback.',
        order: 11,
        status: 'TODO',
      },
      { title: 'Improve UX', description: 'Enhance user experience based on feedback.', order: 12, status: 'TODO' },
      { title: 'Prepare for Launch', description: 'Complete final app store reviews.', order: 13, status: 'TODO' },
    ],
  },
  {
    name: 'MarketingCampaign',
    image:
      'https://plus.unsplash.com/premium_photo-1684179641331-e89c6320b6a9?q=80&w=578&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tasks: [
      {
        title: 'Define Target Audience',
        description: 'Identify the ideal customer profile.',
        order: 1,
        status: 'TODO',
      },
      {
        title: 'Plan Social Media Content',
        description: 'Schedule posts for the next 3 months.',
        order: 2,
        status: 'IN_PROGRESS',
      },
      {
        title: 'Create Facebook Ads',
        description: 'Design ad creatives and set up campaigns.',
        order: 3,
        status: 'TODO',
      },
      {
        title: 'Write Blog Articles',
        description: 'Publish 3 SEO-optimized blog posts.',
        order: 4,
        status: 'IN_PROGRESS',
      },
      { title: 'Analyze Metrics', description: 'Track campaign performance.', order: 8, status: 'TODO' },
      { title: 'Plan Giveaways', description: 'Engage users with promotional giveaways.', order: 9, status: 'TODO' },
      { title: 'Create Video Ads', description: 'Produce engaging video ads.', order: 10, status: 'TODO' },
    ],
  },
  {
    name: 'ProductLaunchPlan',
    image:
      'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?q=80&w=578&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    tasks: [
      {
        title: 'Finalize Product Features',
        description: 'Ensure all features are launch-ready.',
        order: 1,
        status: 'TODO',
      },
      { title: 'Develop Product Demo', description: 'Create a walkthrough video.', order: 2, status: 'IN_PROGRESS' },
      { title: 'Set Up Help Desk', description: 'Prepare a support system for users.', order: 3, status: 'DONE' },
      { title: 'Write Press Release', description: 'Distribute product announcement.', order: 4, status: 'DONE' },
      { title: 'Launch Landing Page', description: 'Go live with the product website.', order: 5, status: 'TODO' },
      {
        title: 'Secure Early Adopters',
        description: 'Attract first users and beta testers.',
        order: 6,
        status: 'IN_PROGRESS',
      },
      {
        title: 'Train Sales Team',
        description: 'Prepare sales team with product knowledge.',
        order: 7,
        status: 'DONE',
      },
    ],
  },
];

const prisma = new PrismaClient();

async function main() {
  try {
    const existingBoards = await prisma.board.findMany();
    if (existingBoards.length > 0) {
      console.log('Boards already exist, skipping seeding');
      return;
    }

    const tasks = [];

    for (const board of boards) {
      const newBoard = await prisma.board.create({
        data: { name: `${board.name}`, image: board.image || '' },
      });

      tasks.push({ boardId: newBoard.id, tasks: board.tasks });
    }

    for (const task of tasks) {
      await prisma.task.createMany({
        data: task.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          status: t.status as Status,
          boardId: task.boardId,
        })),
      });
    }
  } catch (error) {
    console.error(error);
  }
}

export default main;
