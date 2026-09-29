// UNUSED (2026-09-29): not imported anywhere in the running app. Kept on purpose, not deleted — see docs/UNUSED_CODE.md in the root repo before reusing or removing.
/**
 * LoadingTracker - Simple utility to track data loading progress
 * Usage:
 *   const tracker = new LoadingTracker(useLoading());
 *   tracker.start('Loading dashboard...');
 *   tracker.update(20);  // 20%
 *   tracker.stop();
 */

export class LoadingTracker {
  constructor(loadingHook) {
    this.loading = loadingHook;
    this.stages = [];
    this.currentStage = 0;
  }

  start(message = 'Loading data...', stages = 5) {
    this.stages = stages;
    this.currentStage = 0;
    this.loading.startLoading(message);
    this.updateProgress();
  }

  nextStage() {
    this.currentStage += 1;
    this.updateProgress();
  }

  updateProgress() {
    const percent = Math.round((this.currentStage / this.stages) * 100);
    this.loading.updateProgress(percent);
  }

  stop() {
    this.loading.stopLoading();
  }

  setMessage(message) {
    this.loading.setMessage(message);
  }
}

/**
 * Hook-based progress tracker
 * Usage in useEffect:
 *   const progress = useLoadingProgress(loadingHook, 5);
 *   progress.start('Loading...');
 *   // fetch data 1
 *   progress.next();
 *   // fetch data 2
 *   progress.next();
 */
export const createProgressTracker = (loadingHook) => {
  return new LoadingTracker(loadingHook);
};
