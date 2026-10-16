"use client";

import { useRef, useState, type ClipboardEvent } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ approvals }: { approvals: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" className="button button-dark button-full" disabled={pending}>{pending ? "正在登录…" : approvals ? "登录并审核会员" : "登录网站管理"}</button>;
}

export function AdminLoginForm({ action, approvals, error }: {
  action: (formData: FormData) => Promise<void>;
  approvals: boolean;
  error?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");

  function replacePassword(value: string) {
    if (!input.current) return;
    input.current.value = value;
    input.current.focus();
    setNotice("已替换密码框中的内容，请点击登录。");
  }

  async function pastePassword() {
    try {
      const value = await navigator.clipboard.readText();
      if (!value) {
        setNotice("剪贴板为空，请先复制网站管理员密码。");
        return;
      }
      replacePassword(value);
    } catch {
      setNotice("浏览器未允许读取剪贴板。请在密码框中全选后粘贴（Mac：⌘A，再按 ⌘V）。");
      input.current?.focus();
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const value = event.clipboardData.getData("text/plain");
    if (!value) return;
    event.preventDefault();
    replacePassword(value);
  }

  return (
    <form action={action} className="stack-form admin-password-form">
      {approvals && <input type="hidden" name="view" value="approvals" />}
      <label htmlFor="website-admin-password">网站管理员密码
        <input ref={input} id="website-admin-password" type={visible ? "text" : "password"} name="password" autoComplete="section-wlhl-admin current-password" autoCapitalize="none" spellCheck={false} required onPaste={handlePaste} onInput={() => setNotice("")} aria-describedby="admin-password-help" />
      </label>
      <div className="admin-password-tools">
        <button type="button" onClick={pastePassword}>粘贴密码</button>
        <button type="button" aria-controls="website-admin-password" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? "隐藏密码" : "显示密码"}</button>
      </div>
      <p id="admin-password-help" className="admin-password-help">粘贴会替换框内原有内容。可点击“显示密码”核对后再登录。</p>
      <p className="admin-password-notice" role="status">{notice}</p>
      {error && <p className="form-error" role="alert">上次登录提示：{error}</p>}
      <SubmitButton approvals={approvals} />
    </form>
  );
}
