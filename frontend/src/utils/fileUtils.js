export const isVideoFile = (filename, mimeType) => {
  if (mimeType && mimeType.startsWith('video/')) {
    return true;
  }
  
  if (filename) {
    const videoExtensions = /\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v|3gp|ogv)$/i;
    return videoExtensions.test(filename);
  }
  
  return false;
};

export const getVideoMimeType = (filename) => {
  if (!filename) return 'video/mp4';
  
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes = {
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'mkv': 'video/x-matroska',
    'm4v': 'video/x-m4v',
    '3gp': 'video/3gpp'
  };
  
  return mimeTypes[ext] || 'video/mp4';
};