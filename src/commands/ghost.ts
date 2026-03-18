import { PostizAPI } from '../api';
import { getConfig } from '../config';

/**
 * Get the status of a Ghost post
 * Usage: postiz ghost:status <integration-id> <provider-post-id>
 */
export async function getGhostStatus(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  if (!args.postId) {
    console.error('❌ Provider post ID is required');
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
 * Change a Ghost post's status
 * Usage: postiz ghost:publish <integration-id> <provider-post-id>
 * Usage: postiz ghost:unpublish <integration-id> <provider-post-id>
 * Usage: postiz ghost:schedule <integration-id> <provider-post-id> --published-at "2024-12-31T12:00:00Z"
 */
export async function changeGhostStatus(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  if (!args.postId) {
    console.error('❌ Provider post ID is required');
    process.exit(1);
  }

  const newStatus = args.status as 'draft' | 'published' | 'scheduled';
  if (!['draft', 'published', 'scheduled'].includes(newStatus)) {
    console.error('❌ Status must be one of: draft, published, scheduled');
    process.exit(1);
  }

  try {
    const result = await api.changePostStatus(
      args.id,
      args.postId,
      newStatus,
      args.publishedAt
    );
    console.log(`✅ Post status changed to ${newStatus}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to change post status:', error.message);
    process.exit(1);
  }
}

/**
 * Delete a Ghost post from the provider
 * Usage: postiz ghost:delete <integration-id> <provider-post-id>
 */
export async function deleteGhostPost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Integration ID is required');
    process.exit(1);
  }

  if (!args.postId) {
    console.error('❌ Provider post ID is required');
    process.exit(1);
  }

  try {
    await api.deleteProviderPost(args.id, args.postId);
    console.log(`✅ Ghost post ${args.postId} deleted successfully`);
  } catch (error: any) {
    console.error('❌ Failed to delete Ghost post:', error.message);
    process.exit(1);
  }
}

/**
 * Reschedule a post
 * Usage: postiz posts:reschedule <post-id> --date "2024-12-31T12:00:00Z"
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