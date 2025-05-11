import React from "react";
import '../styles/BackgroundVideo.css'
import { useThemeContext } from "../hooks/useThemeContext";
import backgroundVideo from "../assets/BackgroundVideo.mp4";

const BackgroundVideo: React.FC = () => {
  const { theme } = useThemeContext();
  return (
    <div className="video-container">
      <video
        className={`video-bg ${theme === "dark" ? "monochrome" : ""}`}
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={backgroundVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default BackgroundVideo;
