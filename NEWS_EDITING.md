# 감띠즈 소식 게시 방법

이 사이트는 GitHub Pages에서 동작하는 정적 사이트입니다. 방문자는 소식을 읽기만 할 수 있습니다. 글과 사진은 저장소에 쓰기 권한이 있는 제작자만 게시할 수 있습니다.

## 웹 편집기로 게시하기

1. 소식 페이지 맨 아래의 작은 **＋ 소식 올리기**를 누릅니다.
2. `fox475763/gamttiz` 저장소에 대해 **Contents: Read and write** 권한이 있는 GitHub fine-grained personal access token으로 로그인합니다. 로그인은 GitHub 계정 `fox475763`과 저장소 게시 권한을 확인합니다. 토큰은 본인만 보관합니다.
3. 제목과 본문을 입력하고 사진(최대 6장, 장당 8MB 이하)이나 첨부 파일(PDF·TXT·DOCX·XLSX·ZIP, 최대 6개, 개당 10MB 이하)을 고른 뒤 게시합니다. 짧은 소개는 비워 두어도 됩니다.
4. 새 글과 사진·파일이 GitHub 저장소에 반영됩니다. GitHub Pages 배포가 끝나면 `news.html`과 홈페이지의 컬렉션 위 최신 소식 영역에 보입니다.

토큰은 페이지에 저장되지 않고 로그인한 탭의 메모리에서만 사용됩니다. 새로고침하거나 로그아웃하면 다시 로그인해야 합니다. 공개 컴퓨터에서는 토큰을 입력하지 마세요. 실제 게시 권한은 GitHub에서 확인합니다. 관리자 정보 화면에서는 게시자 이름을 변경할 수 있고, GitHub 아이디와 비밀번호는 GitHub 계정 설정에서 변경합니다. `gmattiz_admin / gamttiz` 같은 사이트 전용 아이디와 비밀번호는 정적 사이트에 안전하게 보관할 수 없어 사용하지 않습니다.

## 저장소에서 직접 편집하기

사진을 `assets/news/` 폴더에 올리고 `news/posts.json`에 다음 형식의 항목을 추가해도 됩니다.

```json
{
  "id": "unique-post-id",
  "date": "2026-11-02T09:00:00+09:00",
  "title": "소식 제목",
  "author": "채민석",
  "excerpt": "목록에 보일 짧은 소개",
  "body": "전체 글 내용",
  "images": ["assets/news/example.jpg"],
  "attachments": [{"path": "assets/news/example.pdf", "name": "안내문.pdf"}]
}
```

소식은 날짜가 최신인 것부터 표시됩니다. HTML 코드는 실행되지 않고 일반 글자로 표시됩니다.
