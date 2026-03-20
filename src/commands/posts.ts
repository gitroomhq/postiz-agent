import { PostizAPI } from '../api';
import { getConfig } from '../config';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const HISTORY_FILE = join(homedir(), '.postiz-history.json');

interface PostHistoryEntry {
  postizId: string;
  providerPostId?: string;
  releaseId?: string;
  releaseURL?: string;
  integrationId: string;
  provider: string;
  title?: string;
  createdAt: string;
  scheduledAt?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  type: 'post' | 'carousel' | 'gif';
}

function getHistory(): PostHistoryEntry[] {
  if (!existsSync(HISTORY_FILE)) {
    return [];
  }
  try {
    const content = readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

function saveHistory(history: PostHistoryEntry[]): void {
  writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

function addToHistory(entry: PostHistoryEntry): void {
  const history = getHistory();
  history.unshift(entry); // Add to beginning

  // Keep only last 100 entries
  if (history.length > 100) {
    history.splice(100);
  }
  saveHistory(history);
}

export async function getMissingContent(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  try {
    const result = await api.getMissingContent(args.id);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to get missing content:', error.message);
    process.exit(1);
  }
}

export async function connectPost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  if (!args.releaseId) {
    console.error('❌ --release-id is required');
    process.exit(1);
  }

  try {
    const result = await api.updateReleaseId(args.id, args.releaseId);
    console.log(`✅ Post ${args.id} connected to release ${args.releaseId}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to connect post:', error.message);
    process.exit(1);
  }
}

export async function createPost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  // Support both simple and complex post creation
  let postData: any;

  if (args.json) {
    // Load from JSON file for complex posts with comments and media
    try {
      const jsonPath = args.json;
      if (!existsSync(jsonPath)) {
        console.error(`❌ JSON file not found: ${jsonPath}`);
        process.exit(1);
      }
      const jsonContent = readFileSync(jsonPath, 'utf-8');
      postData = JSON.parse(jsonContent);
    } catch (error: any) {
      console.error('❌ Failed to parse JSON file:', error.message);
      process.exit(1);
    }
  } else {
    const integrations = args.integrations
      ? args.integrations.split(',').map((id: string) => id.trim())
      : [];

    if (integrations.length === 0) {
      console.error('❌ At least one integration ID is required');
      console.error('Use -i or --integrations to specify integration IDs');
      console.error('Run "postiz integrations:list" to see available integrations');
      process.exit(1);
    }

    // Support multiple -c and -m flags
    // Normalize to arrays
    const contents = Array.isArray(args.content) ? args.content : [args.content];
    const medias = Array.isArray(args.media) ? args.media : (args.media ? [args.media] : []);

    if (!contents[0]) {
      console.error('❌ At least one -c/--content is required');
      process.exit(1);
    }

    // Build value array by pairing contents with their media
    const values = contents.map((content: string, index: number) => {
      const mediaForThisContent = medias[index];
      const images = mediaForThisContent
        ? mediaForThisContent.split(',').map((img: string) => ({
            id: Math.random().toString(36).substring(7),
            path: img.trim(),
          }))
        : [];

      return {
        content: content,
        image: images,
        delay: args?.delay || 0,
      };
    });

    // Parse provider-specific settings if provided
    // Note: __type is automatically added by the backend based on integration ID
    let settings: any = undefined;

    if (args.settings) {
      try {
        settings = typeof args.settings === 'string'
          ? JSON.parse(args.settings)
          : args.settings;
      } catch (error: any) {
        console.error('❌ Failed to parse settings JSON:', error.message);
        process.exit(1);
      }
    }

    // Build the proper post structure
    postData = {
      type: args.type || 'schedule', // 'schedule' or 'draft'
      date: args.date, // Required date field
      shortLink: args.shortLink !== false,
      tags: [],
      posts: integrations.map((integrationId: string) => ({
        integration: { id: integrationId },
        value: values,
        settings: settings,
      })),
    };
  }

  try {
    const result = await api.createPost(postData);
    console.log('✅ Post created successfully!');
    console.log(JSON.stringify(result, null, 2));

    // Save to local history
    try {
      // Extract fields from result - Postiz API response structure
      const postizId = result?.id || result?.postId || result?._id;
      const integrationId = postData.posts?.[0]?.integration?.id || '';
      const scheduledAt = postData.date;

      // Extract provider info from result
      const providerResults = result?.posts || result?.results || [];
      const firstResult = providerResults[0] || {};

      addToHistory({
        postizId: postizId || 'unknown',
        providerPostId: firstResult.providerPostId || firstResult.id,
        releaseId: firstResult.releaseId || result?.releaseId,
        releaseURL: firstResult.releaseURL || result?.releaseURL,
        integrationId: integrationId,
        provider: firstResult.provider || firstResult.__type || 'unknown',
        title: postData.title || (contents?.[0] || '').substring(0, 50),
        createdAt: new Date().toISOString(),
        scheduledAt: scheduledAt,
        status: args.type === 'draft' ? 'draft' : 'scheduled',
        type: 'post',
      });

      console.log(`📁 Post saved to history (~/.postiz-history.json)`);
    } catch (historyError: any) {
      // Don't fail the main operation if history fails
      console.warn(`⚠️  Could not save to history: ${historyError.message}`);
    }

    return result;
  } catch (error: any) {
    console.error('❌ Failed to create post:', error.message);
    process.exit(1);
  }
}

export async function listPosts(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  // Set default date range: last 30 days to 30 days in the future
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);

  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);

  // Only send fields that are in GetPostsDto
  const filters: any = {
    startDate: args.startDate || defaultStartDate.toISOString(),
    endDate: args.endDate || defaultEndDate.toISOString(),
  };

  // customer is optional in the DTO
  if (args.customer) {
    filters.customer = args.customer;
  }

  try {
    const result = await api.listPosts(filters);
    console.log('📋 Posts:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list posts:', error.message);
    process.exit(1);
  }
}

export async function deletePost(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  try {
    await api.deletePost(args.id);
    console.log(`✅ Post ${args.id} deleted successfully!`);
  } catch (error: any) {
    console.error('❌ Failed to delete post:', error.message);
    process.exit(1);
  }
}

/**
 * Show local post history (posts created via this CLI)
 * This is different from listPosts which queries the Postiz API
 */
export async function historyPosts(args: any) {
  const history = getHistory();

  if (history.length === 0) {
    console.log('📋 No post history found.');
    console.log('');
    console.log('Posts created via this CLI will be tracked here.');
    console.log('History file: ~/.postiz-history.json');
    return;
  }

  // Filter by status if provided
  let filtered = history;
  if (args.status) {
    filtered = filtered.filter(h => h.status === args.status);
  }

  // Filter by provider if provided
  if (args.provider) {
    const providerLower = args.provider.toLowerCase();
    filtered = filtered.filter(h => h.provider.toLowerCase().includes(providerLower));
  }

  // Limit results
  const limit = args.limit ? parseInt(args.limit, 10) : 20;
  filtered = filtered.slice(0, limit);

  console.log(`📋 Post History (${filtered.length} of ${history.length} entries):\n`);

  // Output as table
  if (args.json) {
    console.log(JSON.stringify(filtered, null, 2));
  } else {
    for (const entry of filtered) {
      console.log(`┌─────────────────────────────────────────────────────────────`);
      console.log(`│ Postiz ID:    ${entry.postizId}`);
      if (entry.providerPostId) {
        console.log(`│ Provider ID:  ${entry.providerPostId}`);
      }
      if (entry.releaseURL) {
        console.log(`│ URL:          ${entry.releaseURL}`);
      }
      console.log(`│ Provider:     ${entry.provider}`);
      console.log(`│ Integration:   ${entry.integrationId}`);
      if (entry.title) {
        console.log(`│ Title:        ${entry.title}`);
      }
      console.log(`│ Status:       ${entry.status}`);
      if (entry.scheduledAt) {
        console.log(`│ Scheduled:    ${entry.scheduledAt}`);
      }
      console.log(`│ Created:      ${entry.createdAt}`);
      console.log(`└─────────────────────────────────────────────────────────────`);
      console.log('');
    }
  }

  console.log(`📁 History file: ~/.postiz-history.json`);
  console.log(`💡 Use --json for machine-readable output`);
  console.log(`💡 Use --status <status> to filter by status`);
  console.log(`💡 Use --provider <name> to filter by provider`);
}

/**
 * Get a specific post from history by Postiz ID
 */
export async function getPostFromHistory(args: any) {
  if (!args.id) {
    console.error('❌ Post ID is required');
    process.exit(1);
  }

  const history = getHistory();
  const entry = history.find(h => h.postizId === args.id || h.providerPostId === args.id);

  if (!entry) {
    console.error(`❌ Post not found in history: ${args.id}`);
    process.exit(1);
  }

  console.log(JSON.stringify(entry, null, 2));
  return entry;
}

/**
 * Clear post history
 */
export async function clearHistory(args: any) {
  if (args.confirm !== true) {
    console.log('⚠️  This will delete all post history from ~/.postiz-history.json');
    console.log('Use --confirm to proceed');
    process.exit(1);
  }

  saveHistory([]);
  console.log('✅ Post history cleared');
}
