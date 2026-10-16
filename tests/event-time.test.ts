import assert from 'node:assert/strict';
import { test } from 'node:test';
import { easternTimeToIso, easternTimeInput } from '../lib/event-time';
test('poster dates use Eastern time across daylight saving changes',()=>{
  assert.equal(easternTimeToIso('2026-10-18T11:00'),'2026-10-18T15:00:00.000Z');
  assert.equal(easternTimeToIso('2026-12-18T11:00'),'2026-12-18T16:00:00.000Z');
  assert.equal(easternTimeInput('2026-10-18T19:00:00.000Z'),'2026-10-18T15:00');
  assert.throws(()=>easternTimeToIso('2026-03-08T02:30'));
});
