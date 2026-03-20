import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createPost, listPosts, deletePost, getMissingContent, connectPost, historyPosts, getPostFromHistory, clearHistory } from './commands/posts';
import { listIntegrations, getIntegrationSettings, triggerIntegrationTool } from './commands/integrations';
import { getAnalytics, getPostAnalytics } from './commands/analytics';
import { uploadFile } from './commands/upload';
import {
  createGhostPreview,
  listGhostTags,
  listGhostAuthors,
  listGhostTiers,
  listGhostNewsletters,
  listGhostPosts,
  createGhostPost,
  updateGhostPost,
  getGhostStatus,
  changeGhostStatus,
  deleteGhostPost,
  reschedulePost,
  listGhostDrafts,
  cleanupGhostDrafts,
  getGhostThemeSettings
} from './commands/ghost';
import type { Argv } from 'yargs';

yargs(hideBin(process.argv))
  .scriptName('postiz')
  .usage('$0 <command> [options]')
  .command(
    'posts:create',
    'Create a new post',
    (yargs: Argv) => {
      return yargs
        .option('content', {
          alias: 'c',
          describe: 'Post/comment content (can be used multiple times)',
          type: 'string',
        })
        .option('media', {
          alias: 'm',
          describe: 'Comma-separated media URLs for the corresponding -c (can be used multiple times)',
          type: 'string',
        })
        .option('integrations', {
          alias: 'i',
          describe: 'Comma-separated list of integration IDs',
          type: 'string',
        })
        .option('date', {
          alias: 's',
          describe: 'Schedule date (ISO 8601 format) - REQUIRED',
          type: 'string',
        })
        .option('type', {
          alias: 't',
          describe: 'Post type: "schedule" or "draft"',
          type: 'string',
          choices: ['schedule', 'draft'],
          default: 'schedule',
        })
        .option('delay', {
          alias: 'd',
          describe: 'Delay in minutes between comments (default: 0)',
          type: 'number',
          default: 0,
        })
        .option('json', {
          alias: 'j',
          describe: 'Path to JSON file with full post structure',
          type: 'string',
        })
        .option('shortLink', {
          describe: 'Use short links',
          type: 'boolean',
          default: true,
        })
        .option('settings', {
          describe: 'Platform-specific settings as JSON string',
          type: 'string',
        })
        .check((argv) => {
          if (!argv.json && !argv.content) {
            throw new Error('Either --content or --json is required');
          }
          if (!argv.json && !argv.integrations) {
            throw new Error('--integrations is required when not using --json');
          }
          if (!argv.json && !argv.date) {
            throw new Error('--date is required when not using --json');
          }
          return true;
        })
        .example(
          '$0 posts:create -c "Hello World!" -s "2030-12-31T12:00:00Z" -i "twitter-123"',
          'Simple scheduled post'
        )
        .example(
          '$0 posts:create -c "Draft post" -s "2030-12-31T12:00:00Z" -t draft -i "twitter-123"',
          'Create draft post'
        )
        .example(
          '$0 posts:create -c "Main post" -m "img1.jpg,img2.jpg" -s "2030-12-31T12:00:00Z" -i "twitter-123"',
          'Post with multiple images'
        )
        .example(
          '$0 posts:create -c "Main post" -m "img1.jpg" -c "First comment" -m "img2.jpg" -c "Second comment" -m "img3.jpg,img4.jpg" -s "2030-12-31T12:00:00Z" -i "twitter-123"',
          'Post with comments, each having their own media'
        )
        .example(
          '$0 posts:create -c "Main" -c "Comment with semicolon; see?" -c "Another!" -s "2030-12-31T12:00:00Z" -i "twitter-123"',
          'Comments can contain semicolons'
        )
        .example(
          '$0 posts:create -c "Thread 1/3" -c "Thread 2/3" -c "Thread 3/3" -d 5 -s "2030-12-31T12:00:00Z" -i "twitter-123"',
          'Twitter thread with 5 minute delay'
        )
        .example(
          '$0 posts:create --json ./post.json',
          'Complex post from JSON file'
        )
        .example(
          '$0 posts:create -c "Post to subreddit" -s "2030-12-31T12:00:00Z" --settings \'{"subreddit":[{"value":{"subreddit":"programming","title":"My Title","type":"text","url":"","is_flair_required":false}}]}\' -i "reddit-123"',
          'Reddit post with specific subreddit settings'
        )
        .example(
          '$0 posts:create -c "Video description" -s "2030-12-31T12:00:00Z" --settings \'{"title":"My Video","type":"public","tags":[{"value":"tech","label":"Tech"}]}\' -i "youtube-123"',
          'YouTube post with title and tags'
        )
        .example(
          '$0 posts:create -c "Tweet content" -s "2030-12-31T12:00:00Z" --settings \'{"who_can_reply_post":"everyone"}\' -i "twitter-123"',
          'X (Twitter) post with reply settings'
        );
    },
    createPost as any
  )
  .command(
    'posts:list',
    'List all posts',
    (yargs: Argv) => {
      return yargs
        .option('startDate', {
          describe: 'Start date (ISO 8601 format). Default: 30 days ago',
          type: 'string',
        })
        .option('endDate', {
          describe: 'End date (ISO 8601 format). Default: 30 days from now',
          type: 'string',
        })
        .option('customer', {
          describe: 'Customer ID (optional)',
          type: 'string',
        })
        .example('$0 posts:list', 'List all posts (last 30 days to next 30 days)')
        .example(
          '$0 posts:list --startDate "2024-01-01T00:00:00Z" --endDate "2024-12-31T23:59:59Z"',
          'List posts for a specific date range'
        )
        .example(
          '$0 posts:list --customer "customer-id"',
          'List posts for a specific customer'
        );
    },
    listPosts as any
  )
  .command(
    'posts:delete <id>',
    'Delete a post',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Post ID to delete',
          type: 'string',
        })
        .example('$0 posts:delete abc123', 'Delete post with ID abc123');
    },
    deletePost as any
  )
  .command(
    'posts:missing <id>',
    'List available content from the provider for a post with missing release ID',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Post ID',
          type: 'string',
        })
        .example(
          '$0 posts:missing post-123',
          'Get available content to connect to a post'
        );
    },
    getMissingContent as any
  )
  .command(
    'posts:connect <id>',
    'Connect a post to its published content by updating the release ID',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Post ID',
          type: 'string',
        })
        .option('release-id', {
          describe: 'The platform-specific content ID to connect',
          type: 'string',
          demandOption: true,
        })
        .example(
          '$0 posts:connect post-123 --release-id "7321456789012345678"',
          'Connect a post to its published content'
        );
    },
    connectPost as any
  )
  .command(
    'posts:history',
    'Show local post history (posts created via this CLI)',
    (yargs: Argv) => {
      return yargs
        .option('status', {
          describe: 'Filter by status (draft, scheduled, published)',
          type: 'string',
        })
        .option('provider', {
          describe: 'Filter by provider name (e.g., ghost, twitter)',
          type: 'string',
        })
        .option('limit', {
          describe: 'Maximum number of entries to show',
          type: 'number',
          default: 20,
        })
        .option('json', {
          describe: 'Output as JSON',
          type: 'boolean',
          default: false,
        })
        .example('$0 posts:history', 'Show recent post history')
        .example('$0 posts:history --status scheduled', 'Show only scheduled posts')
        .example('$0 posts:history --provider ghost --json', 'Show Ghost posts as JSON');
    },
    historyPosts as any
  )
  .command(
    'posts:get <id>',
    'Get a specific post from local history',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Postiz ID or provider post ID',
          type: 'string',
        })
        .example('$0 posts:get abc123', 'Get post from history by ID');
    },
    getPostFromHistory as any
  )
  .command(
    'posts:clear-history',
    'Clear all local post history',
    (yargs: Argv) => {
      return yargs
        .option('confirm', {
          describe: 'Confirm deletion',
          type: 'boolean',
          default: false,
        })
        .example('$0 posts:clear-history --confirm', 'Clear all history');
    },
    clearHistory as any
  )
  .command(
    'integrations:list',
    'List all connected integrations',
    {},
    listIntegrations as any
  )
  .command(
    'integrations:settings <id>',
    'Get settings schema for a specific integration',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID',
          type: 'string',
        })
        .example(
          '$0 integrations:settings reddit-123',
          'Get settings schema for Reddit integration'
        )
        .example(
          '$0 integrations:settings youtube-456',
          'Get settings schema for YouTube integration'
        );
    },
    getIntegrationSettings as any
  )
  .command(
    'integrations:trigger <id> <method>',
    'Trigger an integration tool to fetch additional data',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID',
          type: 'string',
        })
        .positional('method', {
          describe: 'Method name from the integration tools',
          type: 'string',
        })
        .option('data', {
          alias: 'd',
          describe: 'Data to pass to the tool as JSON string',
          type: 'string',
        })
        .example(
          '$0 integrations:trigger reddit-123 getSubreddits',
          'Get list of subreddits'
        )
        .example(
          '$0 integrations:trigger reddit-123 searchSubreddits -d \'{"query":"programming"}\'',
          'Search for subreddits'
        )
        .example(
          '$0 integrations:trigger youtube-123 getPlaylists',
          'Get YouTube playlists'
        )
        .example(
          '$0 integrations:trigger ghost-456 tags',
          'Get Ghost tags'
        )
        .example(
          '$0 integrations:trigger ghost-456 preview -d \'{"title":"Test","html":"<p>Content</p>"}\'',
          'Create Ghost preview draft'
        );
    },
    triggerIntegrationTool as any
  )
  .command(
    'analytics:platform <id>',
    'Get analytics for a specific integration/channel',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID',
          type: 'string',
        })
        .option('date', {
          alias: 'd',
          describe: 'Number of days to look back (default: 7)',
          type: 'string',
          default: '7',
        })
        .example(
          '$0 analytics:platform integration-123',
          'Get last 7 days of analytics'
        )
        .example(
          '$0 analytics:platform integration-123 -d 30',
          'Get last 30 days of analytics'
        );
    },
    getAnalytics as any
  )
  .command(
    'analytics:post <id>',
    'Get analytics for a specific post',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Post ID',
          type: 'string',
        })
        .option('date', {
          alias: 'd',
          describe: 'Number of days to look back (default: 7)',
          type: 'string',
          default: '7',
        })
        .example(
          '$0 analytics:post post-123',
          'Get last 7 days of post analytics'
        )
        .example(
          '$0 analytics:post post-123 -d 30',
          'Get last 30 days of post analytics'
        );
    },
    getPostAnalytics as any
  )
  .command(
    'upload <file>',
    'Upload a file',
    (yargs: Argv) => {
      return yargs
        .positional('file', {
          describe: 'File path to upload',
          type: 'string',
        })
        .example('$0 upload ./image.png', 'Upload an image');
    },
    uploadFile as any
  )
  // ============================================
  // Ghost-specific commands
  // ============================================
  .command(
    'ghost:preview <id>',
    'Create a Ghost preview draft',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .option('data', {
          alias: 'd',
          describe: 'Post data as JSON: {"title":"...","html":"...","tags":[...]}',
          type: 'string',
        })
        .example(
          '$0 ghost:preview ghost-123 -d \'{"title":"Test","html":"<p>Content</p>"}\'',
          'Create Ghost preview draft'
        )
        .example(
          '$0 ghost:preview ghost-123 -d \'{"title":"My Post","html":"<p>Hello</p>","visibility":"members"}\'',
          'Create member-only preview'
        );
    },
    createGhostPreview as any
  )
  .command(
    'ghost:tags <id>',
    'List all Ghost tags',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .example('$0 ghost:tags ghost-123', 'List all Ghost tags');
    },
    listGhostTags as any
  )
  .command(
    'ghost:authors <id>',
    'List all Ghost authors',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .example('$0 ghost:authors ghost-123', 'List all Ghost authors');
    },
    listGhostAuthors as any
  )
  .command(
    'ghost:tiers <id>',
    'List all Ghost membership tiers',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .example('$0 ghost:tiers ghost-123', 'List membership tiers');
    },
    listGhostTiers as any
  )
  .command(
    'ghost:newsletters <id>',
    'List all Ghost newsletters',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .example('$0 ghost:newsletters ghost-123', 'List newsletters');
    },
    listGhostNewsletters as any
  )
  .command(
    'ghost:posts <id>',
    'List Ghost posts',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .option('limit', {
          alias: 'l',
          describe: 'Maximum number of posts to return (default: 15)',
          type: 'number',
          default: 15,
        })
        .option('page', {
          alias: 'p',
          describe: 'Page number for pagination',
          type: 'number',
          default: 1,
        })
        .option('status', {
          alias: 's',
          describe: 'Filter by status: draft, published, scheduled',
          type: 'string',
        })
        .example('$0 ghost:posts ghost-123', 'List recent Ghost posts')
        .example('$0 ghost:posts ghost-123 -l 50', 'List up to 50 posts')
        .example('$0 ghost:posts ghost-123 --status draft', 'List only draft posts');
    },
    listGhostPosts as any
  )
  .command(
    'ghost:create',
    'Create a Ghost post through Postiz (tracked in Postiz database)',
    (yargs: Argv) => {
      return yargs
        .option('id', {
          alias: 'i',
          describe: 'Integration ID (Ghost integration) - REQUIRED',
          type: 'string',
          demandOption: true,
        })
        .option('title', {
          alias: 't',
          describe: 'Post title',
          type: 'string',
        })
        .option('content', {
          alias: 'c',
          describe: 'Post HTML content',
          type: 'string',
        })
        .option('html', {
          alias: 'H',
          describe: 'Post HTML content (alias for --content)',
          type: 'string',
        })
        .option('date', {
          alias: 'd',
          describe: 'Schedule date (ISO 8601). Default: now',
          type: 'string',
        })
        .option('draft', {
          describe: 'Create as draft instead of publishing',
          type: 'boolean',
          default: false,
        })
        .option('schedule', {
          describe: 'Schedule for future publication (use with --date)',
          type: 'boolean',
          default: false,
        })
        .option('visibility', {
          describe: 'Visibility: public, members, paid',
          type: 'string',
          choices: ['public', 'members', 'paid'],
          default: 'public',
        })
        .option('tags', {
          describe: 'Comma-separated tag names',
          type: 'string',
        })
        .option('authors', {
          describe: 'Comma-separated author IDs',
          type: 'string',
        })
        .option('feature-image', {
          alias: 'f',
          describe: 'Feature image URL',
          type: 'string',
        })
        .option('feature-image-caption', {
          describe: 'Feature image caption',
          type: 'string',
        })
        .option('excerpt', {
          alias: 'e',
          describe: 'Custom excerpt',
          type: 'string',
        })
        .option('slug', {
          alias: 's',
          describe: 'URL slug (auto-generated if not provided)',
          type: 'string',
        })
        .option('tiers', {
          describe: 'Comma-separated tier IDs for paid content',
          type: 'string',
        })
        .option('newsletter-id', {
          describe: 'Newsletter ID to send to',
          type: 'string',
        })
        .option('published-at', {
          describe: 'Publication date for scheduled posts (ISO 8601)',
          type: 'string',
        })
        .example(
          '$0 ghost:create -i ghost-123 --title "My Post" --content "<p>Content</p>"',
          'Create and publish a Ghost post (tracked in Postiz)'
        )
        .example(
          '$0 ghost:create -i ghost-123 --title "Draft" --content "<p>Content</p>" --draft',
          'Create a draft post'
        )
        .example(
          '$0 ghost:create -i ghost-123 --title "Scheduled" --content "<p>Content</p>" --schedule --date "2024-12-31T10:00:00Z"',
          'Schedule a post for future publication'
        )
        .example(
          '$0 ghost:create -i ghost-123 --title "Members Post" --content "<p>Members only</p>" --visibility members',
          'Create member-only post'
        )
        .example(
          '$0 ghost:create -i ghost-123 --title "With Tags" --content "<p>Content</p>" --tags "news,tech"',
          'Create post with tags'
        )
        .check((argv) => {
          if (!argv.id) {
            throw new Error('--id is required');
          }
          return true;
        });
    },
    createGhostPost as any
  )
  .command(
    'ghost:update <id>',
    'Update a Ghost post through Postiz',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Postiz Post ID (not Ghost post ID)',
          type: 'string',
        })
        .option('integration-id', {
          alias: 'i',
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
          demandOption: true,
        })
        .option('title', {
          alias: 't',
          describe: 'New title',
          type: 'string',
        })
        .option('content', {
          alias: 'c',
          describe: 'New HTML content',
          type: 'string',
        })
        .option('visibility', {
          describe: 'New visibility: public, members, paid',
          type: 'string',
          choices: ['public', 'members', 'paid'],
        })
        .option('tags', {
          describe: 'Comma-separated tag names',
          type: 'string',
        })
        .option('feature-image', {
          describe: 'New feature image URL',
          type: 'string',
        })
        .option('date', {
          describe: 'New schedule date (ISO 8601)',
          type: 'string',
        })
        .example(
          '$0 ghost:update post-123 -i ghost-456 --title "New Title"',
          'Update post title'
        )
        .example(
          '$0 ghost:update post-123 -i ghost-456 --content "<p>New content</p>"',
          'Update post content'
        );
    },
    updateGhostPost as any
  )
  .command(
    'ghost:status <id> <postId>',
    'Get the status of a Ghost post (draft, published, scheduled)',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID',
          type: 'string',
        })
        .positional('postId', {
          describe: 'Ghost post ID',
          type: 'string',
        })
        .example(
          '$0 ghost:status ghost-abc123 64a1b2c3d4e5f6',
          'Get status of a Ghost post'
        );
    },
    getGhostStatus as any
  )
  .command(
    'ghost:publish <id> <postId>',
    'Publish a Ghost draft immediately',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID',
          type: 'string',
        })
        .positional('postId', {
          describe: 'Ghost post ID',
          type: 'string',
        })
        .example(
          '$0 ghost:publish ghost-abc123 64a1b2c3d4e5f6',
          'Publish a Ghost draft'
        );
    },
    (args: any) => changeGhostStatus({ ...args, status: 'published' }) as any
  )
  .command(
    'ghost:unpublish <id> <postId>',
    'Convert a published Ghost post back to draft',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID',
          type: 'string',
        })
        .positional('postId', {
          describe: 'Ghost post ID',
          type: 'string',
        })
        .example(
          '$0 ghost:unpublish ghost-abc123 64a1b2c3d4e5f6',
          'Unpublish a Ghost post'
        );
    },
    (args: any) => changeGhostStatus({ ...args, status: 'draft' }) as any
  )
  .command(
    'ghost:schedule <id> <postId>',
    'Schedule a Ghost post for future publication',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID',
          type: 'string',
        })
        .positional('postId', {
          describe: 'Ghost post ID',
          type: 'string',
        })
        .option('published-at', {
          alias: 'p',
          describe: 'Publication date/time (ISO 8601 format)',
          type: 'string',
          demandOption: true,
        })
        .example(
          '$0 ghost:schedule ghost-abc123 64a1b2c3d4e5f6 -p "2030-12-31T12:00:00Z"',
          'Schedule a Ghost post'
        );
    },
    (args: any) => changeGhostStatus({ ...args, status: 'scheduled', publishedAt: args.publishedAt }) as any
  )
  .command(
    'ghost:delete <id>',
    'Delete a post from Postiz and Ghost',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Postiz Post ID (this will also delete from Ghost)',
          type: 'string',
        })
        .example(
          '$0 ghost:delete post-abc123',
          'Delete post from Postiz (and Ghost if published)'
        )
        .example(
          '$0 posts:delete post-abc123',
          'Alternative: use posts:delete command'
        );
    },
    deleteGhostPost as any
  )
  .command(
    'posts:reschedule <id>',
    'Reschedule a post to a new date',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Post ID',
          type: 'string',
        })
        .option('date', {
          alias: 'd',
          describe: 'New schedule date (ISO 8601 format)',
          type: 'string',
          demandOption: true,
        })
        .option('action', {
          alias: 'a',
          describe: 'Action: schedule (set state to QUEUE) or update (just change date)',
          type: 'string',
          choices: ['schedule', 'update'],
          default: 'schedule',
        })
        .example(
          '$0 posts:reschedule abc123 -d "2030-12-31T12:00:00Z"',
          'Reschedule a post'
        );
    },
    reschedulePost as any
  )
  .command(
    'ghost:drafts <id>',
    'List all draft posts in Ghost (for cleanup)',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .option('limit', {
          alias: 'l',
          describe: 'Maximum number of drafts to return (default: 100)',
          type: 'number',
          default: 100,
        })
        .option('older-than', {
          alias: 'o',
          describe: 'Filter drafts created before this date (ISO 8601)',
          type: 'string',
        })
        .example('$0 ghost:drafts ghost-123', 'List all draft posts')
        .example('$0 ghost:drafts ghost-123 --older-than "2024-01-01T00:00:00Z"', 'List drafts created before a date')
        .example('$0 ghost:drafts ghost-123 -l 50', 'List up to 50 drafts');
    },
    listGhostDrafts as any
  )
  .command(
    'ghost:cleanup <id>',
    'Clean up orphaned Ghost draft posts',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .option('older-than', {
          alias: 'o',
          describe: 'Delete drafts older than this many hours (default: 24)',
          type: 'number',
          default: 24,
        })
        .option('dry-run', {
          describe: 'Show what would be deleted without actually deleting',
          type: 'boolean',
          default: false,
        })
        .example('$0 ghost:cleanup ghost-123', 'Delete drafts older than 24 hours')
        .example('$0 ghost:cleanup ghost-123 --older-than 48', 'Delete drafts older than 48 hours')
        .example('$0 ghost:cleanup ghost-123 --dry-run', 'Preview what would be deleted');
    },
    cleanupGhostDrafts as any
  )
  .command(
    'ghost:theme <id>',
    'Get Ghost theme settings (colors, typography, etc.)',
    (yargs: Argv) => {
      return yargs
        .positional('id', {
          describe: 'Integration ID (Ghost integration)',
          type: 'string',
        })
        .example('$0 ghost:theme ghost-123', 'Get theme settings');
    },
    getGhostThemeSettings as any
  )
  .demandCommand(1, 'You need at least one command')
  .help()
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .epilogue(
    'For more information, visit: https://postiz.com\n\n' +
    'Ghost Commands (all flow through Postiz for tracking):\n' +
    '  ghost:create     Create a Ghost post (tracked in Postiz DB)\n' +
    '  ghost:update     Update a Ghost post\n' +
    '  ghost:delete     Delete a post from Postiz and Ghost\n' +
    '  ghost:schedule   Schedule a post for future publication\n' +
    '  ghost:preview    Create a preview draft (for testing)\n' +
    '  ghost:tags       List all tags\n' +
    '  ghost:authors    List all authors\n' +
    '  ghost:tiers      List membership tiers\n' +
    '  ghost:newsletters List newsletters\n' +
    '  ghost:posts      List Ghost posts\n' +
    '  ghost:status     Get post status\n' +
    '  ghost:publish     Publish a draft\n' +
    '  ghost:unpublish  Unpublish (revert to draft)\n' +
    '  ghost:drafts     List all draft posts (for cleanup)\n' +
    '  ghost:cleanup    Clean up orphaned draft posts\n' +
    '  ghost:theme      Get Ghost theme settings\n\n' +
    'Posts Commands:\n' +
    '  posts:create     Create a post (works for all providers)\n' +
    '  posts:list        List all posts\n' +
    '  posts:delete      Delete a post\n' +
    '  posts:history     Show local post history\n\n' +
    'Set your API key: export POSTIZ_API_KEY=your_api_key\n' +
    'Set API URL (optional): export POSTIZ_API_URL=https://your-api-url/api\n\n' +
    '📽️  Recommendation: Use agent-media to generate AI videos & images (Kling, Veo, Sora, Seedance, Flux, Grok) and post them directly with Postiz.\n' +
    '   Install: npm install -g agent-media-cli\n' +
    '   Learn more: https://agent-media.ai'
  )
  .parse();