import { PostizAPI } from '../api';
import { getConfig } from '../config';

export async function createClipping(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.url) {
    console.error('❌ YouTube video URL is required');
    process.exit(1);
  }

  const integrations = args.integrations
    ? String(args.integrations)
        .split(',')
        .map((id: string) => id.trim())
        .filter(Boolean)
    : undefined;

  try {
    const result = await api.createClipping({
      url: args.url,
      ...(integrations?.length ? { integrations } : {}),
      ...(args.clips ? { clips: args.clips } : {}),
      ...(args.fit ? { fit: args.fit } : {}),
    });
    console.log('🎬 Clipping started:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to start clipping:', error.message);
    process.exit(1);
  }
}

export async function listClippings(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  try {
    const result = await api.listClippings(args?.page);
    console.log('🎬 Clippings:');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list clippings:', error.message);
    process.exit(1);
  }
}

export async function getClipping(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.id) {
    console.error('❌ Clipping ID is required');
    process.exit(1);
  }

  try {
    const result = await api.getClipping(args.id);
    console.log(`🎬 Clipping: ${args.id}`);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to get clipping:', error.message);
    process.exit(1);
  }
}
