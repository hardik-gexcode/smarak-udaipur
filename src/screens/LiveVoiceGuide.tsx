import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../ui';

type Turn = { who: 'You' | 'SMARAK'; text: string };
type Status = 'idle' | 'connecting' | 'connected' | 'error';

export default function LiveVoiceGuide({ place, language, context, onClose }: { place: string; language: string; context: string; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState('');
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const stop = () => {
    try { if (dcRef.current?.readyState === 'open') dcRef.current.send(JSON.stringify({ type: 'session.close' })); } catch { /* closing */ }
    dcRef.current?.close(); dcRef.current = null;
    pcRef.current?.close(); pcRef.current = null;
    micRef.current?.getTracks().forEach((track) => track.stop()); micRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    setStatus('idle');
  };
  useEffect(() => () => {
    dcRef.current?.close(); pcRef.current?.close();
    micRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setError('Microphone access needs HTTPS and a supported browser.'); setStatus('error'); return; }
    setError(''); setStatus('connecting');
    try {
      const credential = await api<{ value?: string }>('/api/realtime-token', { place, lang: language, context }, 15000);
      if (!credential.ok || !credential.data?.value) throw new Error(credential.status === 503 ? 'Add OPENAI_API_KEY in Vercel, then redeploy.' : 'Could not create the live voice session. Check the deployed API and try again.');
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      micRef.current = mic;
      const pc = new RTCPeerConnection(); pcRef.current = pc;
      pc.ontrack = (event) => { if (audioRef.current) { audioRef.current.srcObject = event.streams[0]; void audioRef.current.play().catch(() => {}); } };
      mic.getAudioTracks().forEach((track) => pc.addTrack(track, mic));
      const dc = pc.createDataChannel('oai-events'); dcRef.current = dc;
      dc.onmessage = (message) => {
        try {
          const event = JSON.parse(message.data);
          if (event.type === 'conversation.item.input_audio_transcription.completed' && event.transcript) setTurns((old) => [...old, { who: 'You' as const, text: String(event.transcript) }].slice(-6));
          if ((event.type === 'response.output_audio_transcript.done' || event.type === 'response.audio_transcript.done') && event.transcript) setTurns((old) => [...old, { who: 'SMARAK' as const, text: String(event.transcript) }].slice(-6));
          if (event.type === 'error') setError(event.error?.message || 'Voice connection error.');
        } catch { /* ignore non-JSON media events */ }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setStatus('connected');
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') setError('Voice connection lost. Tap Start to reconnect.');
      };
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const response = await fetch('https://api.openai.com/v1/realtime/calls', {
        method: 'POST', body: offer.sdp,
        headers: { Authorization: `Bearer ${credential.data.value}`, 'Content-Type': 'application/sdp' },
      });
      const answer = await response.text();
      if (!response.ok) throw new Error('OpenAI could not start the voice session. Check API access and billing.');
      await pc.setRemoteDescription({ type: 'answer', sdp: answer });
    } catch (cause) {
      stop(); setStatus('error'); setError(cause instanceof Error ? cause.message : 'Could not start voice chat.');
    }
  };

  return (
    <section className="live-guide" role="dialog" aria-label="Live SMARAK voice guide">
      <div className="live-guide-head">
        <div><div className={`live-orb ${status === 'connected' ? 'active' : ''}`}><Icon n="mic" size={23} /></div></div>
        <div className="live-guide-title"><b>SMARAK · Live voice</b><small>{status === 'connected' ? `Listening at ${place}` : status === 'connecting' ? 'Connecting securely…' : 'Ask about this place out loud'}</small></div>
        {status !== 'idle' && status !== 'error' && <button className="voice-end" onClick={stop}>End</button>}
        <button className="voice-close" aria-label="Close voice guide" onClick={() => { stop(); onClose(); }}>×</button>
      </div>
      {turns.length > 0 && <div className="live-turns" aria-live="polite">{turns.slice(-3).map((turn, index) => <p key={`${turn.who}-${index}`}><b>{turn.who}:</b> {turn.text}</p>)}</div>}
      {error && <div className="live-error" role="alert">{error}</div>}
      <div className="live-guide-actions">
        {status === 'connected' ? <span className="live-status"><i />Live · speak naturally</span> : <button className="btn-dark live-start" disabled={status === 'connecting'} onClick={start}><Icon n="mic" size={20} />{status === 'connecting' ? 'Connecting…' : status === 'error' ? 'Try again' : 'Start talking'}</button>}
        <span className="live-privacy">Microphone is active only during this voice session.</span>
      </div>
      <audio ref={audioRef} autoPlay playsInline />
    </section>
  );
}
