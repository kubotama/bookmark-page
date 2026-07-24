/**
 * ユーザーへエラーメッセージを表示するユーティリティ関数
 * ※ 将来的にはダイアログ表示からトースト表示・インラインエリア表示へ差し替え予定
 */
export const showErrorMessage = (message: string) => {
  // 現時点：ダイアログ（alertなど）で表示
  alert(message)

  // 将来の変更例：
  // notificationStore.addMessage({ type: 'error', text: message })
}
