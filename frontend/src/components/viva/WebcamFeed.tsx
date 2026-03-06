import { useRef, useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Video, VideoOff } from "lucide-react";

const WebcamFeed = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 200, height: 200, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setActive(true);
      }
    } catch {
      setError(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setActive(false);
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`h-full w-full object-cover ${active ? "opacity-100" : "opacity-0"}`}
        style={{ transform: "scaleX(-1)" }}
      />

      {!active && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          {error ? (
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
              Camera unavailable
            </span>
          ) : (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={startCamera}
              className="flex flex-col items-center gap-1.5"
            >
              <Video className="h-6 w-6 text-muted-foreground/40" />
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                Enable Camera
              </span>
            </motion.button>
          )}
        </div>
      )}

      {active && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={stopCamera}
          className="absolute bottom-2 right-2 rounded-full bg-foreground/10 p-1 backdrop-blur-sm"
        >
          <VideoOff className="h-3 w-3 text-muted-foreground" />
        </motion.button>
      )}
    </div>
  );
};

export default WebcamFeed;
