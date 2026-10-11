const {test}=require('node:test'); const assert=require('node:assert/strict');
const ts=require('typescript'); const {readFileSync}=require('node:fs');
const compiled=ts.transpileModule(readFileSync('apps/web/src/lib/notifications.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const loaded={exports:{}};new Function('module','exports',compiled)(loaded,loaded.exports);
const {groupNotificationsByDay,formatNotificationTime}=loaded.exports;
test('Group and event use the same date across UTC midnight, independent of server timeLabel',()=>{
 const event={id:'boundary',createdAt:'2026-09-25T00:30:00Z',timeLabel:'25-sept'};
 for(const [timeZone,date] of [['America/Argentina/Buenos_Aires','2026-09-24'],['UTC','2026-09-25'],['Asia/Tokyo','2026-09-25']]){
  assert.equal(groupNotificationsByDay([event],{timeZone})[0].dateKey,date);
  assert.ok(formatNotificationTime(event.createdAt,timeZone).includes(date.slice(-2)));
 }
 assert.ok(formatNotificationTime(event.createdAt,'America/Argentina/Buenos_Aires').includes('21:30'));
});
test('Local Today/Yesterday uses calendar days even during DST changes',()=>{
 const timeZone='America/New_York',now=new Date('2026-03-09T04:30:00Z');
 assert.equal(groupNotificationsByDay([{createdAt:'2026-03-08T05:30:00Z'}],{timeZone,now})[0].label,'Ayer');
 assert.equal(groupNotificationsByDay([{createdAt:'2026-03-09T04:00:00Z'}],{timeZone,now})[0].label,'Hoy');
 assert.equal(groupNotificationsByDay([{createdAt:'invalid'}],{timeZone,now})[0].label,'Sin fecha');
 assert.equal(formatNotificationTime('invalid',timeZone),'Fecha no disponible');
});
