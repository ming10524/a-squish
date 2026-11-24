const { chromium, devices } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const server = require('./serve.cjs');
(async () => {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({channel:'chrome',headless:true});
  fs.mkdirSync('.local',{recursive:true});
  try {
    for(const mobile of [false,true]) {
      const context=await browser.newContext(mobile ? {...devices['iPhone 13'],browserName:undefined} : {viewport:{width:1000,height:800}});
      const page=await context.newPage(), errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(url);
      await page.getByRole('button',{name:'海龜',exact:false}).click();
      await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('局部變形試作'),null,{timeout:60000});
      await page.evaluate(()=>window.scrollTo(0,0));
      assert.equal(await page.locator('#pet').evaluate(e=>getComputedStyle(e).visibility),'hidden');
      const stage=await page.locator('#stage').boundingBox();
      await page.screenshot({path:`.local/turtle-${mobile?'mobile':'desktop'}.png`});
      const x=stage.x+stage.width/2,y=stage.y+stage.height*.52;
      if(mobile) await page.touchscreen.tap(x,y);
      else {await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+25,y+10,{steps:5});await page.mouse.up();}
      assert.match(await page.locator('#msg').textContent(),/海龜：/);
      // Rotation and controls must not trigger the 2D sound/message path.
      const canvas = page.locator('#stage canvas');
      async function restored(original) {
        const deadline=Date.now()+12000;
        while(Date.now()<deadline) {
          if(original.equals(await canvas.screenshot())) return true;
          await page.waitForTimeout(100);
        }
        return false;
      }
      await page.waitForTimeout(1200);
      const resting = await canvas.screenshot();
      await page.getByRole('button',{name:'戳戳',exact:false}).click();
      await page.mouse.move(x,y); await page.mouse.down(); await page.waitForTimeout(350);
      assert.ok(!resting.equals(await canvas.screenshot()), 'Poke must visibly deform model');
      await page.screenshot({path:'.local/turtle-poke.png'});
      await page.mouse.up(); await page.waitForTimeout(1800);
      assert.ok(await restored(resting), 'Release must restore original geometry');
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-20,y,id:1},{x:x+20,y,id:2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-35,y,id:1},{x:x+35,y,id:2}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
      await page.waitForTimeout(1800);
      assert.ok(await restored(resting), 'Touch cancel must restore model');
      await cdp.detach();
      await page.getByRole('button',{name:'旋轉角色'}).click();
      const before=await page.locator('#msg').textContent();
      await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+70,y,{steps:8});await page.mouse.up();
      assert.equal(await page.locator('#msg').textContent(),before);
      await page.getByRole('button',{name:'✓ 拖曳旋轉'}).click();
      for(const name of ['捏捏','擠壓','撫摸','拉扯','搔癢','戳戳']) {
        await page.getByRole('button',{name,exact:false}).click();
        await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+15,y+10);await page.mouse.up();
      }
      // Background must leave message untouched.
      const message=await page.locator('#msg').textContent();
      await page.mouse.click(stage.x+5,stage.y+5);
      assert.equal(await page.locator('#msg').textContent(),message);
      await page.getByRole('button',{name:'鴨董',exact:false}).click();
      assert.equal(await page.locator('#pet').evaluate(e=>getComputedStyle(e).visibility),'hidden');
      await page.getByRole('button',{name:'兔子',exact:false}).click();
      assert.equal(await page.locator('#pet').evaluate(e=>getComputedStyle(e).visibility),'visible');
      await page.getByRole('button',{name:'海龜',exact:false}).click();
      assert.equal(await page.locator('#pet').evaluate(e=>getComputedStyle(e).visibility),'hidden');
      await page.getByRole('button',{name:'音效開啟',exact:false}).click();
      assert.match(await page.locator('#sound').textContent(),/關閉/);
      assert.deepEqual(errors,[]);
      console.log(mobile?'Mobile emulation PASS':'Desktop PASS');
      await context.close();
    }
    for(const fail of ['model','cdn']) {
      const page=await browser.newPage();
      await page.route(fail==='model'?'**/turtle.glb':'**/cdn.jsdelivr.net/**',r=>r.abort());
      await page.goto(url);
      await page.getByRole('button',{name:'海龜',exact:false}).click();
      if(fail==='model') await page.waitForFunction(()=>document.querySelector('[role=status]').textContent.includes('載入失敗'));
      assert.equal(await page.locator('#pet').evaluate(e=>getComputedStyle(e).visibility),'visible');
      console.log(`${fail} fallback PASS`);await page.close();
    }
  } finally {await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
