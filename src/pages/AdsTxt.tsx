import { useEffect } from 'react';

const AdsTxt = () => {
  useEffect(() => {
    document.title = 'ads.txt';
  }, []);
  return (
    <pre className="p-4 text-xs whitespace-pre-wrap">
{`# ads.txt file for shadowcomment.com
# Authorized digital sellers

google.com, pub-3772894258095114, DIRECT, f08c47fec0942fa0
ezoic.com, 19390, DIRECT

# Additional authorized sellers will be added by Ezoic`}
    </pre>
  );
};

export default AdsTxt;
