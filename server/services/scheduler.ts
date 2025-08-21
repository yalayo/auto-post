export class PostScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly checkInterval = 5 * 60 * 1000; // Check every 5 minutes

  start() {
    if (this.intervalId) {
      console.log('Scheduler already running');
      return;
    }

    console.log('Starting post scheduler...');
    this.intervalId = setInterval(async () => {
      try {
        await this.processScheduledPosts();
      } catch (error) {
        console.error('Scheduler error:', error);
      }
    }, this.checkInterval);

    // Run immediately on start
    this.processScheduledPosts().catch(console.error);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Post scheduler stopped');
    }
  }

  private async processScheduledPosts() {
    try {
      const response = await fetch('http://localhost:5000/api/posts/process-scheduled', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.processed > 0 || result.failed > 0) {
          console.log(`Scheduler: Processed ${result.processed} posts, ${result.failed} failed`);
        }
      } else {
        console.error('Failed to process scheduled posts:', response.statusText);
      }
    } catch (error) {
      console.error('Error calling scheduled posts processor:', error);
    }
  }
}

export const postScheduler = new PostScheduler();