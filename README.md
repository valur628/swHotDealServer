# swHotDealServer
### _소프트웨어 핫딜 서버_
>경상국립대학교 컴퓨터과학과
>팀장 박주철(19학번)

# 개요
‘소프트웨어 핫딜’은 여러 ESD에서 제공하는 할인 및 무료 소프트웨어 목록을 정리해서 알려주는 앱이다. 그리고 해당 리포지토리는 이러한 소프트웨어 핫딜 프로젝트의 서버 및 크롤링을 담당하는 부분의 리포지토리이다.

***
# 상세
### 개발 인원
- 팀장 박주철
   - 프로젝트 지휘, 계획, 관리
   - 구글 파이어베이스 및 데이터베이스 구축
   - 서버 및 크롤링 기능 구현
   - 자료 조사
- 팀원 손승우
   - 서버 간 연결 기능 구현
   - 핫딜 리스트 및 UX/UI 구현
   - 설정 기능 및 UX/UI 구현
   - 기능 간 연동
- 팀원 황승현
   - 스플래시 화면 구현
   - 설정 기능 및 UX/UI 구현
   - 검색 기능 구현
   - 앱 UX/UI 디자인

### 개발 기술
본 프로젝트 개발에 사용된 라이브러리 및 파이프라인입니다.
- [Firebase] - 모바일, 웹 애플리케이션 개발 플랫폼
- [Morgan] - 미들웨어로 HTTP 요청 로그를 기록해주는 모듈
- [Express] - 웹 애플리케이션 프레임워크로 서버 개발을 쉽게 해주는 모듈
- [Puppeteer] - Headless Chrome 브라우저를 제어하여 웹 스크래핑 및 자동화에 사용하는 모듈

### 개발 환경
| 종류 | 목록 |
| ------ | ------ |
| 사용 언어 | Node.js |
| 개발 도구 | Visual Studio, Github |
| 데이터베이스 | Firebase Cloud Firestore Database |
| OS 환경 | Windows 10 |

### 포크 & 모듈 & 리포지토리
본 프로젝트의 포크 혹은 분리되어 개발된 모듈 혹은 관련된 추가 리포지토리 목록입니다.
- __SW HotDeal Project__
  - [SW HotDeal Repository] - SW HotDeal 프로젝트의 Repository입니다.
  - [SW HotDeal 서버 및 크롤러 Repository] - SW HotDeal의 서버 및 크롤러 Repository입니다. (현 Repository)
- __ESD HotDeal Project__
  - [ESD HotDeal Repository] - SW HotDeal 프로젝트의 웹 이식 프로젝트 Repository입니다.
  - [ESD HotDeal 컴포넌트 Repository] - ESD HotDeal 프로젝트에서 사용된 컴포넌트 Repository입니다.
  - [ESD HotDeal 서버 및 크롤러 Repository] - ESD HotDeal 프로젝트의 서버 및 크롤러 Repository입니다.

### 자료
본 개발을 하면서 작성된 보고서 및 발표 자료입니다.
| 보고서 자료 | 발표 자료 |
| ------ | ------ |
| [제안서 PDF 링크](https://drive.google.com/file/d/1k2vOxdQK3UgTK1r5mcqTy3rCIlceySeA/view?usp=drive_link) | [제안서 발표 PPT 링크](https://docs.google.com/presentation/d/1ZiamtsvQsbki7dkTkH70JLLYek2V3w-w/edit?usp=drive_link&ouid=106667079864051075882&rtpof=true&sd=true) |
| [설계서 PDF 링크](https://drive.google.com/file/d/1OnutPUlM824V85VrbN7lAneGRUCp4F4O/view?usp=drive_link) | [설계서 발표 PPT 링크](https://docs.google.com/presentation/d/1xsgqM0wwz0zbo9R74pnFjkmnw5ukCkRm/edit?usp=drive_link&ouid=106667079864051075882&rtpof=true&sd=true) |
| 보고서 없음 | [중간 발표 PPT 링크](https://docs.google.com/presentation/d/193nxay-bmcbqSJpVF_9-FI0iXHFQcP8F/edit?usp=drive_link&ouid=106667079864051075882&rtpof=true&sd=true) |
| [테스트 계획서 PDF 링크](https://drive.google.com/file/d/1o9VLK7JQCE-RzKMatMyJ1fxe0iA3fD3m/view?usp=drive_link) | [테스트 발표 PPT 링크](https://docs.google.com/presentation/d/1rebs4k0nwW83regCto8zIyJZAeQstF5D/edit?usp=drive_link&ouid=106667079864051075882&rtpof=true&sd=true) |
| [최종보고서 PDF 링크](https://drive.google.com/file/d/1iKZv7htd01Wi2SvJ9iW5L4gG8S4dIGgH/view?usp=drive_link) | [최종 발표 PPT 링크](https://docs.google.com/presentation/d/1gyD-9zWb4-SacBM9X84trG_D_ZyXGCT-/edit?usp=drive_link&ouid=106667079864051075882&rtpof=true&sd=true) |

### DB 관련 정보
|    | Hangle Name     | in DB Name     | Type          | Key |
|----|-----------------|----------------|---------------|-----|
| 1  | 갱신순서        | DB_LoadNumber  | integer       | P.K |
| 2  | 소프트웨어 명   | DB_SWName      | Text string   |     |
| 3  | 개발사 명       | DB_DevName     | Text string   |     |
| 4  | 할인 기간       | DB_DisPeriod   | Date and time |     |
| 5  | 통화            | DB_Currency    | Text string   |     |
| 6  | 원가            | DB_Cost        | integer       |     |
| 7  | 할인가          | DB_DisPrice    | integer       |     |
| 8  | 할인율          | DB_DisRate     | integer       |     |
| 9  | 플랫폼 주소     | DB_PlatAddress | Text string   |     |
| 10 | 플랫폼 이름     | DB_PlatName    | Text string   |     |
| 11 | 대표 사진       | DB_RepPicture  | Text string   |     |
| 12 | 기타 사진       | DB_OthPicture  | Text string   |     |
| -- | -----------     | -----------    | -----------   | --- |
| 1  | 키워드 우선순위 | DB_KeyNumber   | integer       | P.K |
| 2  | 설정 키워드     | DB_KeySetting  | Text string   |     |

[Firebase]: <https://firebase.google.com/?hl=ko>
[Morgan]: <https://www.npmjs.com/package/morgan>
[Express]: <https://expressjs.com/ko/>
[Puppeteer]: <https://www.npmjs.com/package/puppeteer>

[SW HotDeal Repository]: <https://github.com/valur628/swHotDealProjcect>
[SW HotDeal 서버 및 크롤러 Repository]: <https://github.com/valur628/swHotDealServer>
[ESD HotDeal Repository]: <https://github.com/valur628/RollCakeProject>
[ESD HotDeal 컴포넌트 Repository]: <https://github.com/valur628/RollCakeComponents>
[ESD HotDeal 서버 및 크롤러 Repository]: <https://github.com/valur628/RollCakeServer>
