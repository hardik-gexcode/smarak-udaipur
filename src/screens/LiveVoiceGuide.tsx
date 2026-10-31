import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { Icon } from '../ui';

type Turn = { who: 'You' | 'SMARAK'; text: string };
type Status = 'idle' | 'connecting' | 'connected' | 'error';
const MODEL = 'gemini-3.8-live';
const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

export default function LiveVoiceGuide({ place, language, context, onClose }: { place: string; language: string; context: string; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('idle');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackAt = useRef(0);
  const statusRef = useRef<Status>('idle');
  const setCurrentStatus = (value: Status) => { statusRef.current = value; setStatus(value); };

  const stop = () => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) socket.close(1000, 'User ended session');
    socketRef.current = null;
    processorRef.current?.disconnect(); processorRef.current = null;
    sourceRef.current?.disconnect(); sourceRef.current = null;
    micRef.current?.getTracks().forEach((track) => track.stop()); micRef.current = null;
    const audioContext = contextRef.current; contextRef.current = null;
    if (audioContext && audioContext.state !== 'closed') void audioContext.close();
    setCurrentStatus('idle');
  };
  useEffect(() => () => {
    socketRef.current?.close();
    processorRef.current?.disconnect(); sourceRef.current?.disconnect();
    micRef.current?.getTracks().forEach((track) => track.stop());
    if (contextRef.current && contextRef.current.state !== 'closed') void contextRef.current.close();
  }, []);

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) { setError('Microphone access needs HTTPS and a supported browser.'); setCurrentStatus('error'); return; }
    setError(''); setCurrentStatus('connecting');
    try {
      // Create/resume audio during the tap gesture so mobile Safari permits playback later.
      const audioContext = new AudioContext(); contextRef.current = audioContext;
      await audioContext.resume();
      const credential = await api<{ token?: string; model?: string }>('/api/gemini-live-token', { place, lang: language, context }, 20000);
      if (!credential.ok || !credential.data?.token) throw new Error(credential.status === 503 ? 'Add GEMINI_API_KEY in Vercel, then redeploy.' : 'Could not create the Gemini Live session. Check the deployed API and try again.');
      const mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      micRef.current = mic;
      const ws = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(credential.data.token)}`);
      socketRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ setup: {
        model: `models/${credential.data?.model || MODEL}`,
        responseModalities: ['AUDIO'],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      } }));
      ws.onmessage = async (message) => {
        try {
          const event = JSON.parse(typeof message.data === 'string' ? message.data : await message.data.text());
          if (event.setupComplete) {
            setCurrentStatus('connected');
            const source = audioContext.createMediaStreamSource(mic);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            const silent = audioContext.createGain(); silent.gain.value = 0;
            source.connect(processor); processor.connect(silent); silent.connect(audioContext.destination);
            sourceRef.current = source; processorRef.current = processor;
            processor.onaudioprocess = (audioEvent) => {
              if (ws.readyState !== WebSocket.OPEN || statusRef.current !== 'connected') return;
              const input = audioEvent.inputBuffer.getChannelData(0);
              const ratio = audioContext.sampleRate / 16000;
              const length = Math.floor(input.length / ratio);
              const pcm = new Int16Array(length);
              for (let i = 0; i < length; i++) {
                const sample = input[Math.floor(i * ratio)];
                pcm[i] = Math.max(-1, Math.min(1, sample)) * (sample < 0 ? 0x8000 : 0x7fff);
              }
              ws.send(JSON.stringify({ realtimeInput: { audio: { data: toBase64(pcm.buffer), mimeType: 'audio/pcm;rate=16000' } } }));
            };
          }
          if (event.serverContent?.inputTranscription?.text) {
            const text = String(event.serverContent.inputTranscription.text);
            setTurns((old) => [...old.filter((turn) => turn.who !== 'You'), { who: 'You' as const, text }].slice(-6));
          }
          if (event.serverContent?.outputTranscription?.text) {
            const text = String(event.serverContent.outputTranscription.text);
            setTurns((old) => [...old.filter((turn) => turn.who !== 'SMARAK'), { who: 'SMARAK' as const, text }].slice(-6));
          }
          const parts = event.serverContent?.modelTurn?.parts ?? [];
          for (const part of parts) {
            const encoded = part.inlineData?.data;
            if (!encoded) continue;
            const binary = atob(encoded);
            const samples = new Int16Array(binary.length / 2);
            for (let i = 0; i < samples.length; i++) samples[i] = (binary.charCodeAt(i * 2 + 1) << 8) | binary.charCodeAt(i * 2);
            const buffer = audioContext.createBuffer(1, samples.length, 24000);
            const channel = buffer.getChannelData(0);
            for (let i = 0; i < samples.length; i++) channel[i] = samples[i] / 32768;
            const player = audioContext.createBufferSource(); player.buffer = buffer; player.connect(audioContext.destination);
            playbackAt.current = Math.max(playbackAt.current, audioContext.currentTime);
            player.start(playbackAt.current); playbackAt.current += buffer.duration;
          }
          if (event.error) setError(event.error.message || 'Gemini voice connection error.');
        } catch { /* Ignore malformed server events; the socket error handler reports connection failures. */ }
      };
      ws.onerror = () => { setError('Gemini voice connection failed. Check that the key and Live API model are enabled.'); setCurrentStatus('error'); };
      ws.onclose = (event) => { if (statusRef.current !== 'idle' && statusRef.current !== 'error') { setCurrentStatus('error'); setError(event.reason || 'Voice session ended. Tap Start to reconnect.'); } };
    } catch (cause) {
      stop(); setCurrentStatus('error'); setError(cause instanceof Error ? cause.message : 'Could not start voice chat.');
    }
  };

  return <section className="live-guide" role="dialog" aria-label="Live SMARAK voice guide">
    <div className="live-guide-head">
      <div><div className={`live-orb ${status === 'connected' ? 'active' : ''}`}><Icon n="mic" size={23} /></div></div>
      <div className="live-guide-title"><b>SMARAK · Gemini Live</b><small>{status === 'connected' ? `Listening at ${place}` : status === 'connecting' ? 'Connecting securely…' : 'Ask about this place out loud'}</small></div>
      {status !== 'idle' && status !== 'error' && <button className="voice-end" onClick={stop}>End</button>}
      <button className="voice-close" aria-label="Close voice guide" onClick={() => { stop(); onClose(); }}>×</button>
    </div>
    {turns.length > 0 && <div className="live-turns" aria-live="polite">{turns.slice(-3).map((turn, index) => <p key={`${turn.who}-${index}`}><b>{turn.who}:</b> {turn.text}</p>)}</div>}
    {error && <div className="live-error" role="alert">{error}</div>}
    <div className="live-guide-actions">
      {status === 'connected' ? <span className="live-status"><i />Live · speak naturally</span> : <button className="btn-dark live-start" disabled={status === 'connecting'} onClick={start}><Icon n="mic" size={20} />{status === 'connecting' ? 'Connecting…' : status === 'error' ? 'Try again' : 'Start talking'}</button>}
      <span className="live-privacy">Microphone is active only during this voice session.</span>
    </div>
  </section>;
}
