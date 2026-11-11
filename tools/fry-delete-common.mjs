// Shared parsing rules for GitHub-authenticated FRY RADAR deletion requests.
export function extractPostId(body='') {
  const text=String(body||'');
  // GitHub issue forms emit the selected dropdown option beneath its heading.
  const selection=text.match(/^### 삭제할 소식\s*\r?\n\s*\r?\n([^\r\n]+)/m)?.[1]?.trim()||'';
  const chosen=selection.match(/^([a-zA-Z0-9_-]{5,100})\s*\|\s*\S/)?.[1];
  if(chosen)return chosen;
  // Legacy manual issues remain supported.
  return text.match(/^POST_ID:\s*([a-zA-Z0-9_-]{5,100})\s*$/m)?.[1]||null;
}
export function approvedDeletionRequest({repo,actor,author,title,body}){
  if(repo!=='fox475763/gamttiz'||actor!=='fox475763'||author!=='fox475763')return null;
  if(!/^\[FRY DELETE\](?:\s|$)/.test(String(title||'')))return null;
  return extractPostId(body);
}
export function renderDeleteForm(items){
  const entries=[...new Map((items||[])
    .filter(x=>x&&/^[a-zA-Z0-9_-]{5,100}$/.test(x.id||'')&&typeof x.title==='string')
    .map(x=>[x.id,x])).values()];
  // Use JSON quoting, a supported YAML double-quoted string syntax.
  const choices=entries.slice(0,250).map(x=>'        - '+JSON.stringify(x.id+' | '+x.title.replace(/\s+/g,' ').slice(0,140))).join('\n');
  const fallback='        - "no-posts | 삭제 가능한 소식 없음"';
  return [
    'name: FRY RADAR 게시물 삭제',
    'description: GitHub 로그인 후 감튀 소식을 선택하여 삭제합니다.',
    'title: "[FRY DELETE]"',
    'body:',
    '  - type: markdown',
    '    attributes:',
    '      value: "소식 삭제는 GitHub 저장소 소유자 fox475763만 승인됩니다. 다른 계정으로 제출해도 게시물은 변경되지 않습니다."',
    '  - type: dropdown',
    '    id: fry_post',
    '    attributes:',
    '      label: 삭제할 소식',
    '      description: "아래 목록에서 삭제할 글을 하나 선택하세요."',
    '      options:',
    choices||fallback,
    '    validations:',
    '      required: true',
    '  - type: checkboxes',
    '    id: deletion_confirmation',
    '    attributes:',
    '      label: 삭제 확인',
    '      options:',
    '        - label: "이 글을 삭제하고 향후 자동 재수집도 차단합니다."',
    '          required: true',
    '    validations:',
    '      required: true',
    ''
  ].join('\n');
}
