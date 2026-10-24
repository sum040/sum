/* =====================================================================
   진짜 구글 로그인 + Firestore 저장.
   firebase-config.js에 config가 있을 때만 켜지고, index.html의 auth / db 안쪽을 바꿔 끼웁니다.
   Firestore 'planets' 컬렉션, 문서 아이디 = uid (계정당 지구 1개).
   ===================================================================== */
(function () {
  const cfg = window.SUMIN_FIREBASE;
  if (!cfg || !cfg.config) return;

  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const load = src => new Promise((ok, no) => { const s = document.createElement('script'); s.src = SDK + src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });

  // SDK가 다 올 때까지는 로그인/저장 요청을 기다리게 함
  let ready, broken;
  const whenReady = new Promise((r, no) => { ready = r; broken = no; });
  whenReady.catch(() => {});
  auth.live = true;
  auth.user = null; // 가짜 로그인 기록은 쓰지 않음
  document.getElementById('proto').hidden = true;

  const toDoc = snap => {
    const d = snap.data(), iso = t => (t && t.toDate ? t.toDate() : new Date()).toISOString();
    return { id: snap.id, ...d, createdAt: iso(d.createdAt), updatedAt: iso(d.updatedAt) };
  };
  const toUser = u => u && { uid: u.uid, name: u.displayName || '이름 없음' }; // 이메일, 프로필 사진은 쓰지 않음

  auth.isAdmin = function () { return !!this.user && !!cfg.adminUid && this.user.uid === cfg.adminUid; };
  auth.signInWithGoogle = async function () {
    const fb = await whenReady;
    const res = await fb.auth().signInWithPopup(new fb.auth.GoogleAuthProvider());
    this.user = toUser(res.user);
    return this.user;
  };
  auth.signOut = async function () { const fb = await whenReady; await fb.auth().signOut(); this.user = null; };

  const col = fb => fb.firestore().collection('planets');
  const stamp = fb => fb.firestore.FieldValue.serverTimestamp();
  const need = () => { if (!auth.user) throw fail('unauthenticated'); };

  db.reset = function () {};
  db.listPlanets = async function () {
    const fb = await whenReady;
    const q = await col(fb).orderBy('createdAt', 'desc').limit(30).get(); // 최근 30개
    return q.docs.map(toDoc);
  };
  db.getPlanet = async function (id) {
    const fb = await whenReady;
    const s = await col(fb).doc(id).get();
    return s.exists ? toDoc(s) : null;
  };
  db.createPlanet = async function (data) {
    const fb = await whenReady; need(); rulesCheck(data);
    const ref = col(fb).doc(auth.user.uid);
    await fb.firestore().runTransaction(async t => {
      if ((await t.get(ref)).exists) throw fail('already-exists');
      t.set(ref, { ...pickFields(data), googleName: auth.user.name, createdAt: stamp(fb), updatedAt: stamp(fb) });
    });
    return toDoc(await ref.get());
  };
  db.updatePlanet = async function (data) {
    const fb = await whenReady; need(); rulesCheck(data);
    const ref = col(fb).doc(auth.user.uid);
    await ref.update({ ...pickFields(data), googleName: auth.user.name, updatedAt: stamp(fb) }); // 없으면 not-found
    return toDoc(await ref.get());
  };
  db.deletePlanet = async function (id) {
    const fb = await whenReady; need();
    if (auth.user.uid !== id && !auth.isAdmin()) throw fail('permission-denied');
    await col(fb).doc(id).delete();
  };

  // 새로고침해도 로그인이 남아 있게: 첫 로그인 상태를 받으면 방명록을 다시 그림
  function refreshGuestbook() {
    if (!gb.root) return;
    renderAuthbox();
    (async () => {
      const mine = auth.user ? await db.getPlanet(auth.user.uid).catch(() => null) : null;
      if (mine) { gb.mode = 'edit'; gb.saved = clone(mine); gb.draft = clone(mine); }
      else if (gb.mode !== 'create') { gb.mode = 'create'; gb.saved = null; gb.draft = defaultDraft(); }
      renderPanel(); renderFront(); loadPlanets();
    })();
  }

  load('firebase-app-compat.js')
    .then(() => Promise.all([load('firebase-auth-compat.js'), load('firebase-firestore-compat.js')]))
    .then(() => {
      const fb = window.firebase;
      fb.initializeApp(cfg.config);
      let first = true;
      fb.auth().onAuthStateChanged(u => {
        auth.user = toUser(u);
        if (first) { first = false; ready(fb); refreshGuestbook(); }
      });
    })
    .catch(() => { broken(fail('unavailable')); toast('방명록 서버에 연결하지 못했어요'); });
})();
