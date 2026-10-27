import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const outDir = 'D:/Bài Tập Cô Dung/cv.worktrees/project-explanation-request/public/images';

const cakePhotos = {
  'banh-kem-dau-tay-kem-tuoi': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=700&auto=format&fit=crop&q=85',
  'banh-kem-socola-belgium': 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&auto=format&fit=crop&q=85',
  'banh-kem-tra-xanh-matcha': 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=700&auto=format&fit=crop&q=85',
  'banh-kem-hoa-hong-vai': 'https://images.unsplash.com/photo-1535141192574-5d4897c13136?w=700&auto=format&fit=crop&q=85',
  'bento-cake-vintage-pastel': 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=700&auto=format&fit=crop&q=85',
  'bento-cake-socola-marshmallow': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=700&auto=format&fit=crop&q=85',
  'bento-cake-tra-sua-tran-chau': 'https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=700&auto=format&fit=crop&q=85',
  'mousse-xoai-chanh-leo': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=700&auto=format&fit=crop&q=85',
  'mousse-viet-quat-kem-cheese': 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=700&auto=format&fit=crop&q=85',
  'mousse-bap-non-kem-dua': 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=700&auto=format&fit=crop&q=85',
  'tiramisu-y-truyen-thong': 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=700&auto=format&fit=crop&q=85',
  'tiramisu-matcha-mascarpone': 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=700&auto=format&fit=crop&q=85',
  'tiramisu-hop-thiec-cao-cap': 'https://images.unsplash.com/photo-1602351447937-745cb720612f?w=700&auto=format&fit=crop&q=85',
  'banh-kem-tao-hinh-fondant': 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=700&auto=format&fit=crop&q=85',
  'banh-kem-tang-sang-trong': 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=700&auto=format&fit=crop&q=85',
  'banh-kem-ve-hinh-theo-anh': 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=700&auto=format&fit=crop&q=85',
  'set-nen-so-nhu-vang': 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=700&auto=format&fit=crop&q=85',
  'set-mu-sinh-nhat-pastel': 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700&auto=format&fit=crop&q=85',
  'hop-phu-kien-dao-dia-nen': 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=700&auto=format&fit=crop&q=85',
  'bang-topper-chuc-mung': 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=700&auto=format&fit=crop&q=85',
  'cake-default': 'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=700&auto=format&fit=crop&q=85'
};

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading 100% REAL cake photographs...');
  for (const [id, url] of Object.entries(cakePhotos)) {
    const dest = path.join(outDir, `${id}.jpg`);
    try {
      await downloadImage(url, dest);
      const stat = fs.statSync(dest);
      console.log(`✓ Downloaded ${id}.jpg (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ Error downloading ${id}:`, err.message);
    }
  }
  console.log('Done downloading real cake photos!');
}

main();

