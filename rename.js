const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/diksh/.gemini/antigravity/scratch/studystick-ai';

function walkDir(currentPath) {
  const files = fs.readdirSync(currentPath);
  for (const file of files) {
    if (file === 'node_modules' || file === 'dist' || file === '.git' || file === '.env.example' || file.startsWith('.')) continue;
    const fullPath = path.join(currentPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.html') || file.endsWith('.json') || file.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('studystick AI') || content.includes('studystick')) {
        console.log(`Found in: ${fullPath}`);
        content = content.replace(/studystick AI/g, 'Study Stick AI').replace(/studystick/g, 'Study Stick');
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

walkDir(dir);
