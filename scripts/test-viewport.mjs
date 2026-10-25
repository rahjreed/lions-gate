import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {viewportSize,syncViewport,installFixedScaleGestures} from '../dist/viewport.js';

for(const [width,height,visual,expected] of [
 [390,844,{width:390,height:744,scale:1},{width:390,height:744}],
 [390,844,{width:390,height:344,scale:1},{width:390,height:344}],
 [390,844,{width:195,height:372,scale:2},{width:390,height:744}],
 [844,390,{width:844,height:340,scale:1},{width:844,height:340}],
 [360,800,undefined,{width:360,height:800}],
 [390,844,{width:0,height:0,scale:0},{width:390,height:844}]
])assert.deepEqual(viewportSize({innerWidth:width,innerHeight:height,visualViewport:visual}),expected);
const values=new Map(),classes=new Set(),doc={documentElement:{style:{getPropertyValue:key=>values.get(key),setProperty:(key,value)=>values.set(key,value)}},body:{classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)}}};
const win={innerWidth:390,innerHeight:844,visualViewport:{width:390,height:744,scale:1}};
syncViewport(doc,win);assert.equal(values.get('--game-view-height'),'744px');assert.equal(values.get('--game-vh'),'7.44px');
win.visualViewport.height=220;syncViewport(doc,win);assert.ok(classes.has('viewport-short'));
win.visualViewport.height=844;syncViewport(doc,win);assert.equal(values.get('--game-view-height'),'844px');assert.ok(!classes.has('viewport-short'),'Toolbar/keyboard dismissal restores full height');

const listeners={},options={},touchWindow={navigator:{maxTouchPoints:5},matchMedia:()=>({matches:false})};
installFixedScaleGestures({addEventListener:(name,fn,opts)=>{listeners[name]=fn;options[name]=opts}},touchWindow);
const background={closest:()=>null},button={closest:()=>({})};let stamp=0;
function event(target=background,extra={}){return {target,timeStamp:stamp,cancelable:true,touches:[],changedTouches:[],defaultPrevented:false,preventDefault(){this.defaultPrevented=true},...extra}}
function fire(name,e){listeners[name](e);return e}
for(const type of ['gesturestart','gesturechange','gestureend']){assert.equal(fire(type,event()).defaultPrevented,true);assert.equal(options[type].passive,false);assert.equal(fire(type,event(background,{cancelable:false})).defaultPrevented,false)}
for(const type of ['touchstart','touchmove'])assert.equal(fire(type,event(background,{touches:[{clientX:0,clientY:0},{clientX:50,clientY:0}]})).defaultPrevented,true);
const point={clientX:10,clientY:10};
const tap=target=>{fire('touchstart',event(target,{touches:[point]}));stamp+=60;return fire('touchend',event(target,{changedTouches:[point]}))};
assert.equal(tap(background).defaultPrevented,false);stamp+=120;assert.equal(tap(background).defaultPrevented,true,'Second background tap cannot zoom');
stamp+=500;assert.equal(tap(button).defaultPrevented,false);stamp+=80;assert.equal(tap(button).defaultPrevented,false,'Rapid ordinary control taps remain intact');
fire('touchstart',event(background,{touches:[point]}));assert.equal(fire('touchmove',event(background,{touches:[{clientX:10,clientY:90}]})).defaultPrevented,false);stamp+=50;assert.equal(fire('touchend',event(background,{changedTouches:[point]})).defaultPrevented,false,'Single-finger Scripture scrolling remains native');
assert.equal(fire('dblclick',event()).defaultPrevented,true);assert.equal(fire('wheel',event(background,{ctrlKey:true})).defaultPrevented,true);
assert.equal(fire('wheel',event(background,{ctrlKey:false})).defaultPrevented,false);
touchWindow.navigator.maxTouchPoints=0;assert.equal(fire('dblclick',event()).defaultPrevented,false,'Desktop selection remains normal');assert.equal(fire('wheel',event(background,{ctrlKey:true})).defaultPrevented,false);
const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
assert.equal((html.match(/name="viewport"/g)||[]).length,1);for(const token of ['width=device-width','initial-scale=1','minimum-scale=1','maximum-scale=1','user-scalable=no','viewport-fit=cover'])assert.ok(html.includes(token));
const css=await readFile(new URL('../dist/viewport.css',import.meta.url),'utf8');assert.match(css,/touch-action:pan-y/);assert.match(css,/nickname\{font-size:16px/);assert.ok(!/transform:.*scale\(/.test(css),'No whole-game transform scaling');
console.log('PASS viewport: visual/layout viewport differences, normalized browser override, keyboard/toolbars/rotation, short-window fallback, fixed-scale metadata, pinch/gesture/background-double-tap cancellation, normal control taps, single-finger explanation scrolling and desktop behavior. Native iOS/Android gestures require device testing.');
