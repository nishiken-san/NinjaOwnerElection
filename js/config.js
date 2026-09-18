/* ============================================================
 * サイト設定：運営はこのファイルだけ触ればOK
 * ============================================================ */
window.SITE_CONFIG = {

  /* フェーズ切替
   * "pre"    : 立候補募集〜投票前（通常のページ順）
   * "voting" : 投票期間中（トップページで「候補者の声明＋投票」が
   *            ヒーロー直下に自動で移動し、「投票受付中」表示になる） */
  phase: "pre",

  /* 投票ページのリンク先（ホルダー投票くん） */
  voteUrl: "https://tohyo.mad-member-tools.com/",

  /* 投票ボタンを有効にするか（COMING SOON表示の解除）
   * true = 全ページの投票ボタンがリンクとして機能する
   * phase を "voting" にした場合も自動で有効になる */
  voteLinksOpen: true,

  /* CNGT申請フォームのURL */
  cngtFormUrl: "https://cngt.vibe.co.jp/",

  /* 立候補（声明文）GoogleフォームのURL */
  entryFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSe_Bi6teVXCJsu9WYHDqJJbWOEbKomxnnpQrlJx3jHyhqHHTQ/viewform",

  /* にんセレ公式サイトのURL */
  ninseleUrl: "https://nincele.ritsuto.org/",

  /* トップページに表示する候補者の最大数（0 = 全員表示）
   * 全員は candidates.html に表示されます */
  candidatesOnTop: 6,
};
