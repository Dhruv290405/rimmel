const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  let result = null;

  page.on('console', msg => {
    const text = msg.text();
    if (text.startsWith('BENCH_RESULT:')) {
      result = JSON.parse(text.replace('BENCH_RESULT:', ''));
      console.log('Parsed bench result:', result);
    } else {
      console.log('PAGE:', text);
    }
  });

  await page.goto('http://127.0.0.1:8080/bench.html');

  // wait up to 30s for bench result
  const start = Date.now();
  while (!result && Date.now() - start < 30000) {
    await new Promise(r => setTimeout(r, 200));
  }

  if (!result) {
    console.error('Benchmark did not complete in time');
    await browser.close();
    process.exit(2);
  }

  console.log('BENCHMARK:', JSON.stringify(result));
  await browser.close();
  // exit success
  process.exit(0);
})();
