/* Firebase 설정값.
   null이면 지금처럼 가짜 로그인 + 브라우저 저장(프로토타입)으로 움직입니다.
   Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹)에 나오는 firebaseConfig를 config 자리에 붙이면 진짜로 바뀝니다.
   이 값들은 공개되어도 괜찮은 값입니다. 실제 보호는 firestore.rules가 합니다. */
window.SUMIN_FIREBASE = {
  config: null,
  // 숨님 구글 계정의 User UID (Firebase 콘솔 > Authentication > 사용자). firestore.rules의 값과 같아야 합니다.
  adminUid: '',
};
