interface AstrometrySubmission {
  subid: number;
  status: string;
  jobs?: number[];
}

interface AstrometryJobStatus {
  status: string;
  job_calibrations?: number[];
}

interface AstrometryCalibration {
  ra: number;
  dec: number;
  pixscale: number;
  radius: number;
  orientation: number;
}

export class AstrometryApi {
  private baseUrl = "http://nova.astrometry.net/api";
  private sessionKey: string | null = null;

  async login(apiKey: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `request-json=${encodeURIComponent(JSON.stringify({ apikey: apiKey }))}`,
    });

    const data = await response.json();
    if (data.status !== "success") {
      throw new Error("Failed to authenticate with Astrometry.net");
    }

    this.sessionKey = data.session;
  }

  async submitImageUrl(
    imageUrl: string,
    options: {
      scaleUnits?: string;
      scaleType?: string;
      scaleLower?: number;
      scaleUpper?: number;
      centerRa?: number;
      centerDec?: number;
      radius?: number;
    } = {}
  ): Promise<number> {
    if (!this.sessionKey) {
      throw new Error("Not authenticated. Call login() first.");
    }

    const payload = {
      session: this.sessionKey,
      url: imageUrl,
      scale_units: options.scaleUnits || "arcminperpix",
      scale_type: options.scaleType || "ul",
      scale_lower: options.scaleLower || 0.5,
      scale_upper: options.scaleUpper || 60,
      center_ra: options.centerRa,
      center_dec: options.centerDec,
      radius: options.radius || 2.0,
    };

    const response = await fetch(`${this.baseUrl}/url_upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `request-json=${encodeURIComponent(JSON.stringify(payload))}`,
    });

    const data = await response.json();
    if (data.status !== "success") {
      throw new Error("Failed to submit image to Astrometry.net");
    }

    return data.subid;
  }

  async getSubmissionStatus(submissionId: number): Promise<AstrometrySubmission> {
    const response = await fetch(`${this.baseUrl}/submissions/${submissionId}`);
    return response.json();
  }

  async getJobStatus(jobId: number): Promise<AstrometryJobStatus> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}`);
    return response.json();
  }

  async getJobCalibration(jobId: number): Promise<AstrometryCalibration> {
    const response = await fetch(`${this.baseUrl}/jobs/${jobId}/calibration/`);
    return response.json();
  }

  async waitForCompletion(
    submissionId: number,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 5000 // 5 seconds
  ): Promise<AstrometryCalibration | null> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const submission = await this.getSubmissionStatus(submissionId);
      
      if (submission.jobs && submission.jobs.length > 0) {
        const jobId = submission.jobs[0];
        const jobStatus = await this.getJobStatus(jobId);
        
        if (jobStatus.job_calibrations && jobStatus.job_calibrations.length > 0) {
          // Job completed successfully
          const calibrationId = jobStatus.job_calibrations[0];
          return this.getJobCalibration(calibrationId);
        } else if (jobStatus.status === "failure") {
          // Job failed
          return null;
        }
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error("Timeout waiting for plate solving to complete");
  }
}

export function createAstrometryApi(): AstrometryApi {
  return new AstrometryApi();
}
