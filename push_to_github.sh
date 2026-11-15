#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Pushing code to GitHub repository 'KTcollage'..."
git push -u origin main
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Push to GitHub successful!"
  echo "Next step: Go to Render (https://dashboard.render.com) and deploy KTcollage."
else
  echo ""
  echo "❌ Push failed. Please make sure you created the repo 'KTcollage' at: https://github.com/new?name=KTcollage"
fi
