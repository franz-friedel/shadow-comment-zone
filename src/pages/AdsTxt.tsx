import { useEffect } from 'react';

const AdsTxt = () => {
  useEffect(() => {
    // Set content type to text/plain
    document.title = 'ads.txt';
    
    // Get the ads.txt content
    const adsTxtContent = `# ads.txt file for shadowcomment.com
# This file lists authorized digital sellers for this domain

# Google AdSense
google.com, pub-3772894258095114, DIRECT, f08c47fec0942fa0

# Ezoic
ezoic.com, 19390, DIRECT

# Additional authorized sellers will be added by Ezoic`;

    // Replace the entire page content with ads.txt content
    document.documentElement.innerHTML = `<pre>${adsTxtContent}</pre>`;
  }, []);

  return null;
};

export default AdsTxt;
