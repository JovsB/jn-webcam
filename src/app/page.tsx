"use client";

import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

const filters = [
	{ name: "Normal", value: "none" },
	{ name: "Monochrome", value: "grayscale(1) contrast(1.3) brightness(1.1)" },
	{ name: "Sepia Tone", value: "sepia(1) contrast(1.15) brightness(1.05)" },
	{ name: "Polaroid", value: "polaroid" },
	{ name: "Disposable / Film", value: "film" },
	{ name: "Old Photo", value: "faded" },
];

const FRAME_WIDTH = 228;
const FRAME_HEIGHT = 200;

export default function Home() {
	const webcamRef = useRef<Webcam>(null);
	const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
	const [countdown, setCountdown] = useState<number | null>(null);
	const [isCapturing, setIsCapturing] = useState(false);
	const [selectedFilter, setSelectedFilter] = useState(filters[0].value);
	const [cameraActive, setCameraActive] = useState(false);
	const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png">("jpg");
	const [labelText, setLabelText] = useState("Photobooth");
	const [showLabel, setShowLabel] = useState(true);
	const [frameColor, setFrameColor] = useState("#fff");
	const [mode, setMode] = useState<"single" | "strip">("strip");
	const [imgSrc, setImgSrc] = useState<string | null>(null); // For single mode

	// Photobooth capture logic
	const startPhotobooth = async () => {
		setPhotos([null, null, null]);
		setIsCapturing(true);

		for (let i = 0; i < 3; i++) {
			// Countdown
			for (let t = 3; t > 0; t--) {
				setCountdown(t);
				await new Promise((res) => setTimeout(res, 1000));
			}
			setCountdown(null);

			// Capture
			if (webcamRef.current) {
				const imageSrc = webcamRef.current.getScreenshot();
				setPhotos((prev) => {
					const updated = [...prev];
					updated[i] = imageSrc;
					return updated;
				});
			}
			await new Promise((res) => setTimeout(res, 500)); // Small pause between shots
		}
		setIsCapturing(false);
	};

	// Download photobooth strip
	const handleDownloadStrip = () => {
		const frameWidth = FRAME_WIDTH;
		const frameHeight = FRAME_HEIGHT;
		const framePadding = 12; // px, adjust for desired border thickness
		const gap = 12; // gap between images
		const labelHeight = 36;

		// Each photo gets padding on all sides
		const photoDrawWidth = frameWidth - framePadding * 2;
		const photoDrawHeight = frameHeight - framePadding * 2;
		const stripHeight = (frameHeight * 3) + (gap * 2) + labelHeight;

		const canvas = document.createElement("canvas");
		canvas.width = frameWidth;
		canvas.height = stripHeight;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Fill the whole canvas with white (the frame)
		ctx.fillStyle = frameColor;  
		ctx.fillRect(0, 0, frameWidth, stripHeight);

		let loaded = 0;
		photos.forEach((src, i) => {
			if (!src) return;
			const img = new window.Image();
			img.crossOrigin = "anonymous";
			img.onload = () => {
				ctx.save();
				ctx.filter = selectedFilter;

				// Aspect ratio fit WITHIN the padded area
				const imgAspect = img.width / img.height;
				const frameAspect = photoDrawWidth / photoDrawHeight;
				let drawWidth = photoDrawWidth,
					drawHeight = photoDrawHeight,
					offsetX = framePadding,
					offsetY = framePadding + i * (frameHeight + gap);

				if (imgAspect > frameAspect) {
					drawWidth = photoDrawWidth;
					drawHeight = photoDrawWidth / imgAspect;
					offsetY += (photoDrawHeight - drawHeight) / 2;
				} else {
					drawHeight = photoDrawHeight;
					drawWidth = photoDrawHeight * imgAspect;
					offsetX += (photoDrawWidth - drawWidth) / 2;
				}

				ctx.drawImage(
					img,
					0,
					0,
					img.width,
					img.height,
					offsetX,
					offsetY,
					drawWidth,
					drawHeight
				);
				ctx.restore();

				loaded++;
				if (loaded === 3) {
					// Draw label only once at the bottom
					if (showLabel && labelText) {
						ctx.font = "16px cursive";
						ctx.fillStyle = "#888";
						ctx.globalAlpha = 0.7;
						ctx.textAlign = "center";
						ctx.fillText(labelText, frameWidth / 2, stripHeight - 12);
						ctx.globalAlpha = 1;
					}
					const mime = downloadFormat === "png" ? "image/png" : "image/jpeg";
					const dataUrl = canvas.toDataURL(mime);
					downloadImage(dataUrl, `photobooth-strip.${downloadFormat}`);
				}
			};
			img.src = src;
		});
	};

	// Helper to trigger download
	function downloadImage(dataUrl: string, filename: string) {
		const link = document.createElement("a");
		link.href = dataUrl;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	// Single capture for regular camera mode
	const capture = () => {
		if (webcamRef.current) {
			setImgSrc(webcamRef.current.getScreenshot());
		}
	};

	return (
		<main
			style={{
				minHeight: "100vh",
				background: "#f7f7fa",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				fontFamily: "Inter, Arial, sans-serif",
			}}
		>
			{/* Show logo and title only if camera is not active */}
			{!cameraActive && (
				<>
					<img
						src="/images/jny.png"
						alt="Logo"
						style={{ width: 270, height: 360, marginBottom: 16 }}
					/>
					<h1
						style={{
							fontWeight: 600,
							fontSize: 32,
							marginBottom: 32,
							color: "#222",
						}}
					>
						Jenny&apos;s Cameras
					</h1>
				</>
			)}
			{/* Mode selection buttons only if camera is not active */}
			{!cameraActive && (
				<div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
					<button
						onClick={() => setMode("single")}
						style={{
							padding: "8px 20px",
							borderRadius: 6,
							border: mode === "single" ? "2px solid #222" : "1px solid #ccc",
							background: mode === "single" ? "#eee" : "#fafbfc",
							color: "#222",
							fontWeight: mode === "single" ? 600 : 400,
							cursor: "pointer",
						}}
					>
						Regular Camera
					</button>
					<button
						onClick={() => setMode("strip")}
						style={{
							padding: "8px 20px",
							borderRadius: 6,
							border: mode === "strip" ? "2px solid #222" : "1px solid #ccc",
							background: mode === "strip" ? "#eee" : "#fafbfc",
							color: "#222",
							fontWeight: mode === "strip" ? 600 : 400,
							cursor: "pointer",
						}}
					>
						Photobooth Strip
					</button>
				</div>
			)}
			{/* Start Camera button with extra space below */}
			{!cameraActive ? (
				<>
					<button
						onClick={() => setCameraActive(true)}
						style={{
							padding: "12px 32px",
							fontSize: 18,
							borderRadius: 8,
							border: "none",
							background: "#222",
							color: "#fff",
							boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
							cursor: "pointer",
							transition: "background 0.2s",
							marginBottom: 40, // Add space below Start Camera
						}}
					>
						Start Camera
					</button>
				</>
			) : (
				<div
					style={{
						background: "#fff",
						borderRadius: 16,
						boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
						padding: 32,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						minWidth: 420,
					}}
				>
					<div style={{ position: "relative", width: 360, height: 270, marginBottom: 20 }}>
						<Webcam
							audio={false}
							ref={webcamRef}
							screenshotFormat="image/jpeg"
							width={360}
							height={270}
							style={{
								borderRadius: 10,
								width: 360,
								height: 270,
								boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
								filter:
									selectedFilter === "polaroid"
										? "contrast(1.1) brightness(1.05) saturate(1.1)"
										: selectedFilter === "film"
										? "contrast(1.2) brightness(1.08) saturate(1.2) sepia(0.18) hue-rotate(-8deg)"
										: selectedFilter === "faded"
										? "contrast(0.85) brightness(1.08) sepia(0.25) saturate(0.8)"
										: selectedFilter,
							}}
							videoConstraints={{ facingMode: "user" }}
						/>
						{/* Polaroid border */}
						{selectedFilter === "polaroid" && (
							<div
								style={{
									pointerEvents: "none",
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									border: "12px solid #fff",
									borderBottomWidth: 32,
									borderRadius: 12,
									boxSizing: "border-box",
								}}
							/>
						)}
					{/* Film/disposable: stronger vignette, heavier grain, warm flash tint */}
            {selectedFilter === "film" && (
              <>
                {/* Strong vignette */}
                <div
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    background:
                      "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.28) 100%)",
                    mixBlendMode: "multiply",
                  }}
                />

                {/* Grain effect - heavier */}
                <div
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    opacity: 0.25,
                    backgroundImage:
                      "url('https://www.transparenttextures.com/patterns/asfalt-light.png')", // coarse grain
                    backgroundSize: "300px 300px",
                    mixBlendMode: "overlay",
                  }}
                />

                {/* Warm tint overlay */}
                <div
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    backgroundColor: "rgba(255, 200, 180, 0.05)", // subtle warm tone
                    mixBlendMode: "soft-light",
                  }}
                />

                {/* Optional soft blur (simulate lens softness) */}
                {/* <div
                  style={{
                    pointerEvents: "none",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    borderRadius: 10,
                    backdropFilter: "blur(1px)",
                  }}
                /> */}
              </>
            )}

						{/* Old photo: faded vignette */}
						{selectedFilter === "faded" && (
							<div
								style={{
									pointerEvents: "none",
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									borderRadius: 10,
									background:
										"radial-gradient(ellipse at center, rgba(255,255,255,0) 60%, rgba(255,255,255,0.35) 100%)",
								}}
							/>
						)}
						{/* Countdown overlay */}
						{isCapturing && countdown && (
							<div
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									width: "100%",
									height: "100%",
									background: "rgba(255,255,255,0.7)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: 64,
									fontWeight: 700,
									color: "#222",
									borderRadius: 10,
									zIndex: 2,
								}}
							>
								{countdown}
							</div>
						)}
					</div>
					<div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
						{mode === "single" ? (
							<button
								onClick={capture}
								style={{
									padding: "12px 32px",
									fontSize: 18,
									borderRadius: 8,
									border: "none",
									background: "#222",
									color: "#fff",
									boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
									cursor: "pointer",
									transition: "background 0.2s",
								}}
							>
								Capture
							</button>
						) : (
							<button
								onClick={startPhotobooth}
								disabled={isCapturing}
								style={{
									padding: "12px 32px",
									fontSize: 18,
									borderRadius: 8,
									border: "none",
									background: isCapturing ? "#888" : "#222",
									color: "#fff",
									boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
									cursor: isCapturing ? "not-allowed" : "pointer",
									transition: "background 0.2s",
								}}
							>
								{isCapturing
									? countdown
										? `Get ready... ${countdown}`
										: "Capturing..."
									: "Start Photobooth"}
							</button>
						)}
						<select
							value={selectedFilter}
							onChange={(e) => setSelectedFilter(e.target.value)}
							style={{
								padding: "8px 12px",
								borderRadius: 6,
								border: "1px solid #ddd",
								fontSize: 16,
								background: "#fafbfc",
								color: "#222",
								outline: "none",
							}}
							disabled={isCapturing}
						>
							{filters.map((f) => (
								<option key={f.value} value={f.value}>
									{f.name}
								</option>
							))}
						</select>
						<button
							onClick={() => {
								setCameraActive(false);
								setPhotos([null, null, null]);
							}}
							style={{
								padding: "8px 20px",
								fontSize: 16,
								borderRadius: 6,
								border: "none",
								background: "#eee",
								color: "#222",
								cursor: "pointer",
								transition: "background 0.2s",
							}}
							disabled={isCapturing}
						>
							Exit
						</button>
					</div>
				</div>
			)}
			{/* Editable label controls */}
			{cameraActive && (
				<div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 8 }}>
					<input
						type="text"
						value={labelText}
						onChange={(e) => setLabelText(e.target.value)}
						placeholder="Label (optional)"
						style={{
							padding: "6px 10px",
							borderRadius: 6,
							border: "1px solid #ddd",
							fontSize: 15,
							background: "#fafbfc",
							color: "#222",
							outline: "none",
							minWidth: 120,
						}}
						disabled={!showLabel}
					/>
					<label style={{ fontSize: 14, color: "#555" }}>
						<input
							type="checkbox"
							checked={showLabel}
							onChange={(e) => setShowLabel(e.target.checked)}
							style={{ marginRight: 4 }}
						/>
						Show label
					</label>
					<label style={{ fontSize: 14, color: "#555" }}>Frame color:</label>
					<select
						value={frameColor}
						onChange={(e) => setFrameColor(e.target.value)}
						style={{
							padding: "6px 12px",
							borderRadius: 6,
							border: "1px solid #ddd",
							fontSize: 15,
							background: "#fafbfc",
							color: "#222",
							outline: "none",
						}}
					>
						<option value="#fff">White</option>
						<option value="#f8e8e8">Blush</option>
						<option value="#e8f8f8">Mint</option>
						<option value="#f8f8e8">Lemon</option>
						<option value="#e8e8f8">Lavender</option>
						<option value="#222">Black</option>
					</select>
				</div>
			)}
			{/* Photobooth strip */}
			{photos.some(Boolean) && (
				<div
					style={{
						marginTop: 32,
						background: frameColor,  
						borderRadius: 16,
						boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
						padding: 24,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						width: 260,
					}}
				>
					<h3
						style={{
							fontWeight: 500,
							fontSize: 20,
							marginBottom: 16,
							color: "#222",
						}}
					>
						Photobooth Strip
					</h3>
					{/* White frame with extra bottom for label */}
    <div
      style={{
        background: "#fff", // <-- always white for the frame
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT * 3 + 36, // extra for label
        marginBottom: 12,
        position: "relative",
        overflow: "hidden",
        border: "2px solid #eee",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {/* Render each photo */}
      {photos.map((src, idx) => (
        <div
          key={idx}
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#eee",
            marginBottom: idx !== photos.length - 1 ? 2 : 0, // <-- reduce gap to 2px
          }}
        >
          {src ? (
            <img
              src={src}
              alt={`Photobooth ${idx + 1}`}
              style={{
                maxWidth: FRAME_WIDTH - 16,
                maxHeight: FRAME_HEIGHT - 16,
                objectFit: "contain",
                borderRadius: 4,
                filter: selectedFilter,
                display: "block",
                background: "#fff",
              }}
            />
          ) : (
            <span style={{ color: "#bbb" }}>...</span>
          )}
        </div>
      ))}
      {/* Label below all images, inside frame */}
      {showLabel && (
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: 14,
            color: "#888",
            fontFamily: "cursive",
            letterSpacing: 1,
            opacity: 0.7,
            userSelect: "none",
            paddingTop: 8,
            paddingBottom: 4,
            position: "absolute",
            left: 0,
            bottom: 0,
            background: "transparent",
          }}
        >
          {labelText}
        </div>
      )}
    </div>
				</div>
			)}
			 
			{mode === "single" && imgSrc && (
  <div
    style={{
      marginTop: 32,
      background: frameColor, // <-- use frameColor here
      borderRadius: 16,
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: 260,
    }}
  >
    <h3 style={{ fontWeight: 500, fontSize: 20, marginBottom: 16, color: "#222" }}>
      Captured Photo
    </h3>
    {/* White frame with extra bottom for label */}
    <div
      style={{
        background: "transparent", // keep transparent so outer frame shows
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT + 36,
        marginBottom: 12,
        position: "relative",
        overflow: "hidden",
        border: "2px solid #eee",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {/* Image with aspect ratio fit */}
      <div
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#eee",
        }}
      >
        <img
          src={imgSrc}
          alt="Captured"
          style={{
            maxWidth: FRAME_WIDTH,
            maxHeight: FRAME_HEIGHT,
            objectFit: "contain",
            borderRadius: 4,
            filter: selectedFilter,
            display: "block",
          }}
        />
      </div>
      {/* Label below image, inside frame */}
      {showLabel && (
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: 14,
            color: "#888",
            fontFamily: "cursive",
            letterSpacing: 1,
            opacity: 0.7,
            userSelect: "none",
            paddingTop: 8,
            paddingBottom: 4,
          }}
        >
          {labelText}
        </div>
      )}
    </div>
    {/* Download button for single image */}
    <button
      onClick={() => {
        if (!imgSrc) return;
        const framePadding = 12; // px, adjust for border thickness
        const labelHeight = 36;
        const photoDrawWidth = FRAME_WIDTH - framePadding * 2;
        const photoDrawHeight = FRAME_HEIGHT - framePadding * 2;

        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = FRAME_WIDTH;
          canvas.height = FRAME_HEIGHT + labelHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          // Draw frame color
          ctx.fillStyle = frameColor;
          ctx.fillRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT + labelHeight);

          // Aspect ratio fit WITHIN the padded area
          const imgAspect = img.width / img.height;
          const frameAspect = photoDrawWidth / photoDrawHeight;
          let drawWidth = photoDrawWidth,
            drawHeight = photoDrawHeight,
            offsetX = framePadding,
            offsetY = framePadding;

          if (imgAspect > frameAspect) {
            drawWidth = photoDrawWidth;
            drawHeight = photoDrawWidth / imgAspect;
            offsetY += (photoDrawHeight - drawHeight) / 2;
          } else {
            drawHeight = photoDrawHeight;
            drawWidth = photoDrawHeight * imgAspect;
            offsetX += (photoDrawWidth - drawWidth) / 2;
          }

          ctx.filter = selectedFilter;
          ctx.drawImage(
            img,
            0,
            0,
            img.width,
            img.height,
            offsetX,
            offsetY,
            drawWidth,
            drawHeight
          );

          // Draw label below image, inside frame
          if (showLabel && labelText) {
            ctx.font = "16px cursive";
            ctx.fillStyle = "#888";
            ctx.globalAlpha = 0.7;
            ctx.textAlign = "center";
            ctx.fillText(labelText, FRAME_WIDTH / 2, FRAME_HEIGHT + 24);
            ctx.globalAlpha = 1;
          }
          const mime = downloadFormat === "png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(mime);
          const link = document.createElement("a");
          link.href = dataUrl;
          link.download = `photo.${downloadFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
        img.src = imgSrc;
      }}
      style={{
        padding: "8px 20px",
        fontSize: 15,
        borderRadius: 6,
        border: "none",
        background: "#222",
        color: "#fff",
        cursor: "pointer",
        transition: "background 0.2s",
      }}
    >
      Download Photo
    </button>
  </div>
)}

			{mode === "strip" && photos.some(Boolean) && (
  <div
    style={{
      marginTop: 32,
      background: frameColor, // <-- use frameColor here
      borderRadius: 16,
      boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
      padding: 24,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: 260,
    }}
  >
    <h3
      style={{
        fontWeight: 500,
        fontSize: 20,
        marginBottom: 16,
        color: "#222",
      }}
    >
      Photobooth Strip
    </h3>
    {/* White frame with extra bottom for label */}
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT * 3 + 36,
        marginBottom: 12,
        position: "relative",
        overflow: "hidden",
        border: "2px solid #eee",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {/* Render each photo */}
      {photos.map((src, idx) => (
        <div
          key={idx}
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff",
            marginBottom: idx !== photos.length - 1 ? 2 : 0,
          }}
        >
          {src ? (
            <img
              src={src}
              alt={`Photobooth ${idx + 1}`}
              style={{
                maxWidth: FRAME_WIDTH - 16, // leave some space for frame
                maxHeight: FRAME_HEIGHT - 16,
                objectFit: "contain",
                borderRadius: 4,
                filter: selectedFilter,
                display: "block",
                background: "#fff",
              }}
            />
          ) : (
            <span style={{ color: "#bbb" }}>...</span>
          )}
        </div>
      ))}
      {/* Label below all images, inside frame */}
      {showLabel && (
        <div
          style={{
            width: "100%",
            textAlign: "center",
            fontSize: 14,
            color: "#888",
            fontFamily: "cursive",
            letterSpacing: 1,
            opacity: 0.7,
            userSelect: "none",
            paddingTop: 8,
            paddingBottom: 4,
            position: "absolute",
            left: 0,
            bottom: 0,
            background: "transparent",
          }}
        >
          {labelText}
        </div>
      )}
    </div>
    {/* Download options for strip */}
    <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
      <select
        value={downloadFormat}
        onChange={e => setDownloadFormat(e.target.value as "jpg" | "png")}
        style={{
          padding: "6px 12px",
          borderRadius: 6,
          border: "1px solid #ddd",
          fontSize: 15,
          background: "#fafbfc",
          color: "#222",
          outline: "none",
        }}
      >
        <option value="jpg">JPG</option>
        <option value="png">PNG</option>
      </select>
      <button
        onClick={handleDownloadStrip}
        style={{
          padding: "8px 20px",
          fontSize: 15,
          borderRadius: 6,
          border: "none",
          background: "#222",
          color: "#fff",
          cursor: "pointer",
          transition: "background 0.2s",
        }}
        disabled={photos.some(p => !p)}
      >
        Download Strip
      </button>
    </div>
  </div>
)}
		</main>
	);
}