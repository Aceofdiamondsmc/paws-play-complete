import heic2any from 'heic2any';

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase();
  return type === 'image/heic' || type === 'image/heif' 
    || ext === 'heic' || ext === 'heif';
}

export async function ensureJpeg(file: File): Promise<File> {
  if (!isHeic(file)) return file;
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
  const result = blob instanceof Blob ? blob : blob[0];
  const name = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([result], name, { type: 'image/jpeg' });
}
