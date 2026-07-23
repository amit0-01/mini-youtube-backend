import { spawn } from "child_process";
import path from "path";

export function transcribe(videoPath, language = "en") {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve("python", "transcribe.py");

    const python = spawn("python", [
      scriptPath,
      videoPath,
      language,
    ]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("error", (error) => {
      reject(error);
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(errorOutput || "Transcription failed"));
      }

      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (error) {
        console.error("Raw Python output:", output);
        reject(new Error("Invalid transcription JSON output"));
      }
    });
  });
}