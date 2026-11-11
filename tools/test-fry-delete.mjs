import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPostId,approvedDeletionRequest,renderDeleteForm} from './fry-delete-common.mjs';
const form='### 삭제할 소식\n\npost-12345 | 감자튀김 테스트 소식\n\n### 삭제 확인\n\n- [X] 이 글을 삭제하고 향후 자동 재수집도 차단합니다.';
test('dropdown selection can be parsed',()=>assert.equal(extractPostId(form),'post-12345'));
test('legacy request is supported',()=>assert.equal(extractPostId('POST_ID: kfc-20261110'),'kfc-20261110'));
test('owner identity required to process deletion',()=>{
  const base={repo:'fox475763/gamttiz',actor:'fox475763',author:'fox475763',title:'[FRY DELETE]',body:form};
  assert.equal(approvedDeletionRequest(base),'post-12345');
  assert.equal(approvedDeletionRequest({...base,actor:'someone-else'}),null);
  assert.equal(approvedDeletionRequest({...base,author:'someone-else'}),null);
  assert.equal(approvedDeletionRequest({...base,title:'hello'}),null);
});
test('issue form contains a dropdown of actual post ids',()=>{
  const yml=renderDeleteForm([{id:'abc-12345',title:'리아런치'},{id:'def-98765',title:'둠프라이'}]);
  assert.match(yml,/type: dropdown/);
  assert.match(yml,/abc-12345 \| 리아런치/);
  assert.match(yml,/def-98765 \| 둠프라이/);
});
