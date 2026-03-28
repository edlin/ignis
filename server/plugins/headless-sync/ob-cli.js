const { spawn, execSync } = require("child_process");
const os = require("os");

function checkInstalled() {
  try {
    const output = execSync("ob --version", { stdio: "pipe" }).toString().trim();
    return { installed: true, version: output || "unknown" };
  } catch {
    return { installed: false, version: null };
  }
}

function runCommand(args, opts = {}) {
  return new Promise((resolve, reject) => {
    const spawnOpts = {
      env: { ...process.env, HOME: os.homedir() },
    };

    if (opts.cwd) {
      spawnOpts.cwd = opts.cwd;
    }

    let stdout = "";
    let stderr = "";

    const proc = spawn("ob", args, spawnOpts);

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(
          new Error(`ob ${args[0]} failed (code ${code}): ${stderr || stdout}`),
        );
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
}

module.exports = { checkInstalled, runCommand };
