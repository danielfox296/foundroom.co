import { useState, useRef, useCallback, useEffect } from 'react';
import { getTrackList, getTrackUrl, reportTrack, type Track } from '../api/tracks';
import { fisherYatesShuffle } from '../utils/shuffle';

export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export function usePlayer() {
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [status, setStatus] = useState<PlayerStatus>('idle');
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showReportConfirm, setShowReportConfirm] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reportTimerRef = useRef<number | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onTimeUpdate = () => setProgress(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => advanceQueue();
    const onError = () => {
      console.error('Audio playback error');
      setStatus('error');
      // Try to advance on error
      advanceQueue();
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    setStatus('loading');
    try {
      const { url } = await getTrackUrl(track.id);
      const audio = audioRef.current!;
      audio.src = url;
      await audio.play();
      setCurrentTrack(track);
      setLastPlayedId(track.id);
      setStatus('playing');
    } catch (err) {
      if (err instanceof Error && err.message === 'TRACK_UNAVAILABLE') {
        // Track was flagged, silently skip
        return false;
      }
      console.error('Failed to play track:', err);
      setStatus('error');
      return false;
    }
    return true;
  }, []);

  const buildQueue = useCallback(async (lastId?: string | null): Promise<Track[]> => {
    const tracks = await getTrackList();
    let shuffled = fisherYatesShuffle(tracks);
    if (lastId && shuffled.length > 1 && shuffled[0]?.id === lastId) {
      [shuffled[0], shuffled[1]] = [shuffled[1]!, shuffled[0]!];
    }
    setQueue(shuffled);
    setQueueIndex(0);
    return shuffled;
  }, []);

  const advanceQueue = useCallback(async () => {
    const nextIndex = queueIndex + 1;
    if (nextIndex >= queue.length) {
      // Queue exhausted — rebuild
      const newQueue = await buildQueue(lastPlayedId);
      if (newQueue.length > 0) {
        await playTrack(newQueue[0]!);
      }
    } else {
      setQueueIndex(nextIndex);
      const nextTrack = queue[nextIndex]!;
      const ok = await playTrack(nextTrack);
      if (!ok) {
        // Track unavailable, try next
        setQueueIndex(nextIndex);
        // Recurse via setTimeout to avoid stack overflow
        setTimeout(() => advanceQueue(), 0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueIndex, queue, lastPlayedId, buildQueue, playTrack]);

  // Wire up the ended event to current advanceQueue
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => advanceQueue();
    audio.addEventListener('ended', onEnded);
    return () => audio.removeEventListener('ended', onEnded);
  }, [advanceQueue]);

  const start = useCallback(async () => {
    const newQueue = await buildQueue();
    if (newQueue.length > 0) {
      await playTrack(newQueue[0]!);
    }
  }, [buildQueue, playTrack]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (status === 'playing') {
      audio.pause();
      setStatus('paused');
    } else if (status === 'paused') {
      audio.play();
      setStatus('playing');
    } else if (status === 'idle') {
      start();
    }
  }, [status, start]);

  const skip = useCallback(() => {
    advanceQueue();
  }, [advanceQueue]);

  const report = useCallback(async () => {
    if (!currentTrack) return;
    const trackId = currentTrack.id;

    // Show confirmation
    setShowReportConfirm(true);
    if (reportTimerRef.current) clearTimeout(reportTimerRef.current);
    reportTimerRef.current = window.setTimeout(
      () => setShowReportConfirm(false),
      2000,
    );

    // Fire report API (fast DB write)
    reportTrack(trackId).catch(console.error);

    // Remove from local queue
    const newQueue = queue.filter((t) => t.id !== trackId);
    setQueue(newQueue);

    // Find the next track to play
    const adjustedIndex = Math.min(queueIndex, newQueue.length - 1);

    if (newQueue.length === 0) {
      // All tracks reported/exhausted, rebuild
      const rebuilt = await buildQueue(lastPlayedId);
      if (rebuilt.length > 0) {
        await playTrack(rebuilt[0]!);
      } else {
        audioRef.current?.pause();
        setStatus('idle');
        setCurrentTrack(null);
      }
      return;
    }

    // Advance to next track (no dead air — fetch URL before cutting audio)
    const nextTrack = newQueue[adjustedIndex]!;
    setQueueIndex(adjustedIndex);
    try {
      const { url } = await getTrackUrl(nextTrack.id);
      const audio = audioRef.current!;
      audio.src = url;
      await audio.play();
      setCurrentTrack(nextTrack);
      setLastPlayedId(nextTrack.id);
      setStatus('playing');
    } catch {
      // If fetch fails, try advancing
      advanceQueue();
    }
  }, [currentTrack, queue, queueIndex, lastPlayedId, buildQueue, playTrack, advanceQueue]);

  return {
    currentTrack,
    status,
    isPlaying: status === 'playing',
    progress,
    duration,
    showReportConfirm,
    start,
    togglePlay,
    skip,
    report,
  };
}
