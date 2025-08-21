# Deploy script for Vercel

Write-Host "Adding changes to git..."
git add .

Write-Host "Committing changes..."
git commit -m "Fix GitHub authentication redirect URLs"

Write-Host "Pushing changes to GitHub..."
git push origin main

Write-Host "Deployment complete! The changes will be automatically deployed by Vercel."
Write-Host "Please wait a few minutes for the deployment to complete, then check your Vercel dashboard."