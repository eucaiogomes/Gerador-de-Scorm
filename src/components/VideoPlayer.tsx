import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw } from "lucide-react";
import type { VideoContent } from "@/types/video";

interface VideoPlayerProps {
  content: VideoContent;
  onComplete?: () => void;
}

export function VideoPlayer({ content, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = content.scenes.reduce((acc, scene) => acc + scene.duration, 0);
  const currentScene = content.scenes[currentSceneIndex];

  // Calculate which scene we're in based on current time
  useEffect(() => {
    let elapsed = 0;
    for (let i = 0; i < content.scenes.length; i++) {
      if (currentTime >= elapsed && currentTime < elapsed + content.scenes[i].duration) {
        if (currentSceneIndex !== i) {
          setCurrentSceneIndex(i);
          // Play audio for this scene
          if (content.scenes[i].audioBase64 && audioRef.current) {
            audioRef.current.src = content.scenes[i].audioBase64!;
            if (isPlaying) {
              audioRef.current.play();
            }
          }
        }
        break;
      }
      elapsed += content.scenes[i].duration;
    }
  }, [currentTime, content.scenes, currentSceneIndex, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            onComplete?.();
            return totalDuration;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, totalDuration, onComplete]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
      setCurrentSceneIndex(0);
    }
    setIsPlaying(!isPlaying);
    
    if (!isPlaying && currentScene?.audioBase64 && audioRef.current) {
      audioRef.current.play();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const restart = () => {
    setCurrentTime(0);
    setCurrentSceneIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{content.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video display area */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          {currentScene?.imageBase64 ? (
            <img
              src={currentScene.imageBase64}
              alt={`Cena ${currentSceneIndex + 1}`}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
              <span className="text-lg font-medium text-muted-foreground">
                Cena {currentSceneIndex + 1}
              </span>
            </div>
          )}

          {/* Narration overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-sm md:text-base text-center">
              {currentScene?.narration}
            </p>
          </div>

          {/* Scene indicator */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 rounded text-white text-xs">
            {currentSceneIndex + 1} / {content.scenes.length}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={totalDuration}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={restart}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="icon" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.1}
              onValueChange={(v) => {
                setVolume(v[0]);
                setIsMuted(v[0] === 0);
              }}
              className="w-24"
            />
          </div>
        </div>

        <audio ref={audioRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
