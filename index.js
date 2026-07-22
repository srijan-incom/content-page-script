const puppeteer = require('puppeteer');
const widgets = require('./widget.json');

const sites = [
  { url: 'https://www.bhawana.incomrealestate.com', loginPath: '/visitor' }
];

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

      for (const widget of widgets) {
        console.log('Processing widget type:', widget.type);
        await page.waitForSelector('.widgetItem[ltr="textWidget-0"]', { timeout: 30000 });
        const sourceElem = await page.$('.widgetItem[ltr="textWidget-0"]');
        const targetElem = await page.$('#contentwidgettop');
        if (sourceElem && targetElem) {
          const sourceInfo = await sourceElem.boundingBox();
          const targetInfo = await targetElem.boundingBox();
          await page.mouse.move(sourceInfo.x + sourceInfo.width / 2, sourceInfo.y + sourceInfo.height / 2);
          await page.mouse.down();
          await page.mouse.move(targetInfo.x + targetInfo.width / 2, targetInfo.y + targetInfo.height / 2, { steps: 20 });
          await page.mouse.up();
        }
        console.log('Text widget dropped');

        const newWidgetId = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('#contentwidgettop .widgetItem'));
          const last = items[items.length - 1];
          return last && last.id ? last.id.replace('textWidget-0-', '') : null;
        });

        if (newWidgetId) {
          console.log('Clicking widget settings for ID:', newWidgetId);
          await page.click(`a.settings-widget[ltr="textWidget-0-${newWidgetId}"]`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          await page.evaluate(() => {
            const iframe = document.querySelector('#superbox-innerbox iframe');
            if (iframe && iframe.contentDocument) {
              const sourceBtn = iframe.contentDocument.querySelector('a.cke_button__source[title="Source"]');
              if (sourceBtn) {
                sourceBtn.click();
              }
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
          }, widget.html);
          await new Promise(resolve => setTimeout(resolve, 1000));
          await page.evaluate(() => {
            const iframe = document.querySelector('#superbox-innerbox iframe');
            if (iframe && iframe.contentDocument) {
              const sourceBtn = iframe.contentDocument.querySelector('a.cke_button__source[title="Source"]');
              if (sourceBtn) {
                sourceBtn.click();
              }
            }
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          await page.evaluate(() => {
            const iframe = document.querySelector('#superbox-innerbox iframe');
            if (iframe && iframe.contentDocument) {
              const saveBtn = iframe.contentDocument.querySelector('input[type="submit"][name="op"][value="Save"]');
              if (saveBtn) {
                saveBtn.click();
              }
            }
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          await page.waitForSelector('p.close a', { timeout: 30000 });
          await page.click('p.close a');
          console.log('Widget saved and superbox closed');
        }
      }
      console.log('Done');
    }
  }
})();
