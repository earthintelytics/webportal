import { ImageOff } from 'lucide-react';
import { useSecurePhoto } from './useSecurePhoto';

const SecurePhoto = ({ path, className = '', alt = '' }) => {
  const { url, failed } = useSecurePhoto(path);
  if (url) return <img src={url} alt={alt} className={className} />;
  return (
    <span className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`} title={failed ? 'Photo could not be loaded' : 'Loading photo'}>
      {failed ? <ImageOff size={18} /> : null}
    </span>
  );
};

export default SecurePhoto;
