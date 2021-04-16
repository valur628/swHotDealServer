# S/W Hot Deal Server
### _소프트웨어 핫딜 서버_

박주철(담당)

- 소프트웨어 핫딜 프로젝트의 서버 부분 제작이 목표.
- https://github.com/wncjf2000/swHotDealProjcect
- 해당 서버는 자바스크립트와 구글 파이어베이스를 이용함
- DB 관련 정보

|    | Hangul Name   | in DB Name     | Type          | Key |
|----|---------------|----------------|---------------|-----|
| 1  | 갱신순서      | DB_LoadNumber  | integer       | P.K |
| 2  | 소프트웨어 명 | DB_SWName      | Text string   |     |
| 3  | 개발사 명     | DB_DevName     | Text string   |     |
| 4  | 할인 기간     | DB_DisPeriod   | Date and time |     |
| 5  | 통화          | DB_Currency    | Text string   |     |
| 6  | 원가          | DB_Cost        | integer       |     |
| 7  | 할인가        | DB_DisPrice    | integer       |     |
| 8  | 할인율        | DB_DisRate     | integer       |     |
| 9  | 플랫폼 주소   | DB_PlatAddress | Text string   |     |
| 10 | 플랫폼 이름   | DB_PlatName    | Text string   |     |
| 11 | 대표 사진     | DB_RepPicture  | Text string   |     |
| 12 | 기타 사진     | DB_OthPicture  | Text string   |     |
