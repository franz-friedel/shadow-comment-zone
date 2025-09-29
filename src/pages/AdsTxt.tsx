import { useEffect } from 'react';

const AdsTxt = () => {
  useEffect(() => {
    document.title = 'ads.txt';
  }, []);

  return (
    <pre className="p-4 text-sm whitespace-pre-wrap">
{`# ads.txt file for shadowcomment.com
# This file lists authorized digital sellers for this domain

# Google AdSense
google.com, pub-3772894258095114, DIRECT, f08c47fec0942fa0

# Ezoic
ezoic.com, 19390, DIRECT

# Additional authorized sellers will be added by Ezoic`}
    </pre>
  );
};

export default AdsTxt;
};

export default AdsTxt;
