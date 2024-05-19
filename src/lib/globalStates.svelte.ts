let communicationCount = $state(0);

export function communication() {
  function start() {
    communicationCount++;
  }

  function finish() {
    communicationCount--;
  }

  return {
    get count() {
      return communicationCount;
    },
    get isInProgress() {
      return communicationCount > 0;
    },
    start,
    finish,
  };
}

let running = $state(true);
let paused = $derived(!running);

export function masterTimer() {
  function pause() {
    running = false;
  }

  function resume() {
    running = true;
  }

  function toggle() {
    running = !running;
  }

  return {
    get isPaused() {
      return paused;
    },
    get isRunning() {
      return running;
    },
    pause,
    resume,
    toggle,
  };
}

interface Timer {
  started_at: Date;
  duration: number;
  sessionOffset: number;
}

let timers: Timer[] = $state([]);

export function timer(index: number) {
  function resumeOrCreate(started_at: Date = new Date()) {
    if (timer(index).exists) {
      timers[index].started_at = new Date();
    } else {
      timers[index] = {
        started_at,
        sessionOffset: 0,
        duration: 0,
      };
    }
  }

  function pauseIfExists() {
    if (timer(index).exists) {
      timers[index].sessionOffset += timers[index].duration;
      timers[index].duration = 0;
    }
  }

  function updateIfExists() {
    if (timer(index).exists) {
      timers[index].duration = new Date().getTime() - timers[index].started_at.getTime();
    }
  }

  return {
    get exists() {
      return timers[index] !== undefined;
    },
    get duration() {
      return timers[index]?.duration;
    },
    get sessionOffset() {
      return timers[index]?.sessionOffset;
    },
    get startedAt() {
      return timers[index]?.started_at;
    },
    updateIfExists,
    resumeOrCreate,
    pauseIfExists,
  };
}
