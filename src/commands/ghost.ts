import { PostizAPI } from '../api';
import { getConfig } from '../config';

/**
 * Ghost Provider CLI Commands
 *
 * All commands flow through Postiz API to ensure posts are tracked.
 * Direct Ghost API access is available for utility commands (tags, authors, etc.)
 */

interface GhostPostSettings {
  title?: string;
  slug?: string;
  custom_excerpt?: string;
  status?: 'draft' | 'published' | 'scheduled';
  visibility?: 'public' | 'members' | 'paid';
  feature_image?: string;
  feature_image_caption?: string;
  feature_image_alt?: string;
  tags?: string[];
  authors?: string[];
  tiers?: string[];
  newsletter_id?: string;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
}

/**
 * Create a Ghost post through Postiz (tracked in Postiz DB)
 *
 * This is the recommended way to create posts - they will be:
 * - Visible in Postiz frontend
 * - Tracked in Postiz database
 * - Synced to Ghost when scheduled/published
 *
 * Usage: postiz ghost:create -i <integration-id> --title "Title" --content "<p>Content</p>"
 */
export async function createGhostPost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required (use -i or --id)');
    process.exit(1);
  }

  // Build post content
  const content = args.content || args.html || '';
  if (!content && !args.title) {
    console.error('❌ At least --title or --content is required');
    process.exit(1);
  }

  // Build Ghost-specific settings
  const settings: GhostPostSettings = {
    title: args.title || 'Untitled',
  };

  if (args.slug) settings.slug = args.slug;
  if (args.excerpt) settings.custom_excerpt = args.excerpt;
  if (args.visibility) settings.visibility = args.visibility;
  if (args['feature-image']) settings.feature_image = args['feature-image'];
  if (args['feature-image-caption']) settings.feature_image_caption = args['feature-image-caption'];
  if (args['feature-image-alt']) settings.feature_image_alt = args['feature-image-alt'];
  if (args.tags) settings.tags = args.tags.split(',').map((t: string) => t.trim());
  if (args.authors) settings.authors = args.authors.split(',').map((a: string) => a.trim());
  if (args.tiers) settings.tiers = args.tiers.split(',').map((t: string) => t.trim());
  if (args['newsletter-id']) settings.newsletter_id = args['newsletter-id'];
  if (args['published-at']) settings.published_at = args['published-at'];
  if (args['meta-title']) settings.meta_title = args['meta-title'];
  if (args['meta-description']) settings.meta_description = args['meta-description'];
  if (args['canonical-url']) settings.canonical_url = args['canonical-url'];

  // Determine post type
  const postType = args.draft ? 'draft' : args.schedule ? 'schedule' : 'now';
  const publishDate = args.date || new Date().toISOString();

  // Build Postiz post structure
  const postData = {
    type: postType,
    date: publishDate,
    shortLink: args.shortLink !== false,
    tags: [],
    posts: [{
      integration: { id: args.id },
      value: [{
        content: content,
        image: [],
        delay: 0,
      }],
      settings: {
        __type: 'ghost',
        ...settings,
      },
    }],
  };

  try {
    console.log(`📝 Creating Ghost post via Postiz...`);
    console.log(`   Type: ${postType}`);
    console.log(`   Title: ${settings.title}`);
    if (settings.visibility) console.log(`   Visibility: ${settings.visibility}`);
    if (args.date) console.log(`   Date: ${args.date}`);

    const result = await api.createPost(postData);

    console.log('\n✅ Post created successfully!');

    // Extract result info
    const postId = result?.postId || result?.id || result?.posts?.[0]?.postId;

    console.log(`   Postiz ID: ${postId}`);
    if (result?.posts?.[0]?.releaseURL) {
      console.log(`   URL: ${result.posts[0].releaseURL}`);
    }
    console.log('\n💡 View in Postiz: This post is now tracked and visible in the Postiz frontend.');
    console.log('💡 Use "postiz posts:list" to see all your posts.');

    return result;
  } catch (error: any) {
    console.error('❌ Failed to create post:', error.message);
    process.exit(1);
  }
}

/**
 * Update a Ghost post through Postiz
 *
 * Updates the post in Postiz DB, changes sync to Ghost when next published.
 * Usage: postiz ghost:update <postiz-id> --title "New Title"
 */
export async function updateGhostPost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Postiz Post ID is required');
    process.exit(1);
  }

  // For updates, we use type: 'update'
  const postData: any = {
    type: 'update',
    date: args.date || new Date().toISOString(),
    shortLink: args.shortLink !== false,
    tags: [],
    posts: [{
      integration: { id: args.integrationId },
      group: args.id, // The Postiz post group ID
      value: [],
    }],
  };

  // Build settings if any Ghost-specific fields provided
  if (args.title || args.content || args.visibility) {
    postData.posts[0].settings = {
      __type: 'ghost',
    };
    if (args.title) postData.posts[0].settings.title = args.title;
    if (args.visibility) postData.posts[0].settings.visibility = args.visibility;
    if (args.excerpt) postData.posts[0].settings.custom_excerpt = args.excerpt;
    if (args.tags) postData.posts[0].settings.tags = args.tags.split(',').map((t: string) => t.trim());
    if (args['feature-image']) postData.posts[0].settings.feature_image = args['feature-image'];
  }

  // Build value array with content if provided
  if (args.content || args.html) {
    postData.posts[0].value = [{
      content: args.content || args.html,
      image: [],
      delay: 0,
    }];
  }

  try {
    console.log(`📝 Updating post ${args.id}...`);
    const result = await api.createPost(postData);
    console.log('✅ Post updated successfully!');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to update post:', error.message);
    process.exit(1);
  }
}

/**
 * Schedule a Ghost post for future publication
 * Usage: postiz ghost:schedule <postiz-id> --date "2024-12-31T10:00:00Z"
 */
export async function scheduleGhostPost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  if (!args.date) {
    console.error('❌ --date is required for scheduling (ISO 8601 format)');
    process.exit(1);
  }

  try {
    const result = await api.updatePostDate(args.id, args.date, 'schedule');
    console.log(`✅ Post scheduled for ${args.date}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to schedule post:', error.message);
    process.exit(1);
  }
}

/**
 * Delete a post from Postiz (and from Ghost if published)
 * Usage: postiz ghost:delete <postiz-id>
 */
export async function deleteGhostPost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  try {
    console.log(`🗑️  Deleting post ${args.id}...`);
    await api.deletePost(args.id);
    console.log('✅ Post deleted successfully!');
    console.log('\n💡 This removes the post from Postiz and Ghost.');
  } catch (error: any) {
    console.error('❌ Failed to delete post:', error.message);
    process.exit(1);
  }
}

/**
 * Get Ghost tags (utility command - direct API)
 * Usage: postiz ghost:tags <integration-id>
 */
export async function listGhostTags(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  try {
    const result = await api.triggerIntegrationTool(args.id, 'tags', {});
    console.log('🏷️  Ghost Tags:');
    const output = result.output || result;
    if (Array.isArray(output)) {
      output.forEach((tag: any) => {
        console.log(`  - ${tag.label} (${tag.value})`);
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list Ghost tags:', error.message);
    process.exit(1);
  }
}

/**
 * Get Ghost authors (utility command - direct API)
 * Usage: postiz ghost:authors <integration-id>
 */
export async function listGhostAuthors(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  try {
    const result = await api.triggerIntegrationTool(args.id, 'authors', {});
    console.log('👤 Ghost Authors:');
    const output = result.output || result;
    if (Array.isArray(output)) {
      output.forEach((author: any) => {
        console.log(`  - ${author.label} (${author.value})`);
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list Ghost authors:', error.message);
    process.exit(1);
  }
}

/**
 * Get Ghost tiers (utility command - direct API)
 * Usage: postiz ghost:tiers <integration-id>
 */
export async function listGhostTiers(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  try {
    const result = await api.triggerIntegrationTool(args.id, 'tiers', {});
    console.log('💎 Ghost Tiers:');
    const output = result.output || result;
    if (Array.isArray(output)) {
      output.forEach((tier: any) => {
        console.log(`  - ${tier.label} (${tier.value})`);
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list Ghost tiers:', error.message);
    process.exit(1);
  }
}

/**
 * Get Ghost newsletters (utility command - direct API)
 * Usage: postiz ghost:newsletters <integration-id>
 */
export async function listGhostNewsletters(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  try {
    const result = await api.triggerIntegrationTool(args.id, 'newsletters', {});
    console.log('📧 Ghost Newsletters:');
    const output = result.output || result;
    if (Array.isArray(output)) {
      output.forEach((newsletter: any) => {
        console.log(`  - ${newsletter.label} (${newsletter.value})`);
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list Ghost newsletters:', error.message);
    process.exit(1);
  }
}

/**
 * List Ghost posts (utility command - direct API)
 * Shows posts directly from Ghost, not from Postiz DB
 * Usage: postiz ghost:posts <integration-id> [-l limit]
 */
export async function listGhostPosts(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  const data: any = {};
  if (args.limit) data.limit = args.limit;
  if (args.page) data.page = args.page;
  if (args.status) data.status = args.status;

  try {
    const result = await api.triggerIntegrationTool(args.id, 'listPosts', data);
    console.log('📝 Ghost Posts (direct from Ghost):');
    const output = result.output || result;

    if (output.posts && Array.isArray(output.posts)) {
      console.log(`\n  Total: ${output.meta?.pagination?.total || output.posts.length} posts`);
      console.log(`  Page: ${output.meta?.pagination?.page || 1}/${output.meta?.pagination?.pages || 1}\n`);

      output.posts.forEach((post: any) => {
        const statusEmoji = post.status === 'published' ? '✅' : post.status === 'scheduled' ? '📅' : '📝';
        const visibilityEmoji = post.visibility === 'public' ? '🔓' : post.visibility === 'members' ? '👥' : '💎';
        console.log(`  ${statusEmoji} ${post.title || 'Untitled'}`);
        console.log(`     ID: ${post.id}`);
        console.log(`     Status: ${post.status} | Visibility: ${post.visibility}`);
        console.log(`     URL: ${post.url}`);
        console.log('');
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list Ghost posts:', error.message);
    process.exit(1);
  }
}

/**
 * Create a preview draft in Ghost (for testing)
 * This creates a temporary draft for preview purposes
 * Usage: postiz ghost:preview <integration-id> --title "Test" --content "<p>Hello</p>"
 */
export async function createGhostPreview(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  let data: any = {};
  if (args.data) {
    try {
      data = JSON.parse(args.data);
    } catch (error: any) {
      console.error('❌ Failed to parse data JSON:', error.message);
      process.exit(1);
    }
  }

  // Ensure title is provided
  if (!data.title) {
    data.title = args.title || 'Untitled Preview';
  }

  try {
    const result = await api.triggerIntegrationTool(args.id, 'preview', data);
    console.log('🔍 Ghost Preview:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to create Ghost preview:', error.message);
    process.exit(1);
  }
}

/**
 * Get post status from Ghost
 * Usage: postiz ghost:status <integration-id> <ghost-post-id>
 */
export async function getGhostStatus(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  if (!args.postId) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  try {
    const result = await api.getPostStatus(args.id, args.postId);
    console.log('📋 Ghost Post Status:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to get post status:', error.message);
    process.exit(1);
  }
}

/**
 * Change post status (publish, unpublish, schedule)
 * Usage: postiz ghost:publish <postiz-id>
 *        postiz ghost:unpublish <postiz-id>
 *        postiz ghost:schedule <postiz-id> --date "2024-12-31T10:00:00Z"
 */
export async function changeGhostStatus(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  if (!args.postId) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  const newStatus = args.status as 'draft' | 'published' | 'scheduled';
  if (!['draft', 'published', 'scheduled'].includes(newStatus)) {
    console.error('❌ Status must be one of: draft, published, scheduled');
    process.exit(1);
  }

  // Validate publishedAt is provided when scheduling
  if (newStatus === 'scheduled' && !args.publishedAt) {
    console.error('❌ --published-at is required when status is "scheduled"');
    process.exit(1);
  }

  try {
    const result = await api.changePostStatus(
      args.id,
      args.postId,
      newStatus,
      args.publishedAt
    );

    const statusEmoji = newStatus === 'published' ? '✅' : newStatus === 'scheduled' ? '📅' : '📝';
    console.log(`${statusEmoji} Post status changed to ${newStatus}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to change post status:', error.message);
    process.exit(1);
  }
}

/**
 * Reschedule a post
 * Usage: postiz posts:reschedule <post-id> --date "2024-12-31T10:00:00Z"
 */
export async function reschedulePost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  if (!args.date) {
    console.error('❌ New date is required (--date)');
    process.exit(1);
  }

  const action = args.action || 'schedule';

  try {
    const result = await api.updatePostDate(args.id, args.date, action);
    console.log(`✅ Post rescheduled to ${args.date}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to reschedule post:', error.message);
    process.exit(1);
  }
}

/**
 * List all draft posts in Ghost
 * Useful for identifying orphaned preview drafts
 * Usage: postiz ghost:drafts <integration-id> [--older-than 24]
 */
export async function listGhostDrafts(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  const data: any = {};
  if (args.limit) data.limit = args.limit;
  if (args.page) data.page = args.page;
  if (args.olderThan) data.createdBefore = args.olderThan;

  try {
    const result = await api.triggerIntegrationTool(args.id, 'listDrafts', data);
    console.log('📝 Ghost Draft Posts:');
    const output = result.output || result;

    if (output.posts && Array.isArray(output.posts)) {
      console.log(`\n  Total drafts: ${output.posts.length}\n`);

      output.posts.forEach((post: any) => {
        const age = post.created_at ? getTimeAgo(post.created_at) : 'unknown';
        console.log(`  📝 ${post.title || 'Untitled'}`);
        console.log(`     ID: ${post.id}`);
        console.log(`     Created: ${post.created_at || 'unknown'} (${age})`);
        if (post.url) console.log(`     URL: ${post.url}`);
        console.log('');
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list Ghost drafts:', error.message);
    process.exit(1);
  }
}

/**
 * Clean up orphaned Ghost draft posts
 * Deletes drafts older than specified hours that have no corresponding Postiz post
 * Usage: postiz ghost:cleanup <integration-id> [--older-than 24] [--dry-run]
 */
export async function cleanupGhostDrafts(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  const olderThanHours = args.olderThan || 24;
  const dryRun = args.dryRun || false;

  const data: any = {
    olderThanHours,
    dryRun,
  };

  try {
    console.log(`🧹 Cleaning up orphaned Ghost drafts...`);
    console.log(`   Integration: ${args.id}`);
    console.log(`   Older than: ${olderThanHours} hours`);
    console.log(`   Dry run: ${dryRun ? 'Yes (will not delete)' : 'No (will delete)'}`);
    console.log('');

    const result = await api.triggerIntegrationTool(args.id, 'cleanupOrphanedDrafts', data);
    const output = result.output || result;

    if (output.deleted) {
      console.log(`✅ Cleaned up ${output.deleted.length} orphaned drafts`);
      if (output.deleted.length > 0) {
        console.log('\n  Deleted posts:');
        output.deleted.forEach((post: any) => {
          console.log(`    - ${post.title || 'Untitled'} (${post.id})`);
        });
      }
    } else if (output.wouldDelete) {
      console.log(`🔍 Would delete ${output.wouldDelete.length} orphaned drafts:`);
      output.wouldDelete.forEach((post: any) => {
        console.log(`    - ${post.title || 'Untitled'} (${post.id})`);
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('❌ Failed to cleanup Ghost drafts:', error.message);
    process.exit(1);
  }
}

/**
 * Get Ghost theme settings
 * Returns theme variables like colors, typography, etc.
 * Usage: postiz ghost:theme <integration-id>
 */
export async function getGhostThemeSettings(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  try {
    const result = await api.triggerIntegrationTool(args.id, 'themeSettings', {});
    console.log('🎨 Ghost Theme Settings:');
    const output = result.output || result;

    if (Array.isArray(output)) {
      console.log('\n');
      output.forEach((setting: any) => {
        console.log(`  ${setting.key}: ${setting.value}`);
        if (setting.type === 'color') {
          console.log(`    (color)`);
        } else if (setting.options) {
          console.log(`    Options: ${setting.options.join(', ')}`);
        }
      });
    } else {
      console.log(JSON.stringify(result, null, 2));
    }
    return result;
  } catch (error: any) {
    console.error('❌ Failed to get Ghost theme settings:', error.message);
    process.exit(1);
  }
}

/**
 * Helper function to calculate time ago
 */
function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  const diffMins = Math.floor(diffMs / (1000 * 60));
  return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
}