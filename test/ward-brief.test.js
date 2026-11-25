import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
test('ward brief renders the sourced notice sample and filters by ward', () => {
  const filters = Object.fromEntries(['area','service','scope'].map(id => [id,{value:'all',addEventListener(type, listener){this.change=listener}}]));
  const cards = [];
  const container = {replaceChildren(){cards.length=0},append(card){cards.push(card)}};
  const result = {};
  const document = {
    querySelector(selector){return selector==='#records'?container:selector==='#result-count'?result:filters[selector.slice(1)]},
    createElement(){return {querySelector(){return {setAttribute(){},addEventListener(){}}},querySelectorAll(){return [{},{}]}}}
  };
  const script = new Script(html.match(/<script>([\s\S]+)<\/script>/)[1]);
  script.runInNewContext({document,location:{hash:''},window:{addEventListener(){}},localStorage:{getItem(){return null}}});
  assert.equal(cards.length,3);
  filters.area.value='Ward 28';
  filters.area.change();
  assert.deepEqual(cards.map(card=>card.id),['WS-2026-09-0139']);
});
