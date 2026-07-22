const puppeteer = require('puppeteer');

const sites = [
  { url: 'https://www.bhawana.incomrealestate.com', loginPath: '/visitor' }
];

const textWidget1Html = `<section aria-labelledby="selling-steps-title" class="selling-steps hero-container"><div class="hero-image-wrapper"><picture><img src="/base_imgs/selling_tips/top-banner.webp" alt="10 steps to selling your home in Canada with a real estate agent" width="1600" height="800" fetchpriority="high" loading="eager" /></picture><div class="round-container"><div class="round-container-text"><h1 id="selling-steps-title" class="main-title animate-on-scroll">10 Steps to Selling a Home With <span class="broker_agent_name"></h1><p class="top-container-content animate-on-scroll">Selling your home is one of the most important financial decisions you'll make. The right strategy, timing, and expert guidance from <span class="broker_agent_name"></span> ensure you maximize your return while enjoying a seamless selling experience.</p><div class="btn-wrapper"><a class="cta-button" href="/node/add/contactSite" target="_blank" title="Contact real estate agent to sell your home">Contact Me</a></div></div></div></div></section>
<section class="steps step_1 animate-on-scroll"><div class="main-content"><div class="left-content"><h2 class="title">Step 1: Decide when to sell</h2><p class="desc">In the Canadian real estate market, timing influences your final selling price. Let&rsquo;s look at the key factors to help you determine the best time to list.</p><div class="step-accordion"><details open=""><summary><h3>Is it a seller&rsquo;s market or a buyer&rsquo;s market?</h3></summary><div class="contents"><p>When buyer demand exceeds available homes, it&rsquo;s a seller&rsquo;s market, creating stronger competition and an advantage for sellers. When supply exceeds demand, it becomes a buyer&rsquo;s market, offering more choice and negotiating power for buyers.</p></div></details><details><summary><h3>When is the best time to sell a home?</h3></summary><div class="contents"><p>Spring and fall are the strongest peak selling periods. However, a properly presented home can sell successfully in any season when marketed strategically.</p></div></details><details><summary><h3>How quickly do you need to sell your home?</h3></summary><div class="contents"><p>The right time to sell depends on both market conditions and your personal situation. If you need a quick sale, competitive pricing can generate immediate interest. If you have more flexibility, you may choose to wait for stronger offers and maximize your return.</p></div></details><details><summary><h3>Should you buy first or sell first?</h3></summary><div class="contents"><p>Buying and selling often happen together, making timing critical. With the right strategy, both transactions can align for a smooth transition. <span class="broker_agent_name"></span> can help coordinate timelines, structure conditions, and manage the process efficiently.</p></div></details></div></div><div class="right-content"><div class="info-card"><div class="mainInfo"><div class="circularimage" itemprop="Agent Image"></div><div class="info"><h2 class="agent-title" itemprop="title"></h2><h3 class="agent-name" itemprop="name"></h3></div></div><div class="agent-bio" itemprop="description"></div><div class="btn-wrapper-read-more"><span id="read-more-btn">Read More</span></div><div class="contact-info"><div class="email"><a class="email" href="/node/add/contactSite" target="_blank">Email Me</a></div></div></div></div></div></section>`;

const textWidget2Html = `<p>Hello world</p>`;

(async () => {
  for (const site of sites) {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 }
    });
    const page = await browser.newPage();
    await page.goto(site.url + site.loginPath);
    await page.type('#edit-name', 'WebsiteOwner');
    await page.type('#edit-pass', 'd4nt6kaQ2bd4p!faQm#sD');
    await page.click('.form-submit');
    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.goto(site.url + '/static_pages');
    await page.waitForSelector('a[href*="static_pages"]', { timeout: 10000 });
    const editLinkHref = await page.evaluate(() => {
      const sellingTipsLink = Array.from(document.querySelectorAll('td a')).find(
        a => a.textContent.trim() === '10-Step Guide to Selling  Your Home'
      );
      if (sellingTipsLink) {
        const editLink = sellingTipsLink.closest('td').nextElementSibling.querySelector('a.node-edit-link');
        return editLink ? editLink.getAttribute('href') : null;
      }
      return null;
    });
    if (editLinkHref) {
      console.log('Found edit link:', editLinkHref);
      await page.goto(site.url + editLinkHref);
      console.log('Navigated to edit page');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Edit page loaded');
      await page.waitForSelector('.cke_button__source', { timeout: 30000 });
      console.log('CKEditor source button found');
      await page.evaluate(() => {
        const sourceBtn = document.querySelector('a.cke_button__source[title="Source"]');
        if (sourceBtn) sourceBtn.click();
      });
      console.log('Clicked source button');
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.evaluate(() => {
        const textarea = document.querySelector('.cke_source');
        if (textarea) {
          textarea.value = '';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          textarea.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.waitForSelector('input[type="submit"][name="op"]', { timeout: 30000 });
      await page.click('input[type="submit"][name="op"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
      await page.goto(site.url + '/WidgetsManager?clear=1');
      if (editLinkHref) {
        const cleanHref2 = editLinkHref.replace(/\/edit\?.*$/, '');
        await page.goto(site.url + cleanHref2);
      }

      const debugCountBefore = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('#contentwidgettop .widgetItem[id^="textWidget-0-"]'));
        console.log('Initial text widgets count:', items.length, items.map(i => i.id));
        return items.length;
      });
      console.log('Initial widget count:', debugCountBefore);

      async function dropAndEditTextWidget(label, html) {
        console.log(`Processing ${label}`);
        await page.waitForSelector('.widgets-wrapper .widgetItem[ltr="textWidget-0"]', { timeout: 30000 });
        const allSources = await page.$$('.widgets-wrapper .widgetItem[ltr="textWidget-0"]');
        const sourceElem = allSources[0];
        const targetElem = await page.$('#contentwidgettop');
        if (sourceElem && targetElem) {
          const sourceInfo = await sourceElem.boundingBox();
          const targetInfo = await targetElem.boundingBox();
          await page.mouse.move(sourceInfo.x + sourceInfo.width / 2, sourceInfo.y + sourceInfo.height / 2);
          await page.mouse.down();
          await page.mouse.move(targetInfo.x + targetInfo.width / 2, targetInfo.y + targetInfo.height / 2, { steps: 20 });
          await page.mouse.up();
        }
        console.log(`${label} dropped`);
        await new Promise(resolve => setTimeout(resolve, 3000));

        const newWidgetId = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('#contentwidgettop .widgetItem[id^="textWidget-0-"]'));
          console.log('After drop widget items:', items.map(item => item.id));
          const last = items[items.length - 1];
          return last ? last.id.replace('textWidget-0-', '') : null;
        });
        console.log(`${label} widget ID:`, newWidgetId);

        if (newWidgetId) {
          console.log(`Clicking ${label} settings for ID:`, newWidgetId);
          await page.evaluate((id) => {
            const settingsLink = document.querySelector(`a.settings-widget[href*="/WidgetsManager/widget/settings/${id}"]`);
            if (settingsLink) settingsLink.click();
          }, newWidgetId);

          await new Promise(resolve => setTimeout(resolve, 2000));
          await page.evaluate(() => {
            const iframe = document.querySelector('#superbox-innerbox iframe');
            if (iframe && iframe.contentDocument) {
              const sourceBtn = iframe.contentDocument.querySelector('a.cke_button__source[title="Source"]');
              if (sourceBtn) sourceBtn.click();
            }
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.evaluate((html) => {
            const iframe = document.querySelector('#superbox-innerbox iframe');
            if (iframe && iframe.contentDocument) {
              const textarea = iframe.contentDocument.querySelector('.cke_source');
              if (textarea) {
                textarea.value = '';
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
                textarea.value = html;
                textarea.dispatchEvent(new Event('input', { bubbles: true }));
                textarea.dispatchEvent(new Event('change', { bubbles: true }));
              }
            }
          }, html);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.evaluate(() => {
            const iframe = document.querySelector('#superbox-innerbox iframe');
            if (iframe && iframe.contentDocument) {
              const sourceBtn = iframe.contentDocument.querySelector('a.cke_button__source[title="Source"]');
              if (sourceBtn) sourceBtn.click();
            }
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          await page.evaluate(() => {
            const iframe = document.querySelector('#superbox-innerbox iframe');
            if (iframe && iframe.contentDocument) {
              const saveBtn = iframe.contentDocument.querySelector('input[type="submit"][name="op"][value="Save"]');
              if (saveBtn) saveBtn.click();
            }
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          await page.waitForSelector('p.close a', { timeout: 30000 }).catch(() => {});
          await page.click('p.close a').catch(() => {});
          console.log(`${label} saved and superbox closed`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      await dropAndEditTextWidget('text widget 1', textWidget1Html);
      await dropAndEditTextWidget('text widget 2', textWidget2Html);

      console.log('Done');
    }
  }
})();
