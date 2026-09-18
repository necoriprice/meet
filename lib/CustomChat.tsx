'use client';
import * as React from 'react';
import type { ChatMessage, MessageDecoder, MessageEncoder, MessageFormatter } from '@livekit/components-react';
import {
  ChatCloseIcon,
  ChatEntry,
  ChatToggle,
  useChat,
  useMaybeLayoutContext,
} from '@livekit/components-react';

export interface CustomChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messageFormatter?: MessageFormatter;
  messageDecoder?: MessageDecoder;
  messageEncoder?: MessageEncoder;
}

/**
 * ライブラリ標準のChatを日本語化したもの(ヘッダー「Messages」→「メッセージ」、
 * 入力欄のplaceholder、送信ボタン)。いずれもpropsでの差し替え手段が無いため、
 * `useChat`/`ChatEntry`等の公開APIを使ってほぼ同じ構成を再実装している。
 */
export function CustomChat({
  messageFormatter,
  messageDecoder,
  messageEncoder,
  ...props
}: CustomChatProps) {
  const ulRef = React.useRef<HTMLUListElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const chatOptions = React.useMemo(
    () => ({ messageDecoder, messageEncoder }),
    [messageDecoder, messageEncoder],
  );

  const { chatMessages, send, isSending } = useChat(chatOptions);

  const layoutContext = useMaybeLayoutContext();
  const lastReadMsgAt = React.useRef<ChatMessage['timestamp']>(0);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (inputRef.current && inputRef.current.value.trim() !== '') {
      await send(inputRef.current.value);
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  }

  React.useEffect(() => {
    ulRef.current?.scrollTo({ top: ulRef.current.scrollHeight });
  }, [chatMessages]);

  React.useEffect(() => {
    if (!layoutContext || chatMessages.length === 0) {
      return;
    }
    if (
      layoutContext.widget.state?.showChat &&
      chatMessages.length > 0 &&
      lastReadMsgAt.current !== chatMessages[chatMessages.length - 1]?.timestamp
    ) {
      lastReadMsgAt.current = chatMessages[chatMessages.length - 1]?.timestamp;
      return;
    }
    const unreadMessageCount = chatMessages.filter(
      (msg) => !lastReadMsgAt.current || msg.timestamp > lastReadMsgAt.current,
    ).length;
    const { widget } = layoutContext;
    if (unreadMessageCount > 0 && widget.state?.unreadMessages !== unreadMessageCount) {
      widget.dispatch?.({ msg: 'unread_msg', count: unreadMessageCount });
    }
  }, [chatMessages, layoutContext?.widget]);

  return (
    <div {...props} className="lk-chat">
      <div className="lk-chat-header">
        メッセージ
        {layoutContext && (
          <ChatToggle className="lk-close-button">
            <ChatCloseIcon />
          </ChatToggle>
        )}
      </div>

      <ul className="lk-list lk-chat-messages" ref={ulRef}>
        {chatMessages.map((msg, idx, allMsg) => {
          const hideName = idx >= 1 && allMsg[idx - 1].from === msg.from;
          const hideTimestamp = idx >= 1 && msg.timestamp - allMsg[idx - 1].timestamp < 60_000;
          return (
            <ChatEntry
              key={msg.id ?? idx}
              hideName={hideName}
              hideTimestamp={hideName === false ? false : hideTimestamp}
              entry={msg}
              messageFormatter={messageFormatter}
            />
          );
        })}
      </ul>
      <form className="lk-chat-form" onSubmit={handleSubmit}>
        <input
          className="lk-form-control lk-chat-form-input"
          disabled={isSending}
          ref={inputRef}
          type="text"
          placeholder="メッセージを入力..."
          onInput={(ev) => ev.stopPropagation()}
          onKeyDown={(ev) => ev.stopPropagation()}
          onKeyUp={(ev) => ev.stopPropagation()}
        />
        <button type="submit" className="lk-button lk-chat-form-button" disabled={isSending}>
          送信
        </button>
      </form>
    </div>
  );
}
