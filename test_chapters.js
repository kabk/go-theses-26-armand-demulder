const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const colText = document.querySelector('.col-main');
const chaptersList = colText.querySelectorAll(':scope > div:not(#bibliography):not(#statement-originality)');

chaptersList.forEach((chap, i) => {
    const anchors = chap.querySelectorAll('sup[data-footnote]');
    const h2 = chap.querySelector('h2');
    console.log(`Index ${i}: anchors=${anchors.length}, h2=${h2 ? h2.textContent : 'none'}`);
});
