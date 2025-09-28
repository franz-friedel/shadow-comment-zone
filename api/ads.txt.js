export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  const adsTxtContent = `# ads.txt file for shadowcomment.com
# This file lists authorized digital sellers for this domain

# Google AdSense
google.com, pub-3772894258095114, DIRECT, f08c47fec0942fa0

# Ezoic
ezoic.com, 19390, DIRECT

# Additional authorized sellers will be added by Ezoic`;

  res.status(200).send(adsTxtContent);
}
