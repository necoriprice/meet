'use client';

import React from 'react';
import { AppHeader } from '@/lib/AppHeader';
import { decodePassphrase } from '@/lib/client-utils';
import { CustomPreJoin } from '@/lib/CustomPreJoin';
import { CustomVideoConference } from '@/lib/CustomVideoConference';
import { DebugMode } from '@/lib/Debug';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { RoomPasswordGate } from '@/lib/RoomPasswordGate';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { loadAudioOutputDeviceId } from '@/lib/audioOutput';
import { ConnectionDetails } from '@/lib/types';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  RoomContext,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FIXED_ROOM_BY_EMAIL, isFixedRoomOwner } from '@/lib/roomAccounts';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
  singlePeerConnection: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [roomPassword, setRoomPassword] = React.useState<string | undefined>(undefined);
  const [passwordVerified, setPasswordVerified] = React.useState(false);
  const handlePasswordVerified = React.useCallback((password: string | undefined) => {
    setRoomPassword(password);
    setPasswordVerified(true);
  }, []);
  // 本人専用の固定ルーム(拠点共有アカウント)は、自分でかけたパスワードを
  // 自分自身の入室時にまで入力させる必要がないため、所有者本人ならゲート自体をスキップする
  const isOwnFixedRoom = isFixedRoomOwner(session?.user?.email, props.roomName);
  React.useEffect(() => {
    if (isOwnFixedRoom) {
      setPasswordVerified(true);
    }
  }, [isOwnFixedRoom]);
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    const email = session?.user?.email?.toLowerCase();
    // honsha1等の拠点共有アカウントは個人名でなくルーム名を表示名の初期値にする。
    // それ以外(Google Workspaceでログインする社員)は本人の名前を使う
    const roomLabel = email ? FIXED_ROOM_BY_EMAIL[email]?.label : undefined;
    return {
      username: roomLabel ?? session?.user?.name ?? session?.user?.email ?? '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, [session]);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );

  const handlePreJoinSubmit = React.useCallback(
    async (values: LocalUserChoices) => {
      const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
      url.searchParams.append('roomName', props.roomName);
      url.searchParams.append('participantName', values.username);
      if (props.region) {
        url.searchParams.append('region', props.region);
      }
      if (roomPassword) {
        url.searchParams.append('password', roomPassword);
      }
      const connectionDetailsResp = await fetch(url.toString());
      if (!connectionDetailsResp.ok) {
        // パスワード変更などでverify時点と食い違った場合はここで検出される。
        // 最初のパスワード入力からやり直させる
        console.error(
          'connection-detailsの取得に失敗しました',
          connectionDetailsResp.status,
          await connectionDetailsResp.text().catch(() => ''),
        );
        alert('入室に失敗しました。パスワードが変更された可能性があります。もう一度お試しください。');
        setPasswordVerified(false);
        setRoomPassword(undefined);
        return;
      }
      const connectionDetailsData = await connectionDetailsResp.json();
      setPreJoinChoices(values);
      setConnectionDetails(connectionDetailsData);
    },
    [props.roomName, props.region, roomPassword],
  );
  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  const showPreJoinHeader = !passwordVerified || connectionDetails === undefined || preJoinChoices === undefined;

  return (
    <>
      {showPreJoinHeader && <AppHeader />}
      <main data-lk-theme="default" style={{ flex: '1 1 auto', minHeight: 0 }}>
      {!passwordVerified ? (
        <div
          style={{
            display: 'flex',
            height: '100%',
            overflowY: 'auto',
            padding: '1.5rem 1rem',
          }}
        >
          <RoomPasswordGate roomName={props.roomName} onVerified={handlePasswordVerified} />
        </div>
      ) : connectionDetails === undefined || preJoinChoices === undefined ? (
        <div
          style={{
            display: 'flex',
            height: '100%',
            overflowY: 'auto',
            padding: '1.5rem 1rem',
          }}
        >
          {/*
            margin: 'auto' で親のflexコンテナ内に縦横センタリングしつつ、
            画面が低くて収まりきらない場合は上詰め+スクロールに自然に切り替わる
            (justifyContent:'center'だと収まらない分が見切れてしまうため)
          */}
          <div
            style={{
              margin: 'auto',
              width: '100%',
              maxWidth: '480px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              gap: '0.75rem',
            }}
          >
            <CustomPreJoin
              defaults={preJoinDefaults}
              onSubmit={handlePreJoinSubmit}
              onError={handlePreJoinError}
            />
            {/*
              PreJoinカード自体は幅いっぱい(width:100%)だが、内部に1remのpaddingがあり
              「参加」ボタンはその分だけ左右に内側の余白が入る。キャンセルボタンも
              同じ見た目の幅になるよう、同じ1rem分を差し引いて中央寄せする
            */}
            <button
              className="lk-button"
              style={{ width: 'calc(100% - 2rem)', marginLeft: 'auto', marginRight: 'auto' }}
              onClick={() => router.push('/')}
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{
            codec: props.codec,
            hq: props.hq,
            singlePeerConnection: props.singlePeerConnection,
          }}
        />
      )}
      </main>
    </>
  );
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
    singlePeerConnection: boolean;
  };
}) {
  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);
  // PreJoin画面で選択・保存したスピーカーを、入室後もそのまま使う
  const audioOutputDeviceId = React.useMemo(() => loadAudioOutputDeviceId(), []);

  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      audioOutput: audioOutputDeviceId ? { deviceId: audioOutputDeviceId } : undefined,
      adaptiveStream: true,
      dynacast: true,
      e2ee: keyProvider && worker && e2eeEnabled ? { keyProvider, worker } : undefined,
      singlePeerConnection: props.options.singlePeerConnection,
    };
  }, [props.userChoices, props.options.hq, props.options.codec, audioOutputDeviceId]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  React.useEffect(() => {
    if (e2eeEnabled) {
      keyProvider
        .setKey(decodePassphrase(e2eePassphrase))
        .then(() => {
          room.setE2EEEnabled(true).catch((e) => {
            if (e instanceof DeviceUnsupportedError) {
              alert(
                `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
              );
              console.error(e);
            } else {
              throw e;
            }
          });
        })
        .then(() => setE2eeSetupComplete(true));
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, room, e2eePassphrase]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    room.on(RoomEvent.MediaDevicesError, handleError);

    if (e2eeSetupComplete) {
      room
        .connect(
          props.connectionDetails.serverUrl,
          props.connectionDetails.participantToken,
          connectOptions,
        )
        .catch((error) => {
          handleError(error);
        });
      if (props.userChoices.videoEnabled) {
        room.localParticipant.setCameraEnabled(true).catch((error) => {
          handleError(error);
        });
      }
      if (props.userChoices.audioEnabled) {
        room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
          handleError(error);
        });
      }
    }
    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [e2eeSetupComplete, room, props.connectionDetails, props.userChoices]);

  const lowPowerMode = useLowCPUOptimizer(room);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(`Encountered an unexpected error, check the console logs for details: ${error.message}`);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  React.useEffect(() => {
    if (lowPowerMode) {
      console.warn('Low power mode enabled');
    }
  }, [lowPowerMode]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <KeyboardShortcuts />
        <CustomVideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
        />
        <DebugMode />
        <RecordingIndicator />
      </RoomContext.Provider>
    </div>
  );
}
