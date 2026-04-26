# Créer le projet Next.js 16
npx create-next-app@latest kes_carburant --typescript --tailwind --app --no-src-dir --import-alias "@/*"

# Entrer dans le projet
cd kes_carburant

# Supprimer les fichiers inutiles
rm -rf public/next.svg public/vercel.svg app/favicon.ico app/globals.css app/page.module.css

# Installer Prisma 7
npm install prisma @prisma/client

# Installer l'authentification
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# Installer MinIO
npm install minio sharp
npm install -D @types/sharp

# Installer PWA (Workbox)
npm install workbox-webpack-plugin
npm install -D @types/node

# Installer offline storage
npm install idb

# Installer formulaires
npm install react-hook-form zod @hookform/resolvers

# Installer graphiques
npm install recharts

# Installer utilitaires
npm install react-hot-toast date-fns

# TSX est un exécuteur TypeScript pour Node.js.
npm install -D tsx

# Initialiser Prisma
npx prisma init

# Démarrer MySQL et MinIO
docker compose up -d

# Générer Prisma client
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed

# Démarrer l'application
npm run dev

npm install sharp


admin@kescarburant.com
admin123
