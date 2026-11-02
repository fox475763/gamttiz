# 감띠즈 소식 게시 방법

이 사이트는 GitHub Pages에서 동작하는 정적 사이트입니다. 방문자는 소식을 읽기만 할 수 있습니다. 글과 사진은 저장소에 쓰기 권한이 있는 제작자만 게시할 수 있습니다.

## 웹 편집기로 게시하기

1. 배포된 사이트의 `admin.html`을 직접 엽니다. 이 주소는 방문자 메뉴에 표시되지 않습니다.
2. `fox475763/gamttiz` 저장소에 대해 **Contents: Read and write** 권한이 있는 GitHub fine-grained personal access token을 준비합니다. 토큰은 본인만 보관합니다.
3. 소식 페이지의 **＋ 소식 올리기**를 누릅니다. 제목과 본문을 입력하고 사진(최대 6장, 장당 8MB 이하)이나 첨부 파일(PDF·TXT·DOCX·XLSX·ZIP, 최대 6개, 개당 10MB 이하)을 고른 뒤 게시합니다. 짧은 소개는 비워 두어도 됩니다.
4. 새 글과 사진·파일이 GitHub 저장소에 반영됩니다. GitHub Pages 배포가 끝나면 `news.html`과 홈페이지의 컬렉션 위 최신 소식 영역에 보입니다.

토큰은 페이지에 저장되지 않으며 게시 요청에만 사용됩니다. 공개 컴퓨터에서는 토큰을 입력하지 마세요. `admin.html` 주소를 숨기는 것은 보안 장치가 아닙니다. 실제 게시 권한은 GitHub 토큰으로 확인됩니다.

## 저장소에서 직접 편집하기

사진을 `assets/news/` 폴더에 올리고 `news/posts.json`에 다음 형식의 항목을 추가해도 됩니다.

```json
{
  "id": "unique-post-id",
  "date": "2026-11-02T09:00:00+09:00",
  "title": "소식 제목",
  "excerpt": "목록에 보일 짧은 소개",
  "body": "전체 글 내용",
  "images": ["assets/news/example.jpg"],
  "attachments": [{"path": "assets/news/example.pdf", "name": "안내문.pdf"}]
}
```

소식은 날짜가 최신인 것부터 표시됩니다. HTML 코드는 실행되지 않고 일반 글자로 표시됩니다.
