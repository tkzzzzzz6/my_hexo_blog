"""Optional visual/behavior check: pip install playwright; use an installed browser.

Run after check:build and serving public/: python tools/agent-flow/browser-sidebar.py
Screenshots and the report stay in ignored tools/blog-assets/.
"""
import argparse
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

parser = argparse.ArgumentParser()
parser.add_argument('--url', default='http://127.0.0.1:41861/')
parser.add_argument('--channel', default='msedge')
args = parser.parse_args()
out = Path('tools/blog-assets/2026-11-28-home-sidebar')
out.mkdir(parents=True, exist_ok=True)
mount_script = Path('themes/hingle/source/static/home-sidebar.js').read_text(encoding='utf-8')
report = []

def sprite_bounds(page):
    return page.evaluate('''() => new Promise(resolve => {
        requestAnimationFrame(() => {
            const c=document.querySelector('.side-live2d-stage canvas'), r=c.getBoundingClientRect();
            const copy=document.createElement('canvas'); copy.width=c.width; copy.height=c.height;
            const ctx=copy.getContext('2d'); ctx.drawImage(c,0,0);
            const pixels=ctx.getImageData(0,0,c.width,c.height).data;
            let minX=c.width, maxY=-1;
            for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
                if(pixels[(y*c.width+x)*4+3]>16){minX=Math.min(minX,x);maxY=Math.max(maxY,y);}
            }
            resolve({visibleLeft:r.x+minX*r.width/c.width,footGap:innerHeight-(r.y+(maxY+1)*r.height/c.height),
                rendered:maxY>=0,linkLeft:document.querySelector('.side-recent .post-list-link').getBoundingClientRect().x});
        });
    })''')

with sync_playwright() as p:
    browser = p.chromium.launch(channel=args.channel, headless=True, args=['--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
    page_errors = []
    page.on('pageerror', lambda error: page_errors.append(str(error)))
    page.goto(args.url, wait_until='load')
    page.wait_for_selector('.side-live2d-stage canvas', state='attached')
    page.wait_for_timeout(1200)

    for width, height, dark in [(1920, 1080, False), (1440, 900, False), (1920, 1080, True), (1440, 650, True)]:
        page.set_viewport_size({'width': width, 'height': height})
        page.evaluate('(dark) => { document.body.classList.toggle("dark-theme", dark); window.scrollTo({top:0,behavior:"instant"}); }', dark)
        page.wait_for_timeout(350)
        metrics = page.evaluate('''() => {
            const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}; };
            const boxStyle = getComputedStyle(document.querySelector('.home-side-box'));
            return {clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
                background:boxStyle.backgroundColor,shadow:boxStyle.boxShadow,border:boxStyle.borderTopWidth,
                left:rect('.home-side-left > .home-side-box'),right:rect('.home-side-right > .home-side-box'),
                content:rect('.home-content'),stage:rect('.side-live2d-stage'),widget:rect('#live2d-widget'),
                widgetInStage:document.querySelector('.side-live2d-stage').contains(document.getElementById('live2d-widget'))};
        }''')
        assert abs(metrics['left']['x'] - 24) <= 1, metrics
        assert abs(metrics['clientWidth'] - metrics['right']['right'] - 24) <= 1, metrics
        assert abs(metrics['content']['x'] + metrics['content']['width']/2 - metrics['clientWidth']/2) <= 1, metrics
        assert metrics['left']['right'] + 24 <= metrics['content']['x'] + 1, metrics
        assert metrics['content']['right'] + 24 <= metrics['right']['x'] + 1, metrics
        assert metrics['scrollWidth'] <= metrics['clientWidth'], metrics
        assert metrics['left']['bottom'] <= height - 15, metrics
        assert metrics['right']['bottom'] <= height - 15, metrics
        assert metrics['background'] == 'rgba(0, 0, 0, 0)', metrics
        assert metrics['shadow'] == 'none' and metrics['border'] == '0px', metrics
        if height >= 900:
            assert metrics['left']['bottom'] >= height - 17, metrics
            sprite = sprite_bounds(page)
            assert sprite['rendered'], sprite
            assert abs(sprite['visibleLeft'] - sprite['linkLeft']) <= 2, sprite
            assert 12 <= sprite['footGap'] <= 40, sprite
        assert metrics['widgetInStage'], metrics
        assert abs(metrics['widget']['width'] - 150) <= 1, metrics
        assert abs(metrics['widget']['height'] - 300) <= 1, metrics
        name = f'desktop-{width}-{height}-' + ('dark' if dark else 'light')
        page.screenshot(path=str(out / (name + '.png')))
        page.evaluate('window.scrollTo({top:1000,behavior:"instant"})')
        page.wait_for_timeout(250)
        sticky_top = page.locator('.home-side-left > .home-side-box').bounding_box()['y']
        header_bottom = page.locator('header').bounding_box()['height']
        assert sticky_top >= header_bottom, (sticky_top, header_bottom)
        assert sticky_top < header_bottom + 30, (sticky_top, header_bottom)
        if height >= 900:
            scrolled_sprite = sprite_bounds(page)
            assert 12 <= scrolled_sprite['footGap'] <= 40, scrolled_sprite
        report.append({'viewport':[width,height],'dark':dark,'metrics':metrics,'stickyTop':sticky_top,
                       'sprite':sprite if height >= 900 else None})

    page.set_viewport_size({'width':1440,'height':900})
    button = page.locator('.side-more')
    if button.count():
        button.click()
        assert button.get_attribute('aria-expanded') == 'true'
        assert page.locator('.side-timeline-rest').is_visible()
        button.click()
        assert button.get_attribute('aria-expanded') == 'false'
    page.locator('.side-tags a').last.scroll_into_view_if_needed()
    assert page.locator('.side-tags a').last.is_visible()

    for width in [1280, 1024, 390]:
        page.set_viewport_size({'width':width,'height':844})
        page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
        page.wait_for_timeout(250)
        assert not page.locator('.home-side-left').is_visible()
        assert not page.locator('.home-side-right').is_visible()
        assert not page.locator('#live2d-widget').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth')
        if width == 390:
            page.screenshot(path=str(out / 'mobile-390.png'))
        report.append({'viewport':[width,844],'sidebarsHidden':True,'widgetHidden':True,'noOverflow':True})

    # Exercise both library creation orders against real browser DOM nodes.
    fixture = browser.new_page()
    for delayed in [False, True]:
        fixture.set_content('<div class="side-live2d-stage"></div>' + ('' if delayed else '<div id="live2d-widget"><canvas></canvas></div>'))
        fixture.evaluate(mount_script)
        if delayed:
            fixture.evaluate('document.body.insertAdjacentHTML("beforeend", \'<div id="live2d-widget"><canvas></canvas></div>\')')
        fixture.wait_for_selector('.side-live2d-stage #live2d-widget', state='attached')
        assert fixture.locator('.side-live2d-stage canvas').count() == 1
        assert fixture.locator('body > #live2d-widget').count() == 0
    fixture.set_content('<div class="side-live2d-stage"></div>')
    fixture.evaluate(mount_script)
    fixture.evaluate('''() => {
        window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted:true}));
        window.dispatchEvent(new PageTransitionEvent('pageshow', {persisted:true}));
        document.body.insertAdjacentHTML('beforeend', '<div id="live2d-widget"><canvas></canvas></div>');
    }''')
    fixture.wait_for_selector('.side-live2d-stage #live2d-widget', state='attached', timeout=1000)
    assert not page_errors, page_errors
    (out / 'report.json').write_text(json.dumps({'cases':report,'pageErrors':page_errors,'mountOrdersPassed':True},ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'passed':True,'layoutCases':len(report),'mountOrdersPassed':True,'screenshots':str(out)},ensure_ascii=False))
    browser.close()
