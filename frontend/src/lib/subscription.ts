interface Removable {
  remove(): void;
}

/**
 * expo-locationの購読解除(remove)は、実行環境によっては内部で例外を投げることがある。
 * ここで例外を吸収し、呼び出し側の画面遷移などの後続処理を止めないようにする。
 */
export function safeRemove(subscription: Removable | null | undefined): void {
  try {
    subscription?.remove();
  } catch {
    // 購読解除に失敗しても、以降の状態更新は継続する。
  }
}
