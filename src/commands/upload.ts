import { PostizAPI } from '../api';
import { getConfig } from '../config';
import { readFileSync } from 'fs';

export async function uploadFile(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  if (!args.file) {
    console.error('❌ File path is required');
    process.exit(1);
  }

  try {
    const fileBuffer = readFileSync(args.file);
    const filename = args.file.split('/').pop() || 'file';

    const result = await api.upload(fileBuffer, filename);
    console.log('✅ File uploaded successfully!');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to upload file:', error.message);
    process.exit(1);
  }
}

export async function listMedia(args: any) {
  const config = getConfig();
  const api = new PostizAPI(config);

  try {
    const result = await api.listMedia(args.page, args.search);
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('❌ Failed to list media:', error.message);
    process.exit(1);
  }
}
