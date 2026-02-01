/**
 * Pelican Launch Video Capture Script
 *
 * This script uses Puppeteer to capture the launch video demo at high quality.
 *
 * Prerequisites:
 *   npm install puppeteer puppeteer-screen-recorder
 *
 * Usage:
 *   node capture-launch.js
 *
 * Output:
 *   ./output/launch-video-[timestamp].mp4
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  demoFile: 'launch-video.html',
  duration: 65000, // 60 seconds + 5 second buffer
  viewport: {
    width: 1920,
    height: 1080
  },
  outputDir: './output',
  recordingConfig: {
    followNewTab: false,
    fps: 30,
    ffmpeg_Path: null, // Uses system ffmpeg
    videoFrame: {
      width: 1920,
      height: 1080
    },
    videoCrf: 18, // High quality (lower = better, 18-23 is good)
    videoCodec: 'libx264',
    videoPreset: 'ultrafast',
    audioBitrate: 128
  }
};

async function captureVideo() {
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputPath = path.join(CONFIG.outputDir, `launch-video-${timestamp}.mp4`);

  console.log('🎬 Starting Pelican Launch Video capture...');
  console.log(`   Resolution: ${CONFIG.viewport.width}x${CONFIG.viewport.height}`);
  console.log(`   Duration: ${CONFIG.duration / 1000} seconds`);
  console.log(`   Output: ${outputPath}`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Show browser for monitoring
    args: [
      `--window-size=${CONFIG.viewport.width},${CONFIG.viewport.height}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);

  // Initialize recorder
  const recorder = new PuppeteerScreenRecorder(page, CONFIG.recordingConfig);

  // Load the demo page
  const demoPath = path.resolve(__dirname, '..', 'demos', CONFIG.demoFile);
  console.log(`📂 Loading: ${demoPath}`);

  await page.goto(`file://${demoPath}`, {
    waitUntil: 'networkidle0'
  });

  console.log('🔴 Recording started...');
  await recorder.start(outputPath);

  // Wait for the demo to complete
  await new Promise(resolve => setTimeout(resolve, CONFIG.duration));

  console.log('⏹️  Recording stopped');
  await recorder.stop();

  await browser.close();

  console.log(`\n✅ Video saved to: ${outputPath}`);
  console.log('🎉 Capture complete!');
}

// Run
captureVideo().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
