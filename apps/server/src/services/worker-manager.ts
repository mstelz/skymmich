import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import path from 'path';

export class WorkerManager extends EventEmitter {
  private workerProcess: ChildProcess | null = null;
  private isEnabled: boolean = false;
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 5;
  private restartDelay: number = 1000; // Start with 1 second delay
  private maxRestartDelay: number = 30000; // Max 30 seconds delay
  private isShuttingDown: boolean = false;

  constructor() {
    super();
    this.isEnabled = process.env.ENABLE_PLATE_SOLVING === 'true';
    console.log(`WorkerManager initialized. Plate solving enabled: ${this.isEnabled}`);
  }

  async start(): Promise<void> {
    if (!this.isEnabled) {
      console.log('Worker not started - plate solving is disabled');
      return;
    }

    if (this.workerProcess) {
      console.log('Worker is already running');
      return;
    }

    if (this.isShuttingDown) {
      console.log('Worker not started - shutdown in progress');
      return;
    }

    try {
      const workerPath = path.resolve(process.cwd(), 'dist/worker.js');
      console.log(`Starting worker process: ${workerPath}`);
      
      this.workerProcess = spawn('node', [workerPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          NODE_ENV: process.env.NODE_ENV || 'production'
        }
      });

      this.setupProcessHandlers();
      this.restartAttempts = 0; // Reset restart attempts on successful start
      this.restartDelay = 1000; // Reset delay
      
      console.log(`Worker process started with PID: ${this.workerProcess.pid}`);
      this.emit('started', this.workerProcess.pid);
      
    } catch (error) {
      console.error('Failed to start worker process:', error);
      this.workerProcess = null;
      this.emit('error', error);
      
      // Attempt restart if not at max attempts
      if (this.restartAttempts < this.maxRestartAttempts && !this.isShuttingDown) {
        this.scheduleRestart();
      }
    }
  }

  async stop(): Promise<void> {
    if (!this.workerProcess) {
      console.log('Worker is not running');
      return;
    }

    this.isShuttingDown = true;
    console.log('Stopping worker process...');

    return new Promise((resolve) => {
      if (!this.workerProcess) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        if (this.workerProcess) {
          console.log('Worker did not exit gracefully, killing process');
          this.workerProcess.kill('SIGKILL');
        }
      }, 5000); // 5 second timeout for graceful shutdown

      this.workerProcess.once('exit', () => {
        clearTimeout(timeout);
        console.log('Worker process stopped');
        this.workerProcess = null;
        this.isShuttingDown = false;
        this.emit('stopped');
        resolve();
      });

      // Send SIGTERM for graceful shutdown
      this.workerProcess.kill('SIGTERM');
    });
  }

  async restart(): Promise<void> {
    console.log('Restarting worker process...');
    await this.stop();
    await this.start();
  }

  async enable(): Promise<void> {
    this.isEnabled = true;
    console.log('Worker enabled');
    await this.start();
  }

  async disable(): Promise<void> {
    this.isEnabled = false;
    console.log('Worker disabled');
    await this.stop();
  }

  isRunning(): boolean {
    return this.workerProcess !== null && !this.workerProcess.killed;
  }

  isWorkerEnabled(): boolean {
    return this.isEnabled;
  }

  getStatus() {
    return {
      enabled: this.isEnabled,
      running: this.isRunning(),
      pid: this.workerProcess?.pid || null,
      restartAttempts: this.restartAttempts,
      maxRestartAttempts: this.maxRestartAttempts
    };
  }

  private setupProcessHandlers(): void {
    if (!this.workerProcess) return;

    // Handle worker stdout
    this.workerProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[Worker] ${output}`);
      }
    });

    // Handle worker stderr
    this.workerProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      if (error) {
        console.error(`[Worker Error] ${error}`);
      }
    });

    // Handle worker exit
    this.workerProcess.on('exit', (code, signal) => {
      console.log(`Worker process exited with code ${code} and signal ${signal}`);
      this.workerProcess = null;
      this.emit('exit', code, signal);

      // If not shutting down and worker was enabled, attempt restart
      if (!this.isShuttingDown && this.isEnabled && code !== 0) {
        console.log('Worker crashed, attempting restart...');
        this.scheduleRestart();
      }
    });

    // Handle worker error
    this.workerProcess.on('error', (error) => {
      console.error('Worker process error:', error);
      this.workerProcess = null;
      this.emit('error', error);

      // Attempt restart if not at max attempts
      if (this.restartAttempts < this.maxRestartAttempts && !this.isShuttingDown) {
        this.scheduleRestart();
      }
    });
  }

  private scheduleRestart(): void {
    if (this.isShuttingDown) return;

    this.restartAttempts++;
    console.log(`Scheduling worker restart attempt ${this.restartAttempts}/${this.maxRestartAttempts} in ${this.restartDelay}ms`);

    setTimeout(() => {
      if (!this.isShuttingDown && this.isEnabled) {
        this.start();
      }
    }, this.restartDelay);

    // Exponential backoff for restart delay
    this.restartDelay = Math.min(this.restartDelay * 2, this.maxRestartDelay);
  }

  // Graceful shutdown handler
  async gracefulShutdown(): Promise<void> {
    console.log('WorkerManager: Graceful shutdown initiated');
    await this.stop();
  }
}

// Export singleton instance
export const workerManager = new WorkerManager();