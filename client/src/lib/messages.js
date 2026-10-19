export const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

export const DEFAULT_LANG = 'en';

export const messages = {
  en: {
    'app.title': 'Planning Poker',
    'app.tagline': 'Estimate stories together with Fibonacci cards. Votes stay hidden until the facilitator reveals them.',
    'common.language': 'Language',
    'common.cancel': 'Cancel',
    'common.backHome': 'Back home',
    'common.you': '(you)',

    'home.create.title': 'Create a room',
    'home.create.roomName': 'Room name',
    'home.create.roomNamePlaceholder': 'Sprint 42 refinement',
    'home.create.yourName': 'Your name',
    'home.create.yourNamePlaceholder': 'Alice',
    'home.create.submit': 'Create & facilitate',
    'home.create.hint': 'The room and its history are saved in this browser. Keep this tab (or browser) to restore it.',
    'home.join.title': 'Join a room',
    'home.join.input': 'Room code or link',
    'home.join.invalid': 'Enter an 8-character room code or a room link',
    'home.join.submit': 'Join',
    'home.hosted.title': 'Rooms you host',
    'home.hosted.meta': 'round {round} · {count} estimated',
    'home.hosted.open': 'Open',
    'home.hosted.export': 'Export',
    'home.hosted.forget': 'Forget',
    'home.hosted.forgetConfirm': 'Forget this room? Its round history in this browser will be deleted.',

    'join.title': 'Join room',
    'join.yourName': 'Your name',
    'join.asObserver': 'Join as observer (watch without voting)',
    'join.submit': 'Join',

    'room.error.title': "Couldn't join room",
    'room.waiting.title': 'Waiting for the facilitator…',
    'room.waiting.body': "Room {id} isn't open right now. You'll join automatically as soon as the facilitator opens it in their browser.",
    'room.waiting.hint': 'If this link is wrong, double-check the room code.',
    'room.connecting': 'Connecting…',
    'room.connected': 'Connected',
    'room.reconnecting': 'Reconnecting…',
    'room.facilitatorOfflineNamed': '{name} (facilitator) is offline.',
    'room.facilitatorOffline': 'The facilitator is offline.',
    'room.becomeFacilitator': 'Become facilitator',
    'room.you': 'You',
    'room.facilitator': 'facilitator',
    'room.role': 'Role',
    'room.voter': 'Voter',
    'room.observer': 'Observer',
    'room.storageHint': "This room's history is saved in your browser and restores the room if the server restarts.",
    'room.exportJson': 'Export JSON',

    'copy.button': '🔗 Copy invite link',
    'copy.done': 'Copied!',
    'copy.prompt': 'Copy this link:',

    'story.round': 'Round {number}',
    'story.placeholder': 'What are we estimating? (e.g. JIRA-123 Login with SSO)',
    'story.empty': 'No story title yet',

    'table.facilitator': 'Facilitator',
    'table.offline': 'offline',
    'table.makeFacilitator': 'make facilitator',
    'table.makeFacilitatorConfirm': 'Make {name} the facilitator?',
    'table.noVoters': 'No voters yet — share the invite link.',
    'table.observers': '👀 Observers:',

    'controls.voted': '{voted} of {total} voted',
    'controls.reveal': 'Reveal votes',
    'controls.reset': 'Reset votes',
    'controls.nextPlaceholder': 'Next story title (optional)',
    'controls.next': 'Next round →',

    'stats.consensus': '🎉 Consensus!',
    'stats.average': 'Average',
    'stats.suggested': 'Suggested',
    'stats.min': 'Min',
    'stats.max': 'Max',

    'deck.label': 'Your card',
    'deck.observing': "You're observing.",
    'deck.switchToVoter': 'Switch to voter',
    'deck.unsure': 'Not sure',
    'deck.break': 'Need a break',
    'deck.points': '{value} points',

    'history.title': 'History',
    'history.empty': 'Revealed rounds will appear here after you move to the next round.',
    'history.untitled': 'Untitled',
    'history.summary': 'avg {average} · min {min} · max {max}',

    'field.Name': 'Name',
    'field.Room name': 'Room name',
    'field.Story': 'Story',
  },

  ja: {
    'app.title': 'プランニングポーカー',
    'app.tagline': 'フィボナッチカードでストーリーをチームで見積もりましょう。投票はファシリテーターが公開するまで非表示です。',
    'common.language': '言語',
    'common.cancel': 'キャンセル',
    'common.backHome': 'ホームに戻る',
    'common.you': '(あなた)',

    'home.create.title': 'ルームを作成',
    'home.create.roomName': 'ルーム名',
    'home.create.roomNamePlaceholder': 'スプリント42 リファインメント',
    'home.create.yourName': 'あなたの名前',
    'home.create.yourNamePlaceholder': '山田 太郎',
    'home.create.submit': '作成してファシリテート',
    'home.create.hint': 'ルームと履歴はこのブラウザに保存されます。復元するには同じブラウザを使用してください。',
    'home.join.title': 'ルームに参加',
    'home.join.input': 'ルームコードまたはリンク',
    'home.join.invalid': '8文字のルームコードまたはルームのリンクを入力してください',
    'home.join.submit': '参加',
    'home.hosted.title': 'ホストしているルーム',
    'home.hosted.meta': 'ラウンド {round} · 見積もり済み {count} 件',
    'home.hosted.open': '開く',
    'home.hosted.export': 'エクスポート',
    'home.hosted.forget': '削除',
    'home.hosted.forgetConfirm': 'このルームを削除しますか?このブラウザに保存されたラウンド履歴も削除されます。',

    'join.title': 'ルームに参加',
    'join.yourName': 'あなたの名前',
    'join.asObserver': 'オブザーバーとして参加(投票せずに閲覧のみ)',
    'join.submit': '参加',

    'room.error.title': 'ルームに参加できませんでした',
    'room.waiting.title': 'ファシリテーターを待っています…',
    'room.waiting.body': 'ルーム {id} は現在開かれていません。ファシリテーターがブラウザでルームを開くと、自動的に参加します。',
    'room.waiting.hint': 'リンクが間違っている場合は、ルームコードを確認してください。',
    'room.connecting': '接続中…',
    'room.connected': '接続済み',
    'room.reconnecting': '再接続中…',
    'room.facilitatorOfflineNamed': '{name}(ファシリテーター)はオフラインです。',
    'room.facilitatorOffline': 'ファシリテーターはオフラインです。',
    'room.becomeFacilitator': 'ファシリテーターになる',
    'room.you': 'あなた',
    'room.facilitator': 'ファシリテーター',
    'room.role': '役割',
    'room.voter': '投票者',
    'room.observer': 'オブザーバー',
    'room.storageHint': 'このルームの履歴はあなたのブラウザに保存され、サーバーが再起動した際にルームを復元します。',
    'room.exportJson': 'JSONをエクスポート',

    'copy.button': '🔗 招待リンクをコピー',
    'copy.done': 'コピーしました!',
    'copy.prompt': 'このリンクをコピーしてください:',

    'story.round': 'ラウンド {number}',
    'story.placeholder': '何を見積もりますか?(例: JIRA-123 SSOログイン)',
    'story.empty': 'ストーリーのタイトルはまだありません',

    'table.facilitator': 'ファシリテーター',
    'table.offline': 'オフライン',
    'table.makeFacilitator': 'ファシリテーターにする',
    'table.makeFacilitatorConfirm': '{name} さんをファシリテーターにしますか?',
    'table.noVoters': 'まだ投票者がいません。招待リンクを共有してください。',
    'table.observers': '👀 オブザーバー:',

    'controls.voted': '{total} 人中 {voted} 人が投票済み',
    'controls.reveal': '投票を公開',
    'controls.reset': '投票をリセット',
    'controls.nextPlaceholder': '次のストーリーのタイトル(任意)',
    'controls.next': '次のラウンドへ →',

    'stats.consensus': '🎉 全員一致!',
    'stats.average': '平均',
    'stats.suggested': '推奨',
    'stats.min': '最小',
    'stats.max': '最大',

    'deck.label': 'あなたのカード',
    'deck.observing': 'オブザーバーとして参加中です。',
    'deck.switchToVoter': '投票者に切り替える',
    'deck.unsure': 'わからない',
    'deck.break': '休憩したい',
    'deck.points': '{value} ポイント',

    'history.title': '履歴',
    'history.empty': '次のラウンドに進むと、公開済みのラウンドがここに表示されます。',
    'history.untitled': '無題',
    'history.summary': '平均 {average} · 最小 {min} · 最大 {max}',

    'field.Name': '名前',
    'field.Room name': 'ルーム名',
    'field.Story': 'ストーリー',
  },
};

// The server (and useRoom) produce English error messages; these are translated client-side.
const serverErrors = {
  ja: {
    'Not connected to the server': 'サーバーに接続されていません',
    'Unable to join room': 'ルームに参加できません',
    'Room not found': 'ルームが見つかりません',
    'Invalid room id': '無効なルームIDです',
    'Invalid client token': '無効なクライアントトークンです',
    'Role must be voter or observer': '役割は投票者またはオブザーバーである必要があります',
    'Already joined a room': 'すでにルームに参加しています',
    'You have not joined a room': 'ルームに参加していません',
    'Observers cannot vote': 'オブザーバーは投票できません',
    'Votes are already revealed': '投票はすでに公開されています',
    'Invalid card': '無効なカードです',
    'No votes to reveal yet': '公開する投票がまだありません',
    'Only the facilitator can do that': 'この操作はファシリテーターのみ可能です',
    'That participant is not online': 'その参加者はオンラインではありません',
    'The facilitator is still online': 'ファシリテーターはまだオンラインです',
    'You are not in this room': 'このルームに参加していません',
    'Internal server error': 'サーバー内部エラーが発生しました',
  },
};

const fieldErrors = {
  ja: [
    [/^(.+) is required$/, (f) => `${f}は必須です`],
    [/^(.+) must be text$/, (f) => `${f}はテキストで入力してください`],
    [/^(.+) must be at most (\d+) characters$/, (f, n) => `${f}は${n}文字以内で入力してください`],
  ],
};

export function detectLanguage(stored, navigatorLanguages = []) {
  if (messages[stored]) return stored;
  for (const l of navigatorLanguages) {
    const code = String(l).toLowerCase().split('-')[0];
    if (messages[code]) return code;
  }
  return DEFAULT_LANG;
}

export function translate(lang, key, params = {}) {
  const template = messages[lang]?.[key] ?? messages[DEFAULT_LANG][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
}

export function translateError(lang, message) {
  if (!message) return message;
  const exact = serverErrors[lang]?.[message];
  if (exact) return exact;
  for (const [re, fmt] of fieldErrors[lang] ?? []) {
    const m = message.match(re);
    if (m) return fmt(translate(lang, `field.${m[1]}`), ...m.slice(2));
  }
  return message;
}
