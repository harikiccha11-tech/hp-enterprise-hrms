import { execSync } from 'child_process'
console.log('Starting Next.js dev server...')
const proc = execSync('npx next dev -p 3000', { cwd: '/home/z/my-project', stdio: 'inherit' })
