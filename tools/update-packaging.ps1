$root = Resolve-Path (Join-Path $PSScriptRoot '..')
function Replace-Once($file, $old, $new) {
  $path = Join-Path $root $file
  $content = [System.IO.File]::ReadAllText($path)
  if (-not $content.Contains($old)) { throw "Missing text in $file`: $old" }
  [System.IO.File]::WriteAllText($path, $content.Replace($old, $new), [System.Text.UTF8Encoding]::new($false))
}
Replace-Once 'index.html' 'src="assets/packaging/box-open.png" alt="키링이 담긴 빨간 감띠즈 랜덤박스"' 'src="assets/packaging/box-closed-cutout.png" alt="배경을 제거한 빨간 감띠즈 랜덤박스"'
Replace-Once 'products.html' '<p>빨간 포장 박스 안에 감띠즈 키링이 들어갑니다. 실물 사진과 패키지 도면을 함께 확인해보세요.</p>' '<p>빨간 포장 박스 안에 감띠즈 키링이 들어갑니다. 배경을 분리한 제품 컷과 연출 이미지로 박스를 자세히 살펴보세요.</p>'
Replace-Once 'products.html' 'src="assets/packaging/box-open.png" alt="랜덤박스를 열어 키링과 포장재가 보이는 모습"' 'src="assets/packaging/box-open-cutout.png" alt="배경을 제거한 열린 랜덤박스와 키링"'
Replace-Once 'products.html' 'src="assets/packaging/box-closed.png" alt="GAMTTIZ 로고가 인쇄된 닫힌 빨간 랜덤박스"' 'src="assets/packaging/box-closed-cutout.png" alt="배경을 제거한 닫힌 빨간 랜덤박스"'
Replace-Once 'products.html' 'src="assets/packaging/box-side.png" alt="Special Keyring Random Box 문구가 있는 박스 측면"' 'src="assets/packaging/box-studio-stack.png" alt="빨간 랜덤박스를 쌓아 놓은 스튜디오 연출 이미지"'
Replace-Once 'products.html' '<figcaption>DETAIL / 패키지 문구</figcaption>' '<figcaption>DETAIL / 박스 연출</figcaption>'
Replace-Once 'products.html' '<p class="catalog-caption">실제 제작한 박스를 촬영한 사진입니다. 박스 내부 구성은 촬영된 시제품을 기준으로 보여줍니다.</p>' '<p class="catalog-caption">제품 컷과 연출 이미지입니다. 실제 구성품의 형태는 원본 시제품을 기준으로 확인해 주세요.</p>'
Replace-Once 'project.html' 'src="assets/packaging/box-open.png" alt="키링이 들어 있는 감띠즈 랜덤박스 실물 사진"' 'src="assets/packaging/box-open-cutout.png" alt="배경을 제거한 열린 감띠즈 랜덤박스와 키링"'
Replace-Once 'project.html' '<figcaption>실물 랜덤박스 · 내부 구성</figcaption>' '<figcaption>랜덤박스 · 내부 구성 제품 컷</figcaption>'
Replace-Once 'project.html' 'src="assets/packaging/box-dieline.png" alt="빨간 감띠즈 키링 포장 박스 전개도"' 'src="assets/packaging/box-dieline-single.png" alt="원본 전개도에서 왼쪽 도안 한 장만 추출한 감띠즈 랜덤박스 도안"'
Replace-Once 'project.html' '<figcaption>박스 전개도 · 제공된 원본 PDF를 화면용으로 렌더링</figcaption>' '<figcaption>박스 전개도 · 원본 도안 한 장</figcaption>'
Replace-Once 'project.html' '<img src="assets/packaging/label-sheet.png" alt="14종 감띠 캐릭터 네임텍 라벨 도면" loading="lazy">' '<div class="packaging-label-pair"><img src="assets/packaging/name-tag-single.png" alt="감띠즈 네임텍 한 장" loading="lazy"><img src="assets/packaging/logo-sticker-single.png" alt="감띠즈 원형 스티커 한 장" loading="lazy"></div>'
Replace-Once 'project.html' '<figcaption>네임텍 라벨 · 이름과 설명</figcaption>' '<figcaption>네임텍과 원형 스티커 · 각 한 장</figcaption>'
Replace-Once 'project.html' 'src="assets/packaging/box-closed.png" alt="GAMTTIZ 로고가 보이는 닫힌 빨간 포장 박스"' 'src="assets/packaging/box-closed-cutout.png" alt="배경을 제거한 닫힌 감띠즈 랜덤박스"'
Replace-Once 'project.html' '<figcaption>실물 랜덤박스 · 닫힌 모습</figcaption>' '<figcaption>랜덤박스 · 닫힌 모습 제품 컷</figcaption>'
Replace-Once 'news.html' '<a class="news-create" href="admin.html" aria-label="제작자 소식 작성 화면 열기"><span aria-hidden="true">＋</span><span>소식 올리기<small>제작자 전용</small></span></a>' ''
Replace-Once 'news.html' '</section></main>' '</section><div class="news-owner-link"><a href="admin.html" aria-label="제작자 소식 작성 화면 열기">＋ 소식 올리기</a></div></main>'
