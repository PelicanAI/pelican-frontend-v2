/**
 * Pelican Demo Video Capture Script - All Demos
 *
 * This script captures all demo videos in sequence.
 *
 * Prerequisites:
 *   npm install puppeteer puppeteer-screen-recorder
 *
 * Usage:
 *   node capture-all.js
 *
 * Output:
 *   ./output/[demo-name]-[timestamp].mp4
 */

const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');
const fs = require('fs');

// All demos to capture
const DEMOS = [
  { file: 'launch-video.html', duration: 65000, name: 'launch-video' },
  { file: 'pelican-video-demo.html', duration: 70000, name: 'full-demo' },
  { file: 'pelican-demo-intc.html', duration: 20000, name: 'intc' },
  { file: 'pelican-demo-simple.html', duration: 15000, name: 'simple' },
  { file: 'pelican-demo-comparison.html', duration: 25000, name: 'comparison' }
];

// Configuration
const CONFIG = {
  viewport: {
    width: 1920,
    height: 1080
  },
  outputDir: './output',
  recordingConfig: {
    followNewTab: false,
    fps: 30,
    ffmpeg_Path: null,
    videoFrame: {
      width: 1920,
      height: 1080
    },
    videoCrf: 18,
    videoCodec: 'libx264',
    videoPreset: 'ultrafast',
    audioBitrate: 128
  }
};

async function captureDemo(browser, demo, timestamp) {
  const outputPath = path.join(CONFIG.outputDir, `${demo.name}-${timestamp}.mp4`);

  console.log(`\n🎬 Capturing: ${demo.name}`);
  console.log(`   File: ${demo.file}`);
  console.log(`   Duration: ${demo.duration / 1000}s`);

  const page = await browser.newPage();
  await page.setViewport(CONFIG.viewport);

  const recorder = new PuppeteerScreenRecorder(page, CONFIG.recordingConfig);

  const demoPath = path.resolve(__dirname, '..', 'demos', demo.file);
  await page.goto(`file://${demoPath}`, { waitUntil: 'networkidle0' });

  console.log('   🔴 Recording...');
  await recorder.start(outputPath);
  await new Promise(resolve => setTimeout(resolve, demo.duration));

  await recorder.stop();
  await page.close();

  console.log(`   ✅ Saved: ${outputPath}`);
  return outputPath;
}

async function captureAll() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  console.log('🎥 Pelican Demo Capture Suite');
  console.log(`   Resolution: ${CONFIG.viewport.width}x${CONFIG.viewport.height}`);
  console.log(`   Demos to capture: ${DEMOS.length}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--window-size=${CONFIG.viewport.width},${CONFIG.viewport.height}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const outputs = [];

  for (const demo of DEMOS) {
    try {
      const output = await captureDemo(browser, demo, timestamp);
      outputs.push({ name: demo.name, path: output, success: true });
    } catch (err) {
      console.error(`   ❌ Error capturing ${demo.name}:`, err.message);
      outputs.push({ name: demo.name, success: false, error: err.message });
    }
  }

  await browser.close();

  console.log('\n' + '='.repeat(50));
  console.log('📊 Capture Summary:');
  outputs.forEach(o => {
    if (o.success) {
      console.log(`   ✅ ${o.name}: ${o.path}`);
    } else {
      console.log(`   ❌ ${o.name}: Failed - ${o.error}`);
    }
  });
  console.log('='.repeat(50));
  console.log('🎉 All captures complete!');
}

captureAll().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
